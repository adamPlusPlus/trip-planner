import { useState } from 'react'

const ComparisonView = ({ trip, destinations, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('overview')

  // Extract comparison data from destinations
  const comparisonData = destinations.map(dest => {
    // Parse distance to get numeric value for sorting
    const distanceMatch = dest.distance.match(/([\d,]+)/)
    const distanceNum = distanceMatch ? parseInt(distanceMatch[1].replace(/,/g, '')) : 0

    return {
      id: dest.id,
      name: dest.name,
      distance: dest.distance,
      distanceNum,
      description: dest.description,
      category: dest.category,
    }
  })

  // Helper function to get drive time from distance (miles)
  const getDriveTime = (dist) => {
    if (dist <= 400) return '5-7 hours'
    if (dist <= 600) return '7-9 hours'
    if (dist <= 800) return '11-12 hours'
    if (dist <= 900) return '12-14 hours'
    if (dist <= 1000) return '14-15 hours'
    return '15-18 hours'
  }

  // Comparison data from destination objects only; no hardcoded map. Use "—" until trip has structured comparison data.
  const getDestData = (_destName, _key) => '—'

  // Generate Google Maps URL for a route (trip origin + destination name)
  const getGoogleMapsUrl = (destName) => {
    const origin = trip?.origin?.name || trip?.origin?.location || 'Houston, TX'
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destName)}`
  }

  // Comparison tables data - dynamically built from all destinations
  const overviewComparison = [
    {
      category: 'Distance',
      values: comparisonData.map(d => ({ dest: d.name, value: d.distance }))
    },
    {
      category: 'Drive Time',
      values: comparisonData.map(d => ({ dest: d.name, value: getDriveTime(d.distanceNum) }))
    },
    {
      category: 'Snow Likelihood',
      values: comparisonData.map(d => ({ dest: d.name, value: getDestData(d.name, 'snow') }))
    },
    {
      category: 'Driving Safety',
      values: comparisonData.map(d => ({ dest: d.name, value: getDestData(d.name, 'safety') }))
    },
    {
      category: 'Primary Attractions',
      values: comparisonData.map(d => ({ dest: d.name, value: getDestData(d.name, 'attractions') }))
    },
  ]

  const budgetComparison = [
    {
      category: 'Fuel Cost (Round Trip)',
      values: comparisonData.map(d => ({ dest: d.name, value: getDestData(d.name, 'fuel') }))
    },
    {
      category: 'Accommodation Cost/Night',
      values: comparisonData.map(d => ({ dest: d.name, value: getDestData(d.name, 'accommodation') }))
    },
    {
      category: 'Total Budget (4 nights)',
      values: comparisonData.map(d => ({ dest: d.name, value: getDestData(d.name, 'budget4Nights') }))
    },
    {
      category: 'Budget Friendliness',
      values: comparisonData.map(d => ({ dest: d.name, value: getDestData(d.name, 'budgetFriendly') }))
    },
  ]

  const routesComparison = [
    {
      category: 'Route Type',
      values: comparisonData.map(d => ({ 
        dest: d.name, 
        value: getDestData(d.name, 'route'),
        link: getGoogleMapsUrl(d.name)
      }))
    },
    {
      category: 'Stopover Needed',
      values: comparisonData.map(d => ({ 
        dest: d.name, 
        value: getDestData(d.name, 'stopover'),
        link: getGoogleMapsUrl(d.name)
      }))
    },
    {
      category: 'Mountain Passes',
      values: comparisonData.map(d => ({ 
        dest: d.name, 
        value: getDestData(d.name, 'passes'),
        link: getGoogleMapsUrl(d.name)
      }))
    },
    {
      category: 'Winter Road Hazards',
      values: comparisonData.map(d => ({ 
        dest: d.name, 
        value: getDestData(d.name, 'hazards'),
        link: getGoogleMapsUrl(d.name)
      }))
    },
  ]

  // Helper to get stopover plan ID for a destination
  const getStopoverPlanId = (destId) => {
    const dest = destinations.find(d => d.id === destId)
    if (!dest) return null
    const stopoverPlan = dest.plans?.find(p => p.id?.includes('stopover') || p.name?.toLowerCase().includes('stopover'))
    return stopoverPlan?.id || null
  }

  // Helper to create navigation link for stopover
  const getStopoverLink = (destId, destName) => {
    const planId = getStopoverPlanId(destId)
    if (!planId) return null
    
    const dest = destinations.find(d => d.id === destId)
    if (!dest) return null
    
    const state = { categoryId: destId, planId: planId }
    return `#${encodeURIComponent(JSON.stringify(state))}`
  }

  const accommodationsComparison = [
    {
      category: 'Kitchen Availability',
      values: comparisonData.map(d => ({ dest: d.name, value: getDestData(d.name, 'kitchen') }))
    },
    {
      category: 'Nature Setting Options',
      values: comparisonData.map(d => ({ dest: d.name, value: getDestData(d.name, 'nature') }))
    },
    {
      category: 'Holiday Pricing',
      values: comparisonData.map(d => ({ dest: d.name, value: getDestData(d.name, 'holidayPricing') }))
    },
    {
      category: 'Stopover Locations',
      values: comparisonData.map(d => {
        const stopoverInfo = getDestData(d.name, 'stopover')
        const stopoverLink = getStopoverLink(d.id, d.name)
        
        return {
          dest: d.name,
          value: stopoverInfo,
          link: stopoverLink,
          isInternal: true // Flag to indicate this is an internal navigation link
        }
      })
    },
  ]

  const thingsToSeeComparison = [
    {
      category: 'National Parks',
      values: comparisonData.map(d => ({ dest: d.name, value: getDestData(d.name, 'nationalParks') }))
    },
    {
      category: 'National Forests',
      values: comparisonData.map(d => ({ dest: d.name, value: getDestData(d.name, 'nationalForests') }))
    },
    {
      category: 'State Parks',
      values: comparisonData.map(d => ({ dest: d.name, value: getDestData(d.name, 'stateParks') }))
    },
    {
      category: 'Unique Features',
      values: comparisonData.map(d => ({ dest: d.name, value: getDestData(d.name, 'unique') }))
    },
  ]

  const tabs = [
    { id: 'overview', name: 'Overview', data: overviewComparison },
    { id: 'budget', name: 'Budget', data: budgetComparison },
    { id: 'routes', name: 'Routes', data: routesComparison },
    { id: 'accommodations', name: 'Accommodations', data: accommodationsComparison },
    { id: 'things-to-see', name: 'Things to See', data: thingsToSeeComparison },
  ]

  const renderComparisonTable = (data) => {
    const destNames = comparisonData.map(d => d.name)

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Category
              </th>
              {destNames.map(dest => (
                <th key={dest} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  {dest}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {row.category}
                </td>
                {destNames.map(dest => {
                  const rowData = row.values.find(v => v.dest === dest)
                  const value = rowData?.value || 'N/A'
                  const link = rowData?.link
                  const isInternal = rowData?.isInternal
                  
                  return (
                    <td key={dest} className="px-6 py-4 text-sm text-gray-700">
                      {link ? (
                        <a 
                          href={link}
                          onClick={(e) => {
                            if (isInternal) {
                              e.preventDefault()
                              if (onNavigate) {
                                const destData = destinations.find(d => d.name === dest)
                                const planId = getStopoverPlanId(destData?.id)
                                if (destData && planId) {
                                  onNavigate(destData.id, planId)
                                }
                              } else {
                                // Fallback to hash navigation
                                window.location.hash = link
                                window.dispatchEvent(new PopStateEvent('popstate'))
                              }
                            }
                          }}
                          target={isInternal ? undefined : "_blank"}
                          rel={isInternal ? undefined : "noopener noreferrer"}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {value}
                        </a>
                      ) : (
                        value
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Destination Comparison
        </h2>
        <p className="text-gray-600">
          Compare all destinations side-by-side across different categories
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        {renderComparisonTable(tabs.find(t => t.id === activeTab)?.data || [])}
      </div>
    </div>
  )
}

export default ComparisonView

