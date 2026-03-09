// GET /api/places?location=...&query=...&type=attraction|poi&limit=10

import { fetchPlacesFromGoogle, fetchOnePlaceFallback } from '../lib/places.js'
import { resolveImageUrl } from '../lib/imageProvider.js'

export function register(app) {
  app.get('/api/places', async (req, res) => {
    const location = req.query.location
    const type = (req.query.type || 'attraction').toLowerCase()
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 10))
    if (!location || typeof location !== 'string') {
      return res.status(400).json({ error: 'Missing location' })
    }
    if (type !== 'attraction' && type !== 'poi') {
      return res.status(400).json({ error: 'type must be attraction or poi' })
    }
    try {
      const fromGoogle = await fetchPlacesFromGoogle(location.trim(), type, limit)
      if (fromGoogle.length) {
        const key = type === 'attraction' ? 'attractions' : 'pointsOfInterest'
        return res.json({ [key]: fromGoogle })
      }
      const query = req.query.query
      if (query && typeof query === 'string') {
        const one = await fetchOnePlaceFallback(location.trim(), query.trim(), resolveImageUrl)
        if (one) {
          const key = type === 'attraction' ? 'attractions' : 'pointsOfInterest'
          return res.json({ [key]: [one] })
        }
      }
      res.json({ attractions: [], pointsOfInterest: [] })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Places fetch failed' })
    }
  })
}
