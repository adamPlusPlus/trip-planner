// GET /api/image?query=... - resolve image URL for query (cache -> DuckDuckGo -> Pexels).

import { resolveImageUrl } from '../lib/imageProvider.js'

export function register(app) {
  app.get('/api/image', async (req, res) => {
    const query = req.query.query
    if (!query) {
      return res.status(400).json({ error: 'Missing query' })
    }
    try {
      const url = await resolveImageUrl(query)
      if (!url) {
        return res.status(404).json({ error: 'No image found' })
      }
      res.json({ url })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Image resolution failed' })
    }
  })
}
