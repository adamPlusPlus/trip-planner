// Mapping of specific location headers to their local image files
// Only these specific locations will have images displayed above their headers

export const locationHeaderImages = {
  // Pagosa Springs Area
  'San Juan National Forest': '/images/locations/san-juan-national-forest.jpg',
  
  // Texas Attractions (Stopover locations - Palo Duro Canyon)
  'Palo Duro Canyon State Park': '/images/locations/palo-duro-canyon-state-park.jpg',
  'Palo Duro Canyon': '/images/locations/palo-duro-canyon-state-park.jpg',
  
  // Pagosa Springs Area
  'Wolf Creek Ski Area': '/images/locations/wolf-creek-ski-area.jpg',
  'San Juan National Forest': '/images/locations/san-juan-national-forest.jpg',
  'Pagosa Hot Springs': '/images/locations/pagosa-hot-springs.jpg',
  'San Juan River': '/images/locations/san-juan-river.jpg',
  'Chimney Rock National Monument': '/images/locations/chimney-rock-national-monument.jpg',
  
  // Stopover Locations (from in-between-locations.md)
  'Amarillo, TX Area': '/images/locations/amarillo-tx-area.jpg',
  'Amarillo Area': '/images/locations/amarillo-tx-area.jpg',
  'Amarillo Area (Return Stopover)': '/images/locations/amarillo-tx-area.jpg',
  'Amarillo/Palo Duro Canyon Area': '/images/locations/amarillo-tx-area.jpg',
  'Albuquerque, NM Area': '/images/locations/albuquerque-nm-area.jpg',
  'Albuquerque, NM Area (Return Option)': '/images/locations/albuquerque-nm-area.jpg',
  'Santa Fe area': '/images/locations/santa-fe-area.jpg',
  'Santa Fe': '/images/locations/santa-fe-area.jpg',
  'Santa Fe, NM Area (Return Option)': '/images/locations/santa-fe-area.jpg',
  'Jemez Springs area': '/images/locations/jemez-springs-area.jpg',
  'Las Cruces, NM Area': '/images/locations/las-cruces-nm-area.jpg',
  'Lubbock, TX Area': '/images/locations/lubbock-tx-area.jpg',
  
  // Additional Stopover Locations
  'Dallas Area': '/images/locations/dallas-tx-area.jpg',
  'Dallas Area (If Desired)': '/images/locations/dallas-tx-area.jpg',
  'Dallas Area (Alternative)': '/images/locations/dallas-tx-area.jpg',
  'Tulsa Area': '/images/locations/tulsa-ok-area.jpg',
  'Tulsa Area (Recommended)': '/images/locations/tulsa-ok-area.jpg',
  'Tulsa Area (Return Stopover)': '/images/locations/tulsa-ok-area.jpg',
  'Texarkana Area': '/images/locations/texarkana-tx-area.jpg',
  'Texarkana Area (If Desired)': '/images/locations/texarkana-tx-area.jpg',
  'Denver Area': '/images/locations/denver-co-area.jpg',
  'Denver Area (Alternative)': '/images/locations/denver-co-area.jpg',
  'Denver Area (Alternative - Too Long for One Day)': '/images/locations/denver-co-area.jpg',
  'Roswell Area': '/images/locations/roswell-nm-area.jpg',
  'Roswell Area (Alternative)': '/images/locations/roswell-nm-area.jpg',
  
  // Stopover Parks (shorter names used in stopover files)
  'Palo Duro Canyon': '/images/locations/palo-duro-canyon-state-park.jpg',
  'Caprock Canyons': '/images/locations/caprock-canyons-state-park.jpg',
  
  // Route Cities (major stops)
  'Amarillo': '/images/locations/amarillo.jpg',
  'Santa Fe': '/images/locations/santa-fe.jpg',
  'Albuquerque': '/images/locations/albuquerque.jpg',
}

