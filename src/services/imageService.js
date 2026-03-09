// Single image API: getImageForLocation, getImageForHeader, shouldShowImageForHeader.
// Chain: local maps -> (later backend) -> Google search -> curated -> Pexels.

import { getLocationImage } from '../utils/locationImages.js'
import { getLocationImageFromSearch } from '../utils/googleImageSearch.js'
import {
  shouldShowImageForHeader as shouldShowHeader,
  getImageForHeader as getHeaderImagePath,
} from '../utils/locationImageMap.js'

// Destination id -> header image path (category cards)
const destinationHeaderImages = {
  'pagosa-springs': '/images/headers/pagosa-springs.jpg',
}

const destinationSearchTerms = {
  'pagosa-springs': 'Pagosa Springs Colorado hot springs mountains nature',
}

const PEXELS_API_KEY = 'UILCwPuEaQGmtNbbdIXdZha7hexD1IwRYjz0QO027BjqvkJxG0clEjtO'

async function fetchPexelsImage(searchTerm) {
  if (!PEXELS_API_KEY) return null
  try {
    const query = encodeURIComponent(searchTerm)
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${query}&per_page=5&orientation=landscape`,
      { headers: { Authorization: PEXELS_API_KEY } }
    )
    if (!response.ok) return null
    const data = await response.json()
    if (data.photos?.length > 0) {
      return data.photos[0].src.large || data.photos[0].src.medium
    }
  } catch (e) {
    console.error('Pexels image fetch error:', e)
  }
  return null
}

/**
 * Resolve image for a location (category card or general). Returns { url, query } or null.
 * Tries backend /api/image first, then local maps, then Google/Pexels.
 * @param {string} location - Location name
 * @param {{ destinationId?: string }} [options]
 */
export async function getImageForLocation(location, options = {}) {
  const { destinationId } = options

  if (destinationId && destinationHeaderImages[destinationId]) {
    return { url: destinationHeaderImages[destinationId], query: location }
  }

  try {
    const res = await fetch(`/api/image?query=${encodeURIComponent(location)}`)
    if (res.ok) {
      const data = await res.json()
      if (data.url) return { url: data.url, query: location }
    }
  } catch (_) {}

  const googleResult = await getLocationImageFromSearch(location)
  if (googleResult?.url) {
    return { url: googleResult.url, query: googleResult.query || location }
  }

  const curated = getLocationImage(location)
  if (curated) return { url: curated, query: location }

  let searchTerm =
    destinationId && destinationSearchTerms[destinationId]
      ? destinationSearchTerms[destinationId]
      : location.toLowerCase().includes('pagosa')
        ? destinationSearchTerms['pagosa-springs']
        : `${(location.split(',')[0] || location).trim()} nature`
  if (!searchTerm.includes('nature')) searchTerm = `${searchTerm} nature`
  const imageUrl = await fetchPexelsImage(searchTerm)
  if (imageUrl) return { url: imageUrl, query: searchTerm }

  return null
}

/**
 * Local path for a destination's header image (category card). Sync; no async.
 * @param {string} destinationId
 * @returns {string | null}
 */
export function getLocalHeaderImage(destinationId) {
  return destinationHeaderImages[destinationId] || null
}

export const shouldShowImageForHeader = shouldShowHeader
export const getImageForHeader = getHeaderImagePath
