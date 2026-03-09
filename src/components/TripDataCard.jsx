/**
 * First card in the trip view. Click opens Trip Data edit view. Not a destination.
 */
export default function TripDataCard({ onClick, isComplete }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer overflow-hidden border-2 border-dashed border-primary-300 flex items-center justify-center min-h-[200px]"
    >
      <div className="text-center p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-1">Trip Data</h3>
        <p className="text-sm text-gray-600">
          {isComplete ? 'Origin, dates, budget, people' : 'Set origin, dates, budget & people to add destinations'}
        </p>
        {!isComplete && (
          <p className="text-xs text-amber-600 mt-2">Complete this card first</p>
        )}
      </div>
    </div>
  )
}
