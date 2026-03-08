import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import CategoryView from './components/CategoryView'
import PlanViewer from './components/PlanViewer'
import ComparisonView from './components/ComparisonView'
import { getDestinations } from './utils/dataLoader'

function App() {
  const [destinations, setDestinations] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showQRCode, setShowQRCode] = useState(false)
  const [currentUrl, setCurrentUrl] = useState('')

  useEffect(() => {
    // Tailscale IP address (100.x.x.x range)
    // If you need to change this, run: ipconfig | findstr "Tailscale" on Windows
    const deviceIP = '100.67.131.21'
    setCurrentUrl(`http://${deviceIP}:5111`)
    loadDestinations()
  }, [])

  // Initialize from URL and handle browser navigation
  useEffect(() => {
    if (loading || destinations.length === 0) return

    // Initialize from URL on load
    const hash = window.location.hash.slice(1) // Remove #
    if (hash) {
      try {
        const state = JSON.parse(decodeURIComponent(hash))
        if (state.isComparison) {
          setSelectedCategory({ id: 'comparison', name: 'Comparison', isComparison: true })
        } else if (state.categoryId) {
          const category = destinations.find(d => d.id === state.categoryId)
          if (category) {
            setSelectedCategory(category)
            if (state.planId) {
              const plan = category.plans?.find(p => p.id === state.planId)
              if (plan) {
                setSelectedPlan(plan)
              }
            }
          }
        }
      } catch (e) {
        console.error('Error parsing URL state:', e)
      }
    }
    
    // Listen for browser back/forward
    const handlePopState = (event) => {
      const hash = window.location.hash.slice(1)
      if (!hash) {
        // Back to home
        setSelectedCategory(null)
        setSelectedPlan(null)
      } else {
        try {
          const state = JSON.parse(decodeURIComponent(hash))
          if (state.isComparison) {
            setSelectedCategory({ id: 'comparison', name: 'Comparison', isComparison: true })
            setSelectedPlan(null)
          } else if (state.categoryId) {
            const category = destinations.find(d => d.id === state.categoryId)
            if (category) {
              setSelectedCategory(category)
              if (state.planId) {
                const plan = category.plans?.find(p => p.id === state.planId)
                setSelectedPlan(plan || null)
              } else {
                setSelectedPlan(null)
              }
            }
          }
        } catch (e) {
          console.error('Error parsing URL state:', e)
        }
      }
    }
    
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [destinations, loading])

  const loadDestinations = async () => {
    try {
      const data = await getDestinations()
      setDestinations(data)
      setLoading(false)
    } catch (error) {
      console.error('Error loading destinations:', error)
      setLoading(false)
    }
  }

  const handleCategorySelect = (category) => {
    // Check if this is the comparison view
    if (category.isComparison) {
      setSelectedCategory({ ...category, isComparison: true })
      // Update URL
      const state = { isComparison: true }
      window.history.pushState(null, '', `#${encodeURIComponent(JSON.stringify(state))}`)
    } else {
      setSelectedCategory(category)
      // Update URL
      const state = { categoryId: category.id }
      window.history.pushState(null, '', `#${encodeURIComponent(JSON.stringify(state))}`)
    }
    setSelectedPlan(null)
  }

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan)
    // Update URL
    if (selectedCategory && !selectedCategory.isComparison) {
      const state = { categoryId: selectedCategory.id, planId: plan.id }
      window.history.pushState(null, '', `#${encodeURIComponent(JSON.stringify(state))}`)
    }
  }

  const handleBack = () => {
    // Use browser back navigation
    if (selectedPlan || selectedCategory) {
      window.history.back()
    }
  }

  const handleHome = () => {
    // Reset to home page
    setSelectedCategory(null)
    setSelectedPlan(null)
    // Update URL to home
    window.history.pushState(null, '', window.location.pathname)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading destinations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowQRCode(!showQRCode)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="Show QR Code"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </button>
              <h1 
                onClick={handleHome}
                className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-primary-600 transition-colors"
              >
                Road Trip Planner
              </h1>
            </div>
            {(selectedCategory || selectedPlan) && (
              <button
                onClick={handleBack}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                ← Back
              </button>
            )}
          </div>
        </div>
      </header>

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
              Scan this QR code with your mobile device to open the Road Trip Planner
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
        {!selectedCategory && !selectedPlan && (
          <CategoryView
            destinations={destinations}
            onSelect={handleCategorySelect}
          />
        )}

        {selectedCategory?.isComparison && (
          <ComparisonView 
            destinations={destinations}
            onNavigate={(categoryId, planId) => {
              const category = destinations.find(d => d.id === categoryId)
              if (category) {
                setSelectedCategory(category)
                if (planId) {
                  const plan = category.plans?.find(p => p.id === planId)
                  if (plan) {
                    setSelectedPlan(plan)
                  }
                }
              }
            }}
          />
        )}

        {selectedCategory && !selectedCategory.isComparison && !selectedPlan && (
          <PlanViewer
            category={selectedCategory}
            onPlanSelect={handlePlanSelect}
          />
        )}

        {selectedPlan && (
          <PlanViewer
            category={selectedCategory}
            plan={selectedPlan}
            onPlanSelect={handlePlanSelect}
          />
        )}
      </main>
    </div>
  )
}

export default App

