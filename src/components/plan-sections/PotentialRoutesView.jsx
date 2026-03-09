import { useState, useEffect } from 'react'
import { defaultRoute } from '../../domain/sectionTypes'

const API = '/api'

function ensureRoute(destination) {
  if (destination?.route && Array.isArray(destination.route.segments)) {
    return {
      segments: destination.route.segments,
      overnightStops: destination.route.overnightStops || [],
      gasCostCents: destination.route.gasCostCents,
      foodCostCents: destination.route.foodCostCents,
    }
  }
  return defaultRoute()
}

function originLabel(trip) {
  const o = trip?.origin
  return o?.name || o?.location || ''
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

  const handleFetchRoute = async () => {
    if (!origin.trim() || !location.trim()) return
    setLoading(true)
    try {
      const res = await fetch(
        `${API}/directions?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(location)}&maxDrivingHours=${maxDrivingHours}&overnightFlexibility=${overnightFlexibility}`
      )
      const data = res.ok ? await res.json() : {}
      const segs = data.segments || []
      const stops = data.overnightStops || []
      setSegments(segs)
      setOvernightStops(stops)
      const current = ensureRoute(category)
      persist({
        segments: segs,
        overnightStops: stops,
        gasCostCents: current.gasCostCents,
        foodCostCents: current.foodCostCents,
      })
    } catch (e) {
      console.error('Directions fetch failed', e)
    } finally {
      setLoading(false)
    }
  }

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
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleFetchRoute}
          disabled={loading || !origin || !location}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Get directions'}
        </button>
        <a
          href={mapsDirUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-gray-100 text-gray-800 text-sm rounded-md hover:bg-gray-200"
        >
          Open in Google Maps
        </a>
      </div>

      {segments.length > 0 && (
        <>
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Route segments</h3>
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
        </>
      )}

      {segments.length === 0 && (
        <p className="text-gray-500 text-sm">
          Enter your origin in Trip Data, then click &quot;Get directions&quot; to load the route and overnight stops (when drive time exceeds {maxDrivingHours} hours).
        </p>
      )}
    </div>
  )
}
