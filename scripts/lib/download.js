// Single implementation: download image from URL to filepath

import fs from 'fs'
import https from 'https'

export function downloadImage(url, filepath) {
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
