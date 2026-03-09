// Image resolution: cache -> DuckDuckGo (stub) -> Pexels. Returns URL or null.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CACHE_DIR = path.resolve(__dirname, '..', 'cache', 'images')
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || ''

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true })
  }
}

function cacheKey(query) {
  return crypto.createHash('md5').update(query.toLowerCase().trim()).digest('hex')
}

function getCachedUrl(query) {
  ensureCacheDir()
  const key = cacheKey(query)
  const metaPath = path.join(CACHE_DIR, `${key}.json`)
  if (!fs.existsSync(metaPath)) return null
  try {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
    return meta.url || null
  } catch {
    return null
  }
}

function setCachedUrl(query, url) {
  ensureCacheDir()
  const key = cacheKey(query)
  const metaPath = path.join(CACHE_DIR, `${key}.json`)
  fs.writeFileSync(metaPath, JSON.stringify({ query, url }), 'utf8')
}

async function fetchDuckDuckGo(query) {
  // Stub: DuckDuckGo image scrape can be added here. Return null to fall through to Pexels.
  return null
}

async function fetchPexels(query) {
  if (!PEXELS_API_KEY) return null
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: PEXELS_API_KEY } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const url = data.photos?.[0]?.src?.large || data.photos?.[0]?.src?.medium
    return url || null
  } catch {
    return null
  }
}

/**
 * Resolve image URL for a search query. Cache -> DuckDuckGo -> Pexels.
 * @param {string} query
 * @returns {Promise<string | null>}
 */
export async function resolveImageUrl(query) {
  if (!query || typeof query !== 'string') return null
  const q = query.trim()
  if (!q) return null

  const cached = getCachedUrl(q)
  if (cached) return cached

  const duck = await fetchDuckDuckGo(q)
  if (duck) {
    setCachedUrl(q, duck)
    return duck
  }

  const pexels = await fetchPexels(q)
  if (pexels) {
    setCachedUrl(q, pexels)
    return pexels
  }

  return null
}
