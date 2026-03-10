// Resolve first DuckDuckGo web search result. Used by GET /api/ddg-first.

import { DDG_FETCH_HEADERS } from './duckduckgoHeaders.js'

/**
 * Search DDG HTML, return first result URL that contains filterContains, or first link if no filter.
 * @param {string} query
 * @param {string} [suffix] - Appended to query
 * @param {string} [filterContains] - Return first URL whose decoded link contains this (case-insensitive)
 * @returns {Promise<string>} - Resolved URL or fallback DDG search URL
 */
export async function resolveDdgFirstMatch(query, suffix = '', filterContains = '') {
  const q = encodeURIComponent(
    `${String(query).trim()} ${String(suffix).trim()}`.trim()
  )
  const ddgHtmlUrl = `https://html.duckduckgo.com/html/?q=${q}`
  try {
    const resp = await fetch(ddgHtmlUrl, { headers: DDG_FETCH_HEADERS })
    const html = await resp.text()
    const filter = (filterContains || '').toLowerCase()
    const uddgRegex = /uddg=([^&"'\s]+)(?:&|&amp;|"|')/g
    let m
    while ((m = uddgRegex.exec(html)) !== null) {
      try {
        const decoded = decodeURIComponent(m[1].replace(/\+/g, ' '))
        if (!/^https?:\/\//i.test(decoded)) continue
        if (filter && decoded.toLowerCase().includes(filter)) return decoded
        if (!filter) return decoded
      } catch {
        /* skip */
      }
    }
    return `https://duckduckgo.com/?q=${q}`
  } catch {
    return `https://duckduckgo.com/?q=${q}`
  }
}
