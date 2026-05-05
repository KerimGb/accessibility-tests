/**
 * Express app factory: API routes, auth, report file serving.
 * Designed for the Astro shell (web/) — Astro serves the UI, this app serves /api/* and /report/* artifacts.
 * @param {string} repoRoot - Repository root (directory containing run-tests.js, generate-report.js, reports/).
 */
import express from 'express';
import multer from 'multer';
import { spawn } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { sendRunNotificationEmail, createSmtpTransport } from '../server-email.js';
import { REPORTS_BASE } from './paths.js';
import { dbPool, dbUpsertRun, dbGetRun, dbGetLatestRun } from './db.js';
import { mergeReportData } from './report-data.js';
import { readJsonIfExists, isValidReportId } from './fs-utils.js';
import { listAuditEntries, listRunsForDomain } from './audit-list.js';
import { getFtpConfig, ftpDownload, ftpUpload, persistReportArtifactsToFtp } from './ftp.js';
import { normalizeManualProgress } from '../manual-checklist.js';
import {
  newRunId,
  isValidRunId,
  isValidDomain,
  runDir as runDirOf,
  latestRunIdOnDisk,
} from './run-ids.js';

const DELIVERABLE_FILES = [
  'accessibility-developers.html',
  'accessibility-client.html',
  'accessibility-statement.html',
];

function runKey(domain, runId) {
  return `${domain}:${runId}`;
}

/** Find any in-memory `running` run for a domain (used by /report/:domain/ redirects). */
function findRunningRun(runStatusMap, domain) {
  for (const [key, value] of runStatusMap.entries()) {
    if (!key.startsWith(`${domain}:`)) continue;
    if (value?.status === 'running') {
      const runId = key.slice(domain.length + 1);
      return { runId, state: value };
    }
  }
  return null;
}

const GENERATE_REPORT_URL = new URL('../generate-report.js', import.meta.url).href;

const FTP_CONFIG = getFtpConfig();

function parseBooleanEnv(name, defaultValue = false) {
  const raw = process.env[name];
  if (raw == null) return defaultValue;
  const value = String(raw).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(value)) return true;
  if (['0', 'false', 'no', 'off'].includes(value)) return false;
  return defaultValue;
}
let AUTH_ENABLED = parseBooleanEnv('AUTH_ENABLED', true);
let APP_PASSWORD = process.env.APP_PASSWORD || '';
const AUTH_COOKIE_NAME = 'wcag_access';
const AUTH_COOKIE_SECURE = parseBooleanEnv('AUTH_COOKIE_SECURE', false);

// In-memory run status (running, done, error)
const runStatus = new Map();
/** Run IDs we already attempted to notify (success or skip) */
const notificationAttempted = new Set();

function clipEmail(s, max = 200) {
  if (typeof s !== 'string') return '';
  return s.trim().slice(0, max);
}

