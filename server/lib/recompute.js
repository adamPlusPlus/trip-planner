// Recompute trip sections from trip state (budget split, people, etc.).

/**
 * Recompute budget section structured data from trip.costTarget and destinations.
 * @param {object} trip
 * @returns {object} trip with updated sections
 */
export function recomputeBudget(trip) {
  const target = trip.settings?.costTarget
  const destinations = trip.destinations || []
  if (!target || destinations.length === 0) return trip

  const perDestination = {}
  const slice = target / destinations.length
  destinations.forEach((d) => {
    perDestination[d.id] = Math.round(slice)
  })

  const updated = JSON.parse(JSON.stringify(trip))
  for (const dest of updated.destinations) {
    if (!dest.sections) dest.sections = []
    let budgetSection = dest.sections.find((s) => s.type === 'budget')
    if (!budgetSection) {
      budgetSection = { id: `budget-${dest.id}`, type: 'budget', name: 'Budget', structured: {} }
      dest.sections.push(budgetSection)
    }
    budgetSection.structured = {
      ...(budgetSection.structured || {}),
      target,
      perDestination,
    }
  }
  return updated
}

/**
 * Recompute shopping-packing section person ids from trip.settings.people.
 * @param {object} trip
 * @returns {object} trip (unchanged structure; could update section labels later)
 */
export function recomputePeople(trip) {
  // Placeholder: in full impl would update section items' personIds to match trip.settings.people.names
  return trip
}

/**
 * Full recompute pipeline. Mutates and returns a deep copy of trip.
 * @param {object} trip
 * @returns {object}
 */
export function recomputeTrip(trip) {
  let next = recomputeBudget(trip)
  next = recomputePeople(next)
  return next
}
