import { useState, useEffect } from 'react'
import { fetchWeather } from '../services/weatherService'
import { getImagesForLocation } from '../services/imageService'
import { getDefaultPlansForDestination } from '../data/planTemplate'

/**
 * List view for generated-plan destinations: same UX as Pagosa (header, weather, image, grid of cards).
 * Uses saved destination.headerImageUrls when present; fetches once and saves via updateTrip otherwise.
 * Cycle through first 5 images; position (headerImageIndex) persisted between screens.
 */
export default function GeneratedPlanView({ category, trip, onPlanSelect, updateTrip }) {
  const planList = category?.plans?.length
    ? category.plans
    : getDefaultPlansForDestination(category?.id || 'dest').map((p) => ({ ...p, path: null }))

  const [weather, setWeather] = useState(null)
  const [weatherExpanded, setWeatherExpanded] = useState(false)

  useEffect(() => {
    if (!category) return
    let cancelled = false
    fetchWeather(category.location, category.coords, trip?.settings?.dateRange)
      .then((data) => { if (!cancelled) setWeather(data) })
      .catch((err) => { console.warn('Weather fetch failed:', err); if (!cancelled) setWeather(null) })
    return () => { cancelled = true }
  }, [category?.id, category?.location, category?.coords, trip?.settings?.dateRange])

  // Fetch header images once and save to trip if not already saved
  useEffect(() => {
    if (!category?.location && !category?.name) return
    if (category?.headerImageUrls?.length) return // already saved
    if (!updateTrip || !trip) return
    let cancelled = false
    getImagesForLocation(category.location || category.name, { destinationId: category.id, limit: 5 })
      .then((result) => {
        if (cancelled || !result?.urls?.length) return
        const dests = (trip.destinations || []).map((d) =>
          d.id === category.id ? { ...d, headerImageUrls: result.urls, headerImageIndex: 0 } : d
        )
        updateTrip({ ...trip, destinations: dests })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [category?.id, category?.location, category?.name, category?.headerImageUrls?.length, trip?.id, updateTrip])

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(category?.location || category?.name || '')}`

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-700 hover:underline transition-colors"
          >
            {category?.name}
          </a>
        </h2>

        {weather && (
          <div className="bg-white rounded-lg shadow-md mb-6 border border-gray-200">
            <button
              type="button"
              onClick={() => setWeatherExpanded(!weatherExpanded)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-900">Current Weather</h3>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${weatherExpanded ? 'transform rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {weatherExpanded && (
              <div className="px-4 pb-4">
                <div className="flex items-center justify-between gap-2">
                  {weather.daily?.slice(0, 7).map((day, idx) => (
                    <div key={idx} className="flex flex-col items-center text-center flex-1">
                      <div className="text-xs text-gray-600 font-medium mb-1">
                        {day.date ? new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-base font-bold text-gray-900">
                        {Math.round(day.temp?.max)}°F
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.round(day.temp?.min)}°F
                      </div>
                      <div className="text-xs text-gray-600 capitalize mt-1 line-clamp-1">
                        {day.weather?.[0]?.description}
                      </div>
                      {day.snow > 0 && (
                        <div className="text-xs text-blue-600 mt-1">
                          ❄️ {day.snow}mm
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {(() => {
          const urls = category?.headerImageUrls
          const idx = (category?.headerImageIndex ?? 0) % (urls?.length || 1)
          const currentUrl = urls?.length ? urls[idx] : null
          const query = category?.location || category?.name
          const canCycle = (urls?.length ?? 0) > 1
          const cycle = (delta) => {
            if (!urls?.length || !updateTrip || !trip) return
            const next = (idx + delta + urls.length) % urls.length
            const dests = (trip.destinations || []).map((d) =>
              d.id === category.id ? { ...d, headerImageIndex: next } : d
            )
            updateTrip({ ...trip, destinations: dests })
          }
          if (!currentUrl) return null
          return (
            <div className="mb-6 rounded-lg overflow-hidden shadow-md relative group">
              <img
                key={currentUrl}
                src={currentUrl}
                alt={query}
                className="w-full h-64 object-cover animate-fade-in"
              />
              {canCycle && (
                <>
                  <button
                    type="button"
                    onClick={() => cycle(-1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    aria-label="Previous image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => cycle(1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    aria-label="Next image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </>
              )}
              <div className="absolute bottom-0 left-0 bg-black/60 text-white text-xs px-2 py-1 rounded-tr-lg backdrop-blur-sm">
                {query}
              </div>
            </div>
          )
        })()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {planList.map((planItem) => (
          <div
            key={planItem.id}
            role="button"
            tabIndex={0}
            onClick={() => onPlanSelect({ id: planItem.id, name: planItem.name, sectionType: planItem.sectionType || planItem.id?.replace(`${category?.id}-`, ''), path: null })}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPlanSelect({ id: planItem.id, name: planItem.name, sectionType: planItem.sectionType || planItem.id?.replace(`${category?.id}-`, ''), path: null }); } }}
            className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer p-6 border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {planItem.name}
            </h3>
            <p className="text-sm text-gray-600">
              Click to open
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
