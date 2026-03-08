// API utilities for fetching images and weather
import { getLocationImage } from './locationImages'
import { getLocationImageFromSearch } from './googleImageSearch'

// Pexels API - Free, reliable image source
const PEXELS_API_KEY = 'UILCwPuEaQGmtNbbdIXdZha7hexD1IwRYjz0QO027BjqvkJxG0clEjtO'

// Fetch image from Pexels API using search
const fetchPexelsImage = async (searchTerm) => {
  try {
    const query = encodeURIComponent(searchTerm)
    const response = await fetch(`https://api.pexels.com/v1/search?query=${query}&per_page=5&orientation=landscape`, {
      headers: {
        'Authorization': PEXELS_API_KEY
      }
    })
    
    if (!response.ok) {
      console.error(`Pexels API error: ${response.status} - ${response.statusText}`)
      return null
    }
    
    const data = await response.json()
    
    if (data.photos && data.photos.length > 0) {
      // Return the first result (most relevant)
      return data.photos[0].src.large || data.photos[0].src.medium
    }
    
    return null
  } catch (error) {
    console.error('Error fetching Pexels image:', error)
    return null
  }
}

// Local header images for main destinations (downloaded, not fetched at runtime)
const destinationHeaderImages = {
  'pagosa-springs': '/images/headers/pagosa-springs.jpg',
}

// Curated search terms for each destination (fallback if local image missing)
const destinationSearchTerms = {
  'pagosa-springs': 'Pagosa Springs Colorado hot springs mountains nature',
}

// Fetch location image - returns { url, query } object
// Uses local header images for main destinations, falls back to API for others
export const fetchLocationImage = async (location, destinationId = null) => {
  try {
    // FIRST: Check for local header image (main destinations only)
    if (destinationId && destinationHeaderImages[destinationId]) {
      return { url: destinationHeaderImages[destinationId], query: location }
    }
    
    // SECOND: Use Google Images search for the EXACT location name
    // This ensures each location gets its own unique image
    const googleResult = await getLocationImageFromSearch(location)
    if (googleResult && googleResult.url) {
      return { url: googleResult.url, query: googleResult.query || location }
    }
    
    // THIRD: Check curated location image map (official sources only)
    const curatedImage = getLocationImage(location)
    if (curatedImage) {
      return { url: curatedImage, query: location }
    }
    
    // FOURTH: Try to get curated search term by destination ID for Pexels
    let searchTerm = null
    if (destinationId && destinationSearchTerms[destinationId]) {
      searchTerm = destinationSearchTerms[destinationId]
    } else {
      // Fallback: Try to match by location name
      const locationLower = location.toLowerCase()
      
      if (locationLower.includes('pagosa')) {
        searchTerm = destinationSearchTerms['pagosa-springs']
      } else {
        // Use EXACT location name for search with nature
        searchTerm = `${location.split(',')[0].trim()} nature`
      }
    }
    
    // FIFTH: Fetch from Pexels API - ALWAYS include "nature" for better results
    if (searchTerm) {
      // Ensure "nature" is in the search term
      const natureSearchTerm = searchTerm.includes('nature') ? searchTerm : `${searchTerm} nature`
      const imageUrl = await fetchPexelsImage(natureSearchTerm)
      if (imageUrl) {
        return { url: imageUrl, query: natureSearchTerm }
      }
    }
    
    // Final fallback - return null (don't show random images)
    return null
    
  } catch (error) {
    console.error('Error fetching location image:', error)
    return null
  }
}

// Fetch image for specific attraction/location name
// Returns { url, query } object with the image URL and the search query used
export const fetchAttractionImage = async (attractionName) => {
  try {
    // FIRST: Search Google Images for the exact location name
    // This will get actual images of the location from search engines
    const googleResult = await getLocationImageFromSearch(attractionName)
    if (googleResult && googleResult.url) {
      return { url: googleResult.url, query: googleResult.query || attractionName }
    }
    
    // SECOND: Check curated location image map (official sources)
    const curatedImage = getLocationImage(attractionName)
    if (curatedImage) {
      // Verify the image URL is valid before returning
      try {
        const testResponse = await fetch(curatedImage, { method: 'HEAD' })
        if (testResponse.ok) {
          return { url: curatedImage, query: attractionName }
        }
      } catch (e) {
        // Image URL doesn't work, continue
      }
    }
    
    // THIRD: Use Pexels API - ALWAYS include "nature" for better results
    const exactSearch = attractionName.trim()
    const natureQuery = `${exactSearch} nature`
    const imageUrl = await fetchPexelsImage(natureQuery)
    if (imageUrl) {
      return { url: imageUrl, query: natureQuery }
    }
    
    // FOURTH: Fallback without nature (should rarely be needed)
    const fallbackImage = await fetchPexelsImage(exactSearch)
    if (fallbackImage) {
      return { url: fallbackImage, query: exactSearch }
    }
    
    return null
  } catch (error) {
    console.error(`Error fetching attraction image for ${attractionName}:`, error)
    return null
  }
}

