/**
 * Read-only budget summary derived from Things to See, Route, and Accommodations.
 */
import { useMemo } from 'react'
import { defaultThingsToSee, defaultRoute, defaultAccommodations } from '../../domain/sectionTypes'

function sumCents(items) {
  if (!Array.isArray(items)) return 0
  return items.reduce((s, i) => s + (Number(i.costCents) || 0), 0)
}

export default function BudgetSummaryView({ category, trip }) {
  const breakdown = useMemo(() => {
    const thingsToSee = category?.thingsToSee || defaultThingsToSee()
    const route = category?.route || defaultRoute()
    const acc = category?.accommodations || defaultAccommodations()
    const attractions = sumCents(thingsToSee.attractions)
    const pois = sumCents(thingsToSee.pointsOfInterest)
    const thingsTotal = attractions + pois
    const gas = Number(route.gasCostCents) || 0
    const food = Number(route.foodCostCents) || 0
    const overnight = Array.isArray(route.overnightStops) ? route.overnightStops.reduce((s, o) => s + (Number(o.costCents) || 0), 0) : 0
    const routeTotal = gas + food + overnight
    const atDest = sumCents(acc.atDestination)
    const onRoute = sumCents(acc.onRoute)
    const accTotal = atDest + onRoute
    const total = thingsTotal + routeTotal + accTotal
    return {
      thingsTotal,
      routeTotal,
      gas,
      food,
      overnight,
      accTotal,
      total,
    }
  }, [category?.thingsToSee, category?.route, category?.accommodations])

  const costTarget = trip?.settings?.costTarget
  const hasTarget = typeof costTarget === 'number' && costTarget >= 0

  const format = (cents) => (cents / 100).toFixed(2)

  return (
    <div className="space-y-4 max-w-xl">
      <h3 className="text-lg font-semibold text-gray-900">Budget summary</h3>
      <ul className="space-y-2 text-sm">
        <li className="flex justify-between">
          <span className="text-gray-600">Things to See (attractions + POIs)</span>
          <span>${format(breakdown.thingsTotal)}</span>
        </li>
        <li className="flex justify-between">
          <span className="text-gray-600">Route (gas + food + overnight)</span>
          <span>${format(breakdown.routeTotal)}</span>
        </li>
        <li className="flex justify-between">
          <span className="text-gray-600">Accommodations</span>
          <span>${format(breakdown.accTotal)}</span>
        </li>
        <li className="flex justify-between font-semibold pt-2 border-t border-gray-200">
          <span>Total</span>
          <span>${format(breakdown.total)}</span>
        </li>
      </ul>
      {hasTarget && (
        <p className="text-sm text-gray-600">
          Trip budget target: ${Number(costTarget).toFixed(2)}
          {breakdown.total > 0 && (
            <span className={breakdown.total / 100 > costTarget ? ' text-red-600' : ''}>
              {' '}({breakdown.total / 100 > costTarget ? 'over' : 'under'} target)
            </span>
          )}
        </p>
      )}
      <p className="text-xs text-gray-500">This section is derived from other sections and is updated when you change costs there.</p>
    </div>
  )
}
