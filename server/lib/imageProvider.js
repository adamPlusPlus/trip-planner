// Image resolution: cache -> DuckDuckGo -> Pexels. Returns URL or null. Multi: resolveImageUrls returns string[].

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import { resolveDdgImageUrls, resolveDdgImageApi } from './duckduckgoImages.js'

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

function getCachedUrls(query) {
  ensureCacheDir()
  const key = cacheKey(query)
  const multiPath = path.join(CACHE_DIR, `${key}-urls.json`)
  if (!fs.existsSync(multiPath)) return null
  try {
    const meta = JSON.parse(fs.readFileSync(multiPath, 'utf8'))
    return Array.isArray(meta.urls) ? meta.urls : null
  } catch {
    return null
  }
}

function setCachedUrls(query, urls) {
  if (!urls?.length) return
  ensureCacheDir()
  const key = cacheKey(query)
  const multiPath = path.join(CACHE_DIR, `${key}-urls.json`)
  fs.writeFileSync(multiPath, JSON.stringify({ query, urls }), 'utf8')
}

async function fetchDuckDuckGo(query) {
  try {
    return await resolveDdgImageUrls(query)
  } catch {
    return null
  }
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

/**
 * Resolve up to limit image URLs for a query. Cache -> DuckDuckGo (first N) -> Pexels single as fallback.
 * @param {string} query
 * @param {number} limit
 * @returns {Promise<string[]>}
 */
export async function resolveImageUrls(query, limit = 5) {
  if (!query || typeof query !== 'string') return []
  const q = query.trim()
  if (!q) return []

  const cached = getCachedUrls(q)
  if (cached && cached.length > 0) {
    return cached.slice(0, limit)
  }

  const list = await resolveDdgImageApi(q, limit)
  const urls = list.map((r) => r.url).filter(Boolean)
  if (urls.length > 0) {
    setCachedUrls(q, urls)
    return urls.slice(0, limit)
  }

  const single = await fetchPexels(q)
  if (single) {
    const arr = [single]
    setCachedUrls(q, arr)
    return arr
  }

  return []
}
