// Choices that code makes for a new site before the AI writes it.
//
// Left to itself the AI converges: in a test of twenty sites it used two of the five
// hero styles, one order of sections and almost no dividers. So the choices that give a
// site its shape are drawn here, from the brief, and handed to the AI as decisions. The
// AI still writes everything and still chooses the look. Any of these can be changed
// afterwards in the inspector like every other setting.
//
// The draw depends only on the brief, so the same brief always gives the same shape.
// For the first screen the code draws three and the AI picks the one that suits the
// business: a blind draw gave a quiet neighbourhood salon the loudest composition.

import { variantFamily } from './plan';
import type { Section, SiteDoc } from './schema';
import { VARIANTS, type EdgeRhythm, type VariantFamily } from './vocab';

type Choice = { id: string; label: string; tell: string };

/** A first-screen composition: what the AI is told, and the fields that make it so. */
export type HeroPlan = Choice & { patch: { hero: string; backdrop?: string; layout?: { kind: string; flip?: boolean }; intro?: { align: string } }; photo?: boolean };

const side = (flip: boolean) => ({ kind: 'split', flip });

export const HERO_PLANS: HeroPlan[] = [
  {
    id: 'edge-right',
    label: 'Picture to the right edge',
    tell: 'hero "edge": copy on the left, a picture running to the right edge of the screen. Layout {"kind":"split","flip":false}.',
    patch: { hero: 'edge', layout: side(false) },
  },
  {
    id: 'edge-left',
    label: 'Picture to the left edge',
    tell: 'hero "edge" with the picture on the left: layout {"kind":"split","flip":true}. Copy sits on the right.',
    patch: { hero: 'edge', layout: side(true) },
  },
  {
    id: 'overlap',
    label: 'Giant heading over a picture',
    tell: 'hero "overlap": a very large heading of two to five words crossing the top of a tall picture.',
    patch: { hero: 'overlap' },
  },
  {
    id: 'wordmark',
    label: 'Brand name as a giant word',
    tell: 'hero "wordmark": the heading is the brand name alone, in one or two words (use its short form if the full name is longer). Eyebrow and body are under ten words each, and the two actions become a bar of links. Loud: for a brand whose name is the message.',
    patch: { hero: 'wordmark' },
  },
  {
    id: 'ticker',
    label: 'Full photo with a moving line',
    tell: 'hero "ticker": a full photo (media with aspect "wide"), the body as one short statement of at most fourteen words, and a heading of three to six words that drifts along the bottom. The loudest of all: for bold brands only.',
    patch: { hero: 'ticker' },
  },
  {
    id: 'photo',
    label: 'Full photo, centred text',
    tell: 'hero "standard" on a full photo: backdrop "media", layout {"kind":"stack"}, intro.align "center", media with aspect "wide". Heading of at most seven words. Describe a picture with calm, even areas so that text can sit on it.',
    patch: { hero: 'standard', backdrop: 'media', layout: { kind: 'stack' }, intro: { align: 'center' } },
    photo: true,
  },
  {
    id: 'split-right',
    label: 'Shaped picture beside the copy',
    tell: 'hero "standard" with layout {"kind":"split","flip":false}: copy on the left, the picture in the theme\'s picture shape on the right, and a compact row of blocks under the copy (three stats, or a rating).',
    patch: { hero: 'standard', layout: side(false) },
  },
  {
    id: 'centred',
    label: 'Centred text, wide picture below',
    tell: 'hero "standard" with layout {"kind":"stack"} and intro.align "center": a centred heading and buttons, then one wide picture below them (media with aspect "wide").',
    patch: { hero: 'standard', layout: { kind: 'stack' }, intro: { align: 'center' } },
  },
];

export const ANGLES: Choice[] = [
  { id: 'offer', label: 'Offer first', tell: 'Straight after the hero, show what the business sells: its services or prices. People and story come later.' },
  { id: 'people', label: 'People first', tell: 'Straight after the hero, introduce the person or team behind the business (a "team" or "story" section). The offer follows.' },
  { id: 'proof', label: 'Proof first', tell: 'Straight after the hero, show proof: customer reviews, numbers or finished work. The offer follows.' },
  { id: 'process', label: 'How it works first', tell: 'Straight after the hero, explain how it works in a "steps" section. The offer follows.' },
];

const CTA_END: Choice = { id: 'cta', label: 'Call to action', tell: 'End Home with a call to action: a section of type "cta".' };
const CONTACT_END: Choice = {
  id: 'contact',
  label: 'Contact section',
  tell: 'End Home with a "contact" section (a contact block beside a form, layout "grid" with 2 columns). Do not add a "cta" section after it.',
};
/** Two in three sites close Home with a call to action, the third with the contact details. */
export const ENDINGS: Choice[] = [CTA_END, CTA_END, CONTACT_END];

const RHYTHMS: EdgeRhythm[] = ['cut', 'strong', 'every'];

