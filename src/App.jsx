import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import CategoryView from './components/CategoryView'
import PlanViewer from './components/PlanViewer'
import ComparisonView from './components/ComparisonView'
import TripModal from './components/TripModal'
import TripDataCard from './components/TripDataCard'
import TripDataView from './components/TripDataView'
import ContextMenu from './components/ContextMenu'
import { getTrips, getTrip, saveTrip, buildDefaultTrip, getLatestTripForTemplate } from './data/tripApi'
import { isTripDataComplete } from './domain/trip'

const TRIP_NAME_MAX = 20

function App() {
  const [trips, setTrips] = useState([])
  const [trip, setTrip] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [selectedTripData, setSelectedTripData] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showQRCode, setShowQRCode] = useState(false)
  const [tripModalOpen, setTripModalOpen] = useState(false)
  const [currentUrl, setCurrentUrl] = useState('')
  const [headerContextMenu, setHeaderContextMenu] = useState(null)
  const [editingTripName, setEditingTripName] = useState(false)
  const [tripNameEditValue, setTripNameEditValue] = useState('')

  const destinations = trip?.destinations ?? []
  const displayTripName = trip?.name || trip?.id || ''
  const displayTripNameShort = displayTripName.slice(0, TRIP_NAME_MAX) + (displayTripName.length > TRIP_NAME_MAX ? '…' : '')

  useEffect(() => {
    const deviceIP = '100.67.131.21'
    setCurrentUrl(`http://${deviceIP}:5111`)
    let cancelled = false
    async function init() {
      try {
        const list = await getTrips()
        if (cancelled) return
        setTrips(list)
        const hash = window.location.hash.slice(1)
        if (hash) {
          try {
            const state = JSON.parse(decodeURIComponent(hash))
            if (state.tripId) {
              const t = await getTrip(state.tripId)
              if (!cancelled && t) setTrip(t)
            }
          } catch (_) {}
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    init()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (tripModalOpen) {
      getTrips().then(setTrips)
    }
  }, [tripModalOpen])

  useEffect(() => {
    if (!trip || destinations.length === 0) return

    const hash = window.location.hash.slice(1)
    if (!hash) return
    try {
      const state = JSON.parse(decodeURIComponent(hash))
      if (state.tripId && state.tripId !== trip.id) return
      if (state.isComparison) {
        setSelectedCategory({ id: 'comparison', name: 'Comparison', isComparison: true })
        setSelectedPlan(null)
      } else if (state.categoryId) {
        const category = destinations.find(d => d.id === state.categoryId)
        if (category) {
          setSelectedCategory(category)
          const plan = state.planId ? category.plans?.find(p => p.id === state.planId) : null
          setSelectedPlan(plan || null)
        }
      }
    } catch (_) {}
  }, [trip, destinations])

  useEffect(() => {
    if (!trip || destinations.length === 0) return
    const handlePopState = () => {
      const hash = window.location.hash.slice(1)
      if (!hash) {
        setSelectedCategory(null)
        setSelectedPlan(null)
        return
      }
      try {
        const state = JSON.parse(decodeURIComponent(hash))
        if (state.isComparison) {
          setSelectedCategory({ id: 'comparison', name: 'Comparison', isComparison: true })
          setSelectedPlan(null)
        } else if (state.categoryId) {
          const category = destinations.find(d => d.id === state.categoryId)
          if (category) {
            setSelectedCategory(category)
            setSelectedPlan(state.planId ? category.plans?.find(p => p.id === state.planId) || null : null)
          }
        }
      } catch (_) {}
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [trip, destinations])

  const updateUrl = (state) => {
    const full = { ...state, tripId: trip?.id }
    window.history.pushState(null, '', `#${encodeURIComponent(JSON.stringify(full))}`)
  }

  const handleCategorySelect = (category) => {
    if (category.isComparison) {
      setSelectedCategory({ ...category, isComparison: true })
      updateUrl({ isComparison: true })
    } else {
      setSelectedCategory(category)
      updateUrl({ categoryId: category.id })
    }
    setSelectedPlan(null)
  }

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan)
    if (selectedCategory && !selectedCategory.isComparison) {
      updateUrl({ categoryId: selectedCategory.id, planId: plan.id })
    }
  }

  const handleBack = () => {
    if (selectedPlan || selectedCategory) window.history.back()
  }

  const handleHome = () => {
    setSelectedCategory(null)
    setSelectedPlan(null)
    setSelectedTripData(false)
    if (trip) {
      updateUrl({})
    } else {
      window.history.pushState(null, '', window.location.pathname)
    }
  }

  const handleLoadTrip = async (id) => {
    const t = await getTrip(id)
    if (t) {
      setTrip(t)
      setSelectedCategory(null)
      setSelectedPlan(null)
      setSelectedTripData(false)
      updateUrl({})
    }
  }

  const handleNewTrip = async () => {
    const latest = await getLatestTripForTemplate()
    const newTrip = buildDefaultTrip({ useUniqueId: true, copyFromTrip: latest || undefined })
    try {
      const saved = await saveTrip(newTrip, { create: true })
      setTrip(saved)
      setSelectedCategory(null)
      setSelectedPlan(null)
      setSelectedTripData(false)
      setTrips((prev) => [...prev, { id: saved.id, name: saved.name || saved.id, dateRange: saved.settings?.dateRange }])
      updateUrl({})
    } catch (e) {
      console.error('Failed to create trip:', e)
      setTrip(newTrip)
      setSelectedTripData(false)
      updateUrl({})
    }
  }

  const handleLoadExample = async () => {
    const defaultTrip = buildDefaultTrip({ useUniqueId: false })
    try {
      const saved = await saveTrip(defaultTrip)
      setTrip(saved)
      setSelectedCategory(null)
      setSelectedPlan(null)
      setTrips((prev) => {
        if (prev.some((t) => t.id === saved.id)) return prev.map((t) => t.id === saved.id ? { id: saved.id, name: saved.name || saved.id, dateRange: saved.settings?.dateRange } : t)
        return [...prev, { id: saved.id, name: saved.name || saved.id, dateRange: saved.settings?.dateRange }]
      })
      updateUrl({})
    } catch (e) {
      console.error('Load example failed:', e)
      setTrip(defaultTrip)
      updateUrl({})
    }
  }

  const handleRenameTrip = async (id, newName) => {
    const full = id === trip?.id ? trip : await getTrip(id)
    if (!full) return
    const updated = { ...full, name: newName }
    try {
      const saved = await saveTrip(updated)
      setTrips((prev) => prev.map((t) => t.id === saved.id ? { id: saved.id, name: saved.name || saved.id, dateRange: saved.settings?.dateRange } : t))
      if (trip?.id === id) setTrip(saved)
    } catch (e) {
      console.error('Rename failed:', e)
    }
  }

  const handleRenameTripInHeader = () => {
    setHeaderContextMenu(null)
    setTripNameEditValue(displayTripName.slice(0, TRIP_NAME_MAX))
    setEditingTripName(true)
  }

  const commitTripNameEdit = () => {
    if (trip && tripNameEditValue.trim()) {
      handleRenameTrip(trip.id, tripNameEditValue.trim().slice(0, TRIP_NAME_MAX))
    }
    setEditingTripName(false)
  }

  const updateTrip = async (updatedTrip) => {
    try {
      const saved = await saveTrip(updatedTrip)
      setTrip(saved)
      setTrips((prev) => prev.map((t) => t.id === saved.id ? { id: saved.id, name: saved.name || saved.id, dateRange: saved.settings?.dateRange } : t))
    } catch (e) {
      console.error('Failed to save trip:', e)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setShowQRCode(!showQRCode)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors shrink-0"
                title="Show QR Code"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </button>
              <h1
                onClick={handleHome}
                className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-primary-600 transition-colors shrink-0"
              >
                Trip Planner
              </h1>
              {trip && (
                <>
                  <span className="text-gray-400 shrink-0">·</span>
                  {editingTripName ? (
                    <input
                      type="text"
                      value={tripNameEditValue}
                      onChange={(e) => setTripNameEditValue(e.target.value.slice(0, TRIP_NAME_MAX))}
                      onBlur={commitTripNameEdit}
                      onKeyDown={(e) => { if (e.key === 'Enter') commitTripNameEdit(); if (e.key === 'Escape') setEditingTripName(false); }}
                      className="text-lg font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded px-2 py-0.5 max-w-[200px]"
                      maxLength={TRIP_NAME_MAX}
                      autoFocus
                    />
                  ) : (
                    <span
                      onContextMenu={(e) => { e.preventDefault(); setHeaderContextMenu({ x: e.clientX, y: e.clientY }); }}
                      className="text-lg font-semibold text-gray-800 truncate max-w-[180px] cursor-context-menu"
                      title={displayTripName}
                    >
                      {displayTripNameShort}
                    </span>
                  )}
                </>
              )}
              <button
                onClick={() => setTripModalOpen(true)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md shrink-0"
              >
                Trips
              </button>
            </div>
            {(selectedCategory || selectedPlan) && (
              <button
                onClick={handleBack}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shrink-0"
              >
                ← Back
              </button>
            )}
          </div>
        </div>
      </header>
      <ContextMenu
        position={headerContextMenu ? { x: headerContextMenu.x, y: headerContextMenu.y } : null}
        items={headerContextMenu ? [{ id: 'rename', label: 'Rename trip', onClick: handleRenameTripInHeader }] : []}
        onClose={() => setHeaderContextMenu(null)}
      />
      <TripModal
        isOpen={tripModalOpen}
        onClose={() => setTripModalOpen(false)}
        trips={trips}
        currentTrip={trip}
        onLoadTrip={handleLoadTrip}
        onNewTrip={handleNewTrip}
        onSaveTrip={async () => { if (trip) { const saved = await saveTrip(trip); setTrip(saved); setTrips((prev) => prev.map((t) => t.id === saved.id ? { id: saved.id, name: saved.name || saved.id, dateRange: saved.settings?.dateRange } : t)); } }}
        onRenameTrip={handleRenameTrip}
        onLoadExample={handleLoadExample}
      />

      {/* QR Code Modal */}
      {showQRCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowQRCode(false)}>
          <div className="bg-white rounded-lg p-8 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Scan to Open on Mobile</h2>
              <button
                onClick={() => setShowQRCode(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex justify-center mb-4">
              <div style={{ width: '256px', height: '256px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <QRCodeSVG 
                  value={currentUrl} 
                  size={256}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: '',
                    height: 0,
                    width: 0,
                  }}
                />
              </div>
            </div>
            <p className="text-sm text-gray-600 text-center mb-2">
              Scan this QR code with your mobile device to open the Trip Planner
            </p>
            <p className="text-xs text-gray-500 text-center mb-2 font-mono">
              {currentUrl}
            </p>
            <div className="text-xs text-gray-500 text-center space-y-1">
              <p><strong>If it doesn't work:</strong></p>
              <p>1. Make sure your phone is on the same Tailscale network</p>
              <p>2. Verify Tailscale is running on both devices</p>
              <p>3. Check Windows Firewall - allow port 5111</p>
              <p>4. Try typing the URL manually in your phone's browser</p>
              <p className="mt-2 text-gray-400">
                Using Tailscale IP: {currentUrl.replace('http://', '').replace(':5111', '')}
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!trip ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-600">
            Open the <button type="button" onClick={() => setTripModalOpen(true)} className="text-primary-600 font-medium hover:underline">Trips</button> menu to load or create a trip.
          </div>
        ) : selectedTripData ? (
            <TripDataView trip={trip} updateTrip={updateTrip} onBack={() => setSelectedTripData(false)} />
          ) : !selectedCategory && !selectedPlan ? (
            <CategoryView
              trip={trip}
              destinations={destinations}
              onSelect={handleCategorySelect}
              dateRange={trip.settings?.dateRange}
              updateTrip={updateTrip}
              firstCard={
                <TripDataCard
                  onClick={() => setSelectedTripData(true)}
                  isComplete={isTripDataComplete(trip)}
                />
              }
            />
          ) : selectedCategory?.isComparison ? (
            <ComparisonView
              trip={trip}
              destinations={destinations}
              onNavigate={(categoryId, planId) => {
                const category = destinations.find(d => d.id === categoryId)
                if (category) {
                  setSelectedCategory(category)
                  if (planId) {
                    const plan = category.plans?.find(p => p.id === planId)
                    if (plan) setSelectedPlan(plan)
                  }
                }
              }}
            />
          ) : selectedCategory && !selectedCategory.isComparison && !selectedPlan ? (
            <PlanViewer
              trip={trip}
              category={selectedCategory}
              onPlanSelect={handlePlanSelect}
              dateRange={trip.settings?.dateRange}
              updateTrip={updateTrip}
            />
          ) : selectedPlan ? (
            <PlanViewer
              trip={trip}
              category={selectedCategory}
              plan={selectedPlan}
              onPlanSelect={handlePlanSelect}
              dateRange={trip.settings?.dateRange}
              updateTrip={updateTrip}
            />
          ) : null}
      </main>
    </div>
  )
}

export default App