function parseNotifyFields(body) {
  const raw = body?.notify_on_complete;
  const notifyOnComplete =
    raw === 'on' ||
    raw === '1' ||
    raw === 'true' ||
    raw === true;
  const notifyEmail = clipEmail(body?.notify_email || body?.statement_email || '');
  return { notifyOnComplete, notifyEmail };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function runStatePatch(domain, runId, patch) {
  const key = runKey(domain, runId);
  const prev = runStatus.get(key) || {};
  const next = { ...prev, ...patch, domain, runId };
  runStatus.set(key, next);
  dbUpsertRun(domain, runId, next).catch((err) => {
    console.error(`[run ${domain}/${runId}] DB state update failed:`, err.message);
  });
  void maybeSendRunEmail(domain, runId);
}

async function maybeSendRunEmail(domain, runId) {
  const key = runKey(domain, runId);
  if (notificationAttempted.has(key)) return;
  const cur = runStatus.get(key);
  if (!cur?.notifyRequested || !cur.notifyEmail) return;
  if (cur.status !== 'done' && cur.status !== 'error') return;
  notificationAttempted.add(key);
  const base = (process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3456}`).replace(
    /\/$/,
    ''
  );
  const reportUrl = `${base}/report/${domain}/${runId}/`;
  if (!createSmtpTransport()) {
    console.warn(
      `[run ${domain}/${runId}] Notification requested for ${cur.notifyEmail} but SMTP is not configured (set SMTP_HOST and related env vars).`
    );
    return;
  }
  try {
    await sendRunNotificationEmail({
      to: cur.notifyEmail,
      reportId: `${domain}/${runId}`,
      status: cur.status,
      error: cur.error || null,
      reportUrl,
    });
  } catch (err) {
    console.error(`[run ${domain}/${runId}] Notification email failed:`, err.message);
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 },
});

function extractUrlsFromText(text) {
  if (!text || typeof text !== 'string') return [];
  const urlRegex = /https?:\/\/[^\s"'<>,\|]+/g;
  const matches = text.match(urlRegex) || [];
  return [...new Set(matches.map((u) => u.replace(/[.,;:!?)]+$/, '')))];
}

function normalizeDomainFromUrl(input) {
  try {
    const u = new URL(input);
    return (u.hostname || '').toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

function getSingleDomainKey(urls) {
  const domains = [...new Set((urls || []).map((u) => normalizeDomainFromUrl(u)).filter(Boolean))];
  if (domains.length !== 1) return null;
  return domains[0];
}

function parseCsv(buffer) {
  const text = buffer.toString('utf8');
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const urls = [];
  for (const line of lines) {
    const parts = line.split(/[,\t]/).map((p) => p.trim().replace(/^["']|["']$/g, ''));
    for (const p of parts) {
      if (p.startsWith('http')) urls.push(p);
    }
  }
  return [...new Set(urls)];
}

/** Pull every &lt;loc&gt; value from a sitemap-shaped XML string. */
function extractLocs(text) {
  const out = [];
  for (const m of text.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)) {
    const v = m[1].trim();
    if (v) out.push(v);
  }
  return out;
}

/**
 * Parse a sitemap (or sitemapindex) buffer and resolve to a flat list of page URLs.
 * Follows nested &lt;sitemapindex&gt; entries by HTTP-fetching each child sitemap.
 *
 * @param {Buffer} buffer Initial sitemap XML (uploaded by the user).
 * @param {{ maxDepth?: number, maxUrls?: number }} [opts]
 * @returns {Promise<string[]>}
 */
async function parseSitemapBuffer(buffer, opts = {}) {
  const maxDepth = Number.isFinite(opts.maxDepth) ? opts.maxDepth : 3;
  const maxUrls = Number.isFinite(opts.maxUrls) && opts.maxUrls > 0 ? opts.maxUrls : 5000;

  /** @type {Set<string>} */
  const pageUrls = new Set();
  /** @type {Set<string>} */
  const seenSitemaps = new Set();

  /**
   * @param {string} text
   * @param {number} depth
   * @param {string | null} sourceUrl - URL of the sitemap we are currently parsing (null for the initial upload)
   */
  async function walk(text, depth, sourceUrl) {
    if (pageUrls.size >= maxUrls) return;
    const isIndex = /<sitemapindex[\s>]/i.test(text);
    const locs = extractLocs(text);
    if (isIndex) {
      if (depth >= maxDepth) {
        console.warn(`[sitemap] depth ${depth} exceeded at ${sourceUrl || '<upload>'}; skipping nested sitemaps`);
        return;
      }
      for (const loc of locs) {
        if (pageUrls.size >= maxUrls) break;
        if (!/^https?:\/\//i.test(loc)) continue;
        if (loc.toLowerCase().endsWith('.gz')) {
          console.warn(`[sitemap] skipping gzip child sitemap (not supported): ${loc}`);
          continue;
        }
        if (seenSitemaps.has(loc)) continue;
        seenSitemaps.add(loc);
        try {
          const res = await fetch(loc, { redirect: 'follow' });
          if (!res.ok) {
            console.warn(`[sitemap] HTTP ${res.status} for ${loc}`);
            continue;
          }
          const childText = await res.text();
          await walk(childText, depth + 1, loc);
        } catch (err) {
          console.warn(`[sitemap] failed to fetch ${loc}: ${err?.message || err}`);
        }
      }
    } else {
      for (const loc of locs) {
        if (pageUrls.size >= maxUrls) break;
        if (!/^https?:\/\//i.test(loc)) continue;
        pageUrls.add(loc);
      }
    }
  }

  await walk(buffer.toString('utf8'), 0, null);
  return [...pageUrls];
}

const STATEMENT_MAX = 2000;

function clipStatement(s, max = STATEMENT_MAX) {
  if (typeof s !== 'string') return '';
  return s.trim().slice(0, max);
}

/** Fields from the run form; used only to pre-fill accessibility-statement.html */
function parseStatementMeta(body) {
  const rd = parseInt(String(body?.statement_response_days ?? '').trim(), 10);
  return {
    orgName: clipStatement(body?.statement_org_name ?? ''),
    orgShortName: clipStatement(body?.statement_org_short ?? '', 200),
    phone: clipStatement(body?.statement_phone ?? '', 120),
    email: clipStatement(body?.statement_email ?? '', 200),
    visitorAddress: clipStatement(body?.statement_visitor_address ?? ''),
    postalAddress: clipStatement(body?.statement_postal_address ?? ''),
    responseDays: Number.isFinite(rd) && rd > 0 && rd <= 365 ? rd : null,
  };
}

export function createAccessibilityApp(repoRoot) {
  if (typeof repoRoot !== 'string' || !repoRoot) {
    throw new Error('createAccessibilityApp(repoRoot): repoRoot must be a non-empty path string');
  }
  AUTH_ENABLED = parseBooleanEnv('AUTH_ENABLED', true);
  APP_PASSWORD = process.env.APP_PASSWORD || '';
  if (AUTH_ENABLED && !String(APP_PASSWORD).trim()) {
    console.error(
      '[config] AUTH_ENABLED is true but APP_PASSWORD is not set. Set APP_PASSWORD in the environment or set AUTH_ENABLED=false for local open access.'
    );
    process.exit(1);
  }
  const loadingPath = '/loading';

  const app = express();

// CORS: allow requests from Combell or any frontend (set ALLOWED_ORIGIN to restrict)
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-App-Password');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

function parseCookies(req) {
  const raw = req.headers.cookie || '';
  const out = {};
  raw.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (!k) return;
    out[k] = decodeURIComponent(v);
  });
  return out;
}

function passwordFromRequest(req) {
  const headerPwd = req.headers['x-app-password'];
  if (typeof headerPwd === 'string' && headerPwd) return headerPwd;
  const qp = req.query?.password;
  if (typeof qp === 'string' && qp) return qp;
  return '';
}

function setAuthCookie(res) {
  const securePart = AUTH_COOKIE_SECURE ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${AUTH_COOKIE_NAME}=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200${securePart}`);
}