// Check if a header should have an image
// ONLY matches specific attractions, NOT generic section headers like "Near Houston" or "Central/West Texas"
export const shouldShowImageForHeader = (headerText) => {
  // Normalize header text - remove parenthetical info and extra whitespace
  const normalizedHeader = headerText.replace(/\s*\(.*?\)\s*/g, '').trim()
  
  // Check exact matches first
  if (locationHeaderImages[normalizedHeader] || locationHeaderImages[headerText]) {
    return true
  }
  
  // Check partial matches for SPECIFIC attractions only
  // Exclude generic section headers like "Near Houston", "Central/West Texas", "Primary Attractions", etc.
  const headerLower = normalizedHeader.toLowerCase()
  
  // List of generic section headers to EXCLUDE
  const excludedPatterns = [
    'near houston',
    'near austin',
    'central',
    'west texas',
    'far west texas',
    'northern new mexico',
    'durango area',
    'scenic drives',
    'primary attractions',
    'secondary attractions',
    'unique biomes',
    'hiking recommendations',
    'planning considerations',
    'recommended priority',
    'route planning',
    'focus:',
    'notes',
    'activities',
    'features',
    'location:',
    'size:',
    'access:',
    'unique:',
    'note:',
  ]
  
  // If header matches any excluded pattern, don't show image
  for (const pattern of excludedPatterns) {
    if (headerLower.includes(pattern)) {
      return false
    }
  }
  
  // Check for specific attraction patterns (must be actual park/forest/lake names)
  const specificAttractionPatterns = [
    'state park',
    'national park',
    'national forest',
    'national monument',
    'national preserve',
    'nature park',
    'wilderness',
    'woodland gardens',
    'canyon',
    'mountains national',
    'river',
    'lake',
  ]
  
  // Must contain at least one specific attraction pattern
  const hasAttractionPattern = specificAttractionPatterns.some(pattern => 
    headerLower.includes(pattern)
  )
  
  if (!hasAttractionPattern) {
    return false
  }
  
  // Now check if it matches any known location (partial match)
  for (const [location, imagePath] of Object.entries(locationHeaderImages)) {
    const locationLower = location.toLowerCase()
    // Remove common prefixes/suffixes for matching
    const cleanLocation = locationLower
      .replace(/^stopover:\s*/i, '')
      .replace(/\s*\(.*?\)\s*/g, '')
      .replace(/\s*\(return.*?\)\s*/gi, '')
      .trim()
    const cleanHeader = headerLower
      .replace(/^stopover:\s*/i, '')
      .replace(/\s*\(.*?\)\s*/g, '')
      .trim()
    
    // Check if header contains the location name or vice versa
    if (cleanHeader.includes(cleanLocation) || cleanLocation.includes(cleanHeader)) {
      return true
    }
  }
  
  return false
}

// Get image path for a header
export const getImageForHeader = (headerText) => {
  // Normalize header text
  const normalizedHeader = headerText.replace(/\s*\(.*?\)\s*/g, '').trim()
  
  // Exact match
  if (locationHeaderImages[headerText]) {
    return locationHeaderImages[headerText]
  }
  if (locationHeaderImages[normalizedHeader]) {
    return locationHeaderImages[normalizedHeader]
  }
  
  // Partial match - remove common prefixes/suffixes
  const headerLower = headerText.toLowerCase()
    .replace(/^stopover:\s*/i, '')
    .replace(/\s*\(.*?\)\s*/g, '')
    .replace(/\s*\(return.*?\)\s*/gi, '')
    .trim()
  
  for (const [location, imagePath] of Object.entries(locationHeaderImages)) {
    const locationLower = location.toLowerCase()
      .replace(/^stopover:\s*/i, '')
      .replace(/\s*\(.*?\)\s*/g, '')
      .replace(/\s*\(return.*?\)\s*/gi, '')
      .trim()
    
    // Check if header contains the location name or vice versa
    if (headerLower.includes(locationLower) || locationLower.includes(headerLower)) {
      return imagePath
    }
  }
  
  return null
}

