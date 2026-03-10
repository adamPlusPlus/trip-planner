// GET /api/osrm/route?coords=lng1,lat1;lng2,lat2;...
// Proxies to OSRM public API to avoid CORS. Returns route with legs and geometry.
// Optional env: OSRM_BASE_URL (default https://router.project-osrm.org)

const OSRM_BASE = process.env.OSRM_BASE_URL || 'https://router.project-osrm.org'
const OSRM_TIMEOUT_MS = 15000

export function register(app) {
  app.get('/api/osrm/route', async (req, res) => {
    const coords = req.query.coords
    if (!coords || typeof coords !== 'string') {
      return res.status(400).json({ error: 'Missing coords (lng,lat;lng,lat;...)' })
    }
    const trimmed = coords.split(';').map((s) => s.trim()).filter(Boolean)
    if (trimmed.length < 2) {
      return res.status(400).json({ error: 'At least 2 coordinates required' })
    }
    const coordsParam = trimmed.join(';')
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), OSRM_TIMEOUT_MS)
    try {
      const url = `${OSRM_BASE}/route/v1/driving/${coordsParam}?overview=full&geometries=geojson`
      const r = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)
      if (!r.ok) {
        return res.status(502).json({ error: 'Route service unavailable' })
      }
      const data = await r.json()
      if (data.code !== 'Ok') {
        return res.status(400).json({ error: data.message || 'OSRM error', code: data.code })
      }
      res.json(data)
    } catch (e) {
      clearTimeout(timeoutId)
      if (e.name === 'AbortError') {
        return res.status(504).json({ error: 'Route request timed out.' })
      }
      console.error('OSRM proxy error', e)
      res.status(502).json({ error: 'OSRM request failed' })
    }
  })
}
