// Plan section type enum and structured shapes. Drives UI and recompute.

export const SECTION_TYPES = {
  OVERVIEW: 'overview',
  BUDGET: 'budget',
  SHOPPING_PACKING: 'shopping-packing',
  WEATHER: 'weather',
  ROUTES: 'routes',
  COMPARISON: 'comparison',
  ACCOMMODATIONS: 'accommodations',
  THINGS_TO_SEE: 'things-to-see',
  STOPOVERS: 'stopovers',
}

/** Structured shape for budget section */
export const BUDGET_STRUCTURED = {
  target: null,           // number | null
  perDestination: null,   // Record<destinationId, number> | null
}

/** Structured shape for shopping-packing section */
export const SHOPPING_PACKING_STRUCTURED = {
  items: [],              // { text, checked, personIds[] }[]
  sectionHeaders: [],     // string[]
}

/** Structured shape for routes section */
export const ROUTES_STRUCTURED = {
  segments: [],           // { from, to, waypoints? }[]
}

/**
 * @typedef {Object} Attraction
 * @property {string} id
 * @property {string} name
 * @property {string} [description]
 * @property {string} [imageUrl]
 * @property {string} [mapUrl]
 * @property {string[]} [researchLinks]
 * @property {number} [costCents]
 * @property {string} [costNote]
 */

/**
 * @typedef {Object} POI
 * @property {string} id
 * @property {string} name
 * @property {string} [description]
 * @property {string} [imageUrl]
 * @property {string} [mapUrl]
 * @property {string[]} [researchLinks]
 * @property {number} [costCents]
 * @property {string} [costNote]
 */

/**
 * @typedef {Object} RouteSegment
 * @property {string} from
 * @property {string} to
 * @property {number} [durationHours]
 * @property {number} [distanceMiles]
 * @property {string} [mapUrl]
 */

/**
 * @typedef {Object} OvernightStop
 * @property {string} id
 * @property {string} name
 * @property {string} [location]
 * @property {number} [costCents]
 * @property {string} [mapUrl]
 * @property {string} [imageUrl]
 */

/**
 * @typedef {Object} Accommodation
 * @property {string} id
 * @property {string} name
 * @property {string} [location]
 * @property {number} [costCents]
 * @property {string} [mapUrl]
 * @property {string} [imageUrl]
 */

/**
 * A single point the route goes through or near (for assessing attractiveness).
 * @typedef {Object} RoutePoint
 * @property {string} name
 * @property {string} [location]
 * @property {number} [order] - 0-based sequence along the route
 * @property {string} [mapUrl]
 */

/**
 * One route option (e.g. most direct, via attractions).
 * @typedef {Object} RouteOption
 * @property {string} id
 * @property {string} name - e.g. "Most direct", "Via attractions"
 * @property {RoutePoint[]} [points] - ordered points this route goes through/near
 * @property {RouteSegment[]} segments
 * @property {OvernightStop[]} [overnightStops]
 */

/**
 * @typedef {Object} DestinationRoute
 * @property {RouteSegment[]} segments
 * @property {OvernightStop[]} [overnightStops]
 * @property {number} [gasCostCents]
 * @property {number} [foodCostCents]
 * @property {RouteOption[]} [routeOptions] - when multiple routes (direct, via waypoints)
 */

/**
 * @typedef {Object} DestinationAccommodations
 * @property {Accommodation[]} atDestination
 * @property {Accommodation[]} onRoute
 */

/**
 * @typedef {Object} ThingsToSeeData
 * @property {Attraction[]} attractions
 * @property {POI[]} pointsOfInterest
 */

/** Default empty thingsToSee */
export function defaultThingsToSee() {
  return { attractions: [], pointsOfInterest: [] }
}

/** Default empty route */
export function defaultRoute() {
  return { segments: [], overnightStops: [], gasCostCents: null, foodCostCents: null }
}

/** Default empty accommodations */
export function defaultAccommodations() {
  return { atDestination: [], onRoute: [] }
}
