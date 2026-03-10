import { useState, useEffect, useMemo, useCallback } from 'react'
import { defaultRoute } from '../../domain/sectionTypes'
import RouteMap from './RouteMap'

const API = '/api'
const MAX_WAYPOINTS = 10

function ensureRoute(destination) {
  if (destination?.route && Array.isArray(destination.route.segments)) {
    return {
      segments: destination.route.segments,
      overnightStops: destination.route.overnightStops || [],
      gasCostCents: destination.route.gasCostCents,
      foodCostCents: destination.route.foodCostCents,
      routeOptions: destination.route.routeOptions,
    }
  }
  return defaultRoute()
}

function originLabel(trip) {
  const o = trip?.origin
  return o?.name || o?.location || ''
}

/** Build ordered list of points this route goes through/near (for assessing attractiveness). */
function buildRoutePoints(origin, destinationName, segments, overnightStops) {
  const points = []
  if (origin) points.push({ name: origin, mapUrl: null })
  for (const seg of segments || []) {
    if (seg.to && !points.some((p) => p.name === seg.to)) {
      points.push({ name: seg.to, mapUrl: seg.mapUrl })
    }
  }
  for (const stop of overnightStops || []) {
    const name = stop.name || stop.location
    if (name && !points.some((p) => p.name === name)) {
      points.push({ name, location: stop.location, mapUrl: stop.mapUrl })
    }
  }
  if (destinationName && !points.some((p) => p.name === destinationName)) {
    points.push({ name: destinationName, mapUrl: null })
  }
  return points.map((p, i) => ({ ...p, order: i }))
}

