import { useState, useEffect, useRef } from 'react'
import { fetchWeather } from '../utils/api'
import { getLocalHeaderImage } from '../services/imageService'
import { createDestination, isTripDataComplete } from '../domain/trip'
import { getDefaultPlansForDestination } from '../data/planTemplate'
import ContextMenu from './ContextMenu'

const CategoryView = ({ trip, destinations, onSelect, dateRange, updateTrip, firstCard }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [destinationImages, setDestinationImages] = useState({})
  const [destinationWeather, setDestinationWeather] = useState({})
  const [linkOriginId, setLinkOriginId] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [addName, setAddName] = useState('')
  const [addLocation, setAddLocation] = useState('')
  const loadedImagesRef = useRef(new Set())
  const itemsPerPage = 6

  const tripDataComplete = isTripDataComplete(trip)
  const totalItems = (firstCard ? 1 : 0) + destinations.length
  const totalPages = Math.ceil(Math.max(1, totalItems) / itemsPerPage)
  const startIndex = firstCard && currentPage === 1 ? 0 : (currentPage - 1) * itemsPerPage - (firstCard ? 1 : 0)
  const endIndex = firstCard && currentPage === 1 ? itemsPerPage - 1 : currentPage * itemsPerPage - (firstCard ? 1 : 0)
  const currentDestinations = destinations.slice(Math.max(0, startIndex), endIndex)

  const getOriginName = (dest) => {
    if (!dest.originDestinationId) return null
    const origin = destinations.find((d) => d.id === dest.originDestinationId)
    return origin?.name || dest.originDestinationId
  }

  const handleCardClick = (destination) => {
    if (linkOriginId) {
      if (destination.id === linkOriginId) return
      const next = destinations.map((d) =>
        d.id === destination.id ? { ...d, originDestinationId: linkOriginId } : d
      )
      updateTrip({ ...trip, destinations: next })
      setLinkOriginId(null)
    } else {
      onSelect(destination)
    }
  }

  const handleRemove = (dest) => {
    setContextMenu(null)
    const next = destinations.filter((d) => d.id !== dest.id)
    updateTrip({ ...trip, destinations: next })
  }

  const handleClearOrigin = (dest) => {
    setContextMenu(null)
    const next = destinations.map((d) =>
      d.id === dest.id ? { ...d, originDestinationId: null } : d
    )
    updateTrip({ ...trip, destinations: next })
  }

  const handleAddDestination = () => {
    if (!addName.trim() || !tripDataComplete) return
    const tripData = { origin: trip.origin, settings: trip.settings }
    const newDest = createDestination({
      name: addName.trim(),
      location: addLocation.trim() || null,
      budgetSlice: tripData.settings?.costTarget != null ? Math.floor(tripData.settings.costTarget / Math.max(1, destinations.length + 1)) : null,
    })
    newDest.plans = getDefaultPlansForDestination(newDest.id)
    updateTrip({ ...trip, destinations: [...destinations, newDest] })
    setAddName('')
    setAddLocation('')
    setShowAddForm(false)
  }

  const handleSaveEdit = (dest, name, location) => {
    const next = destinations.map((d) =>
      d.id === dest.id ? { ...d, name: name.trim(), location: location?.trim() || null } : d
    )
    updateTrip({ ...trip, destinations: next })
    setEditingId(null)
  }

  // Load images for all destinations - use local images directly (no API calls, instant)
  useEffect(() => {
    const loadImages = () => {
      // Only load images for destinations we haven't loaded yet
      const destinationsToLoad = destinations.filter(dest => !loadedImagesRef.current.has(dest.id))
      
      if (destinationsToLoad.length === 0) return

      // Mark as loaded
      destinationsToLoad.forEach(dest => loadedImagesRef.current.add(dest.id))

      // Use local header images directly - no async needed, instant
      const newImages = {}
      destinationsToLoad.forEach(dest => {
        const localImagePath = getLocalHeaderImage(dest.id)
        if (localImagePath) {
          newImages[dest.id] = { url: localImagePath, query: dest.name }
        }
      })

      if (Object.keys(newImages).length > 0) {
        setDestinationImages(prev => ({ ...prev, ...newImages }))
      }
    }

    loadImages()
  }, [destinations])

  // Load weather data for all destinations to check for snow
  useEffect(() => {
    const loadWeather = async () => {
      const weatherPromises = destinations.map(async (dest) => {
        try {
          const weatherData = await fetchWeather(dest.location, dest.coords, dateRange)
          // Check if any day in the forecast has snow
          const hasSnow = weatherData.daily?.some(day => day.snow > 0) || false
          return { id: dest.id, hasSnow }
        } catch (error) {
          console.error(`Error fetching weather for ${dest.name}:`, error)
          return { id: dest.id, hasSnow: false }
        }
      })

      const weatherResults = await Promise.all(weatherPromises)
      const weatherMap = {}
      weatherResults.forEach(result => {
        weatherMap[result.id] = { hasSnow: result.hasSnow }
      })
      setDestinationWeather(weatherMap)
    }

    loadWeather()
  }, [destinations])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleComparisonClick = () => {
    onSelect({ id: 'comparison', name: 'Comparison', isComparison: true })
  }

  const contextMenuItems = contextMenu
    ? [
        { id: 'edit', label: 'Edit', onClick: () => { setEditingId(contextMenu.dest.id); setContextMenu(null); } },
        { id: 'remove', label: 'Remove', onClick: () => handleRemove(contextMenu.dest) },
        { id: 'set-origin', label: 'Set as origin for…', onClick: () => { setLinkOriginId(contextMenu.dest.id); setContextMenu(null); } },
        ...(contextMenu.dest.originDestinationId
          ? [{ id: 'clear-origin', label: 'Clear origin link', onClick: () => handleClearOrigin(contextMenu.dest) }]
          : []),
      ]
    : []

  return (
    <div>
      {linkOriginId && (
        <p className="mb-4 text-sm text-primary-700 bg-primary-50 px-3 py-2 rounded-md">
          Click a destination to set it as the next leg (origin of that leg = selected).
        </p>
      )}
      {/* Add destination */}
      <div className="mb-6">
        {!tripDataComplete && (
          <p className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-md mb-3">
            Complete the Trip Data card (origin, dates, budget, people) to add destinations.
          </p>
        )}
        {showAddForm ? (
          <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Name</label>
              <input
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="Destination name"
                className="border border-gray-300 rounded px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Location (optional)</label>
              <input
                type="text"
                value={addLocation}
                onChange={(e) => setAddLocation(e.target.value)}
                placeholder="e.g. City, State"
                className="border border-gray-300 rounded px-3 py-1.5 text-sm"
              />
            </div>
            <button type="button" onClick={handleAddDestination} disabled={!tripDataComplete} className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed">Add</button>
            <button type="button" onClick={() => { setShowAddForm(false); setAddName(''); setAddLocation(''); }} className="px-3 py-1.5 text-gray-600 text-sm">Cancel</button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            disabled={!tripDataComplete}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!tripDataComplete ? 'Complete Trip Data first' : ''}
          >
            + Add destination
          </button>
        )}
      </div>

      {destinations.length > 1 && (
        <div className="mb-8">
          <div
            onClick={handleComparisonClick}
            className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer overflow-hidden border border-primary-400"
          >
            <div className="py-2 px-4 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Compare All Destinations</h3>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {destinations.length === 0 && !firstCard ? (
        <p className="text-gray-500 text-sm py-6">No destinations yet. Add one above.</p>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {firstCard && currentPage === 1 && <div>{firstCard}</div>}
        {currentDestinations.map((destination) => (
          <DestinationCard
            key={destination.id}
            destination={destination}
            originName={getOriginName(destination)}
            imageUrl={destinationImages[destination.id]}
            hasSnow={destinationWeather[destination.id]?.hasSnow || false}
            onSelect={() => handleCardClick(destination)}
            onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, dest: destination }); }}
            linkMode={!!linkOriginId}
            isLinkSource={linkOriginId === destination.id}
            editing={editingId === destination.id}
            onSaveEdit={(name, location) => handleSaveEdit(destination, name, location)}
            onCancelEdit={() => setEditingId(null)}
          />
        ))}
      </div>
      )}
      <ContextMenu position={contextMenu ? { x: contextMenu.x, y: contextMenu.y } : null} items={contextMenuItems} onClose={() => setContextMenu(null)} />

      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Previous
          </button>
          
          <div className="flex space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                  currentPage === page
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

