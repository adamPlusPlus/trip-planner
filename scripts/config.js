// Single source for script config: paths and image query maps.
// API keys from env: PEXELS_API_KEY

import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

export const paths = {
  projectRoot,
  // Plan copy: source dirs (relative to project root) -> copied into public/plans
  planSources: [
    path.join(projectRoot, 'backup', 'Road Trip - Houston to Durango'),
    path.join(projectRoot, 'backup', 'Road Trip Alternatives'),
  ],
  publicPlans: path.join(projectRoot, 'public', 'plans'),
  publicImagesHeaders: path.join(projectRoot, 'public', 'images', 'headers'),
  publicImagesLocations: path.join(projectRoot, 'public', 'images', 'locations'),
}

export const headerImageQueries = {
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

export const locationImageQueries = {
  'mesa-verde-national-park': 'Mesa Verde National Park Colorado cliff dwellings',
  'san-juan-national-forest': 'San Juan National Forest Colorado mountains',
  'bastrop-state-park': 'Bastrop State Park Texas Lost Pines',
  'mckinney-roughs-nature-park': 'McKinney Roughs Nature Park Texas',
  'palo-duro-canyon-state-park': 'Palo Duro Canyon State Park Texas red rock',
  'caprock-canyons-state-park': 'Caprock Canyons State Park Texas',
  'big-bend-ranch-state-park': 'Big Bend Ranch State Park Texas desert',
  'guadalupe-mountains-national-park': 'Guadalupe Mountains National Park Texas',
  'bandelier-national-monument': 'Bandelier National Monument New Mexico cliff dwellings',
  'valles-caldera-national-preserve': 'Valles Caldera National Preserve New Mexico',
  'tent-rocks-national-monument': 'Kasha-Katuwe Tent Rocks National Monument New Mexico',
  'beavers-bend-state-park': 'Beavers Bend State Park Oklahoma pine forest',
  'ouachita-national-forest': 'Ouachita National Forest Arkansas Oklahoma',
  'mountain-fork-river': 'Mountain Fork River Oklahoma Broken Bow',
  'broken-bow-lake': 'Broken Bow Lake Oklahoma',
  'hochatown-state-park': 'Hochatown State Park Oklahoma',
  'hot-springs-national-park': 'Hot Springs National Park Arkansas bathhouse row',
  'lake-ouachita': 'Lake Ouachita Arkansas',
  'lake-ouachita-state-park': 'Lake Ouachita State Park Arkansas',
  'garvan-woodland-gardens': 'Garvan Woodland Gardens Arkansas botanical',
  'mark-twain-national-forest': 'Mark Twain National Forest Missouri Ozarks',
  'table-rock-lake': 'Table Rock Lake Missouri Branson',
  'table-rock-state-park': 'Table Rock State Park Missouri',
  'dogwood-canyon-nature-park': 'Dogwood Canyon Nature Park Missouri',
  'hercules-glades-wilderness': 'Hercules Glades Wilderness Missouri',
  'roaring-river-state-park': 'Roaring River State Park Missouri',
  'bull-shoals-lake': 'Bull Shoals Lake Missouri Arkansas',
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
  'amarillo': 'Amarillo Texas Cadillac Ranch Route 66',
  'santa-fe': 'Santa Fe New Mexico adobe architecture plaza',
  'albuquerque': 'Albuquerque New Mexico Sandia Mountains balloon fiesta',
  'taos-ski-valley': 'Taos Ski Valley New Mexico mountains snow',
  'carson-national-forest': 'Carson National Forest New Mexico mountains',
  'taos-pueblo': 'Taos Pueblo New Mexico adobe UNESCO',
  'rio-grande-gorge': 'Rio Grande Gorge New Mexico canyon',
  'wheeler-peak': 'Wheeler Peak New Mexico highest point',
  'ski-apache': 'Ski Apache New Mexico mountains snow',
  'lincoln-national-forest': 'Lincoln National Forest New Mexico mountains',
  'white-mountain-wilderness': 'White Mountain Wilderness New Mexico',
  'monjeau-lookout': 'Monjeau Lookout New Mexico mountain',
  'cloudcroft-ski-area': 'Cloudcroft Ski Area New Mexico mountains snow',
  'sacramento-mountains': 'Sacramento Mountains New Mexico',
  'osha-trail': 'Osha Trail New Mexico forest',
  'trestle-recreation-area': 'Trestle Recreation Area New Mexico',
  'winter-park-resort': 'Winter Park Resort Colorado mountains snow ski',
  'arapaho-national-forest': 'Arapaho National Forest Colorado mountains',
  'rocky-mountain-national-park': 'Rocky Mountain National Park Colorado mountains',
  'fraser-valley': 'Fraser Valley Colorado mountains',
  'berthoud-pass': 'Berthoud Pass Colorado mountain',
  'steamboat-ski-resort': 'Steamboat Ski Resort Colorado mountains snow ski',
  'routt-national-forest': 'Routt National Forest Colorado mountains',
  'yampa-river': 'Yampa River Colorado Steamboat Springs',
  'strawberry-park-hot-springs': 'Strawberry Park Hot Springs Colorado natural',
  'fish-creek-falls': 'Fish Creek Falls Colorado waterfall',
  'crested-butte-ski-resort': 'Crested Butte Ski Resort Colorado mountains snow ski',
  'gunnison-national-forest': 'Gunnison National Forest Colorado mountains',
  'crested-butte-mountain': 'Crested Butte Mountain Colorado',
  'gunnison-river': 'Gunnison River Colorado',
  'wolf-creek-ski-area': 'Wolf Creek Ski Area Colorado mountains snow',
  'pagosa-hot-springs': 'Pagosa Hot Springs Colorado natural deepest',
  'san-juan-river': 'San Juan River Colorado Pagosa Springs',
  'chimney-rock-national-monument': 'Chimney Rock National Monument Colorado',
  'angel-fire-resort': 'Angel Fire Resort New Mexico mountains snow ski',
  'vietnam-veterans-memorial': 'Vietnam Veterans Memorial Angel Fire',
  'sangre-de-cristo-mountains': 'Sangre de Cristo Mountains New Mexico',
  'eagle-nest-lake': 'Eagle Nest Lake New Mexico',
  'red-river-ski-area': 'Red River Ski Area New Mexico mountains snow',
  'goose-lake': 'Goose Lake New Mexico Red River',
}

export function getPexelsApiKey() {
  return process.env.PEXELS_API_KEY || ''
}
