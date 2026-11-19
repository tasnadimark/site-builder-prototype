// Choices that code makes for a new site before the AI writes it.
//
// Left to itself the AI converges: in a test of twenty sites it used two of the five
// hero styles, one order of sections and almost no dividers. So the choices that give a
// site its shape are drawn here, from the brief, and handed to the AI as decisions. The
// AI still writes everything and still chooses the look. Any of these can be changed
// afterwards in the inspector like every other setting.
//
// The draw depends only on the brief, so the same brief always gives the same shape.

import type { SiteDoc } from './schema';
import type { EdgeRhythm } from './vocab';

type Choice = { id: string; label: string; tell: string };

/** A first-screen composition: what the AI is told, and the fields that make it so. */
type HeroPlan = Choice & { patch: Record<string, unknown>; photo?: boolean };

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
    tell: 'hero "wordmark": the heading is the brand name alone, in one or two words (use its short form if the full name is longer). Eyebrow and body are under ten words each, and the two actions become a bar of links.',
    patch: { hero: 'wordmark' },
  },
  {
    id: 'ticker',
    label: 'Full photo with a moving line',
    tell: 'hero "ticker": a full photo (media with aspect "wide"), the body as one short statement of at most fourteen words, and a heading of three to six words that drifts along the bottom.',
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

export const ENDINGS: Choice[] = [
  { id: 'band', label: 'Call-to-action band', tell: 'End Home with a short call to action: a section of type "cta", layout "stack".' },
  { id: 'contact', label: 'Contact section', tell: 'End Home with a "contact" section (a contact block beside a form, layout "grid" with 2 columns). Do not add a "cta" section after it.' },
  { id: 'picture', label: 'Call to action with a picture', tell: 'End Home with a call to action that has a picture: a section of type "cta" with media and layout {"kind":"split"}.' },
];

const RHYTHMS: { id: EdgeRhythm; label: string }[] = [
  { id: 'cut', label: 'Clean cuts' },
  { id: 'strong', label: 'Around strong sections' },
  { id: 'every', label: 'At every change of colour' },
];

export type Direction = { hero: HeroPlan; angle: Choice; ending: Choice; edges: EdgeRhythm };

/** FNV-1a. Small, stable, and good enough to spread a few choices. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function directionFor(brief: string): Direction {
  const key = brief.trim().replace(/\s+/g, ' ').toLowerCase();
  const draw = <T,>(list: readonly T[], salt: string) => list[hash(`${salt}:${key}`) % list.length];
  return {
    hero: draw(HERO_PLANS, 'hero'),
    angle: draw(ANGLES, 'angle'),
    ending: draw(ENDINGS, 'ending'),
    edges: draw(RHYTHMS, 'edges').id,
  };
}

/** The decisions, as the AI is told them. */
export function directionText(d: Direction): string {
  return `# Direction for this site
These choices are already made, so that sites differ from one another. Follow them exactly.
- First screen: ${d.hero.tell}
- Order of Home: ${d.angle.tell}
- End of Home: ${d.ending.tell}
- Dividers: put "edges":"${d.edges}" in theme.traits and leave "edge" out of every section.`;
}

/**
 * Operations that make a freshly generated site match its direction, for the parts that
 * can be checked: the first screen and the divider rhythm. Applied after the AI has
 * finished, the same way the location pages are, so the result does not depend on the
 * AI having followed the instruction.
 */
export function directionOps(doc: SiteDoc, d: Direction): unknown[] {
  const ops: unknown[] = [];
  if (doc.theme.traits?.edges !== d.edges) ops.push({ op: 'theme', theme: { traits: { edges: d.edges } } });

  const hero = doc.pages[0]?.sections[0];
  if (hero?.type === 'hero') {
    const patch: Record<string, unknown> = { ...d.hero.patch };
    // Only the photo composition may put the picture behind the text.
    if (!d.hero.photo && hero.backdrop === 'media') patch.backdrop = 'none';
    ops.push({ op: 'update', id: hero.id, patch });
  }
  return ops;
}

export const describeDirection = (d: Direction) => ({ hero: d.hero.id, angle: d.angle.id, ending: d.ending.id, edges: d.edges });
