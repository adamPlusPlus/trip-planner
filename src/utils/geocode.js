/**
 * Single-location geocoding via Open-Meteo (no API key). Used for route map waypoints.
 * @param {string} query - Place name (e.g. "Houston, TX", "Pagosa Springs, CO")
 * @returns {Promise<{ lat: number, lon: number, name: string } | null>}
 */
export async function geocodeOne(query) {
  const q = (query || '').trim()
  if (!q) return null
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json().catch(() => ({}))
  const r = data.results?.[0]
  if (!r || r.latitude == null || r.longitude == null) return null
  const name = [r.name, r.admin1, r.country].filter(Boolean).join(', ')
  return { lat: r.latitude, lon: r.longitude, name: name || q }
}
