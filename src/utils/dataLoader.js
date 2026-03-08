// Data structure for destinations
const destinationsData = [
  {
    id: 'pagosa-springs',
    name: 'Pagosa Springs, Colorado',
    location: 'Pagosa Springs, Colorado',
    coords: { lat: 37.2694, lon: -107.0098 },
    distance: '900 miles',
    description: 'Natural hot springs, Wolf Creek Ski Area, San Juan National Forest. Closer than Durango with unique hot springs.',
    category: 'Alternatives',
    plans: [
      { id: 'pagosa-overview', name: 'Overview', path: '/plans/Road Trip Alternatives/Pagosa Springs Colorado/overview.md' },
      { id: 'pagosa-things', name: 'Things to See', path: '/plans/Road Trip Alternatives/Pagosa Springs Colorado/things-to-see.md' },
      { id: 'pagosa-routes', name: 'Potential Routes', path: '/plans/Road Trip Alternatives/Pagosa Springs Colorado/potential-routes.md' },
      { id: 'pagosa-budget', name: 'Budget', path: '/plans/Road Trip Alternatives/Pagosa Springs Colorado/budget.md' },
      { id: 'pagosa-accommodations', name: 'Accommodations', path: '/plans/Road Trip Alternatives/Pagosa Springs Colorado/accommodations-comparison.md' },
      { id: 'pagosa-stopovers', name: 'Stopover Locations', path: '/plans/Road Trip Alternatives/Pagosa Springs Colorado/in-between-locations.md' },
      { id: 'pagosa-packing', name: 'Pre-Shopping & Packing', path: '/plans/Road Trip Alternatives/Pagosa Springs Colorado/pre-shopping-packing.md' },
      { id: 'pagosa-weather', name: 'Weather Conditions', path: '/plans/Road Trip Alternatives/Pagosa Springs Colorado/weather-conditions.md' },
    ]
  },
]

export const getDestinations = async () => {
  // In a real app, this would fetch from an API
  // For now, return the static data
  return destinationsData
}

export const getPlanContent = async (filePath) => {
  try {
    // Paths are now relative to public folder (e.g., /plans/...)
    // Try multiple path strategies
    const paths = [
      filePath, // Direct path (should work if files are in public/)
      `http://localhost:8000${filePath}`, // If served on port 8000
      `http://127.0.0.1:8000${filePath}`, // Alternative localhost
    ]

    for (const path of paths) {
      try {
        const response = await fetch(path, {
          method: 'GET',
          headers: {
            'Accept': 'text/markdown, text/plain, */*',
          },
        })
        if (response.ok) {
          const text = await response.text()
          // Check if we got HTML instead of markdown
          if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
            console.warn('Received HTML instead of markdown, trying next path')
            continue
          }
          return text
        }
      } catch (e) {
        // Try next path
        console.log(`Failed to load from ${path}:`, e.message)
        continue
      }
    }

    throw new Error('All path attempts failed')
  } catch (error) {
    console.error('Error loading plan content:', error)
    // Return a helpful fallback message
    return `# Error Loading Plan

Unable to load the plan content from: ${filePath}

## Setup Required

To view plan content, you need to serve the markdown files. 

**Quick Fix**: Run this command in the project root (Poeisis directory):

\`\`\`bash
python -m http.server 8000
\`\`\`

Or on Windows PowerShell:
\`\`\`powershell
python -m http.server 8000
\`\`\`

Then refresh this page.

## Plan Information

**File Path**: ${filePath}

**Note**: The markdown files are located in:
- \`Road Trip - Houston to Durango/\`
- \`Road Trip Alternatives/\`

See SETUP.md for detailed instructions.`
  }
}

