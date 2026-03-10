// DuckDuckGo image search: i.js API + og:image fallback. No API key. Ported from media-server.

import { DDG_FETCH_HEADERS } from './duckduckgoHeaders.js'

function extractVqd(html) {
  if (!html || typeof html !== 'string') return null
  const m =
    html.match(/vqd="([^"]+)"/) ||
    html.match(/vqd:\s*["']([^"']+)["']/) ||
    html.match(/vqd='([^']+)'/) ||
    html.match(/vqd=([\d\-]+)&/) ||
    html.match(/vqd=([\d\-]+)["']/)
  return m ? m[1].trim() : null
}

/**
 * DuckDuckGo image search via i.js API. Returns array of { url, thumbnail?, title? }.
 * @param {string} query
 * @param {number} maxImages
 */
export async function resolveDdgImageApi(query, maxImages = 35) {
  const q = String(query).trim()
  if (!q) return []
  const headers = {
    ...DDG_FETCH_HEADERS,
    Accept: 'application/json, text/javascript, */*; q=0.01',
    Referer: 'https://duckduckgo.com/',
  }
  let vqd = null
  const ac = new AbortController()
  const timeoutId = setTimeout(() => ac.abort(), 12000)
  const pageResp = await fetch(
    'https://duckduckgo.com/?q=' + encodeURIComponent(q) + '&iar=images&t=h_',
    { headers, signal: ac.signal }
  ).catch(() => null)
  clearTimeout(timeoutId)
  if (pageResp && pageResp.ok) {
    const pageHtml = await pageResp.text()
    vqd = extractVqd(pageHtml)
  }
  if (!vqd) {
    const postUrl = 'https://html.duckduckgo.com/html/'
    const postHeaders = {
      ...DDG_FETCH_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded',
      Referer: 'https://html.duckduckgo.com/',
    }
    const body =
      'q=' +
      encodeURIComponent(q) +
      '&b=&nextParams=&api=d.js&o=json&v=l&dc=1&s=0&kl=wt-wt'
    const ac2 = new AbortController()
    const t2 = setTimeout(() => ac2.abort(), 12000)
    const postResp = await fetch(postUrl, {
      method: 'POST',
      headers: postHeaders,
      body,
      signal: ac2.signal,
    }).catch(() => null)
    clearTimeout(t2)
    if (postResp && postResp.ok) {
      const postHtml = await postResp.text()
      const inputMatch = postHtml.match(
        /name=["']vqd["'][^>]*value=["']([^"']+)["']|value=["']([^"']+)["'][^>]*name=["']vqd["']/i
      )
      vqd = inputMatch ? (inputMatch[1] || inputMatch[2] || '').trim() : null
      if (!vqd) vqd = extractVqd(postHtml)
    }
  }
  if (!vqd) return []
  const results = []
  const baseParams = {
    q,
    vqd,
    o: 'json',
    u: 'bing',
    l: 'wt-wt',
    a: 'h_',
    bpia: '1',
    ct: 'EN',
    p: '1',
    s: '0',
  }
  let nextUrl =
    'https://duckduckgo.com/i.js?' + new URLSearchParams(baseParams).toString()
  for (let page = 0; page < 3 && results.length < maxImages; page++) {
    const ac2 = new AbortController()
    const t2 = setTimeout(() => ac2.abort(), 10000)
    const jsResp = await fetch(nextUrl, { headers, signal: ac2.signal }).catch(
      () => null
    )
    clearTimeout(t2)
    if (!jsResp || !jsResp.ok) break
    let data
    const raw = await jsResp.text()
    const jsonStr = raw.replace(/^[^(]*\(/, '').replace(/\)[^)]*$/, '').trim()
    try {
      data = JSON.parse(jsonStr)
    } catch {
      data = null
    }
    if (!data || !Array.isArray(data.results)) break
    for (const row of data.results) {
      const url = row.image || row.url
      if (
        url &&
        /^https?:\/\//i.test(url) &&
        !results.some((r) => r.url === url)
      ) {
        results.push({
          url,
          thumbnail: row.thumbnail || url,
          title: row.title || null,
        })
        if (results.length >= maxImages) break
      }
    }
    const next = data && data.next
    if (!next || typeof next !== 'string') break
    nextUrl = /^https?:\/\//i.test(next)
      ? next
      : 'https://duckduckgo.com/i.js?' + next
  }
  return results
}

/**
 * Fallback: HTML search + fetch result pages, extract og:image. Used when i.js is blocked.
 */
export async function resolveDdgImageResultsOg(
  query,
  maxPageFetches = 14,
  maxImages = 30
) {
  const qEnc = encodeURIComponent(String(query).trim())
  const postUrl = 'https://html.duckduckgo.com/html/'
  const postHeaders = {
    ...DDG_FETCH_HEADERS,
    'Content-Type': 'application/x-www-form-urlencoded',
    Referer: 'https://html.duckduckgo.com/',
  }
  const body =
    'q=' + qEnc + '&b=&nextParams=&api=d.js&o=json&v=l&dc=1&s=0&kl=wt-wt'
  const resp = await fetch(postUrl, { method: 'POST', headers: postHeaders, body })
  if (!resp.ok) return []
  const html = await resp.text()
  if (/challenge-form|not a robot|Your IP address is/i.test(html)) return []
  const pageUrls = []
  const uddgRegex = /uddg=([^&"'\s]+)(?:&|&amp;|"|')/g
  let m
  while ((m = uddgRegex.exec(html)) !== null) {
    try {
      const decoded = decodeURIComponent(m[1].replace(/\+/g, ' '))
      if (!/^https?:\/\//i.test(decoded)) continue
      if (/^https?:\/\/(www\.)?duckduckgo\./i.test(decoded)) continue
      if (pageUrls.includes(decoded)) continue
      pageUrls.push(decoded)
      if (pageUrls.length >= maxPageFetches) break
    } catch {
      /* skip */
    }
  }
  if (pageUrls.length === 0) {
    const directHrefRegex = /<a[^>]+href=["'](https?:\/\/[^"']+)["'][^>]*>/gi
    while ((m = directHrefRegex.exec(html)) !== null) {
      const u = (m[1] || '').trim()
      if (!u || /duckduckgo\.com|google\.com\/url|bing\.com\/ck/i.test(u))
        continue
      if (pageUrls.includes(u)) continue
      pageUrls.push(u)
      if (pageUrls.length >= maxPageFetches) break
    }
  }
  if (pageUrls.length === 0) {
    const getResp = await fetch(
      'https://html.duckduckgo.com/html/?q=' + qEnc,
      { headers: DDG_FETCH_HEADERS }
    ).catch(() => null)
    if (getResp && getResp.ok) {
      const getHtml = await getResp.text()
      if (!/challenge-form|not a robot|Your IP address is/i.test(getHtml)) {
        const uddgGet = /uddg=([^&"'\s]+)(?:&|&amp;|"|')/g
        while ((m = uddgGet.exec(getHtml)) !== null) {
          try {
            const decoded = decodeURIComponent(m[1].replace(/\+/g, ' '))
            if (!/^https?:\/\//i.test(decoded)) continue
            if (/^https?:\/\/(www\.)?duckduckgo\./i.test(decoded)) continue
            if (pageUrls.includes(decoded)) continue
            pageUrls.push(decoded)
            if (pageUrls.length >= maxPageFetches) break
          } catch {
            /* skip */
          }
        }
      }
    }
  }
  const results = []
  const ogImageRegex =
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']|content=["']([^"']+)["'][^>]+property=["']og:image["']/i
  const ogTitleRegex =
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']|content=["']([^"']+)["'][^>]+property=["']og:title["']/i
  for (const pageUrl of pageUrls) {
    if (results.length >= maxImages) break
    try {
      const ac = new AbortController()
      const timeoutId = setTimeout(() => ac.abort(), 10000)
      const pageResp = await fetch(pageUrl, {
        headers: DDG_FETCH_HEADERS,
        redirect: 'follow',
        signal: ac.signal,
      })
      clearTimeout(timeoutId)
      if (!pageResp.ok) continue
      const pageHtml = await pageResp.text()
      const imgMatch = pageHtml.match(ogImageRegex)
      const imageUrl = imgMatch ? (imgMatch[1] || imgMatch[2] || '').trim() : null
      if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) continue
      let title = ''
      const titleMatch = pageHtml.match(ogTitleRegex)
      if (titleMatch) title = (titleMatch[1] || titleMatch[2] || '').trim()
      results.push({
        url: imageUrl,
        thumbnail: imageUrl,
        title: title || null,
      })
    } catch {
      /* skip this page */
    }
  }
  return results
}

/**
 * Resolve first image URL for a query. Tries i.js API then og:image fallback.
 * Used by imageProvider. Returns single URL string or null.
 * @param {string} query
 * @returns {Promise<string | null>}
 */
export async function resolveDdgImageUrls(query) {
  const q = (query && String(query).trim()) || ''
  if (!q) return null
  let list = await resolveDdgImageApi(q, 5)
  if (list.length === 0) list = await resolveDdgImageResultsOg(q, 5, 5)
  const first = list[0]
  return first && first.url ? first.url : null
}
