// Google Images search - uses a service to get actual location images
// This searches for the exact location name and returns real images

export const searchGoogleImages = async (query) => {
  try {
    const searchQuery = encodeURIComponent(query)
    
    // Use a Google Images API proxy service
    // Construct Google Images search URL with specific parameters
    const googleSearchUrl = `https://www.google.com/search?tbm=isch&q=${searchQuery}&tbs=isz:m`
    
    // Use a CORS proxy to fetch the search results
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(googleSearchUrl)}`
    
    const response = await fetch(proxyUrl)
    if (!response.ok) {
      console.error('Proxy request failed:', response.status)
      return null
    }
    
    const data = await response.json()
    
    if (data.contents) {
      const html = data.contents
      
      // Method 1: Extract from Google's embedded JSON data
      // Google Images stores image data in script tags with AF_initDataCallback
      const scriptMatches = html.match(/<script[^>]*>[\s\S]*?AF_initDataCallback[\s\S]*?<\/script>/gi)
      if (scriptMatches) {
        for (const script of scriptMatches) {
          // Look for image URLs in the JSON data
          const imageUrlPattern = /https?:\/\/[^"'\s<>\[\]{}]+\.(jpg|jpeg|png|webp|gif)(\?[^"'\s<>\[\]{}]*)?/gi
          const matches = script.match(imageUrlPattern)
          if (matches && matches.length > 0) {
            // Filter out Google's proxy URLs and return first valid image
            const validUrl = matches.find(url => 
              !url.includes('googleusercontent.com/url?') &&
              !url.includes('gstatic.com') &&
              !url.includes('logo') &&
              !url.includes('icon') &&
              !url.includes('favicon')
            )
            if (validUrl) {
              return validUrl
            }
          }
        }
      }
      
      // Method 2: Extract from img tags in HTML
      const imgTagMatches = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)
      if (imgTagMatches) {
        for (const imgTag of imgTagMatches) {
          const srcMatch = imgTag.match(/src=["']([^"']+)["']/i)
          if (srcMatch && srcMatch[1]) {
            const url = srcMatch[1]
            // Decode HTML entities
            const decodedUrl = url.replace(/&amp;/g, '&').replace(/&quot;/g, '"')
            // Check if it's a valid image URL
            if (decodedUrl.match(/https?:\/\/[^"'\s<>]+\.(jpg|jpeg|png|webp|gif)/i) &&
                !decodedUrl.includes('googleusercontent.com/url?') &&
                !decodedUrl.includes('gstatic.com') &&
                !decodedUrl.includes('logo') &&
                !decodedUrl.includes('icon')) {
              return decodedUrl
            }
          }
        }
      }
      
      // Method 3: Simple regex fallback for image URLs
      const imageUrlMatches = html.match(/https?:\/\/[^"'\s<>\[\]{}]+\.(jpg|jpeg|png|webp|gif)(\?[^"'\s<>\[\]{}]*)?/gi)
      if (imageUrlMatches && imageUrlMatches.length > 0) {
        // Filter out common non-image URLs
        const validUrls = imageUrlMatches.filter(url => 
          !url.includes('googleusercontent.com/url?') &&
          !url.includes('gstatic.com') &&
          !url.includes('logo') &&
          !url.includes('icon') &&
          !url.includes('favicon') &&
          url.length < 500 // Avoid extremely long URLs
        )
        if (validUrls.length > 0) {
          return validUrls[0]
        }
      }
    }
    
    return null
  } catch (error) {
    console.error('Error searching Google Images:', error)
    return null
  }
}

// Get location image by searching Google Images with the exact location name
// Returns { url, query } object with the image URL and the search query used
// ALWAYS includes "nature" in search to get relevant images
export const getLocationImageFromSearch = async (locationName) => {
  if (!locationName || locationName.length < 3) {
    return null
  }
  
  // Clean the location name - remove common suffixes that might interfere
  let cleanName = locationName.trim()
  
  // Remove state abbreviations if present (e.g., "Durango, Colorado" -> "Durango Colorado")
  cleanName = cleanName.replace(/,\s*[A-Z]{2}$/, '') // Remove ", CO" style
  cleanName = cleanName.replace(/\s+Colorado$/, ' Colorado') // Ensure space before state
  cleanName = cleanName.replace(/\s+Oklahoma$/, ' Oklahoma')
  cleanName = cleanName.replace(/\s+Arkansas$/, ' Arkansas')
  cleanName = cleanName.replace(/\s+Missouri$/, ' Missouri')
  cleanName = cleanName.replace(/\s+Texas$/, ' Texas')
  
  // ALWAYS include "nature" in search queries to get relevant images
  // Try multiple search queries in order of specificity
  const queries = [
    `${cleanName} nature`, // Primary search - always include nature
    `${cleanName} nature landscape`, // More specific
    `${cleanName} nature park`, // If it's a park
    cleanName, // Fallback without nature (but this should rarely be needed)
  ]
  
  for (const query of queries) {
    try {
      console.log(`Searching Google Images for: "${query}"`)
      const imageUrl = await searchGoogleImages(query)
      if (imageUrl) {
        console.log(`Found image for "${locationName}" using query "${query}": ${imageUrl}`)
        // Return both the URL and the query that was used
        return { url: imageUrl, query: query }
      }
    } catch (error) {
      console.error(`Error searching for "${query}":`, error)
      continue
    }
  }
  
  console.warn(`No image found for location: "${locationName}"`)
  return null
}

