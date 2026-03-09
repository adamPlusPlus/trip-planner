// Shared filesystem helpers: ensureDir, copyMarkdownFiles (generic src -> dest)

import fs from 'fs'
import path from 'path'

export function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

/**
 * Recursively copy all .md files from srcDir to destDir, preserving directory structure.
 * @param {string} srcDir - Source directory
 * @param {string} destDir - Destination directory
 */
export function copyMarkdownFiles(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) {
    console.warn(`Source directory does not exist: ${srcDir}`)
    return
  }

  const entries = fs.readdirSync(srcDir, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name)
    const destPath = path.join(destDir, entry.name)

    if (entry.isDirectory()) {
      ensureDir(destPath)
      copyMarkdownFiles(srcPath, destPath)
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      fs.copyFileSync(srcPath, destPath)
      console.log(`Copied: ${entry.name}`)
    }
  }
}
