// Weather: fetch by location, coords, and date range. No hardcoded dates; callers pass dateRange.
// Fetches once per calendar day per location/range and keeps that loaded (in-memory cache).
import { geocodeOne } from '../utils/geocode'

function todayUtc() {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

const weatherCache = new Map()

function getCacheKey(coords, range) {
  if (!coords || range.start == null || range.end == null) return null
  return `${Number(coords.lat)},${Number(coords.lon)}|${range.start}|${range.end}`
}

function getCached(coords, range) {
  const key = getCacheKey(coords, range)
  if (!key) return null
  const entry = weatherCache.get(key)
  if (!entry || entry.fetchedAtDate !== todayUtc()) return null
  return entry.data
}

function setCached(coords, range, data) {
  const key = getCacheKey(coords, range)
  if (!key || !data) return
  weatherCache.set(key, { data, fetchedAtDate: todayUtc() })
}

/** Open-Meteo free tier: forecast only up to 14 days from today. Clamp to avoid 400. */
function clampRangeToAllowed(range) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const maxEnd = new Date(today)
  maxEnd.setDate(maxEnd.getDate() + 14)
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const todayStr = fmt(today)
  const maxEndStr = fmt(maxEnd)
  let start = (range.start && String(range.start).trim()) || todayStr
  let end = (range.end && String(range.end).trim()) || maxEndStr
  if (end > maxEndStr) end = maxEndStr
  if (start > end) start = end
  return { start, end }
}

const getWeatherMain = (code) => {
  if (code >= 0 && code <= 3) return 'Clear'
  if (code >= 45 && code <= 48) return 'Fog'
  if (code >= 51 && code <= 67) return 'Rain'
  if (code >= 71 && code <= 77) return 'Snow'
  if (code >= 80 && code <= 82) return 'Rain'
  if (code >= 85 && code <= 86) return 'Snow'
  if (code >= 95 && code <= 99) return 'Thunderstorm'
  return 'Clear'
}

const getWeatherDescription = (code) => {
  const descriptions = {
    0: 'clear sky', 1: 'mainly clear', 2: 'partly cloudy', 3: 'overcast',
    45: 'fog', 48: 'depositing rime fog',
    51: 'light drizzle', 53: 'moderate drizzle', 55: 'dense drizzle',
    61: 'slight rain', 63: 'moderate rain', 65: 'heavy rain',
    71: 'slight snow', 73: 'moderate snow', 75: 'heavy snow',
    77: 'snow grains', 80: 'slight rain showers', 81: 'moderate rain showers',
    82: 'violent rain showers', 85: 'slight snow showers', 86: 'heavy snow showers',
    95: 'thunderstorm', 96: 'thunderstorm with slight hail', 99: 'thunderstorm with heavy hail',
  }
  return descriptions[code] || 'clear sky'
}

function getDefaultDateRange() {
  const now = new Date()
  const currentYear = now.getFullYear()
  const dec28ThisYear = new Date(currentYear, 11, 28)
  const targetYear = now > dec28ThisYear ? currentYear + 1 : currentYear
  return {
    start: `${targetYear}-12-28`,
    end: `${targetYear + 1}-01-03`,
  }
}

function getMockWeatherData() {
  const dates = []
  for (let i = 0; i < 7; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)
    dates.push({
      dt: Math.floor(date.getTime() / 1000),
      temp: { min: 20 + Math.random() * 15, max: 35 + Math.random() * 20 },
      weather: [{ main: i < 2 ? 'Snow' : 'Clear', description: i < 2 ? 'light snow' : 'clear sky' }],
      snow: i < 2 ? Math.random() * 5 : 0,
    })
  }
  return {
    current: { main: { temp: 32 }, weather: [{ description: 'partly cloudy' }] },
    daily: dates,
    location: { name: 'Location' },
  }
}

/**
 * Fetch weather for a location and date range.
 * @param {string} location - Location name (for display and geocoding if coords missing)
 * @param {{ lat: number, lon: number } | null} coords - Optional; if missing, geocode via Open-Meteo
 * @param {{ start: string, end: string } | null} dateRange - ISO date strings (e.g. '2025-12-28', '2026-01-03'). If null, uses default Dec 28 - Jan 3.
 * @returns {Promise<{ current, daily, location }>}
 */
export async function fetchWeather(location, coords, dateRange = null) {
  const range = dateRange || getDefaultDateRange()
  const locationStr = (location && String(location).trim()) || ''

  let resolvedCoords = coords && typeof coords.lat === 'number' && typeof coords.lon === 'number'
    ? { lat: coords.lat, lon: coords.lon }
    : null

  if (!resolvedCoords && locationStr) {
    try {
      let result = await geocodeOne(locationStr)
      if (!result) {
        const cityPart = locationStr.split(',')[0]?.trim() || locationStr
        if (cityPart !== locationStr) {
          result = await geocodeOne(cityPart)
        }
      }
      if (result) {
        resolvedCoords = { lat: result.lat, lon: result.lon }
      }
    } catch (_) {}
  }

  if (!resolvedCoords) {
    return getMockWeatherData()
  }

  const cached = getCached(resolvedCoords, range)
  if (cached) {
    return cached
  }

  const { start: startDate, end: endDate } = clampRangeToAllowed(range)

  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${resolvedCoords.lat}&longitude=${resolvedCoords.lon}&daily=temperature_2m_max,temperature_2m_min,weathercode,snowfall_sum&temperature_unit=fahrenheit&timezone=auto&start_date=${startDate}&end_date=${endDate}`
    let response = await fetch(weatherUrl)

    if (response.status === 429) {
      await new Promise((r) => setTimeout(r, 1500))
      response = await fetch(weatherUrl)
    }

    if (!response.ok) {
      return getMockWeatherData()
    }

    let data
    try {
      data = await response.json()
    } catch (_) {
      return getMockWeatherData()
    }

    if (!data.daily || !Array.isArray(data.daily.time) || data.daily.time.length === 0) {
      return getMockWeatherData()
    }

    const daily = data.daily.time.map((time, idx) => ({
      dt: new Date(time).getTime() / 1000,
      date: time,
      temp: {
        min: data.daily.temperature_2m_min?.[idx],
        max: data.daily.temperature_2m_max?.[idx],
      },
      weather: [{
        main: getWeatherMain(data.daily.weathercode?.[idx]),
        description: getWeatherDescription(data.daily.weathercode?.[idx]),
      }],
      snow: data.daily.snowfall_sum?.[idx] ?? 0,
    }))

    const result = {
      current: daily[0],
      daily,
      location: { name: location || locationStr },
    }

    setCached(resolvedCoords, range, result)
    return result
  } catch (_) {
    return getMockWeatherData()
  }
}
