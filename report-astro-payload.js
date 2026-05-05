/**
 * Builds view-model + HTML fragments for the Astro main report.
 * Kept separate from generate-report.js so the Astro SSR bundle does not load generate-deliverables.
 */
import {
  getRemediation,
  fixOrderScore,
  REMEDIATION_MAP,
  AXE_REMEDIATION,
} from './remediation-data.js';
import {
  buildExecutiveSummaryHtml,
  buildChartDataPayload,
  buildChartsSectionHtml,
  buildChartSectionStyles,
} from './report-summary.js';
import { MANUAL_VERIFICATION_ITEMS, ASSISTIVE_TECH_ITEMS } from './manual-checklist.js';

/** Same keys as generate-report.js DISABILITY_MAP (subset used for chart disability stats). */
const DISABILITY_MAP = {
  'page-title-exists': ['Blindness', 'Low Vision', 'Reading Disabilities', 'Cognitive Disabilities'],
  'html-lang': ['Blindness', 'Reading Disabilities', 'Cognitive Disabilities'],
  'landmarks-present': ['Blindness', 'Low Vision', 'Cognitive Disabilities'],
  'single-main': ['Blindness', 'Low Vision', 'Cognitive Disabilities'],
  'heading-structure': ['Blindness', 'Low Vision', 'Reading Disabilities', 'Cognitive Disabilities'],
  'heading-main-h1': ['Blindness', 'Low Vision', 'Reading Disabilities', 'Cognitive Disabilities'],
  'link-text': ['Blindness', 'Low Vision', 'Reading Disabilities'],
  'link-meaningful': ['Blindness', 'Low Vision', 'Reading Disabilities', 'Cognitive Disabilities'],
  'skip-link': ['Blindness', 'Dexterity/Motor Disabilities'],
  'table-headers': ['Blindness', 'Low Vision', 'Reading Disabilities', 'Cognitive Disabilities'],
  'list-markup': ['Blindness', 'Low Vision', 'Reading Disabilities', 'Cognitive Disabilities'],
  'iframe-titles': ['Blindness', 'Low Vision', 'Cognitive Disabilities'],
  'unique-ids': ['Blindness', 'Cognitive Disabilities'],
  'img-alt': ['Blindness', 'Low Vision', 'Deafblindness'],
  'img-alt-length': ['Blindness', 'Low Vision', 'Deafblindness', 'Cognitive Disabilities'],
  'svg-role': ['Blindness', 'Low Vision', 'Deafblindness'],
  'svg-accessible-name': ['Blindness', 'Low Vision', 'Deafblindness'],
  'canvas-alt': ['Blindness', 'Low Vision', 'Deafblindness'],
  'image-map-alt': ['Blindness', 'Low Vision', 'Deafblindness'],
  'link-differentiation': ['Colorblindness', 'Low Vision'],
  'text-contrast': ['Low Vision', 'Colorblindness'],
  'non-text-contrast': ['Low Vision', 'Colorblindness'],
  'focus-indicator': ['Low Vision', 'Dexterity/Motor Disabilities', 'Blindness'],
  'no-horizontal-scroll': ['Low Vision', 'Dexterity/Motor Disabilities'],
  'viewport-zoom': ['Low Vision', 'Dexterity/Motor Disabilities'],
  'video-captions': ['Deafness and Hard-of-Hearing', 'Deafblindness'],
  'video-autoplay': ['Deafness and Hard-of-Hearing', 'Cognitive Disabilities'],
  'audio-autoplay': ['Deafness and Hard-of-Hearing'],
  'flash-alternative': ['Blindness', 'Deafness and Hard-of-Hearing'],
  'tabindex-positive': ['Dexterity/Motor Disabilities', 'Blindness'],
  'touch-target-size': ['Dexterity/Motor Disabilities', 'Low Vision'],
  'form-labels': ['Blindness', 'Cognitive Disabilities', 'Reading Disabilities'],
  'placeholder-not-only-label': ['Blindness', 'Cognitive Disabilities', 'Reading Disabilities'],
  'no-auto-refresh': ['Cognitive Disabilities', 'Dexterity/Motor Disabilities'],
  'dynamic-announcements': ['Blindness', 'Cognitive Disabilities'],
  'dynamic-status-roles': ['Blindness', 'Cognitive Disabilities'],
  'dynamic-aria-busy': ['Blindness', 'Cognitive Disabilities'],
  'page-load': ['Various'],
};

