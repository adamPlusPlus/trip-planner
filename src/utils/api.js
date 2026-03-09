// Legacy API surface: re-export weather and image for backward compatibility.
// New code should use services/weatherService and services/imageService directly.

import { fetchWeather } from '../services/weatherService.js'
import {
  getImageForLocation,
  getImageForHeader,
} from '../services/imageService.js'

export { fetchWeather }

export async function fetchLocationImage(location, destinationId = null) {
  return getImageForLocation(location, { destinationId })
}

export async function fetchAttractionImage(attractionName) {
  const result = await getImageForLocation(attractionName)
  return result ? { url: result.url, query: result.query || attractionName } : null
}

export { getImageForHeader }
