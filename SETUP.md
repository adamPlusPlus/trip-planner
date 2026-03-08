# Setup Instructions

## Quick Start

1. **Install dependencies:**
```bash
cd road-trip-planner
npm install
```

2. **Start the development server:**
```bash
npm run dev
```

3. **Open your browser:**
The app will open at http://localhost:3000

## Markdown File Access

The app needs to access markdown files from the parent directories. There are a few options:

### Option 1: Use a Local Server (Recommended for Development)

Since the markdown files are in parent directories, you may need to serve them. You can:

1. **Use a simple HTTP server** in the parent directory:
```bash
# From the project root (Poeisis directory)
python -m http.server 8000
# or
npx serve .
```

2. **Update file paths** in `src/utils/dataLoader.js` to point to `http://localhost:8000/...`

### Option 2: Copy Markdown Files

Copy the markdown files into the `public` folder:
```bash
# Create public directory
mkdir -p road-trip-planner/public/plans

# Copy files (adjust paths as needed)
cp "Road Trip - Houston to Durango"/*.md road-trip-planner/public/plans/durango/
cp "Road Trip Alternatives"/*/*.md road-trip-planner/public/plans/
```

Then update paths in `dataLoader.js` to `/plans/...`

### Option 3: Use a Backend API

Create a simple Express server to serve the markdown files:

```javascript
// server.js
const express = require('express')
const fs = require('fs')
const path = require('path')
const app = express()

app.get('/api/plan/:filepath(*)', (req, res) => {
  const filePath = path.join(__dirname, '..', req.params.filepath)
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath)
  } else {
    res.status(404).send('File not found')
  }
})

app.listen(3001, () => console.log('API server on port 3001'))
```

## API Keys (Optional)

### Weather API
- **Default**: Uses Open-Meteo (free, no key required) ✅
- **Optional**: OpenWeatherMap (requires free API key)
  - Sign up at https://openweathermap.org/api
  - Update `OPENWEATHER_API_KEY` in `src/utils/api.js`

### Image API
- **Default**: Uses Unsplash Source (basic, no key required) ✅
- **Optional**: Unsplash API (better quality, requires free key)
  - Sign up at https://unsplash.com/developers
  - Update `UNSPLASH_ACCESS_KEY` in `src/utils/api.js`

## Troubleshooting

### Markdown files not loading
- Check browser console for CORS errors
- Ensure files are accessible via HTTP (not file://)
- Update file paths in `dataLoader.js` to match your setup

### Weather not showing
- Check browser console for API errors
- Open-Meteo should work without a key
- If issues persist, the app will show mock weather data

### Images not loading
- Unsplash Source may have rate limits
- Consider getting a free Unsplash API key
- Images will show placeholders if unavailable

## Production Build

```bash
npm run build
```

Files will be in the `dist` directory. Deploy to any static hosting service (Vercel, Netlify, etc.).

