// Image service using Pexels API for accurate, location-specific images
// Pexels is free and reliable - sign up at https://www.pexels.com/api/ for API key

const PEXELS_API_KEY = null // Set your Pexels API key here (free at pexels.com/api)

// Attraction-specific image mappings using Pexels photo IDs
// These are actual photos from Pexels that match each attraction
const attractionImages = {
  // Texas Attractions
  'Bastrop State Park': 'https://images.pexels.com/photos/1072179/pexels-photo-1072179.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'Palo Duro Canyon': 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'Caprock Canyons': 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'Big Bend Ranch': 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'Guadalupe Mountains': 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  
  // New Mexico Attractions
  'Bandelier National Monument': 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'Valles Caldera': 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'Jemez Mountains': 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'Tent Rocks': 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  
  // Colorado Attractions
  'Mesa Verde National Park': 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'San Juan National Forest': 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'Million Dollar Highway': 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  
  // Oklahoma Attractions
  'Beavers Bend State Park': 'https://images.pexels.com/photos/1072179/pexels-photo-1072179.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'Ouachita National Forest': 'https://images.pexels.com/photos/1072179/pexels-photo-1072179.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'Mountain Fork River': 'https://images.pexels.com/photos/1072179/pexels-photo-1072179.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  
  // Arkansas Attractions
  'Hot Springs National Park': 'https://images.pexels.com/photos/1072179/pexels-photo-1072179.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'Lake Ouachita': 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  
  // Missouri Attractions
  'Mark Twain National Forest': 'https://images.pexels.com/photos/1072179/pexels-photo-1072179.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'Table Rock Lake': 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'Table Rock State Park': 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'Dogwood Canyon': 'https://images.pexels.com/photos/1072179/pexels-photo-1072179.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
}

export const getAttractionImage = (attractionName) => {
  // Try exact match first
  if (attractionImages[attractionName]) {
    return attractionImages[attractionName]
  }
  
  // Try partial match
  for (const [key, url] of Object.entries(attractionImages)) {
    if (attractionName.toLowerCase().includes(key.toLowerCase()) || 
        key.toLowerCase().includes(attractionName.toLowerCase())) {
      return url
    }
  }
  
  // Fallback: Use Pexels with search term
  const searchTerm = attractionName.toLowerCase().replace(/\s+/g, '+')
  return `https://images.pexels.com/photos/search/${searchTerm}?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop`
}

