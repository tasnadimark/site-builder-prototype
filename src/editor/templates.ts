// Starting points for sections and blocks added by hand. They are ordinary documents
// fragments, validated by the same schema as everything else.

import type { BLOCK_KINDS, SECTION_TYPES } from '@/site/vocab';

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
  cta: {
    label: 'Call to action',
    section: { type: 'cta', tone: 'accent', layout: { kind: 'stack' }, intro: { heading: 'Ready when *you* are.', body: 'One line that removes the last doubt.', actions: [{ label: 'Get started' }], align: 'center' } },
  },
};
