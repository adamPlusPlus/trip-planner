// Generate plan section content for user-created destinations. Uses trip data and APIs.

import { fetchWeather } from '../services/weatherService'
import { getImageForLocation } from '../services/imageService'

function originLabel(trip) {
  const o = trip?.origin
  if (!o) return 'your origin'
  return o.name || o.location || 'your origin'
}

/**
 * Generate markdown content for a plan section. Returns { content, imageUrl? }.
 * @param {string} sectionType
 * @param {object} destination - { id, name, location, coords }
 * @param {object} trip - { origin, settings: { dateRange } }
 */
export async function generateSectionContent(sectionType, destination, trip) {
  const name = destination.name || destination.location || 'Destination'
  const location = destination.location || destination.name || ''
  const dateRange = trip?.settings?.dateRange
  const dateLabel = dateRange?.start && dateRange?.end
    ? `${dateRange.start} to ${dateRange.end}`
    : 'your travel dates'
  const origin = originLabel(trip)
  const mapsSearch = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
  const mapsDir = trip?.origin?.name || trip?.origin?.location
    ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(location)}`
    : mapsSearch

  switch (sectionType) {
    case 'overview': {
      const imageResult = await getImageForLocation(location, { destinationId: destination.id })
      const imageUrl = imageResult?.url
      const imgMarkdown = imageUrl ? `\n![${name}](${imageUrl})\n` : ''
      const content = `# ${name} - Trip Overview
${imgMarkdown}
## Destination Summary
- **Location**: ${location}
- **Trip origin**: ${origin}
- **Travel dates**: ${dateLabel}

## Maps & Links
- [View ${name} on Google Maps](${mapsSearch})
- [Directions from ${origin}](${mapsDir})

## Why This Destination?
- Add your own notes and research here.
- Use the links above to explore attractions, lodging, and routes.

## Key Considerations
- Check local conditions and seasonal factors.
- Plan stops and accommodations along your route.
`
      return { content, imageUrl: imageUrl || undefined }
    }

    case 'things-to-see': {
      return {
        content: `# Things to See - ${name}

## Attractions & Points of Interest
- Use [Google Maps](${mapsSearch}) to discover attractions, parks, and activities.
- Search for "${location} things to do" for ideas.

## Suggested Research
- Local tourism sites and event calendars
- Seasonal events during ${dateLabel}
`,
      }
    }

    case 'potential-routes': {
      return {
        content: `# Potential Routes - ${name}

## Driving Directions
- **From**: ${origin}
- **To**: ${location}
- **Dates**: ${dateLabel}

## Get Directions
- [Open in Google Maps - Directions](${mapsDir})

## Route Tips
- Check traffic and road conditions before you go.
- Consider rest stops and fuel along the way.
`,
      }
    }

    case 'budget': {
      const costTarget = trip?.settings?.costTarget
      const budgetLine = typeof costTarget === 'number' && costTarget >= 0
        ? `- **Trip budget target**: $${costTarget}`
        : '- **Trip budget**: Set in Trip Data if desired.'
      return {
        content: `# Budget - ${name}

## Budget Overview
${budgetLine}

## Planning
- Add accommodation, fuel, and activity estimates here.
- Use the Trip Data card to set an overall cost target.
`,
      }
    }

    case 'accommodations': {
      return {
        content: `# Accommodations - ${name}

## Where to Stay
- Search [Google Maps](${mapsSearch}) for hotels and rentals near ${location}.
- Consider availability and rates for ${dateLabel}.

## Notes
- Add your shortlist and booking details here.
`,
      }
    }

    case 'pre-shopping-packing': {
      return { content: '' }
    }

    case 'weather': {
      try {
        const weather = await fetchWeather(location, destination.coords, dateRange)
        const daily = weather.daily || []
        const lines = daily.map((day) => {
          const low = day.temp?.min != null ? Math.round(day.temp.min) : '—'
          const high = day.temp?.max != null ? Math.round(day.temp.max) : '—'
          const cond = day.weather?.[0]?.description || '—'
          const snow = day.snow != null && day.snow > 0 ? `, ${day.snow}mm snow` : ''
          return `- **${day.date}**: Low ${low}°F, High ${high}°F - ${cond}${snow}`
        })
        const content = `# Weather Conditions - ${name} (${dateLabel})

## ${location} Weather

### Daily Forecast
${lines.join('\n')}

### Notes
- Check the app for real-time updates as your dates approach.
`
        return { content }
      } catch (e) {
        console.warn('Weather fetch failed:', e)
        return {
          content: `# Weather Conditions - ${name}

## ${dateLabel}
- Weather for ${location} could not be loaded automatically.
- Check a weather service for ${dateLabel} before your trip.
`,
        }
      }
    }

    default:
      return { content: `# ${name}\n\nContent for this section.` }
  }
}
