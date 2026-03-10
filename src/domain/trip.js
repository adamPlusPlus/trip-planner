// Trip domain: root aggregate, destination, plan section. No I/O.

/**
 * @typedef {Object} LocationRef
 * @property {string} [name]
 * @property {string} [location]
 * @property {{ lat: number, lon: number }} [coords]
 */

/**
 * @typedef {Object} PlanSection
 * @property {string} id
 * @property {string} type - section type (overview, budget, shopping-packing, etc.)
 * @property {string} name
 * @property {string} [path] - markdown path (e.g. /plans/.../overview.md)
 * @property {Object} [structured] - type-dependent JSON
 * @property {string} [markdownBody]
 */

/**
 * @typedef {Object} Destination
 * @property {string} id
 * @property {string} name
 * @property {string} [location]
 * @property {{ lat: number, lon: number }} [coords]
 * @property {string} [distance]
 * @property {string} [description]
 * @property {string} [category]
 * @property {number} [budgetSlice]
 * @property {PlanSection[]} [sections]
 * @property {{ id: string, name: string, path: string }[]} [plans] - legacy plan list (id, name, path)
 * @property {string} [originDestinationId] - id of another destination that is the leg origin (user-defined link)
 * @property {string[]} [headerImageUrls] - first 5 image URLs for destination header (saved after first fetch)
 * @property {number} [headerImageIndex] - which of the 5 to show (0-4), persisted between screens
 * @property {Object} [thingsToSee] - { attractions: Attraction[], pointsOfInterest: POI[] }
 * @property {Object} [route] - { segments, overnightStops, gasCostCents, foodCostCents }
 * @property {Object} [accommodations] - { atDestination: Accommodation[], onRoute: Accommodation[] }
 */

/**
 * @typedef {Object} TripSettings
 * @property {{ start: string, end: string }} dateRange - ISO dates
 * @property {number} [costTarget]
 * @property {boolean} [noBudget] - true when user chose "No budget"
 * @property {{ count: number, names: string[] }} people
 * @property {number} [maxDrivingHours] - max hours before overnight (default 10)
 * @property {number} [overnightFlexibility] - fraction e.g. 0.2 = 1/5 (default 0.2)
 */

/**
 * @typedef {Object} Trip
 * @property {string} id
 * @property {string} [name]
 * @property {LocationRef} [origin]
 * @property {LocationRef} [endpoint]
 * @property {Destination[]} destinations
 * @property {TripSettings} [settings]
 */

/** Default settings */
export function defaultTripSettings() {
  const now = new Date()
  const y = now.getFullYear()
  const dec28 = new Date(y, 11, 28)
  const start = now > dec28 ? `${y + 1}-12-28` : `${y}-12-28`
  const end = now > dec28 ? `${y + 2}-01-03` : `${y + 1}-01-03`
  return {
    dateRange: { start, end },
    costTarget: null,
    people: { count: 2, names: ['Person 1', 'Person 2'] },
    maxDrivingHours: 10,
    overnightFlexibility: 0.2,
  }
}

/**
 * Whether Trip Data is complete (origin, date range, budget, people). Used to gate adding destinations.
 * @param {Trip} trip
 * @returns {boolean}
 */
export function isTripDataComplete(trip) {
  if (!trip) return false
  const origin = trip.origin
  const hasOrigin = !!(origin && ((origin.name && String(origin.name).trim()) || (origin.location && String(origin.location).trim())))
  const dr = trip.settings?.dateRange
  const hasDateRange = !!(dr && typeof dr.start === 'string' && dr.start.trim() && typeof dr.end === 'string' && dr.end.trim())
  const budgetFilled = trip.settings && (typeof trip.settings.costTarget === 'number' && trip.settings.costTarget >= 0 || trip.settings.noBudget === true)
  const people = trip.settings?.people
  const hasPeople = !!(people && Number(people.count) >= 1 && Array.isArray(people.names) && people.names.length >= 1)
  return hasOrigin && hasDateRange && budgetFilled && hasPeople
}

/**
 * Create a minimal Trip.
 * @param {Partial<Trip>} overrides
 * @returns {Trip}
 */
export function createTrip(overrides = {}) {
  return {
    id: overrides.id || `trip-${Date.now()}`,
    name: overrides.name ?? null,
    origin: overrides.origin ?? null,
    endpoint: overrides.endpoint ?? null,
    destinations: overrides.destinations ?? [],
    settings: overrides.settings ?? defaultTripSettings(),
  }
}

/**
 * Create a minimal Destination.
 * @param {Partial<Destination>} overrides
 * @returns {Destination}
 */
export function createDestination(overrides = {}) {
  return {
    id: overrides.id || `dest-${Date.now()}`,
    name: overrides.name ?? '',
    location: overrides.location ?? null,
    coords: overrides.coords ?? null,
    distance: overrides.distance ?? null,
    description: overrides.description ?? null,
    category: overrides.category ?? null,
    budgetSlice: overrides.budgetSlice ?? null,
    sections: overrides.sections ?? [],
    plans: overrides.plans ?? null,
    originDestinationId: overrides.originDestinationId ?? null,
    headerImageUrls: overrides.headerImageUrls ?? undefined,
    headerImageIndex: overrides.headerImageIndex ?? undefined,
    thingsToSee: overrides.thingsToSee ?? undefined,
    route: overrides.route ?? undefined,
    accommodations: overrides.accommodations ?? undefined,
  }
}

/**
 * Create a plan section.
 * @param {Partial<PlanSection>} overrides
 * @returns {PlanSection}
 */
export function createPlanSection(overrides = {}) {
  return {
    id: overrides.id || `section-${Date.now()}`,
    type: overrides.type ?? 'overview',
    name: overrides.name ?? '',
    path: overrides.path ?? null,
    structured: overrides.structured ?? null,
    markdownBody: overrides.markdownBody ?? null,
  }
}
