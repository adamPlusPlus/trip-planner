// Script to download location images from Pexels API
// Run this once to download all location images to public/images/locations/

import { createClient } from 'pexels'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import https from 'https'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PEXELS_API_KEY = 'UILCwPuEaQGmtNbbdIXdZha7hexD1IwRYjz0QO027BjqvkJxG0clEjtO'
const pexelsClient = createClient(PEXELS_API_KEY)

const locationSearches = {
  // Durango Area
  'mesa-verde-national-park': 'Mesa Verde National Park Colorado cliff dwellings',
  'san-juan-national-forest': 'San Juan National Forest Colorado mountains',
  
  // Texas Attractions (Specific Parks Only)
  'bastrop-state-park': 'Bastrop State Park Texas Lost Pines',
  'mckinney-roughs-nature-park': 'McKinney Roughs Nature Park Texas',
  'palo-duro-canyon-state-park': 'Palo Duro Canyon State Park Texas red rock',
  'caprock-canyons-state-park': 'Caprock Canyons State Park Texas',
  'big-bend-ranch-state-park': 'Big Bend Ranch State Park Texas desert',
  'guadalupe-mountains-national-park': 'Guadalupe Mountains National Park Texas',
  
  // New Mexico Attractions
  'bandelier-national-monument': 'Bandelier National Monument New Mexico cliff dwellings',
  'valles-caldera-national-preserve': 'Valles Caldera National Preserve New Mexico',
  'tent-rocks-national-monument': 'Kasha-Katuwe Tent Rocks National Monument New Mexico',
  
  // Broken Bow Area
  'beavers-bend-state-park': 'Beavers Bend State Park Oklahoma pine forest',
  'ouachita-national-forest': 'Ouachita National Forest Arkansas Oklahoma',
  'mountain-fork-river': 'Mountain Fork River Oklahoma Broken Bow',
  'broken-bow-lake': 'Broken Bow Lake Oklahoma',
  'hochatown-state-park': 'Hochatown State Park Oklahoma',
  
  // Hot Springs Area
  'hot-springs-national-park': 'Hot Springs National Park Arkansas bathhouse row',
  'lake-ouachita': 'Lake Ouachita Arkansas',
  'lake-ouachita-state-park': 'Lake Ouachita State Park Arkansas',
  'garvan-woodland-gardens': 'Garvan Woodland Gardens Arkansas botanical',
  
  // Branson Area
  'mark-twain-national-forest': 'Mark Twain National Forest Missouri Ozarks',
  'table-rock-lake': 'Table Rock Lake Missouri Branson',
  'table-rock-state-park': 'Table Rock State Park Missouri',
  'dogwood-canyon-nature-park': 'Dogwood Canyon Nature Park Missouri',
  'hercules-glades-wilderness': 'Hercules Glades Wilderness Missouri',
  'roaring-river-state-park': 'Roaring River State Park Missouri',
  'bull-shoals-lake': 'Bull Shoals Lake Missouri Arkansas',
  
  // Stopover Locations - Much more specific with landmarks/features
  'amarillo-tx-area': 'Amarillo Texas Cadillac Ranch Palo Duro Canyon',
  'albuquerque-nm-area': 'Albuquerque New Mexico Sandia Mountains',
  'santa-fe-area': 'Santa Fe New Mexico adobe architecture mountains',
  'jemez-springs-area': 'Jemez Springs New Mexico hot springs mountains',
  'las-cruces-nm-area': 'Las Cruces New Mexico Organ Mountains',
  'lubbock-tx-area': 'Lubbock Texas plains cotton fields',
  'dallas-tx-area': 'Dallas Texas skyline downtown',
  'tulsa-ok-area': 'Tulsa Oklahoma skyline downtown',
  'texarkana-tx-area': 'Texarkana Texas Arkansas downtown',
  'denver-co-area': 'Denver Colorado mountains skyline',
  'roswell-nm-area': 'Roswell New Mexico desert',
  
  // Route Cities - More specific
  'amarillo': 'Amarillo Texas Cadillac Ranch Route 66',
  'santa-fe': 'Santa Fe New Mexico adobe architecture plaza',
  'albuquerque': 'Albuquerque New Mexico Sandia Mountains balloon fiesta',
  
  // Taos Area
  'taos-ski-valley': 'Taos Ski Valley New Mexico mountains snow',
  'carson-national-forest': 'Carson National Forest New Mexico mountains',
  'taos-pueblo': 'Taos Pueblo New Mexico adobe UNESCO',
  'rio-grande-gorge': 'Rio Grande Gorge New Mexico canyon',
  'wheeler-peak': 'Wheeler Peak New Mexico highest point',
  
  // Ruidoso Area
  'ski-apache': 'Ski Apache New Mexico mountains snow',
  'lincoln-national-forest': 'Lincoln National Forest New Mexico mountains',
  'white-mountain-wilderness': 'White Mountain Wilderness New Mexico',
  'monjeau-lookout': 'Monjeau Lookout New Mexico mountain',
  
  // Cloudcroft Area
  'cloudcroft-ski-area': 'Cloudcroft Ski Area New Mexico mountains snow',
  'sacramento-mountains': 'Sacramento Mountains New Mexico',
  'osha-trail': 'Osha Trail New Mexico forest',
  'trestle-recreation-area': 'Trestle Recreation Area New Mexico',
  
  // Winter Park Area
  'winter-park-resort': 'Winter Park Resort Colorado mountains snow ski',
  'arapaho-national-forest': 'Arapaho National Forest Colorado mountains',
  'rocky-mountain-national-park': 'Rocky Mountain National Park Colorado mountains',
  'fraser-valley': 'Fraser Valley Colorado mountains',
  'berthoud-pass': 'Berthoud Pass Colorado mountain',
  
  // Steamboat Springs Area
  'steamboat-ski-resort': 'Steamboat Ski Resort Colorado mountains snow ski',
  'routt-national-forest': 'Routt National Forest Colorado mountains',
  'yampa-river': 'Yampa River Colorado Steamboat Springs',
  'strawberry-park-hot-springs': 'Strawberry Park Hot Springs Colorado natural',
  'fish-creek-falls': 'Fish Creek Falls Colorado waterfall',
  
  // Crested Butte Area
  'crested-butte-ski-resort': 'Crested Butte Ski Resort Colorado mountains snow ski',
  'gunnison-national-forest': 'Gunnison National Forest Colorado mountains',
  'crested-butte-mountain': 'Crested Butte Mountain Colorado',
  'gunnison-river': 'Gunnison River Colorado',
  
  // Pagosa Springs Area
  'wolf-creek-ski-area': 'Wolf Creek Ski Area Colorado mountains snow',
  'san-juan-national-forest': 'San Juan National Forest Colorado mountains',
  'pagosa-hot-springs': 'Pagosa Hot Springs Colorado natural deepest',
  'san-juan-river': 'San Juan River Colorado Pagosa Springs',
  'chimney-rock-national-monument': 'Chimney Rock National Monument Colorado',
  
  // Angel Fire Area
  'angel-fire-resort': 'Angel Fire Resort New Mexico mountains snow ski',
  'vietnam-veterans-memorial': 'Vietnam Veterans Memorial Angel Fire',
  'sangre-de-cristo-mountains': 'Sangre de Cristo Mountains New Mexico',
  'eagle-nest-lake': 'Eagle Nest Lake New Mexico',
  
  // Red River Area
  'red-river-ski-area': 'Red River Ski Area New Mexico mountains snow',
  'goose-lake': 'Goose Lake New Mexico Red River',
}

