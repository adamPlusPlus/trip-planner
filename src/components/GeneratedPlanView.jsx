import { useState, useEffect } from 'react'
import { fetchWeather } from '../services/weatherService'
import { getImageForLocation } from '../services/imageService'
import { getDefaultPlansForDestination } from '../data/planTemplate'

/**
 * List view for generated-plan destinations: same UX as Pagosa (header, weather, image, grid of cards).
 * Clicking a card calls onPlanSelect(planItem); full-screen content is handled by PlanViewer.
 */
export default function GeneratedPlanView({ category, trip, onPlanSelect }) {
  const planList = category?.plans?.length
    ? category.plans
    : getDefaultPlansForDestination(category?.id || 'dest').map((p) => ({ ...p, path: null }))

  const [weather, setWeather] = useState(null)
  const [weatherExpanded, setWeatherExpanded] = useState(false)
  const [destinationImage, setDestinationImage] = useState(null)

  useEffect(() => {
    if (!category) return
    let cancelled = false
    fetchWeather(category.location, category.coords, trip?.settings?.dateRange)
      .then((data) => { if (!cancelled) setWeather(data) })
      .catch((err) => { console.warn('Weather fetch failed:', err); if (!cancelled) setWeather(null) })
    return () => { cancelled = true }
  }, [category?.id, category?.location, category?.coords, trip?.settings?.dateRange])

  useEffect(() => {
    if (!category?.location && !category?.name) return
    let cancelled = false
    getImageForLocation(category.location || category.name, { destinationId: category.id })
      .then((result) => { if (!cancelled && result?.url) setDestinationImage(result) })
      .catch(() => { if (!cancelled) setDestinationImage(null) })
    return () => { cancelled = true }
  }, [category?.id, category?.location, category?.name])

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

        {destinationImage?.url && (
          <div className="mb-6 rounded-lg overflow-hidden shadow-md relative">
            <img
              src={destinationImage.url}
              alt={category?.location || category?.name}
              className="w-full h-64 object-cover"
            />
            <div className="absolute bottom-0 left-0 bg-black/60 text-white text-xs px-2 py-1 rounded-tr-lg backdrop-blur-sm">
              {destinationImage.query || category?.location}
            </div>
          </div>
        )}
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
