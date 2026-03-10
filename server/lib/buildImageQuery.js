/**
 * Build image search query for DuckDuckGo (same format as rom-browser/media-server cover search).
 * Format: [location in city state country] [poi (if relevant)] [keyword (default "nature")].
 * Used by imageProvider callers (e.g. places fallback) so the same query shape is used everywhere.
 */

const DEFAULT_KEYWORD = 'nature'

/**
 * @param {string} location - Location string (e.g. "Pagosa Springs, CO")
 * @param {{ poi?: string, keyword?: string }} [options]
 * @returns {string}
 */
export function buildLocationImageQuery(location, options = {}) {
  const { poi, keyword = DEFAULT_KEYWORD } = options
  const parts = [location, poi, keyword].filter(Boolean).map((s) => String(s).trim()).filter(Boolean)
  return parts.length ? parts.join(' ') : keyword
}
