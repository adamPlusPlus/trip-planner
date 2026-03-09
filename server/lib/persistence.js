// Trip persistence: read/write trips as JSON files under server/data/trips.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, '..', 'data', 'trips')

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function filePath(id) {
  return path.join(DATA_DIR, `${id}.json`)
}

/**
 * @param {string} id
 * @returns {Promise<object | null>}
 */
export async function readTrip(id) {
  ensureDir()
  const fp = filePath(id)
  if (!fs.existsSync(fp)) return null
  const raw = fs.readFileSync(fp, 'utf8')
  return JSON.parse(raw)
}

/**
 * @param {object} trip - must have trip.id
 * @returns {Promise<void>}
 */
export async function writeTrip(trip) {
  ensureDir()
  const fp = filePath(trip.id)
  const toWrite = { ...trip, lastModified: new Date().toISOString() }
  fs.writeFileSync(fp, JSON.stringify(toWrite, null, 2), 'utf8')
}

/**
 * @returns {Promise<Array<{ id: string, name: string, dateRange?: { start, end }, lastModified?: string }>>}
 */
export async function listTrips() {
  try {
    ensureDir()
    if (!fs.existsSync(DATA_DIR) || !fs.statSync(DATA_DIR).isDirectory()) {
      return []
    }
    const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'))
    const list = []
    for (const f of files) {
      const id = f.replace(/\.json$/, '')
      if (!id) continue
      try {
        const trip = await readTrip(id)
        if (trip) {
          list.push({
            id: trip.id,
            name: trip.name || id,
            dateRange: trip.settings?.dateRange,
            lastModified: trip.lastModified || null,
          })
        }
      } catch (_) {
        // skip corrupt file
      }
    }
    return list
  } catch (err) {
    console.error('listTrips error:', err)
    return []
  }
}

/**
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function deleteTrip(id) {
  const fp = filePath(id)
  if (!fs.existsSync(fp)) return false
  fs.unlinkSync(fp)
  return true
}
