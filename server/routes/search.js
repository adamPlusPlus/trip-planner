// GET /api/search?q=... - run search, return sanitized results for in-app display.

export function register(app) {
  app.get('/api/search', async (req, res) => {
    const q = req.query.q
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Missing q' })
    }
    try {
      // Placeholder: return a DuckDuckGo HTML search URL and minimal result structure.
      // Full impl would fetch DuckDuckGo (or similar), parse, sanitize, return { results: [{ title, link, snippet }] }.
      const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(q.trim())}`
      res.json({
        query: q.trim(),
        searchUrl,
        results: [],
      })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Search failed' })
    }
  })
}
