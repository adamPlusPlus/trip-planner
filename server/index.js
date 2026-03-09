// Express backend: trips CRUD, image, search. Run with: node server/index.js

import express from 'express'
import { register as registerTrips } from './routes/trips.js'
import { register as registerImage } from './routes/image.js'
import { register as registerSearch } from './routes/search.js'
import { register as registerPlaces } from './routes/places.js'
import { register as registerDirections } from './routes/directions.js'

const app = express()
const PORT = process.env.SERVER_PORT || 5112

app.use(express.json())

registerTrips(app)
registerImage(app)
registerSearch(app)
registerPlaces(app)
registerDirections(app)

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
