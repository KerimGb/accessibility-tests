/**
 * Production: Express (API + reports from server/create-app.mjs) + Astro SSR + static client.
 * Run from repo: cd web && npm run build && npm start
 */
import './set-reports-env.mjs';
import express from 'express';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { loadLocalEnv } from '../server/load-env.mjs';
import { initDb, dbPool } from '../server/db.js';
import { createAccessibilityApp } from '../server/create-app.mjs';

const webRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(webRoot, '..');
loadLocalEnv(repoRoot);
const PORT = Number(process.env.PORT) || 3456;

const { handler } = await import('./dist/server/entry.mjs');

const apiApp = createAccessibilityApp(repoRoot);
const app = express();
app.use(apiApp);
app.use(express.static(join(webRoot, 'dist/client')));
app.use((req, res) => handler(req, res));

await initDb();
if (dbPool) {
  console.log('Postgres persistence enabled (runs table ready).');
} else {
  console.log('Postgres persistence disabled (DATABASE_URL not set).');
}
app.listen(PORT, () => {
  console.log(`Accessibility app (Astro + API) at http://localhost:${PORT}`);
});
