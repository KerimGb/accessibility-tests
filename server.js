#!/usr/bin/env node
/**
 * Standalone API server: Express API + report routes only (no static UI).
 * Production uses the Astro shell at web/ which proxies /api and /report here.
 * For the full app run: cd web && npm run build && npm start
 */
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { initDb, dbPool } from './server/db.js';
import { createAccessibilityApp } from './server/create-app.mjs';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3456;

const app = createAccessibilityApp(repoRoot);

initDb()
  .then(() => {
    if (dbPool) {
      console.log('Postgres persistence enabled (runs table ready).');
    } else {
      console.log('Postgres persistence disabled (DATABASE_URL not set).');
    }
    app.listen(PORT, () => {
      console.log(`Accessibility test server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err.message);
    process.exit(1);
  });
