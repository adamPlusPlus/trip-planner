// GET /api/directions?origin=...&destination=...&waypoints=...&maxDrivingHours=10&overnightFlexibility=0.2

import { fetchDirectionsFromGoogle, computeOvernightStops } from '../lib/directions.js'

export function register(app) {
  app.get('/api/directions', async (req, res) => {
    const origin = req.query.origin
    const destination = req.query.destination
    const waypointsParam = req.query.waypoints
    const maxDrivingHours = Math.min(24, Math.max(1, parseFloat(req.query.maxDrivingHours) || 10))
    const overnightFlexibility = Math.min(1, Math.max(0, parseFloat(req.query.overnightFlexibility) || 0.2))
    if (!origin || typeof origin !== 'string' || !destination || typeof destination !== 'string') {
      return res.status(400).json({ error: 'Missing origin or destination' })
    }
    const waypoints = waypointsParam && typeof waypointsParam === 'string'
      ? waypointsParam.split('|').map((w) => w.trim()).filter(Boolean)
      : []
    try {
      const { segments } = await fetchDirectionsFromGoogle(origin.trim(), destination.trim(), waypoints)
      const totalHours = segments.reduce((sum, s) => sum + (s.durationHours || 0), 0)
      const overnightStops = totalHours > maxDrivingHours
        ? computeOvernightStops(segments, maxDrivingHours, overnightFlexibility)
        : []
      res.json({ segments, overnightStops })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Directions fetch failed' })
    }
  })
}
