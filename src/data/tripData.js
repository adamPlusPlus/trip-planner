// Data access: load destinations (Phase 1 static) and plan content by path.
// No static trip data in this file; that lives in staticDestinations.js.

import { staticDestinations } from './staticDestinations.js'

export const getDestinations = async () => {
  return staticDestinations
}

export const getPlanContent = async (filePath) => {
  try {
    const pathAttempts = [
      filePath,
      `http://localhost:8000${filePath}`,
      `http://127.0.0.1:8000${filePath}`,
    ]

    for (const p of pathAttempts) {
      try {
        const response = await fetch(p, {
          method: 'GET',
          headers: { Accept: 'text/markdown, text/plain, */*' },
        })
        if (response.ok) {
          const text = await response.text()
          if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
            continue
          }
          return text
        }
      } catch (e) {
        continue
      }
    }

    throw new Error('All path attempts failed')
  } catch (error) {
    console.error('Error loading plan content:', error)
    return `# Error Loading Plan

Unable to load the plan content from: ${filePath}

## Setup Required

To view plan content, serve the markdown files (e.g. run \`npm run copy-files\` and use the dev server).

**File Path**: ${filePath}

See SETUP.md for detailed instructions.`
  }
}
