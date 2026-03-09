import { useState, useEffect } from 'react'
import { defaultAccommodations } from '../../domain/sectionTypes'

function ensureAccommodations(destination) {
  if (destination?.accommodations && Array.isArray(destination.accommodations.atDestination) && Array.isArray(destination.accommodations.onRoute)) {
    return destination.accommodations
  }
  return defaultAccommodations()
}

function hasOvernightStops(destination) {
  const route = destination?.route
  return Array.isArray(route?.overnightStops) && route.overnightStops.length > 0
}

function AccCard({ item, onRemove }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
      {item.imageUrl && (
        <a href={item.mapUrl} target="_blank" rel="noopener noreferrer" className="block">
          <img src={item.imageUrl} alt={item.name} className="w-full h-32 object-cover" />
        </a>
      )}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-gray-900 flex-1">
            <a href={item.mapUrl || '#'} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
              {item.name}
            </a>
          </h4>
          <button type="button" onClick={onRemove} className="text-gray-400 hover:text-red-600 p-1" aria-label="Remove">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {item.location && <p className="text-sm text-gray-600 mt-1">{item.location}</p>}
        {item.costCents != null && <p className="text-sm text-gray-700 mt-1">${(item.costCents / 100).toFixed(2)}</p>}
      </div>
    </div>
  )
}

export default function AccommodationsView({ category, trip, updateTrip }) {
  const location = category?.location || category?.name || ''
  const data = ensureAccommodations(category)
  const showOnRoute = hasOvernightStops(category)
  const [atDestination, setAtDestination] = useState(data.atDestination || [])
  const [onRoute, setOnRoute] = useState(data.onRoute || [])
  const [addName, setAddName] = useState('')
  const [addToRoute, setAddToRoute] = useState(false)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    const d = ensureAccommodations(category)
    setAtDestination(d.atDestination || [])
    setOnRoute(d.onRoute || [])
  }, [category?.id, category?.accommodations])

  const persist = (next) => {
    if (!trip || !updateTrip || !category) return
    const destinations = (trip.destinations || []).map((d) =>
      d.id === category.id ? { ...d, accommodations: next } : d
    )
    updateTrip({ ...trip, destinations })
  }

  const addPlace = (name, toRoute) => {
    const id = `acc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + (toRoute ? 'lodging' : location))}`
    const item = { id, name: name.trim(), location: toRoute ? name : location, mapUrl }
    if (toRoute) {
      const next = { atDestination, onRoute: [...onRoute, item] }
      setOnRoute(next.onRoute)
      persist(next)
    } else {
      const next = { atDestination: [...atDestination, item], onRoute }
      setAtDestination(next.atDestination)
      persist(next)
    }
  }

  const handleAdd = (e) => {
    e?.preventDefault()
    const name = addName.trim()
    if (!name) return
    setAdding(true)
    addPlace(name, addToRoute)
    setAddName('')
    setAdding(false)
  }

  const removeAtDestination = (id) => {
    const next = { atDestination: atDestination.filter((a) => a.id !== id), onRoute }
    setAtDestination(next.atDestination)
    persist(next)
  }
  const removeOnRoute = (id) => {
    const next = { atDestination, onRoute: onRoute.filter((o) => o.id !== id) }
    setOnRoute(next.onRoute)
    persist(next)
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
        <input
          type="text"
          value={addName}
          onChange={(e) => setAddName(e.target.value)}
          placeholder="Add accommodation by name"
          className="border border-gray-300 rounded px-3 py-2 text-sm min-w-[200px]"
        />
        {showOnRoute && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={addToRoute} onChange={(e) => setAddToRoute(e.target.checked)} />
            On route
          </label>
        )}
        <button type="submit" disabled={adding || !addName.trim()} className="px-4 py-2 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 disabled:opacity-50">
          Add
        </button>
      </form>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">At destination</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {atDestination.map((item) => (
            <AccCard key={item.id} item={item} onRemove={() => removeAtDestination(item.id)} />
          ))}
        </div>
        {atDestination.length === 0 && <p className="text-gray-500 text-sm">No accommodations at destination yet.</p>}
      </section>

      {showOnRoute && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">On route (overnight stops)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {onRoute.map((item) => (
              <AccCard key={item.id} item={item} onRemove={() => removeOnRoute(item.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
