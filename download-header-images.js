// Script to download header images for main destination cards
// Run this once to download all destination header images

import { createClient } from 'pexels'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import https from 'https'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PEXELS_API_KEY = 'UILCwPuEaQGmtNbbdIXdZha7hexD1IwRYjz0QO027BjqvkJxG0clEjtO'
const pexelsClient = createClient(PEXELS_API_KEY)

const destinationSearches = {
  'durango': 'Durango Colorado mountains winter snow nature',
  'broken-bow': 'Broken Bow Oklahoma Beavers Bend State Park pine forest nature',
  'hot-springs': 'Hot Springs Arkansas Ouachita Mountains forest nature',
  'branson': 'Branson Missouri Ozark Mountains Table Rock Lake nature',
  'colorado-resorts': 'Colorado ski resorts Breckenridge Keystone mountains snow nature',
  'taos': 'Taos New Mexico mountains winter snow Carson National Forest nature',
  'ruidoso': 'Ruidoso New Mexico mountains winter snow Lincoln National Forest nature',
  'cloudcroft': 'Cloudcroft New Mexico mountains winter snow highest elevation nature',
  'winter-park': 'Winter Park Colorado mountains winter snow Arapaho National Forest ski resort nature',
  'steamboat-springs': 'Steamboat Springs Colorado mountains winter snow Routt National Forest ski resort nature',
  'crested-butte': 'Crested Butte Colorado mountains winter snow Gunnison National Forest ski resort nature',
  'pagosa-springs': 'Pagosa Springs Colorado mountains winter snow San Juan National Forest hot springs nature',
  'angel-fire': 'Angel Fire New Mexico mountains winter snow Carson National Forest ski resort nature',
  'red-river': 'Red River New Mexico mountains winter snow Carson National Forest ski area nature',
}

const imagesDir = path.join(__dirname, 'public', 'images', 'headers')

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

async function downloadAllHeaderImages() {
  console.log('Downloading destination header images from Pexels...\n')
  
  for (const [destinationId, searchQuery] of Object.entries(destinationSearches)) {
    try {
      console.log(`Searching for: ${searchQuery}`)
      const response = await pexelsClient.photos.search({ 
        query: searchQuery, 
        per_page: 1,
        orientation: 'landscape'
      })
      
      if (response.photos && response.photos.length > 0) {
        const photo = response.photos[0]
        const imageUrl = photo.src.large || photo.src.medium
        const filepath = path.join(imagesDir, `${destinationId}.jpg`)
        
        console.log(`  Downloading: ${imageUrl}`)
        await downloadImage(imageUrl, filepath)
        console.log(`  ✓ Saved: ${destinationId}.jpg\n`)
      } else {
        console.log(`  ✗ No image found for: ${searchQuery}\n`)
      }
      
      // Rate limiting - wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error(`  ✗ Error downloading ${destinationId}:`, error.message, '\n')
    }
  }
  
  console.log('Done! Header images saved to:', imagesDir)
}

downloadAllHeaderImages().catch(console.error)

