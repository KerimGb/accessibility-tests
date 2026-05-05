export function emptyReport() {
  return {
    generatedAt: new Date().toISOString(),
    urls: [],
    axeResults: {},
    customResults: [],
    summary: { pass: 0, fail: 0, warn: 0, info: 0 },
    screenshots: {},
  };
}

export function computeCustomSummary(customResults) {
  const summary = { pass: 0, fail: 0, warn: 0, info: 0 };
  (customResults || []).forEach((r) => {
    if (r.status === 'pass') summary.pass += 1;
    else if (r.status === 'fail') summary.fail += 1;
    else if (r.status === 'warn') summary.warn += 1;
    else if (r.status === 'info') summary.info += 1;
    else summary.warn += 1;
  });
  return summary;
}

export function mergeReportData(existing, incoming) {
  const prev = existing || emptyReport();
  const next = incoming || emptyReport();
  const incomingUrls = new Set(next.urls || []);

  const merged = {
    generatedAt: new Date().toISOString(),
    urls: [...new Set([...(prev.urls || []), ...(next.urls || [])])],
    axeResults: { ...(prev.axeResults || {}) },
    customResults: [],
    screenshots: { ...(prev.screenshots || {}) },
    summary: { pass: 0, fail: 0, warn: 0, info: 0 },
  };

  Object.entries(next.axeResults || {}).forEach(([url, data]) => {
    merged.axeResults[url] = data;
  });

  const keptCustom = (prev.customResults || []).filter((r) => !incomingUrls.has(r.url));
  const mergedCustom = [...keptCustom, ...(next.customResults || [])];
  merged.customResults = mergedCustom;
  merged.summary = computeCustomSummary(mergedCustom);

  Object.entries(next.screenshots || {}).forEach(([url, value]) => {
    merged.screenshots[url] = value;
  });

  return merged;
}

export function computeIssueCountFromResult(resultJson) {
  if (!resultJson || typeof resultJson !== 'object') return 0;
  const summary = resultJson.summary || {};
  const fail = Number(summary.fail || 0);
  const warn = Number(summary.warn || 0);
  const axe = Object.values(resultJson.axeResults || {}).reduce(
    (sum, r) => sum + Number((r && r.violations && r.violations.length) || 0),
    0
  );
  return fail + warn + axe;
}