const imagesDir = path.join(__dirname, 'public', 'images', 'locations')

// Ensure directory exists
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true })
}

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(filepath)
        response.pipe(fileStream)
        fileStream.on('finish', () => {
          fileStream.close()
          resolve()
        })
      } else {
        reject(new Error(`Failed to download: ${response.statusCode}`))
      }
    }).on('error', reject)
  })
}

async function downloadAllImages() {
  console.log('Downloading location images from Pexels...\n')
  
  for (const [filename, searchQuery] of Object.entries(locationSearches)) {
    try {
      console.log(`Searching for: ${searchQuery}`)
      // Try to get multiple results and pick the best one
      const response = await pexelsClient.photos.search({ 
        query: searchQuery, 
        per_page: 5, // Get more results to find better match
        orientation: 'landscape'
      })
      
      if (response.photos && response.photos.length > 0) {
        // Use the first result (most relevant)
        const photo = response.photos[0]
        const imageUrl = photo.src.large || photo.src.medium
        const filepath = path.join(imagesDir, `${filename}.jpg`)
        
        console.log(`  Downloading: ${imageUrl}`)
        console.log(`  Photo ID: ${photo.id}, Photographer: ${photo.photographer}`)
        await downloadImage(imageUrl, filepath)
        console.log(`  ✓ Saved: ${filename}.jpg\n`)
      } else {
        console.log(`  ✗ No image found for: ${searchQuery}\n`)
      }
      
      // Rate limiting - wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error(`  ✗ Error downloading ${filename}:`, error.message, '\n')
    }
  }
  
  console.log('Done! Images saved to:', imagesDir)
}

downloadAllImages().catch(console.error)

