import { useState, useEffect, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { geocodeOne } from '../../utils/geocode'

const API = '/api'

// Fix default marker icon in Leaflet with bundler
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

function computeOvernightStops(segments, maxDrivingHours = 10, overnightFlexibility = 0.2) {
  if (!segments?.length) return []
  const window = maxDrivingHours * Math.max(0, Math.min(1, overnightFlexibility))
  const low = maxDrivingHours - window
  const high = maxDrivingHours + window
  let cumulative = 0
  const stops = []
  let stopIndex = 0
  for (const seg of segments) {
    const dur = seg.durationHours || 0
    const nextCumulative = cumulative + dur
    if (cumulative < low && nextCumulative >= low) {
      stopIndex += 1
      const location = seg.to || seg.from
      stops.push({
        id: `overnight-${stopIndex}-${Date.now()}`,
        name: `Stop ${stopIndex}: ${location}`,
        location,
        costCents: undefined,
        mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`,
        imageUrl: undefined,
      })
    }
    cumulative = nextCumulative
    if (cumulative >= high) cumulative = 0
  }
  return stops
}

function osrmToSegments(osrmData) {
  if (!osrmData?.routes?.[0]?.legs || !osrmData.waypoints?.length) return []
  const legs = osrmData.routes[0].legs
  const waypoints = osrmData.waypoints
  return legs.map((leg, i) => {
    const from = waypoints[i]?.name || [waypoints[i]?.location?.[1], waypoints[i]?.location?.[0]].filter(Boolean).join(', ') || 'Origin'
    const to = waypoints[i + 1]?.name || [waypoints[i + 1]?.location?.[1], waypoints[i + 1]?.location?.[0]].filter(Boolean).join(', ') || 'Destination'
    return {
      from,
      to,
      durationHours: (leg.duration || 0) / 3600,
      distanceMiles: (leg.distance || 0) / 1609.344,
      mapUrl: `https://www.google.com/maps/dir/${encodeURIComponent(from)}/${encodeURIComponent(to)}`,
    }
  })
}

function FitMapToRoute({ routeGeo, points }) {
  const map = useMap()
  useEffect(() => {
    if (!map) return
    const positions = (routeGeo && routeGeo.length >= 2)
      ? routeGeo
      : (points.length >= 2 ? points.map((p) => [p.lat, p.lon]) : null)
    if (positions && positions.length >= 2) {
      const bounds = L.latLngBounds(positions)
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 12 })
    }
  }, [map, routeGeo, points])
  return null
}

function DraggableMarker({ point, index, onDragEnd }) {
  const position = [point.lat, point.lon]
  return (
    <Marker
      position={position}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const ll = e.target.getLatLng()
          onDragEnd(index, ll.lat, ll.lng)
        },
      }}
    >
      <Popup>{point.name || `Point ${index + 1}`}</Popup>
    </Marker>
  )
}

