# Accessibility Test Suite

Automated accessibility testing for websites based on **Deque University** checklists. Generates client-ready reports.

## Checklist Chapters

| Chapter | Topic | Source |
|---------|-------|--------|
| 1 | Semantic Structure and Navigation | [module-semantic-checklist.pdf](https://media.dequeuniversity.com/courses/generic/testing-basic-method-and-tools/2.0/en/docs/module-semantic-checklist.pdf) |
| 2 | Images, Canvas, SVG, Non-Text Content | [module-images-checklist.pdf](https://media.dequeuniversity.com/courses/generic/testing-basic-method-and-tools/2.0/en/docs/module-images-checklist.pdf) |
| 3 | Visual Design and Colors | [module-visual-design-checklist.pdf](https://media.dequeuniversity.com/courses/generic/testing-basic-method-and-tools/2.0/en/docs/module-visual-design-checklist.pdf) |
| 4 | Responsive Design and Zoom | [module-responsive-zoom-checklist.pdf](https://media.dequeuniversity.com/courses/generic/testing-basic-method-and-tools/2.0/en/docs/module-responsive-zoom-checklist.pdf) |
| 5 | Multimedia, Animations, Motion | [module-multimedia-checklist.pdf](https://media.dequeuniversity.com/courses/generic/testing-basic-method-and-tools/2.0/en/docs/module-multimedia-checklist.pdf) |
| 6 | Device-Independent Input Methods | [module-input-methods-checklist.pdf](https://media.dequeuniversity.com/courses/generic/testing-basic-method-and-tools/2.0/en/docs/module-input-methods-checklist.pdf) |
| 7 | Form Labels, Instructions, Validation | [module-forms-checklist.pdf](https://media.dequeuniversity.com/courses/generic/testing-basic-method-and-tools/2.0/en/docs/module-forms-checklist.pdf) |
| 8 | Dynamic Updates, AJAX, SPAs | [module-dynamic-updates-checklist.pdf](https://media.dequeuniversity.com/courses/generic/testing-basic-method-and-tools/2.0/en/docs/module-dynamic-updates-checklist.pdf) |

## Setup

```bash
npm install
npx playwright install chromium   # Download Chromium browser (~250MB, required for tests)
```

## Web UI (recommended)

Start the server and open the form in your browser:

```bash
npm start
```

Then open http://localhost:3456 (or the port shown). You can:

- **Add URLs** in the text area (one per line or comma-separated)
- **Upload a CSV or XML file** (e.g. sitemap.xml) with URLs
- Click **Run accessibility tests** → loading page → redirect to report with unique URL

Each report has a unique ID in the URL, e.g. `http://localhost:3456/report/a1b2c3d4`

## CLI (alternative)

### With urls.config.js

Edit `urls.config.js` and run:

```bash
npm run test:report
```

### With inline URLs

```bash
node run-tests.js --report --urls="https://example.com,https://example.com/about" --output-id=my-run
```

### Generate HTML report from existing results

```bash
npm run report
```

## Output

- **`reports/accessibility-results.json`** – Raw test results (axe violations + custom checks)
- **`reports/accessibility-report.html`** – Client-ready HTML report

## What is tested

- **axe-core (Deque)** – WCAG 2.x automated rules (contrast, ARIA, semantics, forms, etc.)
- **Custom checks** – Semantic structure, page title, lang, landmarks, headings, links, images, forms, responsive layout, multimedia, input methods, dynamic content

Some checklist items require manual verification (e.g., meaningful link text, audio description quality). The report includes pass/warn/fail status and references to the Deque PDFs for full criteria.
