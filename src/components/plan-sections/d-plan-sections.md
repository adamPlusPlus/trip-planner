# plan-sections

Purpose: Section-specific UI components for the Plan viewer (Things to See, Potential Routes, Budget, Accommodations, Weather). Each reads/writes structured data on the destination and uses `updateTrip` to persist.

Usage: Rendered by PlanViewer when `plan.sectionType` matches; receive `category` (destination), `trip`, and `updateTrip` (except Budget and Weather which are read-only or fetch-only).

Ownership: Trip planner app; domain types live in `src/domain/sectionTypes.js` and `src/domain/trip.js`.
