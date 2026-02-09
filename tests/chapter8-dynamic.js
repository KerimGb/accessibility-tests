/**
 * Chapter 8: Dynamic Updates, AJAX, and Single-Page Applications
 * Based on: module-dynamic-updates-checklist.pdf
 */
export const chapterId = 'dynamicUpdates';

export async function runDynamicChecks(page) {
  const results = [];

  // Auto-refresh meta
  const refreshMeta = await page.evaluate(() => {
    const meta = document.querySelector('meta[http-equiv="refresh"]');
    return !!meta;
  });

  results.push({
    id: 'no-auto-refresh',
    rule: 'Page MUST NOT refresh or reload automatically',
    status: !refreshMeta ? 'pass' : 'fail',
    message: refreshMeta ? 'Meta refresh found - may auto-reload page' : 'No meta refresh',
    chapter: chapterId,
  });

  // ARIA live regions (SPA often use these)
  const liveRegions = await page.evaluate(() => {
    const live = document.querySelectorAll('[aria-live]');
    return live.length;
  });

  results.push({
    id: 'dynamic-announcements',
    rule: 'Dynamic content changes SHOULD be announced (aria-live, etc.)',
    status: 'info',
    message: `Found ${liveRegions} aria-live region(s) - verify status messages are announced`,
    chapter: chapterId,
  });

  return results;
}
