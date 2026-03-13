/**
 * app.js — CJS entry point for Phusion Passenger (Plesk)
 *
 * Passenger can't load ESM modules directly, so this CommonJS wrapper
 * uses dynamic import() to bootstrap the actual ESM application.
 * It also ensures the SQLite data directory exists.
 */

const fs = require('fs');
const path = require('path');

// ── 1. Load environment variables ────────────────────────────
require('dotenv').config({ path: path.join(__dirname, '.env') });

// ── 2. Ensure data directory exists for SQLite ───────────────
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('[KORE] Created data directory:', dataDir);
}

// ── 3. Ensure uploads directory exists ───────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('[KORE] Created uploads directory:', uploadsDir);
}

// ── 4. Bootstrap ESM application ─────────────────────────────
(async () => {
  try {
    await import('./server/dist/index.js');
  } catch (err) {
    console.error('[KORE] Failed to start server:', err);
    process.exit(1);
  }
})();
