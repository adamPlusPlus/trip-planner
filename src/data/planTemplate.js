// Plan section template matching Pagosa Springs structure. Used for user-created destinations.

export const PLAN_SECTION_TYPES = [
  { id: 'overview', name: 'Overview', sectionType: 'overview' },
  { id: 'things-to-see', name: 'Things to See', sectionType: 'things-to-see' },
  { id: 'potential-routes', name: 'Potential Routes', sectionType: 'potential-routes' },
  { id: 'budget', name: 'Budget', sectionType: 'budget' },
  { id: 'accommodations', name: 'Accommodations', sectionType: 'accommodations' },
  { id: 'pre-shopping-packing', name: 'Pre-Shopping & Packing', sectionType: 'pre-shopping-packing' },
  { id: 'weather', name: 'Weather Conditions', sectionType: 'weather' },
]

/**
 * Build default plans array for a destination (no paths = generated content).
 * @param {string} destinationId
 * @returns {{ id: string, name: string, sectionType: string }[]}
 */
export function getDefaultPlansForDestination(destinationId) {
  return PLAN_SECTION_TYPES.map((t) => ({
    id: `${destinationId}-${t.id}`,
    name: t.name,
    sectionType: t.sectionType,
  }))
}
