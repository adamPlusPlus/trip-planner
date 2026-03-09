import { useState, useEffect } from 'react'
import { fetchWeather } from '../../services/weatherService'

function WeatherBlock({ title, location, dateRange, coords }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!location) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchWeather(location, coords, dateRange)
      .then((w) => { if (!cancelled) setData(w) })
      .catch(() => { if (!cancelled) setData(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [location, dateRange?.start, dateRange?.end, coords?.lat, coords?.lon])

  if (loading) return <div className="text-sm text-gray-500">{title}: Loading…</div>
  if (!data?.daily?.length) return <div className="text-sm text-gray-500">{title}: No data</div>
  return (
    <div className="mb-4">
      <h4 className="text-sm font-semibold text-gray-800 mb-2">{title}</h4>
      <div className="flex flex-wrap gap-3">
        {data.daily.slice(0, 7).map((day, idx) => (
          <div key={idx} className="text-center min-w-[4rem] px-2 py-1 bg-gray-50 rounded">
            <div className="text-xs text-gray-600">
              {day.date ? new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—'}
            </div>
            <div className="font-semibold text-gray-900">{Math.round(day.temp?.max ?? 0)}°F</div>
            <div className="text-xs text-gray-500">{Math.round(day.temp?.min ?? 0)}°F</div>
            <div className="text-xs text-gray-600 capitalize">{day.weather?.[0]?.description ?? '—'}</div>
            {day.snow > 0 && <div className="text-xs text-blue-600">❄️ {day.snow}mm</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function WeatherRouteView({ category, trip }) {
  const dateRange = trip?.settings?.dateRange || null
  const location = category?.location || category?.name || ''
  const coords = category?.coords || null
  const route = category?.route
  const segments = route?.segments || []
  const overnightStops = route?.overnightStops || []
  const [warnings, setWarnings] = useState([])

  useEffect(() => {
    setWarnings([])
    // Placeholder: Open-Meteo alerts would require a separate call per location; skip for now.
  }, [location])

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Destination</h3>
        <WeatherBlock title="" location={location} dateRange={dateRange} coords={coords} />
      </section>

      {segments.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Route (waypoints)</h3>
          <div className="space-y-3">
            {segments.map((seg, i) => (
              <WeatherBlock
                key={i}
                title={`${seg.from} → ${seg.to}`}
                location={seg.to || seg.from}
                dateRange={dateRange}
              />
            ))}
          </div>
        </section>
      )}

      {overnightStops.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Overnight stops</h3>
          <div className="space-y-3">
            {overnightStops.map((stop) => (
              <WeatherBlock
                key={stop.id}
                title={stop.name}
                location={stop.location || stop.name}
                dateRange={dateRange}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Warnings</h3>
        {warnings.length > 0 ? (
          <ul className="text-sm text-amber-800 bg-amber-50 rounded p-3 space-y-1">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">Check local weather and road conditions as your trip approaches. Alerts can be added when the weather API supports them.</p>
        )}
      </section>
    </div>
  )
}
