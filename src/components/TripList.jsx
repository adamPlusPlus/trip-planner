import { getTrip } from '../data/tripApi'

/**
 * Sidebar list of all trips + New trip button. Parent owns trips list and selection.
 */
export default function TripList({ trips, loading, selectedTripId, onSelectTrip, onNewTrip }) {
  async function handleSelect(id) {
    const trip = await getTrip(id)
    if (trip) onSelectTrip(trip)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Trips</h2>
        <button
          onClick={onNewTrip}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700"
        >
          New trip
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
        </div>
      ) : trips.length === 0 ? (
        <p className="text-gray-600 text-sm">No trips yet. Create one to get started.</p>
      ) : (
        <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg bg-white overflow-hidden">
          {trips.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => handleSelect(t.id)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex justify-between items-center ${selectedTripId === t.id ? 'bg-primary-50 border-l-4 border-primary-600' : ''}`}
              >
                <span className="font-medium text-gray-900">{t.name || t.id}</span>
                {t.dateRange?.start && (
                  <span className="text-xs text-gray-500">
                    {t.dateRange.start} – {t.dateRange.end}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
