/**
 * Generates an HTML accessibility report for clients.
 * Run after run-tests.js, or use: node run-tests.js --report
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUTPUT_DIR = join(__dirname, 'reports');

const CHECKLIST_CHAPTERS = {
  semantics: { id: '1', name: 'Semantic Structure and Navigation' },
  images: { id: '2', name: 'Images, Canvas, SVG, and Non-Text Content' },
  visualDesign: { id: '3', name: 'Visual Design and Colors' },
  responsive: { id: '4', name: 'Responsive Design and Zoom' },
  multimedia: { id: '5', name: 'Multimedia, Animations, and Motion' },
  inputMethods: { id: '6', name: 'Device-Independent Input Methods' },
  forms: { id: '7', name: 'Form Labels, Instructions, and Validation' },
  dynamicUpdates: { id: '8', name: 'Dynamic Updates, AJAX, and SPAs' },
};

function statusColor(s) {
  if (s === 'pass') return '#2e7d32';
  if (s === 'fail') return '#c62828';
  if (s === 'warn') return '#ed6c02';
  return '#1565c0';
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function generateReport(reportData, options = {}) {
  const outputDir = options.outputDir || DEFAULT_OUTPUT_DIR;
  const resultsFile = join(outputDir, 'accessibility-results.json');
  const reportFile = join(outputDir, 'accessibility-report.html');

  if (!reportData) {
    if (!existsSync(resultsFile)) {
      console.error('No results found. Run: node run-tests.js');
      process.exit(1);
    }
    reportData = JSON.parse(readFileSync(resultsFile, 'utf8'));
  }

  const customByChapter = {};
  Object.keys(CHECKLIST_CHAPTERS).forEach((ch) => {
    customByChapter[ch] = reportData.customResults?.filter((r) => r.chapter === ch) || [];
  });

  const totalAxeViolations = Object.values(reportData.axeResults || {}).reduce(
    (sum, r) => sum + (r.violations?.length || 0),
    0
  );

  const loadErrors = (reportData.customResults || []).filter((r) => r.id === 'page-load');

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Accessibility Report · Us</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root { --pass: #2e7d32; --fail: #c62828; --warn: #ed6c02; --info: #1565c0; --bg: #f8f7f4; --surface: #fff; --text: #1a1a1a; --text-muted: #5c5c5c; --accent: #2d9d78; --border: #e8e6e1; }
    * { box-sizing: border-box; }
    body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; margin: 0; padding: 0; background: var(--bg); color: var(--text); line-height: 1.5; }
    .container { max-width: 960px; margin: 0 auto; background: var(--surface); border-radius: 16px; box-shadow: 0 2px 24px rgba(0,0,0,.06); border: 1px solid var(--border); overflow: hidden; }
    header { padding: 28px 32px; border-bottom: 1px solid var(--border); }
    header .brand { font-size: 1.25rem; font-weight: 700; letter-spacing: -0.02em; }
    header h1 { margin: 0 0 6px; font-size: 1.4rem; font-weight: 700; letter-spacing: -0.02em; }
    header p { margin: 0; font-size: 0.9rem; color: var(--text-muted); }
    .summary { display: flex; gap: 12px; padding: 20px 32px; background: var(--bg); border-bottom: 1px solid var(--border); flex-wrap: wrap; }
    .summary-item { padding: 14px 20px; border-radius: 10px; background: var(--surface); border: 1px solid var(--border); }
    .summary-item.pass { border-color: var(--pass); background: #e8f5e9; }
    .summary-item.fail { border-color: var(--fail); background: #ffebee; }
    .summary-item.warn { border-color: var(--warn); background: #fff3e0; }
    .summary-item span { display: block; font-size: 1.5rem; font-weight: 700; }
    .summary-item small { color: var(--text-muted); font-size: 0.85rem; }
    nav { padding: 16px 32px; border-bottom: 1px solid var(--border); background: var(--surface); }
    nav a { margin-right: 20px; color: var(--accent); text-decoration: none; font-weight: 500; font-size: 0.9rem; }
    nav a:hover { text-decoration: underline; }
    .alert { padding: 18px 32px; margin: 0; border-radius: 0; }
    .alert-warning { background: #fff3e0; border-left: 4px solid var(--warn); }
    .alert-error { background: #ffebee; border-left: 4px solid var(--fail); }
    section { padding: 28px 32px; }
    section h2 { margin: 0 0 20px; font-size: 1.2rem; font-weight: 700; letter-spacing: -0.02em; color: var(--text); }
    .url-section { margin-bottom: 32px; }
    .url-section h3 { margin: 0 0 12px; font-size: 0.95rem; color: var(--text-muted); word-break: break-all; font-weight: 500; }
    table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    th, td { padding: 12px 14px; text-align: left; border-bottom: 1px solid var(--border); }
    th { background: var(--bg); font-weight: 600; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
    .badge.pass { background: #e8f5e9; color: var(--pass); }
    .badge.fail { background: #ffebee; color: var(--fail); }
    .badge.warn { background: #fff3e0; color: var(--warn); }
    .badge.info { background: #e3f2fd; color: var(--info); }
    .violation { margin-bottom: 16px; padding: 14px 16px; background: #fff8e1; border-left: 4px solid var(--warn); border-radius: 8px; font-size: 0.9rem; }
    .violation strong { display: block; margin-bottom: 4px; }
    .violation code { font-size: 0.85em; background: var(--bg); padding: 2px 6px; border-radius: 4px; }
    footer { padding: 20px 32px; font-size: 0.85rem; color: var(--text-muted); border-top: 1px solid var(--border); }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">Us</div>
      <h1>Accessibility audit report</h1>
      <p>Deque University checklists · Generated ${new Date(reportData.generatedAt).toLocaleString()}</p>
    </header>

    <div class="summary">
      <div class="summary-item pass"><span>${reportData.summary?.pass || 0}</span><small>Checks Passed</small></div>
      <div class="summary-item warn"><span>${reportData.summary?.warn || 0}</span><small>Warnings</small></div>
      <div class="summary-item fail"><span>${reportData.summary?.fail || 0}</span><small>Failures</small></div>
      <div class="summary-item"><span>${totalAxeViolations}</span><small>Axe Violations</small></div>
      <div class="summary-item"><span>${reportData.urls?.length || 0}</span><small>Pages Tested</small></div>
    </div>

    ${loadErrors.length > 0 ? `
    <div class="alert alert-error">
      <strong>No pages could be loaded.</strong> All ${loadErrors.length} URL(s) failed. Possible causes: site blocks headless browsers, bot protection, timeout, or network issues.
      <ul style="margin: 12px 0 0 20px;">
        ${loadErrors.map((e) => `<li><strong>${escapeHtml(e.url)}</strong>: ${escapeHtml(e.message)}</li>`).join('')}
      </ul>
      <p style="margin: 12px 0 0;">Fix these issues and re-run <code>npm run test:report</code></p>
    </div>
    ` : reportData.urls?.length === 0 ? `
    <div class="alert alert-warning">
      <strong>No pages were tested.</strong> Add URLs to <code>urls.config.js</code> and run <code>npm run test:report</code>
    </div>
    ` : ''}

    <nav>
      ${Object.entries(CHECKLIST_CHAPTERS)
        .map(([id, ch]) => `<a href="#ch${ch.id}">Ch.${ch.id} ${ch.name.split(' ')[0]}</a>`)
        .join('')}
    </nav>

    <section>
`;

  Object.entries(CHECKLIST_CHAPTERS).forEach(([chapterId, ch]) => {
    html += `
      <h2 id="ch${ch.id}">Chapter ${ch.id}: ${ch.name}</h2>
`;

    if (reportData.urls?.length > 0) {
      reportData.urls.forEach((url) => {
        html += `<div class="url-section"><h3>${escapeHtml(url)}</h3>`;

        const custom = customByChapter[chapterId]?.filter((r) => r.url === url) || [];
        const axeData = reportData.axeResults?.[url];
        const axeViolations = (axeData?.byChapter?.[chapterId]?.violations || []);

        if (custom.length > 0) {
          html += '<table><thead><tr><th>Rule</th><th>Status</th><th>Message</th></tr></thead><tbody>';
          custom.forEach((r) => {
            html += `<tr>
              <td>${escapeHtml(r.rule)}</td>
              <td><span class="badge ${r.status}">${r.status}</span></td>
              <td>${escapeHtml(r.message)}</td>
            </tr>`;
          });
          html += '</tbody></table>';
        }

        axeViolations.forEach((v) => {
          html += `
          <div class="violation">
            <strong>${escapeHtml(v.id)}: ${escapeHtml(v.help)}</strong>
            ${v.description ? `<p>${escapeHtml(v.description)}</p>` : ''}
            ${v.nodes?.length ? `<p><strong>Affected:</strong> ${v.nodes.length} element(s)</p>` : ''}
          </div>`;
        });

        if (custom.length === 0 && axeViolations.length === 0) {
          html += '<p>No issues found for this chapter.</p>';
        }

        html += '</div>';
      });
    } else {
      html += '<p><em>No pages were successfully tested. Resolve the page load errors above and re-run the tests.</em></p>';
    }

    html += '<br>';
  });

  html += `
    </section>

    <footer>
      <p>Us · Accessibility audit. Report generated by an automated suite based on Deque University checklists. Some checks require manual verification.</p>
    </footer>
  </div>
</body>
</html>`;

  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
  writeFileSync(reportFile, html, 'utf8');
  return reportFile;
}

const isMain = process.argv[1] && process.argv[1].endsWith('generate-report.js');
if (isMain) {
  generateReport();
  console.log(`Report saved to ${REPORT_FILE}`);
}
