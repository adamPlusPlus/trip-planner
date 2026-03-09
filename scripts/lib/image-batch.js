// Generic image batch: given entries [{ id, searchQuery }], outputDir, and getUrlForQuery,
// download each image to outputDir/{id}.jpg. No hardcoded ids.

import path from 'path'
import { ensureDir } from './fs.js'
import { downloadImage } from './download.js'

/**
 * @param {Array<{ id: string, searchQuery: string }>} entries
 * @param {string} outputDir
 * @param {(query: string) => Promise<string | null>} getUrlForQuery
 * @param {object} [opts] - { rateLimitMs: number }
 */
export async function runImageBatch(entries, outputDir, getUrlForQuery, opts = {}) {
  const { rateLimitMs = 500 } = opts
  ensureDir(outputDir)

  for (const { id, searchQuery } of entries) {
    try {
      const imageUrl = await getUrlForQuery(searchQuery)
      if (!imageUrl) {
        console.log(`  ✗ No image found for: ${searchQuery}\n`)
        continue
      }
      const filepath = path.join(outputDir, `${id}.jpg`)
      await downloadImage(imageUrl, filepath)
      console.log(`  ✓ Saved: ${id}.jpg\n`)
    } catch (error) {
      console.error(`  ✗ Error downloading ${id}:`, error.message, '\n')
    }
    await new Promise((r) => setTimeout(r, rateLimitMs))
  }
}
