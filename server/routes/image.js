// GET /api/image?query=... - single image URL.
// GET /api/images?query=...&limit=5 - up to limit image URLs for cycling.

import { resolveImageUrl, resolveImageUrls } from '../lib/imageProvider.js'

export function register(app) {
  app.get('/api/image', async (req, res) => {
    const query = req.query.query
    if (!query) {
      return res.status(400).json({ error: 'Missing query' })
    }
    try {
      const url = await resolveImageUrl(query)
      // 200 with url: null when not found so clients can fall back without 404 noise
      res.json({ url: url || null })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Image resolution failed' })
    }
  })

  app.get('/api/images', async (req, res) => {
    const query = req.query.query
    if (!query) {
      return res.status(400).json({ error: 'Missing query' })
    }
    const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 5), 10)
    try {
      const urls = await resolveImageUrls(query, limit)
      res.json({ urls })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Image resolution failed' })
    }
  })
}