const ALL_DISABILITIES = [
  'Blindness',
  'Low Vision',
  'Colorblindness',
  'Deafness and Hard-of-Hearing',
  'Deafblindness',
  'Dexterity/Motor Disabilities',
  'Speech Disabilities',
  'Cognitive Disabilities',
  'Reading Disabilities',
  'Seizure Disorders',
  'Various',
];


function severityRank(level) {
  if (level === 'critical') return 3;
  if (level === 'serious') return 2;
  if (level === 'moderate') return 1;
  return 0;
}

function computeIssueMetrics(reportData) {
  const severity = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  const pageMap = new Map((reportData.urls || []).map((u) => [u, { issues: 0, worst: 'minor' }]));

  Object.entries(reportData.axeResults || {}).forEach(([url, data]) => {
    (data.violations || []).forEach((v) => {
      const impact = String(v.impact || 'moderate').toLowerCase();
      const level = ['critical', 'serious', 'moderate', 'minor'].includes(impact) ? impact : 'moderate';
      const count = Math.max(1, (v.nodes || []).length || 1);
      severity[level] += count;

      const current = pageMap.get(url) || { issues: 0, worst: 'minor' };
      current.issues += count;
      if (severityRank(level) > severityRank(current.worst)) current.worst = level;
      pageMap.set(url, current);
    });
  });

  (reportData.customResults || []).forEach((r) => {
    if (r.status !== 'fail' && r.status !== 'warn') return;
    const rem = getRemediation(r.id, null);
    const level =
      r.status === 'fail' ? ((rem.impact || '').toLowerCase() === 'high' ? 'critical' : 'serious') : 'moderate';
    severity[level] += 1;
    if (!r.url) return;
    const current = pageMap.get(r.url) || { issues: 0, worst: 'minor' };
    current.issues += 1;
    if (severityRank(level) > severityRank(current.worst)) current.worst = level;
    pageMap.set(r.url, current);
  });

  const mostAffectedPages = [...pageMap.entries()]
    .map(([url, v]) => ({ url, issues: v.issues, worst: v.worst }))
    .filter((x) => x.issues > 0)
    .sort((a, b) => b.issues - a.issues || severityRank(b.worst) - severityRank(a.worst));

  return {
    severity,
    mostAffectedPages,
    pagesAffected: mostAffectedPages.length,
  };
}

/** Decide which monospaced "language" hint to render the fix snippet with. */
function snippetLanguage(snippet) {
  if (typeof snippet !== 'string') return 'text';
  if (/^\s*</.test(snippet)) return 'html';
  if (/[{};]/.test(snippet)) return 'css';
  return 'text';
}

/** Quick build of an occurrence index so the issue drawer can show per-page/global counts. */
function buildOccurrenceIndex(reportData) {
  /** @type {Record<string, { total: number, byUrl: Record<string, number>, pages: Set<string> }>} */
  const idx = {};
  function bump(key, url, n = 1) {
    if (!idx[key]) idx[key] = { total: 0, byUrl: {}, pages: new Set() };
    idx[key].total += n;
    if (url) {
      idx[key].byUrl[url] = (idx[key].byUrl[url] || 0) + n;
      idx[key].pages.add(url);
    }
  }
  (reportData.customResults || []).forEach((r) => bump(`custom:${r.id}`, r.url, 1));
  Object.entries(reportData.axeResults || {}).forEach(([url, data]) => {
    (data.violations || []).forEach((v) => {
      bump(`axe:${v.id}`, url, Math.max(1, (v.nodes || []).length || 1));
    });
  });
  return idx;
}

