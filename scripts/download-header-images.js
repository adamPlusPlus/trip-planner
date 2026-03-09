// Download destination header images. Uses config + lib/image-batch; Pexels for URL lookup.

import { createClient } from 'pexels'
import { paths, headerImageQueries, getPexelsApiKey } from './config.js'
import { runImageBatch } from './lib/image-batch.js'

const apiKey = getPexelsApiKey()
if (!apiKey) {
  console.error('Set PEXELS_API_KEY environment variable to run this script.')
  process.exit(1)
}

const pexelsClient = createClient(apiKey)

async function getUrlForQuery(searchQuery) {
  const response = await pexelsClient.photos.search({
    query: searchQuery,
    per_page: 1,
    orientation: 'landscape',
  })
  if (response.photos && response.photos.length > 0) {
    const photo = response.photos[0]
    return photo.src.large || photo.src.medium
  }
  return null
}

const entries = Object.entries(headerImageQueries).map(([id, searchQuery]) => ({ id, searchQuery }))

console.log('Downloading destination header images from Pexels...\n')
await runImageBatch(entries, paths.publicImagesHeaders, getUrlForQuery)
console.log('Done! Header images saved to:', paths.publicImagesHeaders)
