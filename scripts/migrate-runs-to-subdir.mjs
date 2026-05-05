#!/usr/bin/env node
/**
 * Migrate legacy reports/<domain>/{...files} -> reports/<domain>/<runId>/{...files}
 *
 * runId is derived from the run's `accessibility-results.json` `generatedAt` (or file mtime),
 * formatted "YYYY-MM-DDTHH-MM-SSZ-<4hex>" so it is filesystem-safe.
 *
 * The script is idempotent: if a domain already has runId subfolders it skips it.
 *
 * Usage:
 *   node scripts/migrate-runs-to-subdir.mjs            # dry run
 *   node scripts/migrate-runs-to-subdir.mjs --apply    # actually move
 */
import { existsSync, readdirSync, statSync, mkdirSync, renameSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readJsonIfExists, isValidReportId } from '../server/fs-utils.js';
import { isValidRunId } from '../server/run-ids.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_BASE = process.env.REPORTS_BASE?.trim()
  ? process.env.REPORTS_BASE.trim()
  : join(__dirname, '..', 'reports');

const APPLY = process.argv.includes('--apply');

const FILES_TO_MOVE = new Set([
  'accessibility-report.html',
  'accessibility-results.json',
  'accessibility-results-previous.json',
  'accessibility-developers.html',
  'accessibility-client.html',
  'accessibility-statement.html',
  'statement-meta.json',
  'manual-progress.json',
]);

function tsForRunId(date) {
  return date.toISOString().replace(/\.\d+Z$/, 'Z').replace(/:/g, '-');
}

function deriveRunId(domainDir, results) {
  const generatedAt = results?.generatedAt ? new Date(results.generatedAt) : null;
  let mtimeFallback = null;
  try {
    mtimeFallback = statSync(join(domainDir, 'accessibility-results.json')).mtime;
  } catch {}
  const date = generatedAt && !Number.isNaN(generatedAt.getTime()) ? generatedAt : (mtimeFallback || new Date());
  const ts = tsForRunId(date);
  const seed = `${ts}-${results?.urls?.[0] || ''}`;
  let hex = 0;
  for (let i = 0; i < seed.length; i += 1) hex = (hex * 31 + seed.charCodeAt(i)) >>> 0;
  return `${ts}-${(hex & 0xffff).toString(16).padStart(4, '0')}`;
}

function moveFile(src, dest) {
  if (!APPLY) return;
  const dir = dirname(dest);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  renameSync(src, dest);
}

function moveDirectory(src, dest) {
  if (!APPLY) return;
  const parent = dirname(dest);
  if (!existsSync(parent)) mkdirSync(parent, { recursive: true });
  renameSync(src, dest);
}

function migrateDomain(domain) {
  const domainDir = join(REPORTS_BASE, domain);
  let entries = [];
  try { entries = readdirSync(domainDir); } catch { return { skipped: true, reason: 'unreadable' }; }

  // If the domain folder already contains runId-style subfolders, skip.
  const subDirs = entries.filter((e) => {
    try { return statSync(join(domainDir, e)).isDirectory() && isValidRunId(e); } catch { return false; }
  });
  if (subDirs.length > 0 && !entries.includes('accessibility-results.json')) {
    return { skipped: true, reason: 'already migrated' };
  }

  const resultsPath = join(domainDir, 'accessibility-results.json');
  if (!existsSync(resultsPath)) return { skipped: true, reason: 'no results file' };

  const results = readJsonIfExists(resultsPath);
  const runId = deriveRunId(domainDir, results);
  const targetDir = join(domainDir, runId);

  const moved = [];
  entries.forEach((name) => {
    const src = join(domainDir, name);
    let stat;
    try { stat = statSync(src); } catch { return; }

    if (stat.isFile() && FILES_TO_MOVE.has(name)) {
      const dest = join(targetDir, name);
      moveFile(src, dest);
      moved.push(name);
    } else if (stat.isDirectory() && name === 'screenshots') {
      const dest = join(targetDir, 'screenshots');
      moveDirectory(src, dest);
      moved.push('screenshots/');
    }
  });

  return { runId, moved };
}

function main() {
  if (!existsSync(REPORTS_BASE)) {
    console.log(`No reports directory at ${REPORTS_BASE}`);
    return;
  }
  console.log(`${APPLY ? 'APPLY' : 'DRY-RUN'} migration in ${REPORTS_BASE}`);
  const domains = readdirSync(REPORTS_BASE).filter((name) => {
    if (!isValidReportId(name)) return false;
    try { return statSync(join(REPORTS_BASE, name)).isDirectory(); } catch { return false; }
  });

  const summary = [];
  for (const domain of domains) {
    const result = migrateDomain(domain);
    summary.push({ domain, ...result });
    if (result.skipped) {
      console.log(`  skip  ${domain}  (${result.reason})`);
    } else {
      console.log(`  move  ${domain}  -> ${result.runId}  (${result.moved.length} entries)`);
    }
  }
  console.log(`Done. Domains processed: ${domains.length}`);
  if (!APPLY) console.log('Re-run with --apply to perform the move.');
}

main();