export function buildAstroMainReportPayload(reportData) {
  if (!reportData || typeof reportData !== 'object') {
    throw new Error('buildAstroMainReportPayload: reportData is required');
  }

  const occIndex = buildOccurrenceIndex(reportData);

  /**
   * Wrap the raw remediation/result into the shape the dashboard consumes.
   * Adds: occurrencesTotal, occurrencesOnPage, pages[], fixCode, fixCodeLanguage.
   */
  function makeFixItem(base) {
    const occKey = base.type === 'violation' ? `axe:${base.id}` : `custom:${base.id}`;
    const occ = occIndex[occKey] || { total: 0, byUrl: {}, pages: new Set() };
    return {
      ...base,
      pages: [...occ.pages],
      occurrencesTotal: occ.total,
      occurrencesOnPage: base.url ? occ.byUrl[base.url] || 0 : 0,
      fixCode: typeof base.snippet === 'string' ? base.snippet : '',
      fixCodeLanguage: snippetLanguage(base.snippet),
    };
  }

  const fixOrderItems = [];
  (reportData.customResults || []).forEach((r) => {
    if (r.status === 'fail' || r.status === 'warn') {
      const rem = getRemediation(r.id, null);
      fixOrderItems.push(makeFixItem({
        type: 'custom',
        rule: r.rule,
        id: r.id,
        url: r.url,
        status: r.status,
        ...rem,
      }));
    }
  });
  Object.entries(reportData.axeResults || {}).forEach(([url, data]) => {
    (data.violations || []).forEach((v) => {
      const rem = getRemediation(null, v.id);
      fixOrderItems.push(makeFixItem({
        type: 'violation',
        rule: v.help,
        id: v.id,
        url,
        status: 'violation',
        ...rem,
      }));
    });
  });
  fixOrderItems.sort((a, b) => fixOrderScore(a) - fixOrderScore(b));

  // How many WCAG SCs do our automated checks (custom + axe remediations) cover?
  const coveredSc = new Set();
  Object.values(REMEDIATION_MAP).forEach((rem) => (rem.wcag || []).forEach((sc) => coveredSc.add(sc)));
  Object.values(AXE_REMEDIATION).forEach((rem) => (rem.wcag || []).forEach((sc) => coveredSc.add(sc)));
  const coveredScCount = coveredSc.size;

  const pass = reportData.summary?.pass || 0;
  const fail = reportData.summary?.fail || 0;
  const warn = reportData.summary?.warn || 0;
  const info = reportData.summary?.info || 0;
  const totalAxeViolations = Object.values(reportData.axeResults || {}).reduce(
    (sum, r) => sum + (r.violations?.length || 0),
    0
  );
  const totalAxePasses = Object.values(reportData.axeResults || {}).reduce(
    (sum, r) => sum + (r.passes?.length || 0),
    0
  );
  const scoreDen = pass + fail + warn + totalAxeViolations + totalAxePasses;
  const total = pass + fail + warn + info + totalAxeViolations + totalAxePasses;
  const score = scoreDen === 0 ? 100 : Math.round(((pass + totalAxePasses) / scoreDen) * 100);
  const scoreClamp = Math.max(0, Math.min(100, score));

  const disabilityStats = {};
  ALL_DISABILITIES.forEach((d) => {
    disabilityStats[d] = 0;
  });
  (reportData.customResults || []).forEach((r) => {
    (DISABILITY_MAP[r.id] || ['Various']).forEach((d) => {
      if (disabilityStats[d] !== undefined) disabilityStats[d]++;
    });
  });
  [...MANUAL_VERIFICATION_ITEMS, ...ASSISTIVE_TECH_ITEMS].forEach((item) => {
    (item.disabilities || []).forEach((d) => {
      if (disabilityStats[d] !== undefined) disabilityStats[d]++;
    });
  });
  Object.values(reportData.axeResults || {}).forEach((data) => {
    const count = (data.violations?.length || 0) * Math.max(1, reportData.urls?.length || 1);
    disabilityStats['Various'] = (disabilityStats['Various'] || 0) + count;
  });

  const issueMetrics = computeIssueMetrics(reportData);
  const chartPayload = buildChartDataPayload(reportData, {
    pass,
    fail,
    warn,
    info,
    totalAxeViolations,
    scoreClamp,
    disabilityStats,
  });

  const primaryHost = (() => {
    const first = (reportData.urls || [])[0];
    if (!first) return 'this-site';
    try {
      return String(new URL(first).hostname || 'this-site').replace(/^www\./, '');
    } catch {
      return 'this-site';
    }
  })();

  const auditedDate = reportData.generatedAt
    ? new Date(reportData.generatedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  const executiveSummaryHtml = buildExecutiveSummaryHtml({
    reportData,
    scoreClamp,
    pass,
    fail,
    warn,
    totalAxeViolations,
    total,
    fixOrderItems,
  });

  const chartsSectionHtml = buildChartsSectionHtml(chartPayload, 'a11y-chart-data-astro');
  const chartStyles = buildChartSectionStyles();

  // Severity buckets in the prototype's vocabulary (errors / warnings / passed / notice)
  const severityCounts = {
    errors: fail + totalAxeViolations,
    warnings: warn,
    passed: pass + totalAxePasses,
    notice: info,
  };

  // Per-page table: errors/warnings/passed per URL.
  const pageBuckets = new Map();
  (reportData.urls || []).forEach((url) => {
    pageBuckets.set(url, { url, title: titleFromUrl(url), errors: 0, warnings: 0, passed: 0 });
  });
  (reportData.customResults || []).forEach((r) => {
    const bucket = pageBuckets.get(r.url) || { url: r.url, title: titleFromUrl(r.url), errors: 0, warnings: 0, passed: 0 };
    if (r.status === 'fail') bucket.errors += 1;
    else if (r.status === 'warn') bucket.warnings += 1;
    else if (r.status === 'pass') bucket.passed += 1;
    pageBuckets.set(r.url, bucket);
  });
  Object.entries(reportData.axeResults || {}).forEach(([url, data]) => {
    const bucket = pageBuckets.get(url) || { url, title: titleFromUrl(url), errors: 0, warnings: 0, passed: 0 };
    bucket.errors += (data.violations || []).length;
    bucket.passed += (data.passes || []).length;
    pageBuckets.set(url, bucket);
  });
  const pagesTable = [...pageBuckets.values()];

  // Per-rule table for the rules tab. Keyed on rule id, counts occurrences across pages.
  const ruleBuckets = new Map();
  (reportData.customResults || []).forEach((r) => {
    const key = `custom:${r.id}`;
    const bucket = ruleBuckets.get(key) || {
      id: r.id,
      rule: r.rule || r.id,
      type: 'custom',
      severity: severityFromStatus(r.status),
      occurrences: 0,
      pages: new Set(),
    };
    bucket.occurrences += 1;
    if (r.url) bucket.pages.add(r.url);
    ruleBuckets.set(key, bucket);
  });
  Object.entries(reportData.axeResults || {}).forEach(([url, data]) => {
    (data.violations || []).forEach((v) => {
      const key = `axe:${v.id}`;
      const bucket = ruleBuckets.get(key) || {
        id: v.id,
        rule: v.help || v.id,
        type: 'axe',
        severity: 'error',
        occurrences: 0,
        pages: new Set(),
      };
      bucket.occurrences += Math.max(1, (v.nodes || []).length || 1);
      bucket.pages.add(url);
      ruleBuckets.set(key, bucket);
    });
  });
  const rulesTable = [...ruleBuckets.values()]
    .map((b) => ({ ...b, pages: [...b.pages] }))
    .sort((a, b) => b.occurrences - a.occurrences);

  return {
    primaryHost,
    auditedDate,
    scoreClamp,
    pass,
    fail,
    warn,
    info,
    totalAxeViolations,
    totalAxePasses,
    total,
    severityCounts,
    issueMetrics,
    executiveSummaryHtml,
    chartsSectionHtml,
    chartStyles,
    chartPayload,
    disabilityStats,
    fixOrderItems,
    fixOrderTop: fixOrderItems.slice(0, 20),
    pagesTable,
    rulesTable,
    coveredScCount,
    urls: reportData.urls || [],
    reportData,
  };
}

function severityFromStatus(status) {
  if (status === 'fail') return 'error';
  if (status === 'warn') return 'warning';
  if (status === 'pass') return 'passed';
  return 'notice';
}

function titleFromUrl(url) {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/$/, '');
    if (!path) return 'Home';
    const last = path.split('/').filter(Boolean).pop();
    if (!last) return 'Home';
    return last
      .replace(/[-_]+/g, ' ')
      .replace(/\.[a-z]+$/i, '')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return url;
  }
}
