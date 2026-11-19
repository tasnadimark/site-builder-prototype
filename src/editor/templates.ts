// Starting points for sections and blocks added by hand. They are ordinary documents
// fragments, validated by the same schema as everything else.

import type { BLOCK_KINDS, PAGE_ROLES, SECTION_TYPES } from '@/site/vocab';

type SectionType = (typeof SECTION_TYPES)[number];
type BlockKind = (typeof BLOCK_KINDS)[number];

const img = (prompt: string, aspect = 'landscape') => ({ prompt, alt: '', aspect });

export const BLOCK_TEMPLATES: Record<BlockKind, object> = {
  card: { kind: 'card', icon: 'sparkles', title: 'A clear benefit', body: 'One or two sentences that explain why it matters to the customer.' },
  stat: { kind: 'stat', value: '98%', label: 'of customers would recommend us' },
  quote: { kind: 'quote', text: 'Short, specific praise works better than a long paragraph.', author: 'Alex Morgan', role: 'Customer' },
  image: { kind: 'image', image: img('A photograph that shows the product in use') },
  plan: { kind: 'plan', name: 'Standard', price: '$29', period: 'per month', features: ['What is included', 'Another thing', 'One more'], cta: 'Choose plan' },
  qa: { kind: 'qa', q: 'A question customers often ask?', a: 'A direct answer in two or three sentences.' },
  step: { kind: 'step', title: 'What happens next', body: 'Describe this step in a sentence.' },
  logo: { kind: 'logo', name: 'Company' },
  row: { kind: 'row', title: 'Service or item', detail: 'A short detail', value: '€30' },
  person: { kind: 'person', name: 'Alex Morgan', role: 'Role', bio: 'Two sentences about their experience and what they are known for.' },
  contact: { kind: 'contact', map: true },
  form: { kind: 'form', fields: ['name', 'email', 'phone', 'message'] },
  rating: { kind: 'rating' },
  check: { kind: 'check', label: 'Something customers can count on' },
};

const copies = (b: object, n: number) => Array.from({ length: n }, () => ({ ...b }));

