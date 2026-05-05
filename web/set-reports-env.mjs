/**
 * Set REPORTS_BASE before any module imports repo `server/paths.js` from the Astro SSR bundle.
 * Bundled code resolves import.meta.url under web/dist/server/, so paths.js would otherwise
 * point at web/reports instead of <repo>/reports.
 */
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const webRoot = dirname(fileURLToPath(import.meta.url));
if (!process.env.REPORTS_BASE?.trim()) {
  process.env.REPORTS_BASE = join(webRoot, '..', 'reports');
}
