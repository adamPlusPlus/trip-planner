# scripts/

**Purpose:** Build-time and one-off CLI scripts: copy plan markdown, download header/location images.  
**Usage:** Run via npm scripts (`npm run copy-files`, etc.). Config in `config.js`; shared I/O in `lib/`.  
**Ownership:** Project infra; keep entrypoints thin and logic in lib/config.
