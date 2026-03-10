// DuckDuckGo HTML search for places (attractions, POIs). No API key. Used when Google Places is unset or returns empty.
// Session warming (GET before POST) and cookie forwarding match the image flow for reliability.

import { DDG_FETCH_HEADERS } from './duckduckgoHeaders.js'
import crypto from 'crypto'

const CHALLENGE_REGEX = /challenge-form|not a robot|Your IP address is/i

/** Get Cookie header value from a fetch Response. Node 18.19+ has getSetCookie(); otherwise use get('set-cookie'). */
function getCookiesFromResponse(res) {
  if (!res || !res.headers) return ''
  if (typeof res.headers.getSetCookie === 'function') {
    const list = res.headers.getSetCookie()
    if (!Array.isArray(list) || list.length === 0) return ''
    return list.map((s) => s.split(';')[0].trim()).join('; ')
  }
  const setCookie = res.headers.get('set-cookie')
  if (!setCookie) return ''
  return setCookie.split(';')[0].trim()
}

/**
 * Parse DDG HTML results: extract result links (uddg=) and titles.
 * Tries multiple patterns so autofill works even when DDG changes class names.
 * Returns array of { title, url }.
 */
function parseDdgHtmlResults(html, limit = 20) {
  const results = []
  const seen = new Set()

  function add(title, url) {
    if (results.length >= limit) return
    if (!url || !/^https?:\/\//i.test(url) || /duckduckgo\.com/i.test(url)) return
    const key = url.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    results.push({ title: (title || url).slice(0, 200), url })
  }

  // 1) Any <a> with href containing uddg= (order-agnostic: href before or after class)
  const anyLinkWithUddg =
    /<a[^>]+href=["']([^"']*uddg=[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  let m
  while ((m = anyLinkWithUddg.exec(html)) !== null && results.length < limit) {
    const href = (m[1] || '').trim()
    const rawTitle = (m[2] || '').replace(/<[^>]+>/g, '').trim()
    const uddgMatch = href.match(/uddg=([^&"'\s]+)/)
    if (uddgMatch) {
      try {
        const url = decodeURIComponent(uddgMatch[1].replace(/\+/g, ' '))
        add(rawTitle, url)
      } catch {
        /* skip */
      }
    }
  }

  // 2) Class result__a (legacy DDG class)
  if (results.length < limit) {
    const resultALink =
      /<a[^>]+class="[^"]*result__a[^"]*"[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
    while ((m = resultALink.exec(html)) !== null && results.length < limit) {
      const href = (m[1] || '').trim()
      const rawTitle = (m[2] || '').replace(/<[^>]+>/g, '').trim()
      const uddgMatch = href.match(/uddg=([^&"'\s]+)/)
      if (uddgMatch) {
        try {
          const url = decodeURIComponent(uddgMatch[1].replace(/\+/g, ' '))
          add(rawTitle, url)
        } catch {
          /* skip */
        }
      }
    }
  }

  // 3) Fallback: all uddg= URLs in order (no title)
  if (results.length === 0) {
    const uddgRegex = /uddg=([^&"'\s]+)(?:&|&amp;|"|')/g
    while ((m = uddgRegex.exec(html)) !== null && results.length < limit) {
      try {
        const decoded = decodeURIComponent(m[1].replace(/\+/g, ' '))
        add(decoded, decoded)
      } catch {
        /* skip */
      }
    }
  }

  // 4) Stronger fallback: direct result links (when DDG markup changes)
  if (results.length === 0) {
    const directHrefRegex = /<a[^>]+href=["'](https?:\/\/[^"']+)["'][^>]*>/gi
    while ((m = directHrefRegex.exec(html)) !== null && results.length < limit) {
      const u = (m[1] || '').trim()
      if (!u || /duckduckgo\.com|google\.com\/url|bing\.com\/ck/i.test(u)) continue
      add(u, u)
    }
  }
  return results
}

/**
 * Run one attempt: try simple GET first (works often); if empty/challenge, warm GET + POST + GET fallback. Returns parsed results or null.
 */
async function fetchPlacesAttempt(query, limit, cookieHeader = '') {
  const qEnc = encodeURIComponent(query)
  const getUrl = 'https://html.duckduckgo.com/html/?q=' + qEnc
  const getHeaders = { ...DDG_FETCH_HEADERS }
  if (cookieHeader) getHeaders.Cookie = cookieHeader

  let resp = await fetch(getUrl, { headers: getHeaders }).catch(() => null)
  if (resp && resp.ok) {
    const html = await resp.text()
    if (!CHALLENGE_REGEX.test(html)) {
      const parsed = parseDdgHtmlResults(html, Math.min(limit, 20))
      if (parsed.length > 0) return parsed
    }
  }

  const postUrl = 'https://html.duckduckgo.com/html/'
  const body =
    'q=' + qEnc + '&b=&nextParams=&api=d.js&o=json&v=l&dc=1&s=0&kl=wt-wt'
  const postHeaders = {
    ...DDG_FETCH_HEADERS,
    'Content-Type': 'application/x-www-form-urlencoded',
    Referer: 'https://html.duckduckgo.com/',
  }
  if (cookieHeader) postHeaders.Cookie = cookieHeader

  resp = await fetch(postUrl, { method: 'POST', headers: postHeaders, body }).catch(() => null)
  if (resp && resp.ok) {
    const html = await resp.text()
    if (!CHALLENGE_REGEX.test(html)) {
      const parsed = parseDdgHtmlResults(html, Math.min(limit, 20))
      if (parsed.length > 0) return parsed
    }
  }

  resp = await fetch(getUrl, { headers: getHeaders }).catch(() => null)
  if (resp && resp.ok) {
    const html = await resp.text()
    if (!CHALLENGE_REGEX.test(html)) {
      const parsed = parseDdgHtmlResults(html, Math.min(limit, 20))
      if (parsed.length > 0) return parsed
    }
  }
  return null
}

/** Build places output from parsed { title, url } list. */
function toPlacesList(parsed, loc) {
  return parsed.map((r, idx) => {
    const name = r.title || r.url
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + loc)}`
    const id =
      'ddg-' +
      idx +
      '-' +
      crypto.createHash('md5').update(r.url).digest('hex').slice(0, 8)
    return {
      id,
      name,
      description: r.url,
      mapUrl,
      researchLinks: [mapUrl, r.url],
      imageUrl: undefined,
      costCents: undefined,
      costNote: undefined,
    }
  })
}

/**
 * Fetch places from DuckDuckGo HTML search. Same shape as Google places for compatibility.
 * Tries GET first, then POST with cookies; multiple query variants; retries with backoff.
 * @param {string} location - e.g. "Nashville, Tennessee"
 * @param {string} type - 'attraction' | 'poi'
 * @param {number} limit - max results (default 10)
 * @returns {Promise<Array<{ id, name, description?, mapUrl, researchLinks, imageUrl?, costCents?, costNote? }>>}
 */
export async function fetchPlacesFromDuckDuckGo(location, type, limit = 10) {
  const loc = (location || '').trim()
  if (!loc) return []
  const maxResults = Math.min(limit, 20)

  const queryVariants =
    type === 'attraction'
      ? [`attractions in ${loc}`, `things to do in ${loc}`, `tourist attractions ${loc}`]
      : [`points of interest ${loc}`, `places to visit ${loc}`, `${loc} places`]

  const seenUrls = new Set()
  let merged = []

  try {
    for (const query of queryVariants) {
      if (merged.length >= maxResults) break

      let cookieHeader = ''
      const warmUrl = 'https://duckduckgo.com/?q=' + encodeURIComponent(query)
      const warmResp = await fetch(warmUrl, { headers: DDG_FETCH_HEADERS }).catch(() => null)
      if (warmResp && warmResp.ok) cookieHeader = getCookiesFromResponse(warmResp)

      let parsed = await fetchPlacesAttempt(query, maxResults - merged.length, cookieHeader)
      if (parsed === null) {
        await new Promise((r) => setTimeout(r, 2000))
        cookieHeader = ''
        const retryWarm = await fetch(warmUrl, { headers: DDG_FETCH_HEADERS }).catch(() => null)
        if (retryWarm && retryWarm.ok) cookieHeader = getCookiesFromResponse(retryWarm)
        parsed = await fetchPlacesAttempt(query, maxResults - merged.length, cookieHeader)
      }
      if (parsed && parsed.length > 0) {
        for (const r of parsed) {
          const key = (r.url || '').toLowerCase()
          if (key && !seenUrls.has(key) && merged.length < maxResults) {
            seenUrls.add(key)
            merged.push(r)
          }
        }
      }
      if (merged.length >= maxResults) break
      await new Promise((r) => setTimeout(r, 800))
    }

    if (merged.length === 0) return []
    return toPlacesList(merged, loc)
  } catch (e) {
    console.error('DuckDuckGo places fetch error:', e)
    return []
  }
}
