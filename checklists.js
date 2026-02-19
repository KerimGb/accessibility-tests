/**
 * Deque University accessibility checklist structure.
 * Maps test categories to the 8 module chapters for reporting.
 */
export const CHECKLIST_CHAPTERS = {
  semantics: {
    id: '1',
    name: 'Semantic Structure and Navigation',
    source: 'https://media.dequeuniversity.com/courses/generic/testing-basic-method-and-tools/2.0/en/docs/module-semantic-checklist.pdf',
    sourceWcag22: 'https://media.dequeuniversity.com/en/courses/generic/web-semantic-structure-and-navigation/wcag-2.2/docs/module-semantic-checklist-wcag-2.2.pdf',
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

/**
 * Semantic Structure and Navigation checklist (WCAG 2.2)
 * Source: https://media.dequeuniversity.com/en/courses/generic/web-semantic-structure-and-navigation/wcag-2.2/docs/module-semantic-checklist-wcag-2.2.pdf
 */
export const SEMANTIC_CHECKLIST_WCAG22 = [
  {
    section: 'Page Title',
    subsections: [
      {
        title: 'Title for Every Page',
        items: [
          'The page <title> MUST be present and MUST contain text.',
          'The page <title> MUST be updated when the web address changes.',
        ],
      },
      {
        title: 'Meaningful Page Title',
        items: [
          'The page <title> MUST be accurate and informative.',
          'If a page is the result of a user action or scripted change of context, the text of the <title> SHOULD describe the result or change of context to the user.',
          'The <title> SHOULD be concise.',
          'The page <title> SHOULD be unique, if possible.',
          'Unique information SHOULD come first in the <title>.',
          'The page <title> SHOULD match (or be very similar to) the top heading in the main content.',
        ],
      },
    ],
  },
  {
    section: 'Language',
    subsections: [
      {
        title: 'Primary Language of Page',
        items: [
          'The primary language of the page MUST be identified accurately on the <html> element.',
          'The primary language of the page MUST be identified with a valid value on the <html> element.',
        ],
      },
      {
        title: 'Language of Parts Within the Page',
        items: ['Inline language changes MUST be identified with a valid lang attribute.'],
      },
      {
        title: 'Language Codes',
        items: ['The language code MUST be valid.'],
      },
    ],
  },
  {
    section: 'Landmarks',
    subsections: [
      {
        title: 'Creating Landmarks (HTML 5, ARIA)',
        items: [
          'Landmarks SHOULD be used to designate predefined parts of the layout (<header>, <nav>, <main>, <footer>, etc.).',
        ],
      },
      {
        title: 'Best Practices for Landmarks',
        items: [
          'All text SHOULD be contained within a landmark region.',
          'Multiple instances of the same type of landmark SHOULD be distinguishable by different programmatically determinable labels (aria-label or aria-labelledby).',
          'A page SHOULD NOT contain more than one instance of each of the following landmarks: banner, main, and contentinfo.',
          'The total number of landmarks SHOULD be minimized to the extent appropriate for the content.',
        ],
      },
      {
        title: 'Backward Compatibility',
        items: ['Landmarks SHOULD be made backward compatible.'],
      },
    ],
  },
  {
    section: 'General UI Components',
    subsections: [
      {
        title: '',
        items: [
          'In content implemented using markup languages, the purpose of User Interface Components, icons, and regions MAY be programmatically determinable.',
        ],
      },
    ],
  },
  {
    section: 'Headings',
    subsections: [
      {
        title: 'Real Headings',
        items: [
          'Text that acts as a heading visually or structurally MUST be designated as a true heading in the markup.',
          'Text that does not act as a heading visually or structurally MUST NOT be marked as a heading.',
        ],
      },
      {
        title: 'Meaningful Text',
        items: [
          'Headings MUST be accurate and informative.',
          'Heading text SHOULD be concise and relatively brief.',
        ],
      },
      {
        title: 'Outline/Hierarchy of Content',
        items: [
          'Headings SHOULD convey a clear and accurate structural outline of the sections of content of a web page.',
          'Headings SHOULD NOT skip hierarchical levels.',
        ],
      },
      {
        title: 'Heading Level 1 Best Practices',
        items: [
          'The beginning of the main content SHOULD start with <h1>.',
          'Most web pages SHOULD have only one <h1>.',
        ],
      },
    ],
  },
  {
    section: 'Links',
    subsections: [
      {
        title: 'Designate Links Correctly',
        items: [
          'Links MUST be semantically designated as such.',
          'Links and buttons SHOULD be designated semantically according to their functions.',
        ],
      },
      {
        title: 'Link Text',
        items: [
          'A link MUST have programmatically determinable text, as determined by the accessible name calculation algorithm.',
          'The purpose of each link SHOULD be able to be determined from the link text alone.',
          'The link text SHOULD NOT repeat the role ("link").',
          'Features such as labels, names, and text alternatives for content that has the same functionality across multiple web pages MUST be consistently identified.',
        ],
      },
      {
        title: 'Links to External Sites, New Windows, Files',
        items: [
          'A link that opens in a new window or tab SHOULD indicate that it opens in a new window or tab.',
          'A link to a file or destination in an alternative or non-web format SHOULD indicate the file or destination type.',
          'A link to an external site MAY indicate that it leads to an external site.',
        ],
      },
      {
        title: 'Visually Distinguishable from Text',
        items: ['Links MUST be visually distinguishable from surrounding text.'],
      },
      {
        title: 'Visual Focus Indicator',
        items: [
          'All focusable elements MUST have a visual focus indicator when in focus.',
          'Focusable elements SHOULD have enhanced visual focus indicator styles.',
        ],
      },
    ],
  },
  {
    section: 'Navigation Between Pages',
    subsections: [
      {
        title: 'Navigation Lists',
        items: [
          'A navigation list SHOULD be designated with the <nav> element or role="navigation".',
          'A navigation list SHOULD include a visible method of informing users which page within the navigation list is the currently active/visible page.',
          'A navigation list SHOULD include a method of informing blind users which page within the navigation list is the currently active/visible page.',
        ],
      },
      {
        title: 'Consistency',
        items: [
          'Navigation patterns that are repeated on web pages MUST be presented in the same relative order each time they appear and MUST NOT change order when navigating through the site.',
          '[WCAG 2.2] Certain help mechanisms that are repeated on multiple web pages MUST occur in the same relative order to other page content, unless a change is initiated by the user.',
        ],
      },
    ],
  },
  {
    section: 'Navigation Within Pages',
    subsections: [
      {
        title: 'Skip Navigation Links',
        items: [
          'A keyboard-functional "skip" link SHOULD be provided to allow keyboard users to navigate directly to the main content.',
          'The "skip link" should be the first focusable element on the page.',
          'A skip link MUST be either visible at all times or visible on keyboard focus.',
        ],
      },
      {
        title: 'Table of Contents',
        items: [
          'A table of contents for the page MAY be included at the top of the content or in the header.',
          'If a table of contents for the page is included, it SHOULD reflect the heading structure of the page.',
        ],
      },
      {
        title: 'Reading Order and Tab/Focus Order',
        items: [
          'The reading order MUST be logical and intuitive.',
          'The navigation order of focusable elements MUST be logical and intuitive.',
          'tabindex of positive values SHOULD NOT be used.',
        ],
      },
      {
        title: 'Paginated Views',
        items: [
          'A paginated view SHOULD include a visible method of informing users which view is the currently active/visible view.',
          'A paginated view SHOULD include a method of informing blind users which view is the currently active/visible view.',
        ],
      },
      {
        title: 'Single-Key Shortcuts',
        items: [
          'If a single-character-key shortcut exists, then at least one of the following MUST be true: single-character-key shortcuts can be turned off, remapped, or are only active when the relevant user interface component is in focus.',
        ],
      },
    ],
  },
  {
    section: 'Tables',
    subsections: [
      {
        title: 'Semantic Markup for Tabular Data',
        items: ['Tabular data SHOULD be represented in a <table>.'],
      },
      {
        title: 'Table Caption/Name',
        items: [
          'Data tables SHOULD have a programmatically associated caption or name.',
          'The name/caption of a data table SHOULD describe the identity or purpose of the table accurately, meaningfully, and succinctly.',
          'The name/caption of each data table SHOULD be unique within the context of other tables on the same page.',
        ],
      },
      {
        title: 'Table Headers',
        items: [
          'Table headers MUST be designated with <th>.',
          'Data table header text MUST accurately describe the category of the corresponding data cells.',
        ],
      },
      {
        title: 'Simple Header Associations',
        items: ['Table data cells MUST be associated with their corresponding header cells.'],
      },
      {
        title: 'Grouped Header Associations',
        items: ['Table data group headers MUST be associated with their corresponding data cell groups.'],
      },
      {
        title: 'Complex Header Associations',
        items: ['Header/data associations that cannot be designated with <th> and scope MUST be designated with headers plus id.'],
      },
      {
        title: 'Nested or Split Tables',
        items: ['Data table headers and data associations MUST NOT be referenced across nested, merged, or separate tables.'],
      },
      {
        title: 'Layout Tables',
        items: [
          'Tables SHOULD NOT be used for the purpose of purely visual (non-data) layout.',
          'Layout tables MUST NOT contain data table markup.',
        ],
      },
    ],
  },
  {
    section: 'Lists',
    subsections: [
      {
        title: 'Semantic Markup for Lists',
        items: ['Lists MUST be constructed using the appropriate semantic markup.'],
      },
    ],
  },
  {
    section: 'Iframes',
    subsections: [
      {
        title: 'Frame Titles',
        items: [
          'Iframes that convey content to users MUST have a non-empty title attribute.',
          'The iframe title MUST be accurate and descriptive.',
          'Frames MUST have a unique title (in the context of the page).',
        ],
      },
      {
        title: 'Page Title Within an iframe',
        items: ['The source page of an iframe MUST have a valid, meaningful <title>.'],
      },
      {
        title: 'Hiding Iframes that Don\'t Contain Meaningful Content',
        items: ['Hidden frames or frames that do not convey content to users SHOULD be hidden from assistive technologies using aria-hidden="true".'],
      },
    ],
  },
  {
    section: 'Other Semantic Elements',
    subsections: [
      {
        title: '<strong> and <em>',
        items: [
          'Critical emphasis in the text SHOULD be conveyed through visual styling.',
          'Critical emphasis in the text SHOULD be conveyed in a text-based format.',
        ],
      },
      {
        title: '<blockquote> and <q>',
        items: [
          'The <blockquote> element SHOULD be used to designate long (block level) quotations.',
          'The <blockquote> element SHOULD NOT be used for visual styling alone.',
          'The <q> element (for inline quotations) SHOULD NOT be used as the only way to designate quotations.',
        ],
      },
      {
        title: '<code>, <pre>',
        items: [
          'Code SHOULD be marked with the <code> element and styled to look different from non-code text.',
          'Blocks of code SHOULD be formatted with the <pre> element.',
        ],
      },
      {
        title: 'Strikethrough/Delete and Insert',
        items: [
          'Strikethrough text SHOULD be marked with the <del> element.',
          'Critical strikethrough text MUST be supplemented with a text-based method to convey the meaning of the strikethrough.',
          'Text designated for insertion SHOULD be marked with the <ins> element.',
          'Critical text designated for insertion MUST be supplemented with a text-based method to convey the meaning of the insertion.',
        ],
      },
      {
        title: 'Highlighting (<mark>)',
        items: [
          'Highlighted text SHOULD be marked with the <mark> element.',
          'Critical highlighted text SHOULD be supplemented with a text-based method to convey the meaning of the highlighting.',
        ],
      },
    ],
  },
];
