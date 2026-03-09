// Trip CRUD and recompute. PUT triggers recompute before save.

import * as persistence from '../lib/persistence.js'
import { recomputeTrip } from '../lib/recompute.js'

export function register(app) {
  // List trips
  app.get('/api/trips', async (req, res) => {
    try {
      const list = await persistence.listTrips()
      res.json(list)
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Failed to list trips' })
    }
  })

  // Get one trip
  app.get('/api/trips/:id', async (req, res) => {
    try {
      const trip = await persistence.readTrip(req.params.id)
      if (!trip) {
        return res.status(404).json({ error: 'Trip not found' })
      }
      res.json(trip)
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Failed to read trip' })
    }
  })

  // Create trip
  app.post('/api/trips', async (req, res) => {
    try {
      const body = req.body || {}
      const trip = {
        id: body.id || `trip-${Date.now()}`,
        name: body.name ?? null,
        origin: body.origin ?? null,
        endpoint: body.endpoint ?? null,
        destinations: body.destinations ?? [],
        settings: body.settings ?? {
          dateRange: body.settings?.dateRange ?? { start: '', end: '' },
          costTarget: body.settings?.costTarget ?? null,
          people: body.settings?.people ?? { count: 2, names: ['Person 1', 'Person 2'] },
        },
      }
      const recomputed = recomputeTrip(trip)
      await persistence.writeTrip(recomputed)
      res.status(201).json(recomputed)
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Failed to create trip' })
    }
  })

  // Update trip (runs recompute then save)
  app.put('/api/trips/:id', async (req, res) => {
    try {
      const id = req.params.id
      const existing = await persistence.readTrip(id)
      if (!existing) {
        return res.status(404).json({ error: 'Trip not found' })
      }
      const body = req.body || {}
      const trip = {
        id,
        name: body.name ?? existing.name,
        origin: body.origin ?? existing.origin,
        endpoint: body.endpoint ?? existing.endpoint,
        destinations: body.destinations ?? existing.destinations,
        settings: body.settings ?? existing.settings,
      }
      const recomputed = recomputeTrip(trip)
      await persistence.writeTrip(recomputed)
      res.json(recomputed)
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Failed to update trip' })
    }
  })

  // Delete trip
  app.delete('/api/trips/:id', async (req, res) => {
    try {
      const ok = await persistence.deleteTrip(req.params.id)
      if (!ok) return res.status(404).json({ error: 'Trip not found' })
      res.status(204).send()
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Failed to delete trip' })
    }
  })
}
