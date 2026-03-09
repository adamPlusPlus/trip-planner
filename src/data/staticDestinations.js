// Static destination data for Phase 1. Loader reads this; no I/O here.

export const staticDestinations = [
  {
    id: 'pagosa-springs',
    name: 'Pagosa Springs, Colorado',
    location: 'Pagosa Springs, Colorado',
    coords: { lat: 37.2694, lon: -107.0098 },
    distance: '900 miles',
    description: 'Natural hot springs, Wolf Creek Ski Area, San Juan National Forest. Closer than Durango with unique hot springs.',
    category: 'Alternatives',
    plans: [
      { id: 'pagosa-overview', name: 'Overview', path: '/plans/Road Trip Alternatives/Pagosa Springs Colorado/overview.md' },
      { id: 'pagosa-things', name: 'Things to See', path: '/plans/Road Trip Alternatives/Pagosa Springs Colorado/things-to-see.md' },
      { id: 'pagosa-routes', name: 'Potential Routes', path: '/plans/Road Trip Alternatives/Pagosa Springs Colorado/potential-routes.md' },
      { id: 'pagosa-budget', name: 'Budget', path: '/plans/Road Trip Alternatives/Pagosa Springs Colorado/budget.md' },
      { id: 'pagosa-accommodations', name: 'Accommodations', path: '/plans/Road Trip Alternatives/Pagosa Springs Colorado/accommodations-comparison.md' },
      { id: 'pagosa-stopovers', name: 'Stopover Locations', path: '/plans/Road Trip Alternatives/Pagosa Springs Colorado/in-between-locations.md' },
      { id: 'pagosa-packing', name: 'Pre-Shopping & Packing', path: '/plans/Road Trip Alternatives/Pagosa Springs Colorado/pre-shopping-packing.md' },
      { id: 'pagosa-weather', name: 'Weather Conditions', path: '/plans/Road Trip Alternatives/Pagosa Springs Colorado/weather-conditions.md' },
    ],
  },
]
