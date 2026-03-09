// Directions: Google Directions API when key is set; overnight stop logic.

const GOOGLE_DIRECTIONS_API_KEY = process.env.GOOGLE_DIRECTIONS_API_KEY || process.env.GOOGLE_PLACES_API_KEY || ''

/**
 * Fetch route segments from Google Directions API.
 * @param {string} origin - address or place name
 * @param {string} destination - address or place name
 * @param {string[]} [waypoints] - optional waypoint addresses
 * @returns {Promise<{ segments: Array<{ from: string, to: string, durationHours?: number, distanceMiles?: number, mapUrl?: string }> }>}
 */
export async function fetchDirectionsFromGoogle(origin, destination, waypoints = []) {
  if (!GOOGLE_DIRECTIONS_API_KEY) {
    return { segments: [] }
  }
  try {
    const baseUrl = 'https://maps.googleapis.com/maps/api/directions/json'
    const params = new URLSearchParams({
      origin: origin,
      destination: destination,
      key: GOOGLE_DIRECTIONS_API_KEY,
    })
    if (waypoints.length) {
      params.set('waypoints', waypoints.join('|'))
    }
    const res = await fetch(`${baseUrl}?${params}`)
    if (!res.ok) return { segments: [] }
    const data = await res.json()
    if (data.status !== 'OK' || !data.routes?.[0]?.legs?.length) return { segments: [] }
    const legs = data.routes[0].legs
    const segments = legs.map((leg, i) => {
      const from = leg.start_address || leg.start_location?.lat + ',' + leg.start_location?.lng || 'Origin'
      const to = leg.end_address || leg.end_location?.lat + ',' + leg.end_location?.lng || 'Destination'
      const durationHours = leg.duration?.value ? leg.duration.value / 3600 : undefined
      const distanceMiles = leg.distance?.value ? leg.distance.value / 1609.344 : undefined
      const mapUrl = `https://www.google.com/maps/dir/${encodeURIComponent(from)}/${encodeURIComponent(to)}`
      return { from, to, durationHours, distanceMiles, mapUrl }
    })
    return { segments }
  } catch (e) {
    console.error('Google Directions fetch error:', e)
    return { segments: [] }
  }
}

/**
 * Compute overnight stops from segments using maxDrivingHours and overnightFlexibility.
 * @param {Array<{ from: string, to: string, durationHours?: number }>} segments
 * @param {number} maxDrivingHours - e.g. 10
 * @param {number} overnightFlexibility - fraction e.g. 0.2
 * @returns {Array<{ id: string, name: string, location?: string, costCents?: number, mapUrl?: string, imageUrl?: string }>}
 */
export function computeOvernightStops(segments, maxDrivingHours = 10, overnightFlexibility = 0.2) {
  if (!segments?.length) return []
  const window = maxDrivingHours * Math.max(0, Math.min(1, overnightFlexibility))
  const low = maxDrivingHours - window
  const high = maxDrivingHours + window
  let cumulative = 0
  const stops = []
  let stopIndex = 0
  for (const seg of segments) {
    const dur = seg.durationHours || 0
    const nextCumulative = cumulative + dur
    if (cumulative < low && nextCumulative >= low) {
      stopIndex += 1
      const location = seg.to || seg.from
      stops.push({
        id: `overnight-${stopIndex}-${Date.now()}`,
        name: `Stop ${stopIndex}: ${location}`,
        location,
        costCents: undefined,
        mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`,
        imageUrl: undefined,
      })
    }
    cumulative = nextCumulative
    if (cumulative >= high) cumulative = 0
  }
  return stops
}
