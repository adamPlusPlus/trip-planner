# Trip Planner

A modern web application for viewing and comparing trip plans with real-time weather and location images. Routing uses OSRM and Leaflet with Open-Meteo geocoding—no API keys required for the map or directions.

## Features

- 📍 **Paginated Destination Categories** - Browse through multiple road trip destinations
- 🖼️ **Recent Location Images** - View recent images (within 1 week) of all mentioned locations
- 🌤️ **7-Day Weather Forecasts** - See weather for each destination during your travel dates
- 📄 **Markdown Plan Viewer** - View detailed planning documents with markdown support
- 🎨 **Modern UI** - Beautiful, responsive design with Tailwind CSS

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy markdown files to public folder:
```bash
npm run copy-files
```

Or use the setup script that does both:
```bash
npm run setup
```

3. Configure API keys (optional, for enhanced features):
   - **Weather API**: Sign up for a free API key at [OpenWeatherMap](https://openweathermap.org/api) or use the free Open-Meteo API (no key required)
   - **Image API**: Sign up for a free API key at [Unsplash](https://unsplash.com/developers) for better image quality

3. Update API keys in `src/utils/api.js`:
   - Replace `YOUR_OPENWEATHER_API_KEY` with your OpenWeatherMap key (optional)
   - Replace `YOUR_UNSPLASH_ACCESS_KEY` with your Unsplash key (optional)
   - The app will work with free alternatives if keys are not provided

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
road-trip-planner/
├── src/
│   ├── components/
│   │   ├── CategoryView.jsx      # Paginated destination cards
│   │   └── PlanViewer.jsx        # Plan content viewer with weather/images
│   ├── utils/
│   │   ├── api.js                # Weather and image API utilities
│   │   └── dataLoader.js         # Destination data and plan loading
│   ├── App.jsx                   # Main application component
│   ├── main.jsx                  # Application entry point
│   └── index.css                 # Global styles
├── index.html
└── package.json
```

## API Configuration

### Weather API Options

1. **Open-Meteo** (Recommended - Free, no API key):
   - Already configured in `api.js`
   - No signup required
   - 7-day forecasts

2. **OpenWeatherMap** (Optional):
   - Requires free API key
   - More detailed forecasts
   - Update `OPENWEATHER_API_KEY` in `src/utils/api.js`

### Image API Options

1. **Unsplash Source** (Current - No API key):
   - Basic image fetching
   - Limited customization

2. **Unsplash API** (Optional):
   - Better image quality
   - More control over image selection
   - Sign up at [Unsplash Developers](https://unsplash.com/developers)
   - Update `UNSPLASH_ACCESS_KEY` in `src/utils/api.js`

## Usage

1. **Browse Destinations**: Click on any destination card to view its plans
2. **View Plans**: Select a specific plan document to read detailed information
3. **Check Weather**: Weather forecasts are automatically displayed for each destination
4. **View Images**: Location images are fetched and displayed when available

## Notes

- Markdown files are loaded from the `Road Trip - Houston to Durango` and `Road Trip Alternatives` directories
- Ensure the markdown files are accessible (may require a local server or API endpoint)
- Images are fetched dynamically based on location names mentioned in the content
- Weather data uses free APIs that don't require authentication

## Development

The app uses:
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Markdown** - Markdown rendering
- **Remark GFM** - GitHub Flavored Markdown support

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

