import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Project `reports/` directory (sibling of this file's folder). */
export const REPORTS_BASE = process.env.REPORTS_BASE?.trim()
  ? process.env.REPORTS_BASE.trim()
  : join(__dirname, '..', 'reports');
