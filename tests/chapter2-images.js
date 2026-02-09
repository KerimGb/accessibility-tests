/**
 * Chapter 2: Images, Canvas, SVG, and Non-Text Content
 * Based on: module-images-checklist.pdf
 */
export const chapterId = 'images';

export async function runImageChecks(page) {
  const results = [];

  // Informative images - must have alt
  const imageChecks = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img');
    const missingAlt = [];
    const emptyAlt = [];
    const longAlt = [];
    const decorativeWithAlt = [];

    imgs.forEach((img, i) => {
      const alt = img.getAttribute('alt');
      const role = img.getAttribute('role');
      const src = (img.getAttribute('src') || '').toLowerCase();

      if (alt === null || alt === undefined) {
        missingAlt.push({ index: i + 1, src: src.substring(0, 50) });
      } else if (alt === '') {
        emptyAlt.push(i + 1);
      } else if (alt.length > 250) {
        longAlt.push({ index: i + 1, length: alt.length });
      }

      // Decorative indicators: very small, spacer, pixel, blank
      const looksDecorative =
        role === 'presentation' ||
        /spacer|pixel|blank|\.gif$/i.test(src) ||
        (img.width <= 1 && img.height <= 1);
      if (looksDecorative && alt && alt.length > 0) {
        decorativeWithAlt.push(i + 1);
      }
    });

    return {
      total: imgs.length,
      missingAlt,
      emptyAlt,
      longAlt,
      decorativeWithAlt,
    };
  });

  if (imageChecks.total > 0) {
    results.push({
      id: 'img-alt',
      rule: 'Informative images MUST have programmatically-discernible alternative text',
      status: imageChecks.missingAlt.length === 0 ? 'pass' : 'fail',
      message:
        imageChecks.missingAlt.length > 0
          ? `${imageChecks.missingAlt.length} image(s) missing alt attribute`
          : `${imageChecks.total} images have alt text`,
      chapter: chapterId,
    });

    if (imageChecks.longAlt.length > 0) {
      results.push({
        id: 'img-alt-length',
        rule: 'Alternative text SHOULD be concise (≤250 characters)',
        status: 'warn',
        message: `${imageChecks.longAlt.length} image(s) with alt > 250 chars`,
        chapter: chapterId,
      });
    }
  }

  // SVG
  const svgChecks = await page.evaluate(() => {
    const svgs = document.querySelectorAll('svg');
    const noRole = [];
    const noAccessibleName = [];
    svgs.forEach((svg, i) => {
      const role = svg.getAttribute('role');
      const ariaLabel = svg.getAttribute('aria-label');
      const ariaLabelledby = svg.getAttribute('aria-labelledby');
      const title = svg.querySelector('title');
      const hasAccessibleName = !!(ariaLabel || ariaLabelledby || (title && title.textContent?.trim()));
      if (!role || role !== 'img') noRole.push(i + 1);
      if (!hasAccessibleName) noAccessibleName.push(i + 1);
    });
    return { total: svgs.length, noRole, noAccessibleName };
  });

  if (svgChecks.total > 0) {
    results.push({
      id: 'svg-role',
      rule: 'SVG elements SHOULD have role="img"',
      status: svgChecks.noRole.length === 0 ? 'pass' : 'warn',
      message:
        svgChecks.noRole.length > 0
          ? `${svgChecks.noRole.length} SVG(s) without role="img"`
          : 'All SVGs have role',
      chapter: chapterId,
    });
    results.push({
      id: 'svg-accessible-name',
      rule: 'Informative/actionable SVGs MUST have meaningful alternative text',
      status: svgChecks.noAccessibleName.length === 0 ? 'pass' : 'warn',
      message:
        svgChecks.noAccessibleName.length > 0
          ? `${svgChecks.noAccessibleName.length} SVG(s) without accessible name`
          : 'All SVGs have accessible names',
      chapter: chapterId,
    });
  }

  // Canvas
  const canvasChecks = await page.evaluate(() => {
    const canvases = document.querySelectorAll('canvas');
    const noRole = [];
    const noAlt = [];
    canvases.forEach((canvas, i) => {
      const role = canvas.getAttribute('role');
      const ariaLabel = canvas.getAttribute('aria-label');
      const ariaLabelledby = canvas.getAttribute('aria-labelledby');
      if (!role || role !== 'img') noRole.push(i + 1);
      if (!ariaLabel && !ariaLabelledby) noAlt.push(i + 1);
    });
    return { total: canvases.length, noRole, noAlt };
  });

  if (canvasChecks.total > 0) {
    results.push({
      id: 'canvas-alt',
      rule: 'Canvas elements MUST have role="img" and text alternative',
      status: canvasChecks.noAlt.length === 0 && canvasChecks.noRole.length === 0 ? 'pass' : 'fail',
      message:
        canvasChecks.noAlt.length > 0 || canvasChecks.noRole.length > 0
          ? `${canvasChecks.total} canvas element(s) need role and alternative text`
          : 'All canvases have role and alt',
      chapter: chapterId,
    });
  }

  // Image maps
  const mapChecks = await page.evaluate(() => {
    const imgWithMap = document.querySelectorAll('img[usemap]');
    const areaNoAlt = [];
    imgWithMap.forEach((img) => {
      const mapName = img.getAttribute('usemap')?.replace('#', '');
      const mapEl = document.querySelector(`map[name="${mapName}"]`);
      if (mapEl) {
        mapEl.querySelectorAll('area').forEach((area, i) => {
          const alt = area.getAttribute('alt');
          if (!alt && alt !== '') areaNoAlt.push(i + 1);
        });
      }
    });
    return { total: imgWithMap.length, areaNoAlt: areaNoAlt.length };
  });

  if (mapChecks.total > 0 && mapChecks.areaNoAlt > 0) {
    results.push({
      id: 'image-map-alt',
      rule: 'Image map areas MUST have alternative text',
      status: 'fail',
      message: `${mapChecks.areaNoAlt} area(s) in image map without alt`,
      chapter: chapterId,
    });
  }

  return results;
}
