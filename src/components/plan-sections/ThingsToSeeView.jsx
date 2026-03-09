import { useState, useEffect } from 'react'
import { defaultThingsToSee } from '../../domain/sectionTypes'

const API = '/api'

function ensureThingsToSee(destination) {
  if (destination?.thingsToSee && Array.isArray(destination.thingsToSee.attractions) && Array.isArray(destination.thingsToSee.pointsOfInterest)) {
    return destination.thingsToSee
  }
  return defaultThingsToSee()
}

function PlaceCard({ item, onRemove, costLabel }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {item.imageUrl && (
        <a href={item.mapUrl} target="_blank" rel="noopener noreferrer" className="block">
          <img src={item.imageUrl} alt={item.name} className="w-full h-40 object-cover" />
        </a>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-gray-900 flex-1">
            <a href={item.mapUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
              {item.name}
            </a>
          </h4>
          <button
            type="button"
            onClick={onRemove}
            className="text-gray-400 hover:text-red-600 p-1"
            aria-label="Remove"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {item.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>}
        {costLabel && <p className="text-sm text-gray-700 mt-1">{costLabel}</p>}
        {item.researchLinks?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {item.researchLinks.slice(0, 3).map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline">
                {i === 0 ? 'Map' : `Link ${i + 1}`}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ThingsToSeeView({ category, trip, updateTrip }) {
  const location = category?.location || category?.name || ''
  const data = ensureThingsToSee(category)
  const [attractions, setAttractions] = useState(data.attractions || [])
  const [pointsOfInterest, setPointsOfInterest] = useState(data.pointsOfInterest || [])
  const [addName, setAddName] = useState('')
  const [autopopulating, setAutopopulating] = useState(false)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    const d = ensureThingsToSee(category)
    setAttractions(d.attractions || [])
    setPointsOfInterest(d.pointsOfInterest || [])
  }, [category?.id, category?.thingsToSee])

  const persist = (next) => {
    if (!trip || !updateTrip || !category) return
    const destinations = (trip.destinations || []).map((d) =>
      d.id === category.id ? { ...d, thingsToSee: next } : d
    )
    updateTrip({ ...trip, destinations })
  }

  const handleAutopopulate = async () => {
    if (!location.trim()) return
    setAutopopulating(true)
    try {
      const [attRes, poiRes] = await Promise.all([
        fetch(`${API}/places?location=${encodeURIComponent(location)}&type=attraction&limit=10`),
        fetch(`${API}/places?location=${encodeURIComponent(location)}&type=poi&limit=10`),
      ])
      const attData = attRes.ok ? await attRes.json() : {}
      const poiData = poiRes.ok ? await poiRes.json() : {}
      const nextAtt = attData.attractions || []
      const nextPoi = poiData.pointsOfInterest || []
      const next = { attractions: nextAtt, pointsOfInterest: nextPoi }
      setAttractions(nextAtt)
      setPointsOfInterest(nextPoi)
      persist(next)
    } catch (e) {
      console.error('Autopopulate failed', e)
    } finally {
      setAutopopulating(false)
    }
  }

  const handleAddByName = async (e) => {
    e?.preventDefault()
    const name = addName.trim()
    if (!name || !location) return
    setAdding(true)
    try {
      const res = await fetch(`${API}/places?location=${encodeURIComponent(location)}&type=attraction&query=${encodeURIComponent(name)}&limit=1`)
      const data = res.ok ? await res.json() : {}
      const list = data.attractions || []
      if (list.length) {
        const next = { attractions: [...attractions, list[0]], pointsOfInterest }
        setAttractions(next.attractions)
        persist(next)
        setAddName('')
      } else {
        const fallback = {
          id: `manual-${Date.now()}`,
          name,
          description: location,
          mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + location)}`,
          researchLinks: [],
        }
        const next = { attractions: [...attractions, fallback], pointsOfInterest }
        setAttractions(next.attractions)
        persist(next)
        setAddName('')
      }
    } catch (err) {
      console.error('Add place failed', err)
      const fallback = {
        id: `manual-${Date.now()}`,
        name,
        description: location,
        mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + location)}`,
        researchLinks: [],
      }
      const next = { attractions: [...attractions, fallback], pointsOfInterest }
      setAttractions(next.attractions)
      persist(next)
      setAddName('')
    } finally {
      setAdding(false)
    }
  }

  const removeAttraction = (id) => {
    const next = { attractions: attractions.filter((a) => a.id !== id), pointsOfInterest }
    setAttractions(next.attractions)
    persist(next)
  }
  const removePOI = (id) => {
    const next = { attractions, pointsOfInterest: pointsOfInterest.filter((p) => p.id !== id) }
    setPointsOfInterest(next.pointsOfInterest)
    persist(next)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleAutopopulate}
          disabled={autopopulating || !location}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50"
        >
          {autopopulating ? 'Loading…' : 'Autopopulate (10 attractions + 10 POIs)'}
        </button>
        <form onSubmit={handleAddByName} className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            placeholder="Add attraction or POI by name"
            className="border border-gray-300 rounded px-3 py-2 text-sm min-w-[200px]"
          />
          <button type="submit" disabled={adding || !addName.trim()} className="px-4 py-2 bg-gray-100 text-gray-800 text-sm rounded-md hover:bg-gray-200 disabled:opacity-50">
            Add
          </button>
        </form>
      </div>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Attractions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {attractions.map((item) => (
            <PlaceCard
              key={item.id}
              item={item}
              onRemove={() => removeAttraction(item.id)}
              costLabel={item.costCents != null ? `$${(item.costCents / 100).toFixed(2)}${item.costNote ? ` (${item.costNote})` : ''}` : item.costNote}
            />
          ))}
        </div>
        {attractions.length === 0 && <p className="text-gray-500 text-sm">No attractions yet. Use Autopopulate or add by name.</p>}
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Points of Interest</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pointsOfInterest.map((item) => (
            <PlaceCard
              key={item.id}
              item={item}
              onRemove={() => removePOI(item.id)}
              costLabel={item.costCents != null ? `$${(item.costCents / 100).toFixed(2)}${item.costNote ? ` (${item.costNote})` : ''}` : item.costNote}
            />
          ))}
        </div>
        {pointsOfInterest.length === 0 && <p className="text-gray-500 text-sm">No POIs yet. Use Autopopulate or add by name.</p>}
      </section>
    </div>
  )
}
