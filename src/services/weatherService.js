// Weather: fetch by location, coords, and date range. No hardcoded dates; callers pass dateRange.

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
  try {
    const range = dateRange || getDefaultDateRange()
    if (!coords) {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`
      const geoResponse = await fetch(geoUrl)
      const geoData = await geoResponse.json()
      if (!geoData.results || geoData.results.length === 0) {
        throw new Error('Location not found')
      }
      coords = { lat: geoData.results[0].latitude, lon: geoData.results[0].longitude }
    }

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=temperature_2m_max,temperature_2m_min,weathercode,snowfall_sum&temperature_unit=fahrenheit&timezone=auto&start_date=${range.start}&end_date=${range.end}`
    const response = await fetch(weatherUrl)
    const data = await response.json()

    if (!data.daily || !data.daily.time || data.daily.time.length === 0) {
      throw new Error('No weather data available for target dates')
    }

    const daily = data.daily.time.map((time, idx) => ({
      dt: new Date(time).getTime() / 1000,
      date: time,
      temp: {
        min: data.daily.temperature_2m_min[idx],
        max: data.daily.temperature_2m_max[idx],
      },
      weather: [{
        main: getWeatherMain(data.daily.weathercode[idx]),
        description: getWeatherDescription(data.daily.weathercode[idx]),
      }],
      snow: data.daily.snowfall_sum[idx] || 0,
    }))

    return {
      current: daily[0],
      daily,
      location: { name: location },
    }
  } catch (error) {
    console.error('Error fetching weather:', error)
    return getMockWeatherData()
  }
}
