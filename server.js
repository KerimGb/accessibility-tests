#!/usr/bin/env node
/**
 * Web server for accessibility testing UI.
 * Provides form to add URLs or upload CSV/XML, runs tests, and serves reports by unique ID.
 */

import express from 'express';
import multer from 'multer';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_BASE = join(__dirname, 'reports');
const PORT = process.env.PORT || 3456;

// In-memory run status (running, done, error)
const runStatus = new Map();

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

function parseXml(buffer) {
  const text = buffer.toString('utf8');
  const urls = [];
  const locMatch = text.matchAll(/<loc>([^<]+)<\/loc>/gi);
  for (const m of locMatch) urls.push(m[1].trim());
  const urlMatch = text.matchAll(/<url>([^<]+)<\/url>/gi);
  for (const m of urlMatch) urls.push(m[1].trim());
  return [...new Set(urls)];
}

const app = express();

// CORS: allow requests from Combell or any frontend (set ALLOWED_ORIGIN to restrict)
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

app.post('/api/run', upload.single('file'), (req, res) => {
  let urls = [];

  const urlText = req.body?.urls || '';
  if (urlText.trim()) {
    urls = extractUrlsFromText(urlText);
  }

  if (req.file) {
    const buf = req.file.buffer;
    const name = (req.file.originalname || '').toLowerCase();
    if (name.endsWith('.csv')) {
      urls = [...urls, ...parseCsv(buf)];
    } else if (name.endsWith('.xml')) {
      urls = [...urls, ...parseXml(buf)];
    } else {
      urls = [...urls, ...extractUrlsFromText(buf.toString('utf8'))];
    }
  }

  urls = [...new Set(urls)].filter((u) => u.startsWith('http'));

  if (urls.length === 0) {
    return res.status(400).json({ error: 'No valid URLs provided. Add URLs in the text area or upload a CSV/XML file.' });
  }

  const id = uuidv4().slice(0, 8);
  const reportDir = join(REPORTS_BASE, id);
  if (!existsSync(reportDir)) mkdirSync(reportDir, { recursive: true });

  runStatus.set(id, { status: 'running', urls: urls.length, error: null });

  const urlsArg = urls.join('\n');
  const child = spawn(
    process.execPath,
    [join(__dirname, 'run-tests.js'), '--report', `--urls=${urlsArg}`, `--output-id=${id}`],
    {
      cwd: __dirname,
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
      runStatus.set(id, { status: 'done', urls: urls.length, error: null });
      return;
    }
    if (code === 0 && !existsSync(reportPath)) {
      const pollForReport = (attempts = 0) => {
        if (existsSync(reportPath)) {
          runStatus.set(id, { status: 'done', urls: urls.length, error: null });
          return;
        }
        if (attempts < 5) {
          setTimeout(() => pollForReport(attempts + 1), 500);
        } else if (existsSync(resultsPath)) {
          (async () => {
            try {
              const { generateReport } = await import('./generate-report.js');
              generateReport(null, { outputDir: reportDir });
              if (existsSync(reportPath)) {
                runStatus.set(id, { status: 'done', urls: urls.length, error: null });
              } else {
                runStatus.set(id, { status: 'error', urls: urls.length, error: 'Report generation failed.' });
              }
            } catch (err) {
              runStatus.set(id, { status: 'error', urls: urls.length, error: err.message });
            }
          })();
        } else {
          runStatus.set(id, {
            status: 'error',
            urls: urls.length,
            error: 'Report file was not created.',
          });
        }
      };
      pollForReport();
      return;
    }
    runStatus.set(id, { status: 'error', urls: urls.length, error: stderr || `Process exited with code ${code}` });
  });

  child.on('error', (err) => {
    runStatus.set(id, { status: 'error', urls: urls.length, error: err.message });
  });

  res.json({ id, urls: urls.length });
});

app.get('/api/status/:id', (req, res) => {
  const id = req.params.id;
  const status = runStatus.get(id);
  const reportPath = join(REPORTS_BASE, id, 'accessibility-report.html');

  if (!status) {
    if (existsSync(reportPath)) {
      return res.json({ status: 'done', urls: 0 });
    }
    return res.status(404).json({ error: 'Run not found' });
  }

  res.json(status);
});

app.get('/report/:id', (req, res) => {
  const id = req.params.id;
  const reportPath = join(REPORTS_BASE, id, 'accessibility-report.html');

  if (existsSync(reportPath)) {
    const html = readFileSync(reportPath, 'utf8');
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
    return;
  }

  const status = runStatus.get(id);
  if (status?.status === 'running') {
    return res.redirect(`/loading.html?id=${id}`);
  }

  res.status(404).send(`
    <!DOCTYPE html>
    <html><head><title>Report Not Found</title></head>
    <body style="font-family:sans-serif;padding:2rem;text-align:center;">
      <h1>Report not found</h1>
      <p>Run ID: ${id}</p>
      <p><a href="/">Start a new test</a></p>
    </body></html>
  `);
});

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Accessibility test server running at http://localhost:${PORT}`);
});