const DestinationCard = ({
  destination,
  originName,
  imageUrl,
  hasSnow,
  onSelect,
  onContextMenu,
  linkMode,
  isLinkSource,
  editing,
  onSaveEdit,
  onCancelEdit,
}) => {
  const [editName, setEditName] = useState(destination.name)
  const [editLocation, setEditLocation] = useState(destination.location || '')
  useEffect(() => {
    if (editing) {
      setEditName(destination.name)
      setEditLocation(destination.location || '')
    }
  }, [editing, destination.id, destination.name, destination.location])

  const imageData = typeof imageUrl === 'string' ? { url: imageUrl, query: destination.name } : imageUrl
  const displayQuery = imageData?.query || destination.name

  if (editing) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden p-4">
        <div className="space-y-2">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Name"
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
          />
          <input
            type="text"
            value={editLocation}
            onChange={(e) => setEditLocation(e.target.value)}
            placeholder="Location (optional)"
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => onSaveEdit(editName, editLocation)} className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-md">Save</button>
            <button type="button" onClick={onCancelEdit} className="px-3 py-1.5 text-gray-600 text-sm">Cancel</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={() => onSelect(destination)}
      onContextMenu={onContextMenu}
      className={`bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden border cursor-pointer ${linkMode ? (isLinkSource ? 'border-primary-500 ring-2 ring-primary-300' : 'border-gray-200') : 'border-gray-200'}`}
    >
      <div className="h-48 bg-gradient-to-br from-primary-400 to-primary-600 relative overflow-hidden">
        {imageData && imageData.url && (
          <img
            src={imageData.url}
            alt={destination.name}
            className="w-full h-full object-cover absolute inset-0"
            loading="lazy"
            onLoad={(e) => {
              // Image loaded successfully, hide fallback
              const fallback = e.target.parentElement.querySelector('.fallback-letter')
              if (fallback) {
                fallback.style.display = 'none'
              }
            }}
            onError={(e) => {
              // Image failed, show fallback
              console.error('Image failed to load:', imageData.url)
              e.target.style.display = 'none'
              const fallback = e.target.parentElement.querySelector('.fallback-letter')
              if (fallback) {
                fallback.style.display = 'flex'
              }
            }}
          />
        )}
        <div 
          className="text-white text-4xl font-bold fallback-letter flex items-center justify-center absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600"
          style={{ display: (imageData && imageData.url) ? 'flex' : 'flex' }}
        >
          {destination.name.charAt(0)}
        </div>
        {/* Image label - bottom left with exact search query */}
        <div className="absolute bottom-0 left-0 bg-black/60 text-white text-xs px-2 py-1 rounded-tr-lg backdrop-blur-sm">
          {displayQuery}
        </div>
        {/* Snowflake icon if snow is present */}
        {hasSnow && (
          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full p-1.5 text-lg">
            ❄️
          </div>
        )}
        {destination.weather && (
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs">
            <div className="font-semibold text-gray-900">
              {destination.weather.temp}°F
            </div>
            <div className="text-gray-600 text-[10px]">
              {destination.weather.condition}
            </div>
          </div>
        )}
      </div>
      
      <div className="p-6">
        {originName && (
          <p className="text-xs text-gray-500 mb-1" title="Leg origin">
            From: {originName}
          </p>
        )}
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {destination.name}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {destination.description}
        </p>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {destination.distance || destination.location || '—'}
          </div>
          <div className="text-primary-600 font-medium">
            {destination.plans?.length || 0} plans
          </div>
        </div>
      </div>
    </div>
  )
}

export default CategoryView

