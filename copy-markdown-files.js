// Script to copy markdown files to public folder for easier access
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sourceDirs = [
  path.join(__dirname, '..', 'Road Trip - Houston to Durango'),
  path.join(__dirname, '..', 'Road Trip Alternatives'),
]

const destDir = path.join(__dirname, 'public', 'plans')

// Create destination directory
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true })
}

function copyMarkdownFiles(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`Source directory does not exist: ${src}`)
    return
  }

  const entries = fs.readdirSync(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true })
      }
      copyMarkdownFiles(srcPath, destPath)
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      fs.copyFileSync(srcPath, destPath)
      console.log(`Copied: ${entry.name}`)
    }
  }
}

console.log('Copying markdown files to public/plans...')
sourceDirs.forEach(dir => {
  const dirName = path.basename(dir)
  const destSubDir = path.join(destDir, dirName)
  if (!fs.existsSync(destSubDir)) {
    fs.mkdirSync(destSubDir, { recursive: true })
  }
  copyMarkdownFiles(dir, destSubDir)
})

console.log('Done! Markdown files are now in public/plans/')

