// Copy markdown files from config plan sources to public/plans. Thin entrypoint.

import path from 'path'
import { paths } from './config.js'
import { ensureDir, copyMarkdownFiles } from './lib/fs.js'

console.log('Copying markdown files to public/plans...')
ensureDir(paths.publicPlans)

paths.planSources.forEach((srcDir) => {
  const dirName = path.basename(srcDir)
  const destSubDir = path.join(paths.publicPlans, dirName)
  ensureDir(destSubDir)
  copyMarkdownFiles(srcDir, destSubDir)
})

console.log('Done! Markdown files are now in public/plans/')