// OpenWeatherMap API for weather
// Note: You'll need a free API key from openweathermap.org
const OPENWEATHER_API_KEY = 'YOUR_OPENWEATHER_API_KEY' // Replace with actual key

export const fetchWeather = async (location, coords) => {
  try {
    // Use free Open-Meteo API (no key required)
    return await fetchWeatherFree(location, coords)
  } catch (error) {
    console.error('Error fetching weather:', error)
    
    // Return mock data if API fails (for development)
    return getMockWeatherData()
  }
}

const groupForecastByDay = (forecastList) => {
  const grouped = {}
  
  forecastList.forEach(item => {
    const date = new Date(item.dt * 1000)
    const dayKey = date.toDateString()
    
    if (!grouped[dayKey]) {
      grouped[dayKey] = {
        dt: item.dt,
        temp: { min: item.main.temp_min, max: item.main.temp_max },
        weather: item.weather,
        snow: item.snow?.['3h'] || 0
      }
    } else {
      // Update min/max temps
      if (item.main.temp_min < grouped[dayKey].temp.min) {
        grouped[dayKey].temp.min = item.main.temp_min
      }
      if (item.main.temp_max > grouped[dayKey].temp.max) {
        grouped[dayKey].temp.max = item.main.temp_max
      }
    }
  })
  
  return Object.values(grouped).slice(0, 7)
}

const getMockWeatherData = () => {
  // Mock weather data for development when API key is not available
  const dates = []
  for (let i = 0; i < 7; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)
    dates.push({
      dt: Math.floor(date.getTime() / 1000),
      temp: {
        min: 20 + Math.random() * 15,
        max: 35 + Math.random() * 20
      },
      weather: [{
        main: i < 2 ? 'Snow' : 'Clear',
        description: i < 2 ? 'light snow' : 'clear sky'
      }],
      snow: i < 2 ? Math.random() * 5 : 0
    })
  }
  
  return {
    current: {
      main: { temp: 32 },
      weather: [{ description: 'partly cloudy' }]
    },
    daily: dates,
    location: { name: 'Location' }
  }
}

// Use a free weather API that doesn't require a key (Open-Meteo)
export const fetchWeatherFree = async (location, coords) => {
  try {
    // Using Open-Meteo (free, no API key required)
    if (!coords) {
      // Geocoding with Open-Meteo
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`
      const geoResponse = await fetch(geoUrl)
      const geoData = await geoResponse.json()
      
      if (!geoData.results || geoData.results.length === 0) {
        throw new Error('Location not found')
      }
      
      coords = { lat: geoData.results[0].latitude, lon: geoData.results[0].longitude }
    }

    // Target travel dates: December 28 to January 3
    // Always use the next occurrence of Dec 28 - Jan 3
    const now = new Date()
    const currentYear = now.getFullYear()
    const dec28ThisYear = new Date(currentYear, 11, 28) // Month is 0-indexed, so 11 = December
    
    // If we're past Dec 28 of current year, use next year's dates
    // Otherwise use this year's dates
    const targetYear = now > dec28ThisYear ? currentYear + 1 : currentYear
    const startDate = `${targetYear}-12-28`
    const endDate = `${targetYear + 1}-01-03`
    
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=temperature_2m_max,temperature_2m_min,weathercode,snowfall_sum&temperature_unit=fahrenheit&timezone=auto&start_date=${startDate}&end_date=${endDate}`
    const response = await fetch(weatherUrl)
    const data = await response.json()
    
    if (!data.daily || !data.daily.time || data.daily.time.length === 0) {
      throw new Error('No weather data available for target dates')
    }
    
    const daily = data.daily.time.map((time, idx) => ({
      dt: new Date(time).getTime() / 1000,
      date: time, // Keep the date string for display
      temp: {
        min: data.daily.temperature_2m_min[idx],
        max: data.daily.temperature_2m_max[idx]
      },
      weather: [{
        main: getWeatherMain(data.daily.weathercode[idx]),
        description: getWeatherDescription(data.daily.weathercode[idx])
      }],
      snow: data.daily.snowfall_sum[idx] || 0
    }))
    
    return {
      current: daily[0],
      daily: daily,
      location: { name: location }
    }
  } catch (error) {
    console.error('Error fetching weather:', error)
    return getMockWeatherData()
  }
}

const getWeatherMain = (code) => {
  // WMO Weather interpretation codes
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
    95: 'thunderstorm', 96: 'thunderstorm with slight hail', 99: 'thunderstorm with heavy hail'
  }
  return descriptions[code] || 'clear sky'
}

