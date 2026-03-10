# plan-sections

Purpose: Section-specific UI components for the Plan viewer (Things to See, Potential Routes, Budget, Accommodations, Weather). Each reads/writes structured data on the destination and uses `updateTrip` to persist.

Usage: Rendered by PlanViewer when `plan.sectionType` matches; receive `category` (destination), `trip`, and `updateTrip` (except Budget and Weather which are read-only or fetch-only).

**Potential Routes:** Uses OSRM + Leaflet for the in-app route map (RouteMap.jsx). Geocoding via Open-Meteo (src/utils/geocode.js). No API key is required for routing, map tiles, or geocoding. Optional Google Directions buttons use the server’s /api/directions when GOOGLE_DIRECTIONS_API_KEY (or GOOGLE_PLACES_API_KEY) is set.

Ownership: Trip planner app; domain types live in `src/domain/sectionTypes.js` and `src/domain/trip.js`.
