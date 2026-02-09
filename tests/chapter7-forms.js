/**
 * Chapter 7: Form Labels, Instructions, and Validation
 * Based on: module-forms-checklist.pdf
 */
export const chapterId = 'forms';

export async function runFormChecks(page) {
  const results = [];

  const formChecks = await page.evaluate(() => {
    const inputs = document.querySelectorAll(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="image"]), textarea, select'
    );
    const missingLabel = [];
    const placeholderOnly = [];
    const requiredNoIndicator = [];

    inputs.forEach((input, i) => {
      const id = input.getAttribute('id');
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledby = input.getAttribute('aria-labelledby');
      const placeholder = input.getAttribute('placeholder');
      const label = id ? document.querySelector(`label[for="${id}"]`) : input.closest('label');
      const hasLabel = !!(label?.textContent?.trim() || ariaLabel || ariaLabelledby);
      if (!hasLabel) missingLabel.push({ index: i + 1, type: input.type || input.tagName });
      if (hasLabel && !label?.textContent?.trim() && !ariaLabel && !ariaLabelledby && placeholder) {
        placeholderOnly.push(i + 1);
      }
      if (input.required && !input.getAttribute('aria-required')) {
        requiredNoIndicator.push(i + 1);
      }
    });

    return {
      total: inputs.length,
      missingLabel,
      placeholderOnly,
      requiredNoIndicator,
    };
  });

  if (formChecks.total > 0) {
    results.push({
      id: 'form-labels',
      rule: 'Form inputs MUST have programmatically-associated labels',
      status: formChecks.missingLabel.length === 0 ? 'pass' : 'fail',
      message:
        formChecks.missingLabel.length > 0
          ? `${formChecks.missingLabel.length} input(s) without proper label`
          : 'All inputs have labels',
      chapter: chapterId,
    });

    results.push({
      id: 'placeholder-not-only-label',
      rule: 'Placeholder MUST NOT be the only label for inputs',
      status: formChecks.placeholderOnly.length === 0 ? 'pass' : 'fail',
      message:
        formChecks.placeholderOnly.length > 0
          ? `${formChecks.placeholderOnly.length} input(s) may use placeholder as only label`
          : 'No placeholder-only labels',
      chapter: chapterId,
    });
  }

  return results;
}