export const SECTION_TEMPLATES: Record<SectionType, { label: string; section: object }> = {
  hero: {
    label: 'Hero',
    section: {
      type: 'hero', layout: { kind: 'split' },
      intro: { eyebrow: 'New', heading: 'Say the *one thing* that matters.', body: 'A sentence that explains who this is for and what they get.', actions: [{ label: 'Get started' }, { label: 'Learn more', kind: 'secondary' }] },
      media: img('A photograph that shows the product in use', 'portrait'),
    },
  },
  logos: {
    label: 'Logos',
    section: { type: 'logos', pad: 'sm', layout: { kind: 'marquee' }, intro: { eyebrow: 'Trusted by', align: 'center' }, blocks: ['Northwind', 'Harbour & Co', 'Atlas', 'Fieldwork', 'Lumen', 'Parcel'].map((name) => ({ kind: 'logo', name })) },
  },
  features: {
    label: 'Features',
    section: { type: 'features', layout: { kind: 'grid', columns: 3 }, intro: { eyebrow: 'Features', heading: 'What you get', align: 'start' }, blocks: copies(BLOCK_TEMPLATES.card, 3) },
  },
  steps: {
    label: 'Steps',
    section: { type: 'steps', layout: { kind: 'grid', columns: 3 }, intro: { eyebrow: 'How it works', heading: 'Three steps', align: 'start' }, blocks: copies(BLOCK_TEMPLATES.step, 3) },
  },
  story: {
    label: 'Story',
    section: {
      type: 'story', layout: { kind: 'split', flip: true },
      intro: { eyebrow: 'Our story', heading: 'Why we started', body: 'A short paragraph about where the business came from and what it cares about.' },
      media: img('A photograph of the people or place behind the business'),
    },
  },
  stats: {
    label: 'Stats',
    section: { type: 'stats', tone: 'inverse', layout: { kind: 'grid', columns: 4 }, blocks: copies(BLOCK_TEMPLATES.stat, 4) },
  },
  testimonials: {
    label: 'Testimonials',
    section: { type: 'testimonials', layout: { kind: 'grid', columns: 3 }, intro: { eyebrow: 'Customers', heading: 'What people say', align: 'center' }, blocks: copies(BLOCK_TEMPLATES.quote, 3) },
  },
  pricing: {
    label: 'Pricing',
    section: {
      type: 'pricing', tone: 'muted', layout: { kind: 'grid', columns: 3 }, intro: { eyebrow: 'Pricing', heading: 'Simple plans', align: 'center' },
      blocks: [
        { ...BLOCK_TEMPLATES.plan, name: 'Starter', price: '$9' },
        { ...BLOCK_TEMPLATES.plan, featured: true },
        { ...BLOCK_TEMPLATES.plan, name: 'Team', price: '$79' },
      ],
    },
  },
  faq: {
    label: 'FAQ',
    section: { type: 'faq', layout: { kind: 'split' }, intro: { eyebrow: 'Questions', heading: 'Good to know' }, blocks: copies(BLOCK_TEMPLATES.qa, 4) },
  },
  gallery: {
    label: 'Gallery',
    section: {
      type: 'gallery', layout: { kind: 'bento', columns: 4 }, intro: { eyebrow: 'Gallery', heading: 'A closer look', align: 'start' },
      blocks: [
        { kind: 'image', size: 'feature', image: img('A wide establishing photograph') },
        { kind: 'image', image: img('A close-up detail', 'square') },
        { kind: 'image', image: img('A second close-up detail', 'square') },
        { kind: 'image', size: 'wide', image: img('People using the product') },
      ],
    },
  },
  prices: {
    label: 'Price list',
    section: {
      type: 'prices', layout: { kind: 'grid', columns: 2 }, intro: { eyebrow: 'Prices', heading: 'What it costs', align: 'start' },
      blocks: [
        { kind: 'row', group: 'First group', title: 'Service one', detail: '30 minutes', value: '€30' },
        { kind: 'row', group: 'First group', title: 'Service two', detail: '45 minutes', value: '€45' },
        { kind: 'row', group: 'Second group', title: 'Service three', detail: '60 minutes', value: '€60' },
        { kind: 'row', group: 'Second group', title: 'Service four', detail: '90 minutes', value: '€80' },
      ],
    },
  },
  timetable: {
    label: 'Timetable',
    section: {
      type: 'timetable', layout: { kind: 'grid', columns: 3 }, intro: { eyebrow: 'Timetable', heading: 'This week', align: 'start' },
      blocks: ['Monday', 'Wednesday', 'Friday'].flatMap((day) => [
        { kind: 'row', group: day, title: 'Morning class', detail: 'All levels', value: '8:00' },
        { kind: 'row', group: day, title: 'Evening class', detail: 'Intermediate', value: '18:30' },
      ]),
    },
  },
  team: {
    label: 'Team',
    section: { type: 'team', layout: { kind: 'grid', columns: 3 }, intro: { eyebrow: 'Team', heading: 'Who you will meet', align: 'start' }, blocks: copies(BLOCK_TEMPLATES.person, 3) },
  },
  title: {
    label: 'Page title',
    section: { type: 'title', layout: { kind: 'stack' }, intro: { heading: 'Page title', body: 'One sentence about what this page holds.', align: 'start' } },
  },
  contact: {
    label: 'Contact',
    section: {
      type: 'contact', tone: 'muted', layout: { kind: 'grid', columns: 2 }, intro: { eyebrow: 'Contact', heading: 'Get in touch', align: 'start' },
      blocks: [BLOCK_TEMPLATES.contact, BLOCK_TEMPLATES.form],
    },
  },
  cta: {
    label: 'Call to action',
    section: { type: 'cta', tone: 'accent', layout: { kind: 'stack' }, intro: { heading: 'Ready when *you* are.', body: 'One line that removes the last doubt.', actions: [{ label: 'Get started' }], align: 'center' } },
  },
};

type PageRole = Exclude<(typeof PAGE_ROLES)[number], 'home'>;

const pageIntro = (heading: string, body: string) => ({ type: 'story', layout: { kind: 'stack' }, intro: { heading, body, align: 'start' } });

/** Starting points for pages added by hand. One per page role. */
export const PAGE_TEMPLATES: Record<PageRole, { label: string; title: { en: string; hu: string }; sections: object[] }> = {
  offer: {
    label: 'Services and prices',
    title: { en: 'Services', hu: 'Szolgáltatások' },
    sections: [pageIntro('Services and prices', 'What is on offer, and what it costs.'), { ...SECTION_TEMPLATES.prices.section, intro: {} }],
  },
  approach: {
    label: 'Method',
    title: { en: 'Method', hu: 'Módszer' },
    sections: [pageIntro('How we work', 'What to expect, step by step.'), { ...SECTION_TEMPLATES.steps.section, intro: {} }],
  },
  proof: {
    label: 'Our work',
    title: { en: 'Our work', hu: 'Munkáink' },
    sections: [pageIntro('Our work', 'A selection of finished projects.'), { ...SECTION_TEMPLATES.gallery.section, intro: {} }],
  },
  people: {
    label: 'About or team',
    title: { en: 'About', hu: 'Rólunk' },
    sections: [pageIntro('About us', 'Who is behind the business.'), { ...SECTION_TEMPLATES.team.section, intro: {} }],
  },
  contact: {
    label: 'Contact',
    title: { en: 'Contact', hu: 'Kapcsolat' },
    sections: [SECTION_TEMPLATES.contact.section],
  },
  location: {
    label: 'Location',
    title: { en: 'New location', hu: 'Új helyszín' },
    sections: [{ type: 'contact', layout: { kind: 'stack', width: 'wide' }, intro: { heading: 'Find us here', align: 'start' }, blocks: [BLOCK_TEMPLATES.contact] }],
  },
};