/** What the AI has to write for each arrangement to work. */
const VARIANT_TELL: Record<string, string> = {
  'cta/band': 'a centred heading, one sentence and one or two buttons',
  'cta/facts': 'a heading, one sentence and a button; the phone number and opening hours are shown beside them automatically',
  'cta/statement': 'a heading of at most eight words, set very large, with the buttons beside it',
  'cta/picture': 'give the section media (aspect "landscape"); the picture sits beside the words',
  'title/plain': 'a heading and one sentence',
  'title/picture': 'a heading and one sentence set on a photo: give every title section media with aspect "wide"',
  'title/facts': 'a heading and one sentence, plus two or three "stat" or "check" blocks holding the key facts of that page',
  'title/links': 'a heading and one sentence; links to the sections of the page are added automatically',
  'features/cards': 'three or four cards with an icon each',
  'features/list': 'three to five cards with a title and one sentence each, no images',
  'features/rows': 'two or three cards, each with an image (aspect "landscape") and two sentences',
  'features/lead': 'three or four cards; the first is the main one and has an image',
  'testimonials/cards': 'three short reviews',
  'testimonials/single': 'two or three reviews, the strongest first, in at most thirty words',
  'testimonials/score': 'two or three reviews; the review score is shown large beside them',
  'testimonials/wall': 'five or six reviews of clearly different lengths',
};

const FAMILY_TELL: Record<VariantFamily, string> = {
  cta: 'Every section of type "cta"',
  title: 'Every page title (type "title")',
  features: 'Every "features" section whose blocks are all cards',
  testimonials: 'Every "testimonials" section',
};

export type Direction = {
  /** Three first screens for the AI to choose between. */
  heroes: HeroPlan[];
  angle: Choice;
  ending: Choice;
  edges: EdgeRhythm;
  /** The arrangement of each family of sections, the same across the whole site. */
  variants: Record<VariantFamily, string>;
};

/**
 * FNV-1a with a final mix. Without the mix the low bits of two draws over the same brief
 * move together, and whole sets of choices arrive as a package: every site that drew one
 * closing band also drew the same title and the same reviews.
 */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

export function directionFor(brief: string): Direction {
  const key = brief.trim().replace(/\s+/g, ' ').toLowerCase();
  const draw = <T,>(list: readonly T[], salt: string) => list[hash(`${salt}:${key}`) % list.length];
  const families = Object.keys(VARIANTS) as VariantFamily[];
  return {
    heroes: [...HERO_PLANS].sort((a, b) => hash(`hero:${a.id}:${key}`) - hash(`hero:${b.id}:${key}`)).slice(0, 3),
    angle: draw(ANGLES, 'angle'),
    ending: draw(ENDINGS, 'ending'),
    edges: draw(RHYTHMS, 'edges'),
    variants: Object.fromEntries(families.map((f) => [f, draw(VARIANTS[f], f)])) as Record<VariantFamily, string>,
  };
}

/** The decisions, as the AI is told them. */
export function directionText(d: Direction): string {
  const families = Object.keys(VARIANTS) as VariantFamily[];
  return `# Direction for this site
These choices are already made, so that sites differ from one another. Follow them exactly.
- First screen: choose ONE of these three, whichever suits this business best, and follow it exactly.
${d.heroes.map((h, i) => `  ${'abc'[i]}) ${h.tell}`).join('\n')}
- Order of Home: ${d.angle.tell}
- End of Home: ${d.ending.tell}
- Dividers: put "edges":"${d.edges}" in theme.traits and leave "edge" out of every section.
- Arrangements, the same on every page:
${families.map((f) => `  ${FAMILY_TELL[f]}: "variant":"${d.variants[f]}". Write ${VARIANT_TELL[`${f}/${d.variants[f]}`]}.`).join('\n')}`;
}

/** Which of the three first screens the AI wrote. If it wrote none of them, the first. */
export function heroWritten(hero: Section, d: Direction): { plan: HeroPlan; followed: boolean } {
  const score = (p: HeroPlan) => {
    if (p.patch.hero !== hero.hero) return -1;
    let n = 0;
    if (p.patch.layout?.kind === hero.layout.kind) n++;
    if (p.patch.layout?.flip !== undefined && p.patch.layout.flip === hero.layout.flip) n++;
    if (!!p.photo === (hero.backdrop === 'media')) n++;
    if (p.patch.intro?.align === hero.intro.align) n++;
    return n;
  };
  const best = [...d.heroes].sort((a, b) => score(b) - score(a))[0];
  return score(best) < 0 ? { plan: d.heroes[0], followed: false } : { plan: best, followed: true };
}

/**
 * Operations that make a freshly generated site match its direction, for the parts that
 * can be checked: the first screen, the divider rhythm and the arrangements. Applied
 * after the AI has finished, the same way the location pages are, so the result does not
 * depend on the AI having followed the instruction.
 */
export function directionOps(doc: SiteDoc, d: Direction): unknown[] {
  const ops: unknown[] = [];
  if (doc.theme.traits?.edges !== d.edges) ops.push({ op: 'theme', theme: { traits: { edges: d.edges } } });

  const hero = doc.pages[0]?.sections[0];
  if (hero?.type === 'hero') {
    const patch: Record<string, unknown> = { ...heroWritten(hero, d).plan.patch };
    // Only the photo composition may put the picture behind the text.
    if (patch.backdrop === undefined && hero.backdrop === 'media') patch.backdrop = 'none';
    ops.push({ op: 'update', id: hero.id, patch });
  }

  doc.pages.forEach((page, p) =>
    page.sections.forEach((s, i) => {
      const family = variantFamily(s, i, p > 0);
      if (family && s.variant !== d.variants[family]) ops.push({ op: 'update', id: s.id, patch: { variant: d.variants[family] } });
    }),
  );
  return ops;
}

export const describeDirection = (d: Direction) => ({ heroes: d.heroes.map((h) => h.id), angle: d.angle.id, ending: d.ending.id, edges: d.edges, variants: d.variants });
