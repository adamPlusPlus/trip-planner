// Single image API: getImageForLocation, getImageForHeader, shouldShowImageForHeader.
// Query format (same idea as rom-browser/media-server cover search): [location city state country] [poi if relevant] [keyword default nature].
// Chain: local header -> backend /api/image (DuckDuckGo, same logic as media-server) -> curated -> Pexels.

import { getLocationImage } from '../utils/locationImages.js'
import {
  shouldShowImageForHeader as shouldShowHeader,
  getImageForHeader as getHeaderImagePath,
} from '../utils/locationImageMap.js'

// Destination id -> header image path (category cards)
const destinationHeaderImages = {
  'pagosa-springs': '/images/headers/pagosa-springs.jpg',
}

const PEXELS_API_KEY = 'UILCwPuEaQGmtNbbdIXdZha7hexD1IwRYjz0QO027BjqvkJxG0clEjtO'

const DEFAULT_IMAGE_KEYWORD = 'nature'

/**
 * Build DuckDuckGo (and fallback) image search query.
 * Format: [location in city state country] [poi (if relevant)] [keyword (default "nature")].
 * Same conceptual pattern as rom-browser/media-server buildCoverSearchQuery (location + optional context + suffix).
 * @param {string} location - Location string (e.g. "Pagosa Springs, CO", "Houston, TX")
 * @param {{ poi?: string, keyword?: string }} [options] - poi = point of interest (e.g. attraction name); keyword defaults to "nature"
 * @returns {string}
 */
export function buildLocationImageQuery(location, options = {}) {
  const { poi, keyword = DEFAULT_IMAGE_KEYWORD } = options
  const parts = [location, poi, keyword].filter(Boolean).map((s) => String(s).trim()).filter(Boolean)
  return parts.length ? parts.join(' ') : keyword
}

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
 * Uses query format: [location] [poi] [keyword]. Tries backend /api/image (DuckDuckGo) first, then curated, then Pexels.
 * @param {string} location - Location name (city, state, country when available)
 * @param {{ destinationId?: string, poi?: string, keyword?: string }} [options]
 */
export async function getImageForLocation(location, options = {}) {
  const { destinationId, poi, keyword = DEFAULT_IMAGE_KEYWORD } = options

  if (destinationId && destinationHeaderImages[destinationId]) {
    return { url: destinationHeaderImages[destinationId], query: location }
  }

  const locationStr = (location && String(location).trim()) || ''
  const query = buildLocationImageQuery(locationStr, { poi, keyword })

  try {
    const res = await fetch(`/api/image?query=${encodeURIComponent(query)}`)
    if (res.ok || res.status === 404) {
      const data = res.ok ? await res.json() : { url: null }
      if (data?.url) return { url: data.url, query }
    }
  } catch (_) {}

  const curated = getLocationImage(locationStr)
  if (curated) return { url: curated, query: locationStr }

  const imageUrl = await fetchPexelsImage(query)
  if (imageUrl) return { url: imageUrl, query }

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

/**
 * Fetch up to 5 image URLs for a location (for destination header cycling).
 * Uses backend /api/images when available; falls back to /api/image (single) so images work even if backend wasn't restarted.
 * @param {string} location - Location name
 * @param {{ destinationId?: string, limit?: number }} [options]
 * @returns {Promise<{ urls: string[], query: string } | null>}
 */
export async function getImagesForLocation(location, options = {}) {
  const { destinationId, limit = 5 } = options

  if (destinationId && destinationHeaderImages[destinationId]) {
    return { urls: [destinationHeaderImages[destinationId]], query: location }
  }

  const locationStr = (location && String(location).trim()) || ''
  const query = buildLocationImageQuery(locationStr)

  try {
    const res = await fetch(
      `/api/images?query=${encodeURIComponent(query)}&limit=${Math.min(limit, 10)}`
    )
    if (res.ok) {
      const data = await res.json().catch(() => null)
      const urls = Array.isArray(data?.urls) ? data.urls : []
      if (urls.length > 0) return { urls, query: locationStr || query }
    }
  } catch (_) {}

  // Fallback: use single-image API (/api/image) + curated + Pexels so images work even when /api/images returns 404
  const single = await getImageForLocation(locationStr || location, { destinationId, keyword: DEFAULT_IMAGE_KEYWORD })
  if (single?.url) return { urls: [single.url], query: single.query || locationStr || query }
  return null
}

export const shouldShowImageForHeader = shouldShowHeader
export const getImageForHeader = getHeaderImagePath