export default function PotentialRoutesView({ category, trip, updateTrip }) {
  const location = category?.location || category?.name || ''
  const origin = originLabel(trip)
  const route = ensureRoute(category)
  const maxDrivingHours = trip?.settings?.maxDrivingHours ?? 10
  const overnightFlexibility = trip?.settings?.overnightFlexibility ?? 0.2

  const [segments, setSegments] = useState(route.segments || [])
  const [overnightStops, setOvernightStops] = useState(route.overnightStops || [])
  const [gasCostCents, setGasCostCents] = useState(route.gasCostCents ?? '')
  const [foodCostCents, setFoodCostCents] = useState(route.foodCostCents ?? '')
  const [loading, setLoading] = useState(false)
  const [loadingVia, setLoadingVia] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [customWaypoints, setCustomWaypoints] = useState([])
  const [addStopInput, setAddStopInput] = useState('')

  useEffect(() => {
    const fromAttractions = (category?.thingsToSee?.attractions || [])
      .slice(0, 5)
      .map((a) => (a.name || a.location || '').trim())
      .filter(Boolean)
    setCustomWaypoints(fromAttractions)
  }, [category?.id])

  const removeWaypoint = useCallback((index) => {
    setCustomWaypoints((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const moveWaypoint = useCallback((index, direction) => {
    setCustomWaypoints((prev) => {
      const next = prev.slice()
      const target = direction === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }, [])

  const handleAddStopSubmit = useCallback((e) => {
    e.preventDefault()
    const trimmed = (addStopInput || '').trim()
    if (trimmed && customWaypoints.length < MAX_WAYPOINTS) {
      setCustomWaypoints((prev) => [...prev, trimmed])
      setAddStopInput('')
    }
  }, [addStopInput, customWaypoints.length])

  const routePoints = useMemo(
    () => buildRoutePoints(origin, location, segments, overnightStops),
    [origin, location, segments, overnightStops]
  )

  useEffect(() => {
    const r = ensureRoute(category)
    setSegments(r.segments || [])
    setOvernightStops(r.overnightStops || [])
    setGasCostCents(r.gasCostCents ?? '')
    setFoodCostCents(r.foodCostCents ?? '')
  }, [category?.id, category?.route])

  const persist = (next) => {
    if (!trip || !updateTrip || !category) return
    const destinations = (trip.destinations || []).map((d) =>
      d.id === category.id ? { ...d, route: next } : d
    )
    updateTrip({ ...trip, destinations })
  }

  const handleFetchRoute = async (waypoints = []) => {
    setFetchError(null)
    if (!origin.trim() || !location.trim()) {
      setFetchError('Set origin in Trip Data and ensure this destination has a name or location.')
      return
    }
    const setLoad = waypoints.length ? setLoadingVia : setLoading
    setLoad(true)
    try {
      let url = `${API}/directions?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(location)}&maxDrivingHours=${maxDrivingHours}&overnightFlexibility=${overnightFlexibility}`
      if (waypoints.length) {
        url += '&waypoints=' + waypoints.map((w) => encodeURIComponent(w)).join('|')
      }
      const res = await fetch(url)
      const data = res.ok ? await res.json() : {}
      const segs = data.segments || []
      const stops = data.overnightStops || []
      setSegments(segs)
      setOvernightStops(stops)
      if (segs.length === 0) {
        setFetchError('No route returned. If using Google Directions, set GOOGLE_DIRECTIONS_API_KEY (or GOOGLE_PLACES_API_KEY) on the server. You can also build the route on the map below and apply it.')
      } else {
        const current = ensureRoute(category)
        persist({
          segments: segs,
          overnightStops: stops,
          gasCostCents: current.gasCostCents,
          foodCostCents: current.foodCostCents,
        })
      }
    } catch (e) {
      console.error('Directions fetch failed', e)
      setFetchError('Network or server error. Is the dev server running on the API port?')
    } finally {
      setLoad(false)
    }
  }

  const handleFetchViaAttractions = () => {
    const attractions = category?.thingsToSee?.attractions || []
    const waypoints = attractions.slice(0, 5).map((a) => a.name || a.location).filter(Boolean)
    if (waypoints.length) {
      handleFetchRoute(waypoints)
    } else {
      handleFetchRoute([])
    }
  }

  const handleMapApply = useCallback((segs, stops) => {
    setSegments(segs)
    setOvernightStops(stops)
    if (!trip || !updateTrip || !category) return
    const current = ensureRoute(category)
    const next = {
      segments: segs,
      overnightStops: stops,
      gasCostCents: current.gasCostCents,
      foodCostCents: current.foodCostCents,
    }
    const destinations = (trip.destinations || []).map((d) =>
      d.id === category.id ? { ...d, route: next } : d
    )
    updateTrip({ ...trip, destinations })
  }, [trip, updateTrip, category])

  const saveCosts = () => {
    const next = {
      segments,
      overnightStops,
      gasCostCents: foodCostCents === '' && gasCostCents === '' ? undefined : (Number(gasCostCents) || 0),
      foodCostCents: foodCostCents === '' && gasCostCents === '' ? undefined : (Number(foodCostCents) || 0),
    }
    if (next.gasCostCents === 0 && next.foodCostCents === 0) next.gasCostCents = next.foodCostCents = undefined
    persist(next)
  }

  const totalDriveHours = segments.reduce((sum, s) => sum + (s.durationHours || 0), 0)
  const mapsDirUrl = origin && location
    ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(location)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Stops (waypoints)</h3>
        <p className="text-sm text-gray-600 mb-2">
          Add or remove stops between origin and destination. The map will route through them in order. Max {MAX_WAYPOINTS} stops.
        </p>
        <form onSubmit={handleAddStopSubmit} className="flex flex-wrap items-center gap-2 mb-3">
          <input
            type="text"
            value={addStopInput}
            onChange={(e) => setAddStopInput(e.target.value)}
            placeholder="City or place name"
            className="flex-1 min-w-[160px] border border-gray-300 rounded px-2 py-1.5 text-sm"
            aria-label="Add stop"
          />
          <button
            type="submit"
            disabled={customWaypoints.length >= MAX_WAYPOINTS}
            className="px-3 py-1.5 bg-gray-100 text-gray-800 text-sm rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            Add stop
          </button>
        </form>
        {customWaypoints.length > 0 && (
          <ul className="space-y-1.5">
            {customWaypoints.map((name, i) => (
              <li key={`${i}-${name}`} className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 font-mono w-6">{i + 1}.</span>
                <span className="flex-1 truncate">{name}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveWaypoint(i, 'up')}
                    disabled={i === 0}
                    className="p-1 text-gray-500 hover:text-gray-800 disabled:opacity-40"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveWaypoint(i, 'down')}
                    disabled={i === customWaypoints.length - 1}
                    className="p-1 text-gray-500 hover:text-gray-800 disabled:opacity-40"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeWaypoint(i)}
                    className="p-1 text-amber-600 hover:text-amber-800"
                    aria-label="Remove"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <RouteMap
        origin={origin}
        destination={location}
        waypointNames={customWaypoints}
        maxDrivingHours={maxDrivingHours}
        overnightFlexibility={overnightFlexibility}
        onApply={handleMapApply}
      />

      <section className="pt-4 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Optional: get route from Google Directions</h3>
        <p className="text-xs text-gray-500 mb-2">
          Requires API key on server (GOOGLE_DIRECTIONS_API_KEY or GOOGLE_PLACES_API_KEY). The map above works with no key.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => handleFetchRoute([])}
            disabled={loading || loadingVia}
            className="px-4 py-2 bg-gray-100 text-gray-800 text-sm rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Most direct'}
          </button>
          <button
            type="button"
            onClick={handleFetchViaAttractions}
            disabled={loading || loadingVia}
            className="px-4 py-2 bg-gray-100 text-gray-800 text-sm rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            {loadingVia ? 'Loading…' : 'Via attractions'}
          </button>
        </div>
        {fetchError && (
          <p className="text-sm text-amber-700 mt-2" role="alert">
            {fetchError}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-2">
          Enter origin in Trip Data. &quot;Via attractions&quot; uses up to 5 Things to See as waypoints (when available).
        </p>
      </section>

      {segments.length > 0 && (
        <>
          {routePoints.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Route points (this route goes through/near)</h3>
              <p className="text-sm text-gray-600 mb-2">
                Use this list to assess how attractive or interesting the route is.
              </p>
              <ul className="space-y-1.5">
                {routePoints.map((p, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500 font-mono w-6">{p.order + 1}.</span>
                    {p.mapUrl ? (
                      <a href={p.mapUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                        {p.name}
                      </a>
                    ) : (
                      <span>{p.name}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Segments</h3>
            <ul className="space-y-2">
              {segments.map((seg, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">{i + 1}.</span>
                  <span>{seg.from} → {seg.to}</span>
                  {seg.durationHours != null && <span className="text-gray-500">({seg.durationHours.toFixed(1)}h)</span>}
                  {seg.mapUrl && (
                    <a href={seg.mapUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 text-xs">Map</a>
                  )}
                </li>
              ))}
            </ul>
            {totalDriveHours > 0 && (
              <p className="text-gray-600 text-sm mt-2">Total drive: {totalDriveHours.toFixed(1)} hours</p>
            )}
          </section>

          {overnightStops.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Overnight stops</h3>
              <ul className="space-y-2">
                {overnightStops.map((stop) => (
                  <li key={stop.id} className="flex items-center gap-2 text-sm">
                    <a href={stop.mapUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                      {stop.name}
                    </a>
                    {stop.costCents != null && <span className="text-gray-600">${(stop.costCents / 100).toFixed(2)}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Route costs (estimates)</h3>
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Gas ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={gasCostCents === '' || gasCostCents == null ? '' : Number(gasCostCents) / 100}
                  onChange={(e) => setGasCostCents(e.target.value === '' ? '' : Math.round(parseFloat(e.target.value) * 100))}
                  onBlur={saveCosts}
                  className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Food ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={foodCostCents === '' || foodCostCents == null ? '' : Number(foodCostCents) / 100}
                  onChange={(e) => setFoodCostCents(e.target.value === '' ? '' : Math.round(parseFloat(e.target.value) * 100))}
                  onBlur={saveCosts}
                  className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
            </div>
          </section>

          <section className="pt-2 border-t border-gray-200">
            <a
              href={mapsDirUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-600 hover:underline"
            >
              Open this route in Google Maps
            </a>
          </section>
        </>
      )}

      {segments.length === 0 && (
        <p className="text-gray-500 text-sm">
          Enter your origin in Trip Data, then click &quot;Most direct&quot; or &quot;Via attractions&quot; to load a route. Overnight stops appear when drive time exceeds {maxDrivingHours} hours.
        </p>
      )}
    </div>
  )
}
