import { useState } from 'react'
import ContextMenu from './ContextMenu.jsx'

const TRIP_NAME_MAX = 20

/**
 * Modal for load/save/new trip and rename. Opened from header "Trips" button.
 */
export default function TripModal({
  isOpen,
  onClose,
  trips,
  currentTrip,
  onLoadTrip,
  onNewTrip,
  onSaveTrip,
  onRenameTrip,
  onLoadExample,
  loading = false,
}) {
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [contextMenu, setContextMenu] = useState(null)

  if (!isOpen) return null

  const handleStartRename = (t) => {
    setRenamingId(t.id)
    setRenameValue((t.name || t.id || '').slice(0, TRIP_NAME_MAX))
  }

  const handleCommitRename = () => {
    if (renamingId && renameValue.trim()) {
      onRenameTrip(renamingId, renameValue.trim().slice(0, TRIP_NAME_MAX))
    }
    setRenamingId(null)
    setContextMenu(null)
  }

  const handleKeyDown = (e, id) => {
    if (e.key === 'Enter') handleCommitRename()
    if (e.key === 'Escape') {
      setRenamingId(null)
      setContextMenu(null)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Trips</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-gray-700 rounded"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4 flex flex-col gap-3 overflow-auto">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { onNewTrip(); onClose(); }}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700"
              >
                New trip
              </button>
              {currentTrip && (
                <button
                  type="button"
                  onClick={() => { onSaveTrip(); onClose(); }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300"
                >
                  Save current
                </button>
              )}
            </div>
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              </div>
            ) : trips.length === 0 ? (
              <div className="text-gray-500 text-sm space-y-2">
                <p>No saved trips. Create one with &quot;New trip&quot;.</p>
                {onLoadExample && (
                  <button
                    type="button"
                    onClick={() => { onLoadExample(); onClose(); }}
                    className="text-primary-600 font-medium hover:underline"
                  >
                    Load example trip (Pagosa Springs)
                  </button>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
                {trips.map((t) => (
                  <li
                    key={t.id}
                    className="bg-white"
                    onContextMenu={(e) => {
                      e.preventDefault()
                      setContextMenu({ x: e.clientX, y: e.clientY, tripId: t.id, trip: t })
                    }}
                  >
                    {renamingId === t.id ? (
                      <div className="px-4 py-2 flex items-center gap-2">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value.slice(0, TRIP_NAME_MAX))}
                          onBlur={handleCommitRename}
                          onKeyDown={(e) => handleKeyDown(e, t.id)}
                          className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                          autoFocus
                          maxLength={TRIP_NAME_MAX}
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { onLoadTrip(t.id); onClose(); }}
                        className={`w-full px-4 py-3 text-left text-sm flex justify-between items-center hover:bg-gray-50 ${currentTrip?.id === t.id ? 'bg-primary-50 text-primary-800' : 'text-gray-900'}`}
                      >
                        <span className="font-medium truncate">{(t.name || t.id).slice(0, TRIP_NAME_MAX)}</span>
                        {t.dateRange?.start && (
                          <span className="text-xs text-gray-500 shrink-0 ml-2">
                            {t.dateRange.start} – {t.dateRange.end}
                          </span>
                        )}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      <ContextMenu
        position={contextMenu ? { x: contextMenu.x, y: contextMenu.y } : null}
        items={contextMenu ? [{ id: 'rename', label: 'Rename', onClick: () => handleStartRename(contextMenu.trip) }] : []}
        onClose={() => setContextMenu(null)}
      />
    </>
  )
}
