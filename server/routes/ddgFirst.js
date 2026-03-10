// GET /api/ddg-first?q=...&filterContains=... - first DDG web result URL

import { resolveDdgFirstMatch } from '../lib/duckduckgoFirst.js'

export function register(app) {
  app.get('/api/ddg-first', async (req, res) => {
    const q = (req.query.q != null && req.query.q !== '')
      ? String(req.query.q).trim()
      : ''
    const filterContains = (req.query.filterContains != null &&
      req.query.filterContains !== '')
      ? String(req.query.filterContains).trim()
      : ''
    if (!q) {
      return res.status(400).json({ error: 'q required' })
    }
    try {
      const url = await resolveDdgFirstMatch(q, '', filterContains)
      const valid =
        url && /^https?:\/\//i.test(url) && !url.startsWith('https://duckduckgo.com/?q=')
      res.json({ url: valid ? url : null })
    } catch (err) {
      console.error(err)
      res.status(502).json({ error: 'DDG resolve failed' })
    }
  })
}
