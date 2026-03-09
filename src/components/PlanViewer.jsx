import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { fetchWeather } from '../utils/api'
import { getPlanContent } from '../utils/dataLoader'
import { shouldShowImageForHeader, getImageForHeader, getLocalHeaderImage } from '../services/imageService'
import { parseCheckboxContent, rebuildContent, formatForAppleNotes } from '../utils/shoppingList'
import GeneratedPlanView from './GeneratedPlanView'
import { generateSectionContent } from '../utils/planGenerators'
import ThingsToSeeView from './plan-sections/ThingsToSeeView'
import PotentialRoutesView from './plan-sections/PotentialRoutesView'
import AccommodationsView from './plan-sections/AccommodationsView'
import BudgetSummaryView from './plan-sections/BudgetSummaryView'
import WeatherRouteView from './plan-sections/WeatherRouteView'

const PlanViewer = ({ trip, category, plan, onPlanSelect, dateRange, updateTrip }) => {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [images, setImages] = useState({}) // { location: { url, query } }
  const [weather, setWeather] = useState(null)
  const [weatherExpanded, setWeatherExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editableContent, setEditableContent] = useState('')

  // Helper to get Google Maps URL for a location
  const getGoogleMapsUrl = (locationName) => {
    const encoded = encodeURIComponent(locationName)
    return `https://www.google.com/maps/search/?api=1&query=${encoded}`
  }

  const sectionType = plan?.sectionType || plan?.id?.replace(`${category?.id}-`, '') || ''

  useEffect(() => {
    if (plan?.path) {
      loadPlanContent(plan)
    } else if (plan && !plan.path && category) {
      const structuredSections = ['things-to-see', 'potential-routes', 'budget', 'accommodations', 'weather', 'pre-shopping-packing']
      if (structuredSections.includes(sectionType)) {
        setContent('')
        setLoading(false)
      } else {
        setLoading(true)
        const dest = { id: category.id, name: category.name, location: category.location, coords: category.coords }
        generateSectionContent(sectionType, dest, trip)
          .then(({ content }) => {
            setContent(content || '')
            setLoading(false)
          })
          .catch((err) => {
            console.error('Generate section failed:', err)
            setContent(`# ${plan.name}\n\nCould not load this section.`)
            setLoading(false)
          })
      }
    } else {
      loadCategoryPlans()
    }
  }, [plan, category, trip, sectionType])

  useEffect(() => {
    if (category) {
      loadWeatherAndImages()
    }
  }, [category])

  const loadCategoryPlans = async () => {
    if (!category?.plans) return
    
    setLoading(false)
  }

  const loadPlanContent = async (planData) => {
    setLoading(true)
    try {
      const planContent = await getPlanContent(planData.path)
      
      // Check if it's a shopping/packing list
      const isShoppingList = planData.name?.toLowerCase().includes('shopping') || 
                            planData.name?.toLowerCase().includes('packing')
      
      if (isShoppingList) {
        // For shopping lists, always start with the original content
        // localStorage will be used to save changes, but we load from file first
        setContent(planContent)
        setEditableContent(planContent)
      } else {
        setContent(planContent)
      }
      // Images are loaded inline when headers are rendered - no pre-loading needed
    } catch (error) {
      console.error('Error loading plan:', error)
      setContent('# Error\n\nFailed to load plan content.')
    } finally {
      setLoading(false)
    }
  }
  
  // Check if current plan is a shopping/packing list
  const isShoppingList = plan?.name?.toLowerCase().includes('shopping') || 
                        plan?.name?.toLowerCase().includes('packing')
  
  // Toggle checkbox state
  const toggleCheckbox = (sectionIndex, itemIndex) => {
    if (!isShoppingList || !plan) return
    
    try {
      const sections = parseCheckboxContent(content)
      const section = sections[sectionIndex]
      if (section && section.items && section.items[itemIndex] && !section.items[itemIndex].type) {
        // Create a deep copy to avoid mutation issues
        const newSections = sections.map((sec, idx) => {
          if (idx === sectionIndex) {
            return {
              ...sec,
              items: sec.items.map((item, iidx) => {
                if (iidx === itemIndex && !item.type) {
                  return { ...item, checked: !item.checked }
                }
                return item
              })
            }
          }
          return sec
        })
        const newContent = rebuildContent(newSections)
        setContent(newContent)
        localStorage.setItem(`shopping-list-${plan.id}`, newContent)
      }
    } catch (error) {
      console.error('Error toggling checkbox:', error)
    }
  }
  
  // Copy list to clipboard (with mobile browser fallback)
  const copyToClipboard = () => {
    // Format content for Apple Notes compatibility (clean markdown)
    const formattedContent = formatForAppleNotes(content)
    
    // Use modern clipboard API if available
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(formattedContent).then(() => {
        alert('Shopping list copied to clipboard!')
      }).catch(err => {
        console.error('Failed to copy:', err)
        // Fallback to older method
        fallbackCopyToClipboard(formattedContent)
      })
    } else {
      // Fallback for older browsers or mobile
      fallbackCopyToClipboard(formattedContent)
    }
  }
  
  // Fallback copy method for mobile browsers
  const fallbackCopyToClipboard = (text) => {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      const successful = document.execCommand('copy')
      if (successful) {
        alert('Shopping list copied to clipboard!')
      } else {
        alert('Failed to copy to clipboard. Please select and copy manually.')
      }
    } catch (err) {
      console.error('Fallback copy failed:', err)
      alert('Failed to copy to clipboard. Please select and copy manually.')
    }
    document.body.removeChild(textArea)
  }
  
  // Handle text editing
  const handleTextEdit = (sectionIndex, itemIndex, newText) => {
    if (!isShoppingList || !plan) return
    
    const sections = parseCheckboxContent(content)
    const section = sections[sectionIndex]
    if (section && section.items && section.items[itemIndex] && !section.items[itemIndex].type) {
      section.items[itemIndex].text = newText
      const newContent = rebuildContent(sections)
      setContent(newContent)
      setEditableContent(newContent)
      localStorage.setItem(`shopping-list-${plan.id}`, newContent)
    }
  }
  
  // Add new item to a section
  const handleAddItem = (sectionIndex, people = ['person1', 'person2']) => {
    if (!isShoppingList || !plan) return
    
    const sections = parseCheckboxContent(content)
    const section = sections[sectionIndex]
    if (section && section.items) {
      // Add a new unchecked item
      section.items.push({
        checked: false,
        text: 'New item',
        people: people
      })
      const newContent = rebuildContent(sections)
      setContent(newContent)
      localStorage.setItem(`shopping-list-${plan.id}`, newContent)
    }
  }
  
  // Toggle which person(s) need an item
  const handleTogglePerson = (sectionIndex, itemIndex, person) => {
    if (!isShoppingList || !plan) return
    
    const sections = parseCheckboxContent(content)
    const section = sections[sectionIndex]
    if (section && section.items && section.items[itemIndex] && !section.items[itemIndex].type) {
      const item = section.items[itemIndex]
      const currentPeople = item.people || ['person1', 'person2']
      
      let newPeople
      if (currentPeople.includes(person)) {
        // Remove person
        newPeople = currentPeople.filter(p => p !== person)
        // If no people left, default to both
        if (newPeople.length === 0) {
          newPeople = ['person1', 'person2']
        }
      } else {
        // Add person
        newPeople = [...currentPeople, person]
      }
      
      item.people = newPeople
      const newContent = rebuildContent(sections)
      setContent(newContent)
      localStorage.setItem(`shopping-list-${plan.id}`, newContent)
    }
  }

  const loadWeatherAndImages = async () => {
    if (!category?.location) return

    try {
      // Load weather (async - needed for API call)
      const weatherData = await fetchWeather(category.location, category.coords, dateRange)
      setWeather(weatherData)

      // Use local header image directly (no API call needed)
      const localImagePath = getLocalHeaderImage(category.id || category.name)
      if (localImagePath) {
        setImages(prev => ({ ...prev, [category.location]: { url: localImagePath, query: category.location } }))
      }
    } catch (error) {
      console.error('Error loading weather/images:', error)
    }
  }
  
  // Helper function to render heading with image above it
  // Only shows images for specific location headers, using local images
  const renderHeadingWithImage = (headingText, level, children, props) => {
    // Extract text from children - ReactMarkdown passes children as React elements
    let headerText = headingText
    
    // If headingText is not a string, try to extract from children
    if (typeof headingText !== 'string' || headingText === '') {
      if (Array.isArray(children)) {
        headerText = children.map(child => {
          if (typeof child === 'string') return child
          if (child?.props?.children) {
            const childContent = child.props.children
            return Array.isArray(childContent) 
              ? childContent.map(c => typeof c === 'string' ? c : '').join('')
              : (typeof childContent === 'string' ? childContent : '')
          }
          return ''
        }).join('').trim()
      } else if (typeof children === 'string') {
        headerText = children
      } else if (children) {
        headerText = String(children)
      }
    }
    
    // Only show images for specific location headers
    if (!shouldShowImageForHeader(headerText)) {
      // No image for this header
      if (level === 2) return <h2 {...props}>{children}</h2>
      if (level === 3) return <h3 {...props}>{children}</h3>
      if (level === 4) return <h4 {...props}>{children}</h4>
      return null
    }
    
    // Get local image path for this header
    const imagePath = getImageForHeader(headerText)
    
    if (!imagePath) {
      // No image found, just render header
      if (level === 2) return <h2 {...props}>{children}</h2>
      if (level === 3) return <h3 {...props}>{children}</h3>
      if (level === 4) return <h4 {...props}>{children}</h4>
      return null
    }
    
    return (
      <>
        <div className="relative my-6 w-full max-w-3xl mx-auto">
          <img
            src={imagePath}
            alt={headerText}
            className="rounded-lg shadow-md w-full h-64 object-cover"
            onError={(e) => {
              console.error('Image failed to load:', imagePath, 'for header:', headerText)
              e.target.style.display = 'none'
            }}
          />
          {/* Image label - bottom left with location name */}
          <div className="absolute bottom-0 left-0 bg-black/60 text-white text-xs px-2 py-1 rounded-tr-lg backdrop-blur-sm">
            {headerText}
          </div>
        </div>
        {level === 2 && <h2 {...props}>{children}</h2>}
        {level === 3 && <h3 {...props}>{children}</h3>}
        {level === 4 && <h4 {...props}>{children}</h4>}
      </>
    )
  }


  if (!plan && category) {
    const hasGeneratedPlan = !category.plans?.length || category.plans.some((p) => !p.path)
    if (hasGeneratedPlan) {
      return <GeneratedPlanView category={category} trip={trip} onPlanSelect={onPlanSelect} />
    }
    const mapsUrl = getGoogleMapsUrl(category.location || category.name)
    return (
      <div>
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            <a 
              href={mapsUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 hover:underline transition-colors"
            >
              {category.name}
            </a>
          </h2>
          
          {weather && (
            <div className="bg-white rounded-lg shadow-md mb-6 border border-gray-200">
              <button
                onClick={() => setWeatherExpanded(!weatherExpanded)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-900">Current Weather</h3>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${weatherExpanded ? 'transform rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {weatherExpanded && (
                <div className="px-4 pb-4">
                  <div className="flex items-center justify-between gap-2">
                    {weather.daily?.slice(0, 7).map((day, idx) => (
                      <div key={idx} className="flex flex-col items-center text-center flex-1">
                        <div className="text-xs text-gray-600 font-medium mb-1">
                          {day.date ? new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-base font-bold text-gray-900">
                          {Math.round(day.temp.max)}°F
                        </div>
                        <div className="text-xs text-gray-500">
                          {Math.round(day.temp.min)}°F
                        </div>
                        <div className="text-xs text-gray-600 capitalize mt-1 line-clamp-1">
                          {day.weather[0]?.description}
                        </div>
                        {day.snow > 0 && (
                          <div className="text-xs text-blue-600 mt-1">
                            ❄️ {day.snow}mm
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {images[category.location] && images[category.location].url && (
            <div className="mb-6 rounded-lg overflow-hidden shadow-md relative">
              <img
                src={images[category.location].url}
                alt={category.location}
                className="w-full h-64 object-cover"
              />
              {/* Image label - bottom left with exact search query */}
              <div className="absolute bottom-0 left-0 bg-black/60 text-white text-xs px-2 py-1 rounded-tr-lg backdrop-blur-sm">
                {images[category.location].query || category.location}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {category.plans.map((planItem) => (
            <div
              key={planItem.id}
              onClick={() => onPlanSelect(planItem)}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer p-6 border border-gray-200"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {planItem.name}
              </h3>
              <p className="text-sm text-gray-600">
                {planItem.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading plan...</p>
        </div>
      </div>
    )
  }

  const destinationName = plan?.name || category?.name
  const destinationLocation = category?.location || category?.name
  const mapsUrl = getGoogleMapsUrl(destinationLocation)

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          <a 
            href={mapsUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-700 hover:underline transition-colors"
          >
            {destinationName}
          </a>
        </h2>
        {plan?.description && (
          <p className="text-gray-600">{plan.description}</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
        {sectionType === 'things-to-see' && category && updateTrip && (
          <ThingsToSeeView category={category} trip={trip} updateTrip={updateTrip} />
        )}
        {sectionType === 'potential-routes' && category && updateTrip && (
          <PotentialRoutesView category={category} trip={trip} updateTrip={updateTrip} />
        )}
        {sectionType === 'accommodations' && category && updateTrip && (
          <AccommodationsView category={category} trip={trip} updateTrip={updateTrip} />
        )}
        {sectionType === 'budget' && category && (
          <BudgetSummaryView category={category} trip={trip} />
        )}
        {sectionType === 'weather' && category && (
          <WeatherRouteView category={category} trip={trip} />
        )}
        {sectionType === 'pre-shopping-packing' && (
          <p className="text-gray-500">Leave blank for now.</p>
        )}
        {!['things-to-see', 'potential-routes', 'accommodations', 'budget', 'weather', 'pre-shopping-packing'].includes(sectionType) && isShoppingList && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy List
            </button>
          </div>
        )}
        <div className="markdown-content">
          {!['things-to-see', 'potential-routes', 'accommodations', 'budget', 'weather', 'pre-shopping-packing'].includes(sectionType) && isShoppingList ? (
            <ShoppingListView 
              content={content}
              onToggleCheckbox={toggleCheckbox}
              onTextEdit={handleTextEdit}
              onAddItem={handleAddItem}
              onTogglePerson={handleTogglePerson}
            />
          ) : !['things-to-see', 'potential-routes', 'accommodations', 'budget', 'weather', 'pre-shopping-packing'].includes(sectionType) ? (
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
              // Inject images above headers that mention locations
              h2: ({ node, children, ...props }) => {
                // Extract text from ReactMarkdown children - it's usually an array of strings/React elements
                const extractText = (children) => {
                  if (typeof children === 'string') return children
                  if (Array.isArray(children)) {
                    return children.map(c => {
                      if (typeof c === 'string') return c
                      if (c?.props?.children) return extractText(c.props.children)
                      return ''
                    }).join('').trim()
                  }
                  return String(children || '')
                }
                const headingText = extractText(children)
                return renderHeadingWithImage(headingText, 2, children, props)
              },
              h3: ({ node, children, ...props }) => {
                // Extract text from ReactMarkdown children
                const extractText = (children) => {
                  if (typeof children === 'string') return children
                  if (Array.isArray(children)) {
                    return children.map(c => {
                      if (typeof c === 'string') return c
                      if (c?.props?.children) return extractText(c.props.children)
                      return ''
                    }).join('').trim()
                  }
                  return String(children || '')
                }
                const headingText = extractText(children)
                return renderHeadingWithImage(headingText, 3, children, props)
              },
              h4: ({ node, children, ...props }) => {
                // Extract text from ReactMarkdown children
                const extractText = (children) => {
                  if (typeof children === 'string') return children
                  if (Array.isArray(children)) {
                    return children.map(c => {
                      if (typeof c === 'string') return c
                      if (c?.props?.children) return extractText(c.props.children)
                      return ''
                    }).join('').trim()
                  }
                  return String(children || '')
                }
                const headingText = extractText(children)
                return renderHeadingWithImage(headingText, 4, children, props)
              },
              img: ({ node, ...props }) => (
                <div className="relative my-4 w-full max-w-2xl mx-auto">
                  <img 
                    {...props} 
                    className="rounded-lg shadow-md w-full"
                    alt={props.alt || 'Image'}
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                  {/* Image label - bottom left */}
                  {props.alt && (
                    <div className="absolute bottom-0 left-0 bg-black/60 text-white text-xs px-2 py-1 rounded-tr-lg backdrop-blur-sm">
                      {props.alt}
                    </div>
                  )}
                </div>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// Shopping List View Component
const ShoppingListView = ({ content, onToggleCheckbox, onTextEdit, onAddItem, onTogglePerson }) => {
  const [editingItem, setEditingItem] = useState(null)
  const [editText, setEditText] = useState('')
  const [addingItem, setAddingItem] = useState(null)
  const [viewMode, setViewMode] = useState('combined') // 'combined', 'person1', 'person2'
  const [itemPeople, setItemPeople] = useState({}) // { sectionIndex-itemIndex: ['person1', 'person2'] }
  
  useEffect(() => {
    // Reset editing state when content changes
    setEditingItem(null)
    setEditText('')
    setAddingItem(null)
  }, [content])
  
  const handleAddButtonClick = (sectionIndex) => {
    setAddingItem(sectionIndex)
    setEditText('')
    // Trigger add item and immediately start editing
    onAddItem(sectionIndex)
    // Set editing state for the new item (it will be the last item in the section)
    const sections = parseCheckboxContent(content)
    const section = sections[sectionIndex]
    if (section && section.items) {
      const newItemIndex = section.items.length // The new item will be at this index
      setTimeout(() => {
        setEditingItem({ sectionIndex, itemIndex: newItemIndex })
        setEditText('New item')
      }, 100)
    }
  }
  
  const sections = parseCheckboxContent(content)
  
  const handleItemClick = (sectionIndex, itemIndex) => {
    const item = sections[sectionIndex]?.items[itemIndex]
    if (item && !item.type) {
      setEditingItem({ sectionIndex, itemIndex })
      setEditText(item.text)
    }
  }
  
  const handleEditSubmit = (sectionIndex, itemIndex) => {
    if (editText.trim()) {
      onTextEdit(sectionIndex, itemIndex, editText)
    }
    setEditingItem(null)
    setEditText('')
  }
  
  const handleEditCancel = () => {
    setEditingItem(null)
    setEditText('')
  }
  
  // Filter items by person - only show items specific to that person (not items for both)
  const filterItemsByPerson = (items, person) => {
    if (!items) return []
    return items.filter(item => {
      if (item.type === 'text') return true
      const people = item.people || ['person1', 'person2']
      // Only show items that are assigned to this person AND not to both
      return people.includes(person) && people.length === 1
    })
  }
  
  // Filter items for combined view - only show items assigned to both people
  const filterItemsForCombined = (items) => {
    if (!items) return []
    return items.filter(item => {
      if (item.type === 'text') return true
      const people = item.people || ['person1', 'person2']
      // Only show items assigned to both people
      return people.length === 2
    })
  }
  
  // Get items for a specific person (only Clothing & Personal Items section with all items - user can assign them)
  const getPersonSections = (person) => {
    const filtered = sections.filter(section => {
      // Only include "Clothing & Personal Items" section
      if (section.type === 'header') {
        const headerText = section.text.toLowerCase()
        return headerText.includes('clothing') && (headerText.includes('personal') || headerText.includes('&'))
      }
      return false
    })
    return filtered
      .map(section => ({
        ...section,
        items: section.items || [] // Show all items so user can assign them to this person
      }))
      .filter(section => 
        section.type === 'header' || 
        section.type === 'text' || 
        (section.items && section.items.length > 0)
      )
  }
  
  // Get items for combined view (only items assigned to both people, exclude Clothing & Personal Items)
  const getCombinedSections = () => {
    return sections
      .filter(section => {
        // Exclude "Clothing & Personal Items" section from combined view
        if (section.type === 'header') {
          const headerText = section.text.toLowerCase()
          return !(headerText.includes('clothing') && (headerText.includes('personal') || headerText.includes('&')))
        }
        return true
      })
      .map(section => ({
        ...section,
        items: filterItemsForCombined(section.items)
      }))
      .filter(section => 
        section.type === 'header' || 
        section.type === 'text' || 
        (section.items && section.items.length > 0)
      )
  }
  
  const person1Sections = getPersonSections('person1')
  const person2Sections = getPersonSections('person2')
  const combinedSections = getCombinedSections()
  
  const renderSection = (section, sectionIndex, isPersonView = false) => {
    // For person views, show all items (they're already filtered to only show Clothing & Personal Items section)
    // For combined view, show filtered items (only items assigned to both)
    const itemsToRender = section.items || []
    
    return (
      <div key={sectionIndex} className="mb-6">
        {section.type === 'header' && (
          <h2 className={`text-2xl font-bold text-gray-900 mb-4 mt-6 first:mt-0`}>
            {section.text}
          </h2>
        )}
        {section.type === 'text' && (
          <p className="text-gray-700 mb-4 whitespace-pre-line">{section.text}</p>
        )}
        {itemsToRender && itemsToRender.length > 0 && itemsToRender.map((item, itemIndex) => {
          // Find the original item index in the full section
          const originalItemIndex = section.items?.findIndex((origItem, idx) => {
            if (origItem.type === 'text' && item.type === 'text') return origItem.text === item.text
            if (!origItem.type && !item.type) return origItem.text === item.text
            return false
          }) ?? itemIndex
          
          if (item.type === 'text') {
            return <p key={itemIndex} className="text-gray-700 mb-2 whitespace-pre-line">{item.text}</p>
          }
          
          const isEditing = editingItem?.sectionIndex === sectionIndex && editingItem?.itemIndex === originalItemIndex
          const itemPeople = item.people || ['person1', 'person2']
          
          return (
            <div key={itemIndex} className="flex items-start mb-2 group">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => onToggleCheckbox(sectionIndex, originalItemIndex)}
                className="mt-1 mr-3 w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
              />
              {isEditing ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={() => handleEditSubmit(sectionIndex, originalItemIndex)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleEditSubmit(sectionIndex, originalItemIndex)
                      } else if (e.key === 'Escape') {
                        handleEditCancel()
                      }
                    }}
                    className="flex-1 px-2 py-1 border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center gap-2">
                  <span
                    onClick={() => handleItemClick(sectionIndex, originalItemIndex)}
                    className={`flex-1 cursor-text hover:bg-gray-50 px-2 py-1 rounded transition-colors ${
                      item.checked ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}
                  >
                    {item.text}
                  </span>
                  {/* Person selector buttons */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onTogglePerson(sectionIndex, originalItemIndex, 'person1')
                      }}
                      className={`px-2 py-1 text-xs rounded ${
                        itemPeople.includes('person1')
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                      title="Person 1"
                    >
                      1
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onTogglePerson(sectionIndex, originalItemIndex, 'person2')
                      }}
                      className={`px-2 py-1 text-xs rounded ${
                        itemPeople.includes('person2')
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                      title="Person 2"
                    >
                      2
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {/* Add button for sections with items */}
        {itemsToRender && itemsToRender.length > 0 && !isPersonView && (
          <button
            onClick={() => handleAddButtonClick(sectionIndex)}
            className="mt-2 px-3 py-1 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add item
          </button>
        )}
      </div>
    )
  }
  
  return (
    <div>
      {/* View mode selector */}
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setViewMode('combined')}
          className={`px-4 py-2 font-medium transition-colors ${
            viewMode === 'combined'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Combined
        </button>
        <button
          onClick={() => setViewMode('person1')}
          className={`px-4 py-2 font-medium transition-colors ${
            viewMode === 'person1'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Person 1
        </button>
        <button
          onClick={() => setViewMode('person2')}
          className={`px-4 py-2 font-medium transition-colors ${
            viewMode === 'person2'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Person 2
        </button>
      </div>
      
      {viewMode === 'combined' && combinedSections.map((section, sectionIndex) => renderSection(section, sectionIndex))}
      {viewMode === 'person1' && person1Sections.map((section, sectionIndex) => {
        // Find original section index
        const originalSectionIndex = sections.findIndex(s => s.text === section.text && s.type === section.type)
        return renderSection(section, originalSectionIndex >= 0 ? originalSectionIndex : sectionIndex, true)
      })}
      {viewMode === 'person2' && person2Sections.map((section, sectionIndex) => {
        // Find original section index
        const originalSectionIndex = sections.findIndex(s => s.text === section.text && s.type === section.type)
        return renderSection(section, originalSectionIndex >= 0 ? originalSectionIndex : sectionIndex, true)
      })}
    </div>
  )
}

export default PlanViewer

