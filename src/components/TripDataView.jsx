import { useState, useEffect, useRef } from 'react'
import ContextMenu from './ContextMenu.jsx'

const AUTOSAVE_MS = 800

/**
 * Edit view for Trip Data: origin, date range, budget, people.
 * Autosaves via updateTrip(trip) after edits (debounced). Also saves on blur and Save button.
 */
export default function TripDataView({ trip, updateTrip, onBack }) {
  const [originName, setOriginName] = useState(trip?.origin?.name ?? '')
  const [originLocation, setOriginLocation] = useState(trip?.origin?.location ?? '')
  const [dateStart, setDateStart] = useState(trip?.settings?.dateRange?.start ?? '')
  const [dateEnd, setDateEnd] = useState(trip?.settings?.dateRange?.end ?? '')
  const [costTarget, setCostTarget] = useState(trip?.settings?.costTarget ?? '')
  const [noBudget, setNoBudget] = useState(!!trip?.settings?.noBudget)
  const [peopleCount, setPeopleCount] = useState(trip?.settings?.people?.count ?? 2)
  const [peopleNames, setPeopleNames] = useState(trip?.settings?.people?.names?.slice() ?? ['Person 1', 'Person 2'])
  const [maxDrivingHours, setMaxDrivingHours] = useState(trip?.settings?.maxDrivingHours ?? 10)
  const [overnightFlexibility, setOvernightFlexibility] = useState(trip?.settings?.overnightFlexibility ?? 0.2)
  const [contextMenu, setContextMenu] = useState(null)
  const autosaveSkippedRef = useRef(true)

  useEffect(() => {
    setOriginName(trip?.origin?.name ?? '')
    setOriginLocation(trip?.origin?.location ?? '')
    setDateStart(trip?.settings?.dateRange?.start ?? '')
    setDateEnd(trip?.settings?.dateRange?.end ?? '')
    const ct = trip?.settings?.costTarget
    setCostTarget(ct !== null && ct !== undefined ? String(ct) : '')
    setNoBudget(!!trip?.settings?.noBudget)
    setPeopleCount(trip?.settings?.people?.count ?? 2)
    setPeopleNames(trip?.settings?.people?.names?.slice() ?? ['Person 1', 'Person 2'])
    setMaxDrivingHours(trip?.settings?.maxDrivingHours ?? 10)
    setOvernightFlexibility(trip?.settings?.overnightFlexibility ?? 0.2)
    autosaveSkippedRef.current = true
  }, [trip?.id, trip?.origin, trip?.settings])

  useEffect(() => {
    if (autosaveSkippedRef.current || !trip) {
      autosaveSkippedRef.current = false
      return
    }
    const t = setTimeout(() => {
      const origin = (originName.trim() || originLocation.trim()) ? { name: originName.trim() || null, location: originLocation.trim() || null } : null
      const cost = noBudget ? null : (costTarget.trim() ? Number(costTarget) : undefined)
      const settings = {
        ...trip.settings,
        dateRange: { start: dateStart.trim(), end: dateEnd.trim() },
        costTarget: cost !== undefined ? cost : trip.settings?.costTarget,
        noBudget: noBudget || undefined,
        people: { count: peopleCount, names: peopleNames },
        maxDrivingHours: Number(maxDrivingHours) || 10,
        overnightFlexibility: Number(overnightFlexibility) || 0.2,
      }
      updateTrip({ ...trip, origin, settings })
    }, AUTOSAVE_MS)
    return () => clearTimeout(t)
  }, [originName, originLocation, dateStart, dateEnd, costTarget, noBudget, peopleCount, peopleNames, maxDrivingHours, overnightFlexibility])

  const syncPeopleNamesToCount = (count) => {
    const n = Math.max(0, Number(count) || 0)
    setPeopleCount(n)
    setPeopleNames((prev) => {
      const next = prev.slice(0, n)
      while (next.length < n) next.push(`Person ${next.length + 1}`)
      return next
    })
  }

  const handleSave = () => {
    const origin = (originName.trim() || originLocation.trim()) ? { name: originName.trim() || null, location: originLocation.trim() || null } : null
    const cost = noBudget ? null : (costTarget.trim() ? Number(costTarget) : undefined)
    const settings = {
      ...trip.settings,
      dateRange: { start: dateStart.trim(), end: dateEnd.trim() },
      costTarget: cost !== undefined ? cost : trip.settings?.costTarget,
      noBudget: noBudget || undefined,
      people: { count: peopleCount, names: peopleNames },
      maxDrivingHours: Number(maxDrivingHours) || 10,
      overnightFlexibility: Number(overnightFlexibility) || 0.2,
    }
    updateTrip({ ...trip, origin, settings })
  }

  const contextMenuItems = contextMenu ? [{ id: 'edit', label: 'Edit', onClick: () => setContextMenu(null) }] : []

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Trip Data</h2>
        <button type="button" onClick={onBack} className="text-sm text-gray-600 hover:text-gray-900">← Back</button>
      </div>

      <div className="space-y-6">
        <section
          onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY }); }}
          className="cursor-context-menu"
        >
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Origin</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Name</label>
              <input
                type="text"
                value={originName}
                onChange={(e) => setOriginName(e.target.value)}
                onBlur={handleSave}
                placeholder="e.g. Houston, TX"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Location</label>
              <input
                type="text"
                value={originLocation}
                onChange={(e) => setOriginLocation(e.target.value)}
                onBlur={handleSave}
                placeholder="Address or place"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
        </section>

        <section className="cursor-context-menu" onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY }); }}>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Date range</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Start (ISO)</label>
              <input
                type="date"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                onBlur={handleSave}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">End (ISO)</label>
              <input
                type="date"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
                onBlur={handleSave}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
        </section>

        <section className="cursor-context-menu" onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY }); }}>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Budget</h3>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={noBudget}
                onChange={(e) => {
                  const checked = e.target.checked
                  setNoBudget(checked)
                  if (checked) setCostTarget('')
                  const settings = { ...trip.settings, noBudget: checked || undefined, costTarget: checked ? null : (costTarget.trim() ? Number(costTarget) : trip.settings?.costTarget) }
                  updateTrip({ ...trip, settings })
                }}
              />
              <span className="text-sm">No budget</span>
            </label>
            {!noBudget && (
              <>
                <span className="text-sm text-gray-500">Cost target ($)</span>
                <input
                  type="number"
                  min="0"
                  value={costTarget}
                  onChange={(e) => setCostTarget(e.target.value)}
                  onBlur={handleSave}
                  placeholder="0"
                  className="w-24 border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </>
            )}
          </div>
          {noBudget && (
            <button type="button" onClick={() => { setNoBudget(false); handleSave(); }} className="mt-2 text-xs text-primary-600">Set a budget</button>
          )}
        </section>

        <section className="cursor-context-menu" onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY }); }}>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Route (driving)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Max driving hours before overnight</label>
              <input
                type="number"
                min="1"
                max="24"
                value={maxDrivingHours}
                onChange={(e) => setMaxDrivingHours(e.target.value)}
                onBlur={handleSave}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Overnight window (fraction, e.g. 0.2 = 1/5)</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={overnightFlexibility}
                onChange={(e) => setOvernightFlexibility(e.target.value)}
                onBlur={handleSave}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
        </section>

        <section className="cursor-context-menu" onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY }); }}>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">People</h3>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm">Count</label>
            <input
              type="number"
              min="1"
              value={peopleCount}
              onChange={(e) => syncPeopleNamesToCount(e.target.value)}
              onBlur={handleSave}
              className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="space-y-2">
            {peopleNames.slice(0, peopleCount).map((name, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-8">#{i + 1}</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    const next = peopleNames.slice()
                    next[i] = e.target.value
                    setPeopleNames(next)
                  }}
                  onBlur={handleSave}
                  placeholder={`Person ${i + 1}`}
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <button type="button" onClick={handleSave} className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700">Save</button>
      </div>

      <ContextMenu position={contextMenu ? { x: contextMenu.x, y: contextMenu.y } : null} items={contextMenuItems} onClose={() => setContextMenu(null)} />
    </div>
  )
}
