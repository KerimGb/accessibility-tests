/**
 * Deque University accessibility checklist structure.
 * Maps test categories to the 8 module chapters for reporting.
 */
export const CHECKLIST_CHAPTERS = {
  semantics: {
    id: '1',
    name: 'Semantic Structure and Navigation',
    source: 'https://media.dequeuniversity.com/courses/generic/testing-basic-method-and-tools/2.0/en/docs/module-semantic-checklist.pdf',
  },
  images: {
    id: '2',
    name: 'Images, Canvas, SVG, and Non-Text Content',
    source: 'https://media.dequeuniversity.com/courses/generic/testing-basic-method-and-tools/2.0/en/docs/module-images-checklist.pdf',
  },
  visualDesign: {
    id: '3',
    name: 'Visual Design and Colors',
    source: 'https://media.dequeuniversity.com/courses/generic/testing-basic-method-and-tools/2.0/en/docs/module-visual-design-checklist.pdf',
  },
  responsive: {
    id: '4',
    name: 'Responsive Design and Zoom',
    source: 'https://media.dequeuniversity.com/courses/generic/testing-basic-method-and-tools/2.0/en/docs/module-responsive-zoom-checklist.pdf',
  },
  multimedia: {
    id: '5',
    name: 'Multimedia, Animations, and Motion',
    source: 'https://media.dequeuniversity.com/courses/generic/testing-basic-method-and-tools/2.0/en/docs/module-multimedia-checklist.pdf',
  },
  inputMethods: {
    id: '6',
    name: 'Device-Independent Input Methods',
    source: 'https://media.dequeuniversity.com/courses/generic/testing-basic-method-and-tools/2.0/en/docs/module-input-methods-checklist.pdf',
  },
  forms: {
    id: '7',
    name: 'Form Labels, Instructions, and Validation',
    source: 'https://media.dequeuniversity.com/courses/generic/testing-basic-method-and-tools/2.0/en/docs/module-forms-checklist.pdf',
  },
  dynamicUpdates: {
    id: '8',
    name: 'Dynamic Updates, AJAX, and SPAs',
    source: 'https://media.dequeuniversity.com/courses/generic/testing-basic-method-and-tools/2.0/en/docs/module-dynamic-updates-checklist.pdf',
  },
};

/**
 * Axe rule tags mapped to checklist chapters.
 * Used to categorize axe results in the report.
 */
export const AXE_TAG_TO_CHAPTER = {
  'wcag2a': ['semantics', 'images', 'forms', 'inputMethods'],
  'wcag2aa': ['semantics', 'images', 'visualDesign', 'forms', 'inputMethods'],
  'wcag21a': ['semantics', 'images', 'forms', 'inputMethods'],
  'wcag21aa': ['semantics', 'images', 'visualDesign', 'forms', 'inputMethods'],
  'wcag22aa': ['semantics', 'images', 'visualDesign', 'forms', 'inputMethods'],
  'best-practice': ['semantics', 'images', 'forms', 'inputMethods', 'dynamicUpdates'],
  'cat.semantics': ['semantics'],
  'cat.name-role-value': ['semantics', 'forms', 'inputMethods'],
  'cat.structure': ['semantics'],
  'cat.color': ['visualDesign'],
  'cat.parsing': ['semantics'],
  'cat.aria': ['semantics', 'forms', 'inputMethods', 'dynamicUpdates'],
  'cat.forms': ['forms'],
  'cat.keyboard': ['inputMethods'],
  'cat.focus': ['inputMethods', 'semantics'],
  'cat.language': ['semantics'],
  'cat.text-alternatives': ['images'],
  'cat.time-based-media': ['multimedia'],
  'cat.sensory-and-visual-cues': ['visualDesign'],
  'cat.layout': ['responsive', 'visualDesign'],
  'cat.motion': ['multimedia'],
};