function loginPageHtml(nextPath = '/', errorMessage = '') {
  const safeNext = String(nextPath || '/').replace(/"/g, '&quot;');
  const safeError = errorMessage ? `<p class="login-error">${errorMessage}</p>` : '';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
  <title>Protected accessibility reports</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Public+Sans:ital,wght@0,300..900;1,400..700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/design-system.css">
  <style>
    body { min-height: 100vh; display: grid; place-items: center; padding: 20px; background: #fcfcf8; }
    .card { width: min(460px, 100%); background: #fff; border: 1px solid var(--border); border-radius: 12px; padding: 22px; box-shadow: 0 2px 16px rgba(0,0,0,.06); }
    .card h1 { font-family: "Bricolage Grotesque", ui-serif, Georgia, serif; margin: 0 0 8px; font-size: 1.2rem; color: var(--text); }
    .card p { margin: 0 0 14px; color: var(--text-muted); }
    .login-error { margin: 0 0 10px; color: var(--error); }
    label { display: block; margin: 0 0 6px; font-weight: 600; color: var(--text); }
    input { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 1rem; font-family: inherit; }
    button { margin-top: 12px; width: 100%; padding: 10px 12px; border: 0; border-radius: 8px; background: var(--accent); color: var(--color-primary-label); font-weight: 600; cursor: pointer; font-family: "Bricolage Grotesque", ui-serif, Georgia, serif; }
    button:hover { background: var(--accent-hover); }
  </style>
</head>
<body>
  <form class="card" method="post" action="/auth/login">
    <h1>Protected area</h1>
    <p>Enter the password to continue.</p>
    ${safeError}
    <input type="hidden" name="next" value="${safeNext}" />
    <label for="password">Password</label>
    <input id="password" name="password" type="password" required autofocus />
    <button type="submit">Continue</button>
  </form>
</body>
</html>`;
}

app.use((req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet, noimageindex');
  next();
});

app.get('/robots.txt', (_req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nDisallow: /');
});

app.get('/design-system.css', (_req, res) => {
  const p = join(repoRoot, 'public', 'design-system.css');
  if (existsSync(p)) res.sendFile(p);
  else res.status(404).send('/* design-system.css not found */');
});

app.get('/auth/login', (req, res) => {
  if (!AUTH_ENABLED) return res.redirect('/');
  const nextPath = typeof req.query.next === 'string' && req.query.next.startsWith('/') ? req.query.next : '/';
  return res.status(200).send(loginPageHtml(nextPath));
});

app.post('/auth/login', (req, res) => {
  if (!AUTH_ENABLED) return res.redirect('/');
  const nextPath = typeof req.body?.next === 'string' && req.body.next.startsWith('/') ? req.body.next : '/';
  const password = String(req.body?.password || '');
  if (password !== APP_PASSWORD) {
    return res.status(401).send(loginPageHtml(nextPath, 'Incorrect password. Try again.'));
  }
  setAuthCookie(res);
  return res.redirect(nextPath);
});

app.use((req, res, next) => {
  if (!AUTH_ENABLED) return next();
  if (req.path === '/robots.txt') return next();
  if (req.path === '/auth/login') return next();
  if (
    req.method === 'GET' &&
    (req.path === '/' ||
      req.path === '/loading' ||
      req.path.startsWith('/assets/'))
  ) {
    return next();
  }
  const cookies = parseCookies(req);
  if (cookies[AUTH_COOKIE_NAME] === '1') return next();
  const providedPassword = passwordFromRequest(req);
  if (providedPassword && providedPassword === APP_PASSWORD) {
    setAuthCookie(res);
    if (!req.path.startsWith('/api/') && typeof req.query?.password === 'string') {
      const cleanQuery = { ...req.query };
      delete cleanQuery.password;
      const qs = new URLSearchParams(cleanQuery).toString();
      const target = `${req.path}${qs ? `?${qs}` : ''}`;
      return res.redirect(target);
    }
    return next();
  }
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const nextPath = req.originalUrl || '/';
  return res.redirect(`/auth/login?next=${encodeURIComponent(nextPath)}`);
});

app.post('/api/run', upload.single('file'), async (req, res) => {
  let urls = [];

  const urlText = req.body?.urls || '';
  if (urlText.trim()) {
    urls = extractUrlsFromText(urlText);
  }

  const maxUrls = process.env.MAX_URLS_PER_RUN ? parseInt(process.env.MAX_URLS_PER_RUN, 10) : 0;

  if (req.file) {
    const buf = req.file.buffer;
    const name = (req.file.originalname || '').toLowerCase();
    if (name.endsWith('.csv')) {
      urls = [...urls, ...parseCsv(buf)];
    } else if (name.endsWith('.xml')) {
      try {
        const fromSitemap = await parseSitemapBuffer(buf, {
          maxUrls: maxUrls > 0 ? maxUrls * 2 : 5000,
        });
        urls = [...urls, ...fromSitemap];
      } catch (err) {
        return res.status(400).json({ error: `Could not parse sitemap: ${err?.message || err}` });
      }
    } else {
      urls = [...urls, ...extractUrlsFromText(buf.toString('utf8'))];
    }
  }

  urls = [...new Set(urls)].filter((u) => u.startsWith('http'));
  const requestedUrls = urls.length;

  if (urls.length === 0) {
    return res.status(400).json({ error: 'No valid URLs provided. Add URLs in the text area or upload a CSV/XML file.' });
  }

  if (maxUrls > 0 && urls.length > maxUrls) {
    urls = urls.slice(0, maxUrls);
  }
  const processedUrls = urls.length;
  const truncated = processedUrls < requestedUrls;

  const { notifyOnComplete, notifyEmail } = parseNotifyFields(req.body || {});
  if (notifyOnComplete && !isValidEmail(notifyEmail)) {
    return res.status(400).json({
      error:
        'Enter a valid e-mail address to receive a notification when tests finish (or uncheck that option).',
    });
  }

  const domainKey = getSingleDomainKey(urls);
  if (!domainKey) {
    return res.status(400).json({
      error: 'Please provide URLs from one domain per run. Mixed-domain runs are not supported.',
    });
  }

  const domain = domainKey;
  // Allow multiple runs per domain over time; only block if one is currently running.
  const concurrent = findRunningRun(runStatus, domain);
  if (concurrent) {
    return res.status(409).json({
      error: `A run for ${domain} is already in progress. Please wait for it to finish.`,
    });
  }
  const runId = newRunId();
  const key = runKey(domain, runId);

  const reportDir = runDirOf(domain, runId);
  if (!existsSync(reportDir)) mkdirSync(reportDir, { recursive: true });

  const statementMeta = parseStatementMeta(req.body || {});
  try {
    writeFileSync(join(reportDir, 'statement-meta.json'), JSON.stringify(statementMeta, null, 2), 'utf8');
  } catch (err) {
    console.error('statement-meta write failed:', err.message);
  }

  const initialState = {
    domain,
    runId,
    status: 'running',
    urls: processedUrls,
    requestedUrls,
    processedUrls,
    truncated,
    error: null,
    notifyRequested: !!(notifyOnComplete && notifyEmail),
    notifyEmail: notifyOnComplete && notifyEmail ? notifyEmail : null,
  };
  notificationAttempted.delete(key);
  runStatus.set(key, initialState);
  dbUpsertRun(domain, runId, { ...initialState, statementMeta }).catch((err) => {
    console.error(`[run ${domain}/${runId}] DB initial write failed:`, err.message);
  });

  const urlsArg = urls.join('\n');
  const child = spawn(
    process.execPath,
    [
      join(repoRoot, 'run-tests.js'),
      '--report',
      `--urls=${urlsArg}`,
      `--output-id=${domain}/${runId}`,
    ],
    {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  let stderr = '';
  child.stderr?.on('data', (d) => { stderr += d.toString(); });
  child.stdout?.on('data', () => {});

  child.on('close', (code) => {
    const reportPath = join(reportDir, 'accessibility-report.html');
    const resultsPath = join(reportDir, 'accessibility-results.json');

    if (code === 0 && existsSync(reportPath)) {
      finalizeSuccessfulRun({ domain, runId, reportDir, processedUrls, requestedUrls, truncated })
        .then((ok) => {
          if (!ok) {
            runStatePatch(domain, runId, { status: 'error', urls: processedUrls, processedUrls, requestedUrls, truncated, error: 'Report generation failed.' });
          }
        })
        .catch((err) => {
          runStatePatch(domain, runId, { status: 'error', urls: processedUrls, processedUrls, requestedUrls, truncated, error: err.message });
        });
      return;
    }
    if (code === 0 && !existsSync(reportPath)) {
      const pollForReport = (attempts = 0) => {
        if (existsSync(reportPath)) {
          finalizeSuccessfulRun({ domain, runId, reportDir, processedUrls, requestedUrls, truncated })
            .then((ok) => {
              if (!ok) {
                runStatePatch(domain, runId, { status: 'error', urls: processedUrls, processedUrls, requestedUrls, truncated, error: 'Report generation failed.' });
              }
            })
            .catch((err) => {
              runStatePatch(domain, runId, { status: 'error', urls: processedUrls, processedUrls, requestedUrls, truncated, error: err.message });
            });
          return;
        }
        if (attempts < 5) {
          setTimeout(() => pollForReport(attempts + 1), 500);
        } else if (existsSync(resultsPath)) {
          (async () => {
            try {
              const { generateReport } = await import(GENERATE_REPORT_URL);
              generateReport(null, { outputDir: reportDir });
              if (existsSync(reportPath)) {
                const ok = await finalizeSuccessfulRun({ domain, runId, reportDir, processedUrls, requestedUrls, truncated });
                if (!ok) {
                  runStatePatch(domain, runId, { status: 'error', urls: processedUrls, processedUrls, requestedUrls, truncated, error: 'Report generation failed.' });
                }
              } else {
                runStatePatch(domain, runId, { status: 'error', urls: processedUrls, processedUrls, requestedUrls, truncated, error: 'Report generation failed.' });
              }
            } catch (err) {
              runStatePatch(domain, runId, { status: 'error', urls: processedUrls, processedUrls, requestedUrls, truncated, error: err.message });
            }
          })();
        } else {
          runStatePatch(domain, runId, {
            status: 'error',
            urls: processedUrls,
            processedUrls,
            requestedUrls,
            truncated,
            error: 'Report file was not created.',
          });
        }
      };
      pollForReport();
      return;
    }
    runStatePatch(domain, runId, {
      status: 'error',
      urls: processedUrls,
      processedUrls,
      requestedUrls,
      truncated,
      error: stderr || `Process exited with code ${code}`,
    });
  });

  child.on('error', (err) => {
    runStatePatch(domain, runId, {
      status: 'error',
      urls: processedUrls,
      processedUrls,
      requestedUrls,
      truncated,
      error: err.message,
    });
  });

  res.json({
    domain,
    runId,
    id: domain,
    reportId: domain,
    urls: processedUrls,
    processedUrls,
    requestedUrls,
    truncated,
    maxUrls: maxUrls > 0 ? maxUrls : null,
  });
});

async function resolveStatus({ domain, runId }) {
  if (!isValidDomain(domain) || !isValidRunId(runId)) return { error: 'Invalid run id' };
  const key = runKey(domain, runId);
  let status = runStatus.get(key);
  if (!status && dbPool) {
    try {
      const dbStatus = await dbGetRun(domain, runId);
      if (dbStatus) {
        status = dbStatus;
        runStatus.set(key, dbStatus);
      }
    } catch (err) {
      console.error(`[run ${domain}/${runId}] DB status lookup failed:`, err.message);
    }
  }
  const reportPath = join(runDirOf(domain, runId), 'accessibility-report.html');
  if (!status) {
    if (existsSync(reportPath)) return { status: 'done', urls: 0 };
    const remote = await ftpDownload(FTP_CONFIG, `${domain}/${runId}/accessibility-report.html`);
    if (remote) return { status: 'done', urls: 0 };
    return null;
  }
  return {
    status: status.status,
    urls: status.urls,
    processedUrls: status.processedUrls ?? status.urls,
    requestedUrls: status.requestedUrls ?? status.urls,
    truncated: !!status.truncated,
    error: status.error,
  };
}

app.get('/api/status/:domain/:runId', async (req, res) => {
  const { domain, runId } = req.params;
  const out = await resolveStatus({ domain, runId });
  if (!out) return res.status(404).json({ error: 'Run not found' });
  if (out.error === 'Invalid run id') return res.status(400).json({ error: out.error });
  res.json(out);
});

/** Legacy: /api/status/:id resolves to the latest run for that domain. */
app.get('/api/status/:id', async (req, res) => {
  const domain = req.params.id;
  if (!isValidDomain(domain)) return res.status(400).json({ error: 'Invalid domain' });
  const running = findRunningRun(runStatus, domain);
  let runId = running?.runId || null;
  if (!runId) {
    if (dbPool) {
      try {
        const latest = await dbGetLatestRun(domain);
        if (latest) runId = latest.runId;
      } catch (err) {
        console.error(`[domain ${domain}] DB latest lookup failed:`, err.message);
      }
    }
  }
  if (!runId) runId = latestRunIdOnDisk(domain);
  if (!runId) return res.status(404).json({ error: 'Run not found' });
  const out = await resolveStatus({ domain, runId });
  if (!out) return res.status(404).json({ error: 'Run not found' });
  if (out.error === 'Invalid run id') return res.status(400).json({ error: out.error });
  res.json({ ...out, runId });
});

app.get('/api/health/db', async (req, res) => {
  if (!dbPool) {
    return res.json({ ok: true, db: 'disabled', message: 'DATABASE_URL not configured' });
  }
  try {
    await dbPool.query('SELECT 1');
    return res.json({ ok: true, db: 'up' });
  } catch (err) {
    return res.status(503).json({ ok: false, db: 'down', error: err.message });
  }
});

app.get('/api/audits', async (_req, res) => {
  try {
    const audits = await listAuditEntries(dbPool, REPORTS_BASE);
    return res.json({ audits });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/audits/:domain/runs', async (req, res) => {
  const domain = req.params.domain;
  if (!isValidDomain(domain)) return res.status(400).json({ error: 'Invalid domain' });
  try {
    const runs = await listRunsForDomain(dbPool, REPORTS_BASE, domain);
    return res.json({ domain, runs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

async function finalizeSuccessfulRun({
  domain,
  runId,
  reportDir,
  processedUrls,
  requestedUrls,
  truncated,
}) {
  const resultsPath = join(reportDir, 'accessibility-results.json');
  const reportPath = join(reportDir, 'accessibility-report.html');
  let resultJson = readJsonIfExists(resultsPath);
  if (resultJson && dbPool) {
    try {
      const previous = await dbGetRun(domain, runId);
      resultJson = mergeReportData(previous?.resultJson || null, resultJson);
      writeFileSync(resultsPath, JSON.stringify(resultJson, null, 2), 'utf8');
    } catch (err) {
      console.error(`[run ${domain}/${runId}] DB merge failed:`, err.message);
    }
  }
  if (resultJson) {
    try {
      const { generateReport } = await import(GENERATE_REPORT_URL);
      generateReport(resultJson, { outputDir: reportDir });
    } catch (err) {
      console.error(`[run ${domain}/${runId}] Report regeneration failed:`, err.message);
    }
  }
  if (existsSync(reportPath)) {
    persistReportArtifactsToFtp(domain, runId, FTP_CONFIG).catch((err) => {
      console.error(`[run ${domain}/${runId}] FTP persistence failed:`, err.message);
    });
    runStatePatch(domain, runId, { status: 'done', urls: processedUrls, processedUrls, requestedUrls, truncated, error: null, resultJson });
    return true;
  }
  return false;
}

async function resolveLatestRunIdForDomain(domain) {
  if (!isValidDomain(domain)) return null;
  if (dbPool) {
    try {
      const latest = await dbGetLatestRun(domain);
      if (latest?.runId) return latest.runId;
    } catch {}
  }
  return latestRunIdOnDisk(domain);
}

async function readManualProgress(domain, runId) {
  if (dbPool) {
    try {
      const dbRun = await dbGetRun(domain, runId);
      if (dbRun && dbRun.manualProgress && Array.isArray(dbRun.manualProgress.checked)) {
        return { checked: normalizeManualProgress(dbRun.manualProgress.checked) };
      }
    } catch (err) {
      console.error(`[run ${domain}/${runId}] DB manual-progress lookup failed:`, err.message);
    }
  }
  const filePath = join(runDirOf(domain, runId), 'manual-progress.json');
  let raw = null;
  try {
    raw = await ftpDownload(FTP_CONFIG, `${domain}/${runId}/manual-progress.json`);
  } catch {}
  if (!raw && existsSync(filePath)) raw = readFileSync(filePath, 'utf8');
  if (!raw) return { checked: [] };
  try {
    const data = JSON.parse(raw);
    return { checked: normalizeManualProgress(data.checked) };
  } catch {
    return { checked: [] };
  }
}

app.get('/api/report/:domain/:runId/manual-progress', async (req, res) => {
  const { domain, runId } = req.params;
  if (!isValidDomain(domain) || !isValidRunId(runId)) return res.status(400).json({ error: 'Invalid run id' });
  res.json(await readManualProgress(domain, runId));
});

app.get('/api/report/:id/manual-progress', async (req, res) => {
  const domain = req.params.id;
  if (!isValidDomain(domain)) return res.status(400).json({ error: 'Invalid domain' });
  const runId = await resolveLatestRunIdForDomain(domain);
  if (!runId) return res.json({ checked: [] });
  res.json(await readManualProgress(domain, runId));
});

async function readUrlsForRun(domain, runId) {
  if (dbPool) {
    try {
      const dbRun = await dbGetRun(domain, runId);
      if (dbRun && dbRun.resultJson) {
        const urls = Array.isArray(dbRun.resultJson.urls)
          ? [...new Set(dbRun.resultJson.urls.map((u) => String(u)).filter(Boolean))]
          : [];
        return { urls, source: 'db' };
      }
    } catch (err) {
      console.error(`[run ${domain}/${runId}] DB urls lookup failed:`, err.message);
    }
  }
  const filePath = join(runDirOf(domain, runId), 'accessibility-results.json');
  let raw = null;
  if (existsSync(filePath)) {
    raw = readFileSync(filePath, 'utf8');
  } else {
    raw = await ftpDownload(FTP_CONFIG, `${domain}/${runId}/accessibility-results.json`);
  }
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    const urls = Array.isArray(data.urls)
      ? [...new Set(data.urls.map((u) => String(u)).filter(Boolean))]
      : [];
    return { urls, source: existsSync(filePath) ? 'file' : 'ftp' };
  } catch (err) {
    return { error: `Invalid report data: ${err.message}` };
  }
}

app.get('/api/report/:domain/:runId/urls', async (req, res) => {
  const { domain, runId } = req.params;
  if (!isValidDomain(domain) || !isValidRunId(runId)) return res.status(400).json({ error: 'Invalid run id' });
  const out = await readUrlsForRun(domain, runId);
  if (!out) return res.status(404).json({ error: 'Report not found' });
  if (out.error) return res.status(500).json({ error: out.error });
  return res.json({ id: domain, domain, runId, urls: out.urls, count: out.urls.length, source: out.source });
});

app.get('/api/report/:id/urls', async (req, res) => {
  const domain = req.params.id;
  if (!isValidDomain(domain)) return res.status(400).json({ error: 'Invalid domain' });
  const runId = await resolveLatestRunIdForDomain(domain);
  if (!runId) return res.status(404).json({ error: 'Report not found' });
  const out = await readUrlsForRun(domain, runId);
  if (!out) return res.status(404).json({ error: 'Report not found' });
  if (out.error) return res.status(500).json({ error: out.error });
  return res.json({ id: domain, domain, runId, urls: out.urls, count: out.urls.length, source: out.source });
});

async function writeManualProgress(domain, runId, checked) {
  const reportDir = runDirOf(domain, runId);
  if (!existsSync(reportDir)) {
    try {
      const dbRun = dbPool ? await dbGetRun(domain, runId) : null;
      if (!dbRun) return { status: 404, error: 'Report not found' };
    } catch (err) {
      console.error(`[run ${domain}/${runId}] DB report lookup failed:`, err.message);
      return { status: 500, error: 'Failed to verify report' };
    }
  }
  const filePath = join(reportDir, 'manual-progress.json');
  try {
    const normalized = normalizeManualProgress(checked);
    if (dbPool) {
      await dbUpsertRun(domain, runId, {
        status: (runStatus.get(runKey(domain, runId))?.status || 'done'),
        manualProgress: { checked: normalized },
      });
    }
    if (!existsSync(reportDir)) mkdirSync(reportDir, { recursive: true });
    writeFileSync(filePath, JSON.stringify({ checked: normalized }), 'utf8');
    ftpUpload(FTP_CONFIG, filePath, `${domain}/${runId}/manual-progress.json`).catch(() => {});
    return { status: 200, ok: true, checked: normalized };
  } catch (err) {
    return { status: 500, error: err.message };
  }
}

app.put('/api/report/:domain/:runId/manual-progress', async (req, res) => {
  const { domain, runId } = req.params;
  if (!isValidDomain(domain) || !isValidRunId(runId)) return res.status(400).json({ error: 'Invalid run id' });
  const checked = req.body?.checked;
  if (!Array.isArray(checked)) return res.status(400).json({ error: 'Body must include checked array' });
  const out = await writeManualProgress(domain, runId, checked);
  if (out.error) return res.status(out.status).json({ error: out.error });
  res.json({ ok: true, checked: out.checked });
});

app.put('/api/report/:id/manual-progress', async (req, res) => {
  const domain = req.params.id;
  if (!isValidDomain(domain)) return res.status(400).json({ error: 'Invalid domain' });
  const runId = await resolveLatestRunIdForDomain(domain);
  if (!runId) return res.status(404).json({ error: 'Report not found' });
  const checked = req.body?.checked;
  if (!Array.isArray(checked)) return res.status(400).json({ error: 'Body must include checked array' });
  const out = await writeManualProgress(domain, runId, checked);
  if (out.error) return res.status(out.status).json({ error: out.error });
  res.json({ ok: true, checked: out.checked });
});

function serveReportFile(domain, runId, filename) {
  const filePath = join(runDirOf(domain, runId), filename);
  if (existsSync(filePath)) {
    return readFileSync(filePath, 'utf8');
  }
  return null;
}

async function ensureReportFilesFromDb(domain, runId) {
  if (!dbPool) return false;
  try {
    const dbRun = await dbGetRun(domain, runId);
    if (!dbRun || !dbRun.resultJson) return false;
    const reportDir = runDirOf(domain, runId);
    if (!existsSync(reportDir)) mkdirSync(reportDir, { recursive: true });
    const resultsPath = join(reportDir, 'accessibility-results.json');
    writeFileSync(resultsPath, JSON.stringify(dbRun.resultJson, null, 2), 'utf8');
    if (dbRun.manualProgress && Array.isArray(dbRun.manualProgress.checked)) {
      writeFileSync(join(reportDir, 'manual-progress.json'), JSON.stringify(dbRun.manualProgress, null, 2), 'utf8');
    }
    const { generateReport } = await import(GENERATE_REPORT_URL);
    generateReport(dbRun.resultJson, { outputDir: reportDir, verbose: true, throwOnDeliverableError: true });
    return existsSync(join(reportDir, 'accessibility-report.html'));
  } catch (err) {
    console.error(`[run ${domain}/${runId}] Failed to hydrate report from DB:`, err.message);
    return false;
  }
}

async function ensureDeliverableFromResults(domain, runId, filename, debugInfo = null) {
  const reportDir = runDirOf(domain, runId);
  const resultsPath = join(reportDir, 'accessibility-results.json');
  if (!existsSync(resultsPath)) {
    if (!existsSync(reportDir)) mkdirSync(reportDir, { recursive: true });
    const ftpResults = await ftpDownload(FTP_CONFIG, `${domain}/${runId}/accessibility-results.json`);
    if (!ftpResults) {
      const dbRun = dbPool ? await dbGetRun(domain, runId) : null;
      if (dbRun && dbRun.resultJson) {
        writeFileSync(resultsPath, JSON.stringify(dbRun.resultJson, null, 2), 'utf8');
      } else {
        if (debugInfo) debugInfo.error = 'results missing in local/ftp/db';
        return false;
      }
    }
  }
  try {
    const reportData = readJsonIfExists(resultsPath);
    if (!reportData) {
      if (debugInfo) debugInfo.error = 'results json unreadable';
      return false;
    }
    const { generateReport } = await import(GENERATE_REPORT_URL);
    generateReport(reportData, { outputDir: reportDir, verbose: true, throwOnDeliverableError: true, noExit: true });
    return existsSync(join(reportDir, filename));
  } catch (err) {
    if (debugInfo) debugInfo.error = err.message;
    console.error(`[run ${domain}/${runId}] Failed to regenerate deliverables:`, err.message);
    return false;
  }
}

app.get('/api/debug/deliverable/:domain/:runId/:file', async (req, res) => {
  const { domain, runId, file } = req.params;
  if (!isValidDomain(domain) || !isValidRunId(runId)) return res.status(400).json({ error: 'Invalid run id' });
  if (!DELIVERABLE_FILES.includes(file)) return res.status(400).json({ error: 'Unsupported deliverable file' });

  const reportDir = runDirOf(domain, runId);
  const reportHtmlPath = join(reportDir, 'accessibility-report.html');
  const deliverablePath = join(reportDir, file);
  const resultsPath = join(reportDir, 'accessibility-results.json');
  const diagnostics = {
    domain,
    runId,
    file,
    local: {
      reportHtmlExists: existsSync(reportHtmlPath),
      deliverableExists: existsSync(deliverablePath),
      resultsExists: existsSync(resultsPath),
    },
    db: { hasRun: false, hasResultJson: false },
    ftp: { reportHtml: false, deliverable: false, results: false },
    actions: [],
    finalExists: false,
  };

  try {
    const dbRun = dbPool ? await dbGetRun(domain, runId) : null;
    diagnostics.db.hasRun = !!dbRun;
    diagnostics.db.hasResultJson = !!dbRun?.resultJson;
  } catch (err) {
    diagnostics.actions.push(`dbGetRun error: ${err.message}`);
  }

  try { diagnostics.ftp.reportHtml = !!(await ftpDownload(FTP_CONFIG, `${domain}/${runId}/accessibility-report.html`)); } catch (err) { diagnostics.actions.push(`ftp report error: ${err.message}`); }
  try { diagnostics.ftp.deliverable = !!(await ftpDownload(FTP_CONFIG, `${domain}/${runId}/${file}`)); } catch (err) { diagnostics.actions.push(`ftp deliverable error: ${err.message}`); }
  try { diagnostics.ftp.results = !!(await ftpDownload(FTP_CONFIG, `${domain}/${runId}/accessibility-results.json`)); } catch (err) { diagnostics.actions.push(`ftp results error: ${err.message}`); }

  if (String(req.query.rebuild || '') === '1') {
    const regen = {};
    try {
      const rebuilt = await ensureDeliverableFromResults(domain, runId, file, regen);
      diagnostics.actions.push(`ensureDeliverableFromResults: ${rebuilt ? 'ok' : 'failed'}`);
      if (regen.error) diagnostics.actions.push(`regenError: ${regen.error}`);
    } catch (err) {
      diagnostics.actions.push(`ensureDeliverableFromResults error: ${err.message}`);
    }
  }

  diagnostics.finalExists = existsSync(deliverablePath);
  return res.json(diagnostics);
});

app.get('/report/:domain/:runId/screenshots/:file', async (req, res) => {
  const { domain, runId, file } = req.params;
  if (!isValidDomain(domain) || !isValidRunId(runId)) return res.status(400).send('Invalid run id');
  const safeName = file.replace(/[^a-zA-Z0-9._-]/g, '');
  const filePath = join(runDirOf(domain, runId), 'screenshots', safeName);
  if (existsSync(filePath)) {
    res.sendFile(filePath);
    return;
  }
  await ftpDownload(FTP_CONFIG, `${domain}/${runId}/screenshots/${safeName}`);
  if (existsSync(filePath)) {
    res.sendFile(filePath);
    return;
  }
  res.status(404).send('Not found');
});

/** Serve deliverable HTML files (developer guide, client deck, statement). */
app.get('/report/:domain/:runId/:file', async (req, res, next) => {
  const { domain, runId, file } = req.params;
  if (!isValidDomain(domain) || !isValidRunId(runId)) return next();
  if (!DELIVERABLE_FILES.includes(file)) return next();

  const reportDir = runDirOf(domain, runId);
  let html = serveReportFile(domain, runId, file);
  if (!html) {
    html = await ftpDownload(FTP_CONFIG, `${domain}/${runId}/${file}`);
  }
  if (!html) {
    const hydrated = await ensureReportFilesFromDb(domain, runId);
    if (hydrated) html = serveReportFile(domain, runId, file);
  }
  if (!html) {
    const rebuilt = await ensureDeliverableFromResults(domain, runId, file);
    if (rebuilt) html = serveReportFile(domain, runId, file);
  }
  if (html) {
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  }
  if (existsSync(join(reportDir, 'accessibility-report.html'))) {
    return res.status(404).send('Deliverable is not available yet. Please refresh in a moment.');
  }
  return res.status(404).send('Deliverable not found');
});

/**
 * Send users to the prototype-styled report under `/report/:domain/:runId/`.
 * The literal `/report/:domain/history` route below is registered first so it wins,
 * and reaches the Astro shell unmodified.
 */
app.get('/report/:domain/history', (req, res, next) => next());
app.get('/report/:domain/history/', (req, res, next) => next());

app.get('/report/:domain', async (req, res) => {
  const domain = req.params.domain;
  if (!isValidDomain(domain)) return res.status(400).send('Invalid domain');
  const running = findRunningRun(runStatus, domain);
  if (running) {
    return res.redirect(`${loadingPath}?domain=${encodeURIComponent(domain)}&runId=${encodeURIComponent(running.runId)}`);
  }
  const runId = await resolveLatestRunIdForDomain(domain);
  if (!runId) return res.status(404).send('Report not found');
  const target = `/report/${encodeURIComponent(domain)}/${encodeURIComponent(runId)}/`;
  return res.redirect(req.path.endsWith('/') ? 302 : 301, target);
});

app.get('/report/:domain/', async (req, res) => {
  const domain = req.params.domain;
  if (!isValidDomain(domain)) return res.status(400).send('Invalid domain');
  const running = findRunningRun(runStatus, domain);
  if (running) {
    return res.redirect(`${loadingPath}?domain=${encodeURIComponent(domain)}&runId=${encodeURIComponent(running.runId)}`);
  }
  const runId = await resolveLatestRunIdForDomain(domain);
  if (!runId) return res.status(404).send('Report not found');
  return res.redirect(302, `/report/${encodeURIComponent(domain)}/${encodeURIComponent(runId)}/`);
});

// Path segments under /report/:domain/ that are NOT runIds (handled by Astro).
const RESERVED_DOMAIN_SUBPATHS = new Set(['history']);

app.get('/report/:domain/:runId', (req, res, next) => {
  const { domain, runId } = req.params;
  if (RESERVED_DOMAIN_SUBPATHS.has(runId)) return next();
  if (!isValidDomain(domain) || !isValidRunId(runId)) return next();
  const key = runKey(domain, runId);
  if (runStatus.get(key)?.status === 'running') {
    return res.redirect(`${loadingPath}?domain=${encodeURIComponent(domain)}&runId=${encodeURIComponent(runId)}`);
  }
  if (req.path.endsWith('/')) return next();
  return res.redirect(301, `/report/${encodeURIComponent(domain)}/${encodeURIComponent(runId)}/`);
});

app.get('/report/:domain/:runId/', (req, res, next) => {
  const { domain, runId } = req.params;
  if (RESERVED_DOMAIN_SUBPATHS.has(runId)) return next();
  if (!isValidDomain(domain) || !isValidRunId(runId)) return next();
  const key = runKey(domain, runId);
  if (runStatus.get(key)?.status === 'running') {
    return res.redirect(`${loadingPath}?domain=${encodeURIComponent(domain)}&runId=${encodeURIComponent(runId)}`);
  }
  return next();
});

app.get('/report/:domain/:runId/sales', (req, res, next) => next());
app.get('/report/:domain/:runId/sales/', (req, res, next) => next());
app.get('/report/:domain/:runId/statement', (req, res, next) => next());
app.get('/report/:domain/:runId/statement/', (req, res, next) => next());

  return app;
}
