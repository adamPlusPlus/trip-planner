// Places search: Google Places API when GOOGLE_PLACES_API_KEY is set; otherwise fallback (search + image).

import { buildLocationImageQuery } from './buildImageQuery.js'

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || ''

/**
 * Fetch places from Google Places API (Text Search / Find Place).
 * @param {string} location - e.g. "Pagosa Springs, CO" or lat,lng
 * @param {string} type - 'attraction' | 'poi'
 * @param {number} maxResults - default 10
 * @returns {Promise<Array<{ id: string, name: string, description?: string, imageUrl?: string, mapUrl?: string, researchLinks: string[], costCents?: number, costNote?: string }>>
 */
export async function fetchPlacesFromGoogle(location, type, maxResults = 10) {
  if (!GOOGLE_PLACES_API_KEY) return []
  try {
    const baseUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json'
    const query = type === 'attraction' ? 'attractions' : 'points of interest'
    const params = new URLSearchParams({
      query: `${query} in ${location}`,
      key: GOOGLE_PLACES_API_KEY,
    })
    const res = await fetch(`${baseUrl}?${params}`)
    if (!res.ok) return []
    const data = await res.json()
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') return []
    const places = (data.results || []).slice(0, maxResults)
    const results = []
    for (const p of places) {
      const placeId = p.place_id
      const name = p.name || ''
      const description = (p.formatted_address || '') + (p.types?.length ? ` (${p.types[0]})` : '')
      const mapUrl = placeId ? `https://www.google.com/maps/place/?q=place_id:${placeId}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + location)}`
      const researchLinks = [mapUrl]
      if (p.photos?.[0]?.photo_reference) {
        const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${p.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
        results.push({
          id: placeId,
          name,
          description,
          imageUrl: photoUrl,
          mapUrl,
          researchLinks,
          costCents: p.price_level != null ? (p.price_level + 1) * 2500 : undefined,
          costNote: p.price_level != null ? `Price level ${p.price_level + 1}` : undefined,
        })
      } else {
        results.push({
          id: placeId,
          name,
          description,
          imageUrl: undefined,
          mapUrl,
          researchLinks,
          costCents: p.price_level != null ? (p.price_level + 1) * 2500 : undefined,
          costNote: p.price_level != null ? `Price level ${p.price_level + 1}` : undefined,
        })
      }
    }
    return results
  } catch (e) {
    console.error('Google Places fetch error:', e)
    return []
  }
}

/**
 * Fallback: build one place from search + image (no Google). For "add by name" flow.
 * @param {string} location
 * @param {string} query - place name
 * @param {function(string): Promise<string|null>} resolveImageUrl
 * @returns {Promise<{ id: string, name: string, description?: string, imageUrl?: string, mapUrl: string, researchLinks: string[], costCents?: number, costNote?: string } | null>}
 */
export async function fetchOnePlaceFallback(location, query, resolveImageUrl) {
  const name = (query || '').trim()
  if (!name) return null
  const searchQuery = `${name} ${location}`
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`
  const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(searchQuery)}`
  const imageQuery = buildLocationImageQuery((location || '').trim(), { poi: name })
  const imageUrl = resolveImageUrl ? await resolveImageUrl(imageQuery) : null
  return {
    id: `fallback-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name,
    description: `${location}`,
    imageUrl: imageUrl || undefined,
    mapUrl,
    researchLinks: [mapUrl, searchUrl],
    costCents: undefined,
    costNote: undefined,
  }
}
