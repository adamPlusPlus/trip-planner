# server/

**Purpose:** Backend API: trip CRUD, image resolution, search, places. Persistence under server/data/trips; image cache under server/cache/images.  
**Usage:** Run with `npm run server` (port 5112). Vite proxies /api to this server. To run backend and Vite together (needed for **multiple destination header images**): `npm run dev:all`.  
**Ownership:** App backend.

## Image resolution (no API key required)

Images are resolved via **DuckDuckGo** (same logic as rom-browser/media-server): `server/lib/duckduckgoImages.js` tries the i.js image-search API, then falls back to HTML search + og:image extraction from result pages. `server/lib/imageProvider.js` uses cache → DuckDuckGo → optional Pexels (if `PEXELS_API_KEY` is set). Optional: set `USE_DDG_PUPPETEER=1` and install puppeteer to try browser-based DDG image search first (see plan).

**Endpoints:** **GET /api/image?query=...** returns a single image URL. **GET /api/images?query=...&limit=5** returns up to five URLs for destination header cycling; the app falls back to the single-image API if this route is unavailable (e.g. backend not restarted).

**Query format:** `[location city state country] [poi if relevant] [keyword]` — default keyword is `nature`. Built by `server/lib/buildImageQuery.js` (places fallback) and by the frontend `imageService.buildLocationImageQuery` so the same shape is used everywhere.

## Places

**GET /api/places?location=...&type=attraction|poi&limit=...**  
When `GOOGLE_PLACES_API_KEY` is set, results come from Google Places. When the key is unset or Google returns no results, the server uses **DuckDuckGo HTML search** (`server/lib/duckduckgoPlaces.js`) and returns results in the same shape (id, name, mapUrl, researchLinks; no cost/image from DDG). "Add by name" (query param) still uses fetchOnePlaceFallback + imageProvider (DDG-backed image).

## DDG-first link

**GET /api/ddg-first?q=...&filterContains=...**  
Returns the first DuckDuckGo web result URL for the query, or null. Optional `filterContains`: only return a URL whose link contains that string (e.g. "wikipedia"). Use for "Open first result" / Research buttons.

## OSRM route proxy

**GET /api/osrm/route?coords=lng1,lat1;lng2,lat2;...**  
Proxies to the OSRM public routing API to avoid CORS. Returns route geometry and legs (duration, distance) for the in-app route map. No API key required.

- **Optional env:** `OSRM_BASE_URL` — default `https://router.project-osrm.org`. Set to a self-hosted or alternate OSRM instance if the public server is rate-limiting or unavailable.
- The public OSRM server may rate-limit under heavy use; for production consider self-hosting or using another public instance and setting `OSRM_BASE_URL`.
- Requests time out after 15 seconds; non-2xx from OSRM return 502/504 with a generic message (no raw OSRM body).

## Notes

- DuckDuckGo scraping (i.js, html.duckduckgo.com) is best-effort and may break if DDG changes HTML or API. Shared browser-like headers live in `server/lib/duckduckgoHeaders.js`.
- No Google or Pexels keys are required for images or places; optional env: `PEXELS_API_KEY`, `USE_DDG_PUPPETEER`, `GOOGLE_PLACES_API_KEY`.
