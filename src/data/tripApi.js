// Trip API: getTrips, getTrip, saveTrip, getPlanSectionContent. Calls backend /api/trips.

import { getPlanContent } from './tripData.js'
import { staticDestinations } from './staticDestinations.js'
import { createTrip, createDestination } from '../domain/trip.js'

const API = '/api'

async function getJson(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = new Error(res.statusText || 'Request failed')
    err.status = res.status
    throw err
  }
  if (res.status === 204) return null
  return res.json()
}

/**
 * List trip summaries. Returns [] if backend unavailable or empty.
 */
export async function getTrips() {
  try {
    return await getJson('/trips')
  } catch (e) {
    console.warn('getTrips failed:', e.message)
    return []
  }
}

/**
 * Get the most recently saved trip (by lastModified). Used to pre-fill new trip Trip Data.
 * @returns {Promise<object | null>}
 */
export async function getLatestTripForTemplate() {
  const list = await getTrips()
  if (!list.length) return null
  const withModified = list.filter((t) => t.lastModified).sort((a, b) => (b.lastModified || '').localeCompare(a.lastModified || ''))
  const latest = withModified.length ? withModified[0] : list[0]
  return getTrip(latest.id)
}

/**
 * Get full trip by id. Returns null if not found or backend error.
 * Uses fetch directly so 404 does not throw (avoids console error for "new" check).
 */
export async function getTrip(id) {
  try {
    const res = await fetch(`${API}/trips/${id}`, { headers: { Accept: 'application/json' } })
    if (res.status === 404) return null
    if (!res.ok) throw new Error(res.statusText || 'Request failed')
    return res.json()
  } catch (e) {
    console.warn('getTrip failed:', e.message)
    return null
  }
}

/**
 * Save trip (create or update). Backend runs recompute and returns updated trip.
 * @param {object} trip
 * @param {{ create?: boolean }} [opts] - If create: true, always POST (skip existence check). Use for "New trip" to avoid GET 404.
 */
export async function saveTrip(trip, opts = {}) {
  const forceCreate = opts.create === true
  const isNew = forceCreate || !(await getTrip(trip.id))
  const path = isNew ? '/trips' : `/trips/${trip.id}`
  const method = isNew ? 'POST' : 'PUT'
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(trip),
  })
  if (!res.ok) {
    const err = new Error(res.statusText || 'Save failed')
    err.status = res.status
    throw err
  }
  return res.json()
}

/**
 * Get content for a plan section. If section has path, fetches markdown; else returns markdownBody or ''.
 * @param {object} trip
 * @param {string} [destinationId]
 * @param {object} section - { id, type, name, path?, markdownBody? }
 */
export async function getPlanSectionContent(trip, destinationId, section) {
  if (section.path) {
    return getPlanContent(section.path)
  }
  return section.markdownBody || ''
}

/**
 * Build default trip. New user trips have no destinations; the seed "default" trip has Pagosa.
 * @param {{ useUniqueId?: boolean }} [opts] - If true, unique id and empty destinations (new trip). If false, id 'default' with static destinations (Pagosa).
 */
export function buildDefaultTrip(opts = {}) {
  const id = opts.useUniqueId ? `trip-${Date.now()}` : 'default'
  const settings = {
    dateRange: { start: '', end: '' },
    costTarget: null,
    people: { count: 2, names: ['Person 1', 'Person 2'] },
  }
  if (opts.useUniqueId) {
    const base = createTrip({ id, name: 'New Trip', destinations: [], settings })
    if (opts.copyFromTrip) {
      return {
        ...base,
        origin: opts.copyFromTrip.origin ?? base.origin,
        endpoint: opts.copyFromTrip.endpoint ?? base.endpoint,
        settings: opts.copyFromTrip.settings ? { ...base.settings, ...opts.copyFromTrip.settings } : base.settings,
      }
    }
    return base
  }
  const dest = staticDestinations[0]
  if (!dest) {
    return createTrip({ id, name: 'Default Trip', destinations: [], settings })
  }
  return createTrip({
    id,
    name: 'Default Trip',
    origin: { name: 'Houston, TX' },
    endpoint: { name: dest.location },
    destinations: [
      createDestination({
        id: dest.id,
        name: dest.name,
        location: dest.location,
        coords: dest.coords,
        distance: dest.distance,
        description: dest.description,
        category: dest.category,
        plans: dest.plans,
      }),
    ],
    settings,
  })
}