export default function RouteMap({
  origin,
  destination,
  waypointNames = [],
  maxDrivingHours = 10,
  overnightFlexibility = 0.2,
  onApply,
}) {
  const [points, setPoints] = useState([])
  const [routeGeo, setRouteGeo] = useState(null)
  const [segments, setSegments] = useState([])
  const [overnightStops, setOvernightStops] = useState([])
  const [loading, setLoading] = useState(false)
  const [updatingRoute, setUpdatingRoute] = useState(false)
  const [error, setError] = useState(null)
  const fetchIdRef = useRef(0)

  const fetchRoute = useCallback(async (coords) => {
    if (coords.length < 2) return
    const param = coords.map((c) => `${c.lon},${c.lat}`).join(';')
    const res = await fetch(`${API}/osrm/route?coords=${encodeURIComponent(param)}`)
    if (!res.ok) {
      setError('Route service unavailable. Try again in a moment.')
      setRouteGeo(null)
      setSegments([])
      setOvernightStops([])
      return
    }
    let data
    try {
      data = await res.json()
    } catch {
      setError('Route service returned invalid data.')
      setRouteGeo(null)
      setSegments([])
      setOvernightStops([])
      return
    }
    if (data.code !== 'Ok') {
      setError(data.code === 'NoRoute' ? 'We couldn\'t find a driveable route. Try moving a stop or simplifying the route.' : (data.message || 'Route request failed.'))
      setRouteGeo(null)
      setSegments([])
      setOvernightStops([])
      return
    }
    if (!data.routes?.[0]) {
      setRouteGeo(null)
      setSegments([])
      setOvernightStops([])
      return
    }
    const route = data.routes[0]
    const coordsGeo = route.geometry?.coordinates || []
    setRouteGeo(coordsGeo.map(([lng, lat]) => [lat, lng]))
    const segs = osrmToSegments(data)
    setSegments(segs)
    setOvernightStops(computeOvernightStops(segs, maxDrivingHours, overnightFlexibility))
    setError(null)
  }, [maxDrivingHours, overnightFlexibility])

  useEffect(() => {
    setError(null)
    const originStr = (origin || '').trim()
    const destStr = (destination || '').trim()
    if (!originStr || !destStr) {
      setPoints([])
      setRouteGeo(null)
      setSegments([])
      setOvernightStops([])
      return
    }
    setLoading(true)
    const wayNames = Array.isArray(waypointNames) ? waypointNames.filter(Boolean) : []
    Promise.all([
      geocodeOne(originStr),
      ...wayNames.map((w) => geocodeOne(w)),
      geocodeOne(destStr),
    ])
      .then((results) => {
        const list = results.filter(Boolean)
        if (list.length < 2) {
          setError('We couldn\'t find that place. Try a different spelling or add state/country.')
          setPoints([])
          setRouteGeo(null)
          return
        }
        setPoints(list)
        const param = list.map((c) => `${c.lon},${c.lat}`).join(';')
        return fetch(`${API}/osrm/route?coords=${encodeURIComponent(param)}`)
      })
      .then(async (res) => {
        if (!res) return null
        if (!res.ok) {
          setError('Route service unavailable. Try again in a moment.')
          setRouteGeo(null)
          setSegments([])
          setOvernightStops([])
          return null
        }
        try {
          return await res.json()
        } catch {
          setError('Route service returned invalid data.')
          setRouteGeo(null)
          setSegments([])
          setOvernightStops([])
          return null
        }
      })
      .then((data) => {
        if (!data) return
        if (data.code !== 'Ok') {
          setError(data.code === 'NoRoute' ? 'We couldn\'t find a driveable route. Try moving a stop or simplifying the route.' : (data.message || 'Route request failed.'))
          setRouteGeo(null)
          setSegments([])
          setOvernightStops([])
          return
        }
        if (!data.routes?.[0]) {
          setRouteGeo(null)
          setSegments([])
          setOvernightStops([])
          return
        }
        const route = data.routes[0]
        const coordsGeo = route.geometry?.coordinates || []
        setRouteGeo(coordsGeo.map(([lng, lat]) => [lat, lng]))
        const segs = osrmToSegments(data)
        setSegments(segs)
        setOvernightStops(computeOvernightStops(segs, maxDrivingHours, overnightFlexibility))
      })
      .catch((e) => {
        setError(e.message || 'Failed to load route.')
        setRouteGeo(null)
        setSegments([])
      })
      .finally(() => setLoading(false))
  }, [origin, destination, waypointNames, maxDrivingHours, overnightFlexibility])

  const handleMarkerDragEnd = useCallback((index, lat, lon) => {
    setUpdatingRoute(true)
    setPoints((prev) => {
      const next = prev.map((p, i) => (i === index ? { ...p, lat, lon } : p))
      const id = ++fetchIdRef.current
      const param = next.map((c) => `${c.lon},${c.lat}`).join(';')
      fetch(`${API}/osrm/route?coords=${encodeURIComponent(param)}`)
        .then((r) => {
          if (!r.ok) return null
          return r.json().catch(() => null)
        })
        .then((data) => {
          if (id !== fetchIdRef.current) return
          if (!data || data.code !== 'Ok' || !data.routes?.[0]) {
            setError(data?.code === 'NoRoute' ? 'We couldn\'t find a driveable route. Try moving a stop or simplifying the route.' : 'Route update failed; try moving the marker again.')
            return
          }
          const route = data.routes[0]
          const coordsGeo = route.geometry?.coordinates || []
          setRouteGeo(coordsGeo.map(([lng, lat]) => [lat, lng]))
          const segs = osrmToSegments(data)
          setSegments(segs)
          setOvernightStops(computeOvernightStops(segs, maxDrivingHours, overnightFlexibility))
          setError(null)
        })
        .catch(() => {
          if (id === fetchIdRef.current) {
            setError('Route update failed; try moving the marker again.')
          }
        })
        .finally(() => setUpdatingRoute(false))
      return next
    })
  }, [maxDrivingHours, overnightFlexibility])

  const handleApply = useCallback(() => {
    if (segments.length) onApply?.(segments, overnightStops)
  }, [segments, overnightStops, onApply])

  if (!origin?.trim() || !destination?.trim()) {
    return (
      <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
        Set origin in Trip Data and select a destination to see the route map.
      </p>
    )
  }

  const center = points.length
    ? [points.reduce((s, p) => s + p.lat, 0) / points.length, points.reduce((s, p) => s + p.lon, 0) / points.length]
    : [39, -98]

  return (
    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">Route map</h3>
      <p className="text-sm text-gray-600">
        Build your route below (free; no API key). Drag markers to adjust, then Apply to plan.
      </p>
      {loading && <p className="text-sm text-gray-500">Loading route…</p>}
      {error && <p className="text-sm text-amber-700" role="alert">{error}</p>}
      <div className="rounded-lg overflow-hidden border border-gray-200" style={{ minHeight: 360 }}>
        <MapContainer
          key={points.length}
          center={center}
          zoom={points.length >= 2 ? 6 : 4}
          style={{ height: 360, width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitMapToRoute routeGeo={routeGeo} points={points} />
          {routeGeo && routeGeo.length >= 2 && (
            <Polyline positions={routeGeo} color="#2563eb" weight={4} />
          )}
          {points.map((point, index) => (
            <DraggableMarker
              key={index}
              point={point}
              index={index}
              onDragEnd={handleMarkerDragEnd}
            />
          ))}
        </MapContainer>
      </div>
      {segments.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700"
          >
            Apply to plan
          </button>
          {updatingRoute && <span className="text-sm text-gray-500">Updating route…</span>}
          <span className="text-sm text-gray-500">
            {segments.length} segment(s), {segments.reduce((s, seg) => s + (seg.durationHours || 0), 0).toFixed(1)}h total
            {overnightStops.length > 0 && `, ${overnightStops.length} overnight stop(s)`}
          </span>
        </div>
      )}
    </section>
  )
}
