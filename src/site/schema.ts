// The site document schema. Parsing is deliberately forgiving: an unknown enum value
// falls back to a safe default, over-long text is trimmed, and a block or section that
// cannot be understood is dropped. Nothing that fails here ever reaches the renderer.

import { z } from 'zod';
import * as V from './vocab';

const clean = (v: string | number, max: number) => String(v).replace(/\s+/g, ' ').trim().slice(0, max);

/** Text that may be empty. */
const text = (max: number) => z.union([z.string(), z.number()]).transform((v) => clean(v, max));
/** Text that must have content, otherwise the thing it belongs to is invalid. */
const req = (max: number) => text(max).refine((s) => s.length > 0, 'empty');
const opt = (max: number) =>
  text(max)
    .transform((s) => (s.length ? s : undefined))
    .optional()
    .catch(undefined);

const pick = <const T extends readonly [string, ...string[]]>(values: T, fallback: T[number]) =>
  z.enum(values).catch(fallback);
const optPick = <const T extends readonly [string, ...string[]]>(values: T) =>
  z.enum(values).optional().catch(undefined);

const objOrEmpty = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

/** A list that keeps the items that parse and silently drops the rest. */
const listOf = <S extends z.ZodType>(item: S, max: number) =>
  z
    .array(z.unknown())
    .catch([])
    .transform((arr) => {
      const out: z.output<S>[] = [];
      for (const raw of arr) {
        const r = item.safeParse(raw);
        if (r.success) out.push(r.data);
        if (out.length >= max) break;
      }
      return out;
    });

const hex = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
  .transform((h) => {
    const s = h.slice(1).toLowerCase();
    return '#' + (s.length === 3 ? s.split('').map((c) => c + c).join('') : s);
  })
  .optional()
  .catch(undefined);

// ---------------------------------------------------------------- content atoms

export const ImageSchema = z.preprocess(
  (v) => (typeof v === 'string' ? { prompt: v } : v),
  z.object({
    prompt: req(420),
    alt: text(160).catch(''),
    aspect: pick(V.ASPECTS, 'landscape'),
  }),
);

export const ActionSchema = z.preprocess(
  (v) => (typeof v === 'string' ? { label: v } : v),
  z.object({
    label: req(40),
    href: text(200).catch('#'),
    kind: pick(['primary', 'secondary'], 'primary'),
  }),
);

const size = pick(V.SIZES, 'sm');
const optImage = ImageSchema.optional().catch(undefined);

export const BlockSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('card'),
    size,
    icon: optPick(V.ICONS),
    tag: opt(28),
    title: req(90),
    body: opt(300),
    image: optImage,
  }),
  z.object({ kind: z.literal('stat'), size, value: req(14), label: req(90) }),
  z.object({ kind: z.literal('quote'), size, text: req(380), author: req(60), role: opt(80) }),
  z.object({ kind: z.literal('image'), size, image: ImageSchema, caption: opt(90) }),
  z.object({
    kind: z.literal('plan'),
    size,
    name: req(40),
    price: req(18),
    period: opt(28),
    blurb: opt(140),
    features: listOf(req(90), 8),
    cta: text(32).catch('Get started'),
    featured: z.boolean().catch(false),
  }),
  z.object({ kind: z.literal('qa'), size, q: req(160), a: req(640) }),
  z.object({ kind: z.literal('step'), size, title: req(70), body: opt(260) }),
  z.object({ kind: z.literal('logo'), size, name: req(32) }),
]);

// ---------------------------------------------------------------- section

export const LayoutSchema = z.preprocess(
  (v) => (typeof v === 'string' ? { kind: v } : objOrEmpty(v)),
  z.object({
    kind: pick(V.LAYOUTS, 'stack'),
    columns: z.coerce.number().int().min(1).max(4).catch(3),
    flip: z.boolean().catch(false),
    ratio: pick(V.RATIOS, 'even'),
    width: pick(V.WIDTHS, 'normal'),
  }),
);

/** Accept the common synonyms a model might reach for instead of the documented names. */
const introAliases = (v: unknown) => {
  const o = { ...(objOrEmpty(v) as Record<string, unknown>) };
  o.heading ??= o.title ?? o.headline;
  o.body ??= o.text ?? o.description ?? o.subheading ?? o.subtitle;
  return o;
};

export const IntroSchema = z.preprocess(
  introAliases,
  z.object({
    eyebrow: opt(48),
    heading: opt(140),
    body: opt(480),
    actions: listOf(ActionSchema, 2),
    align: pick(V.ALIGNS, 'start'),
  }),
);

/** A section written flat (heading, body, actions at the top level) is folded into its intro. */
const liftIntro = (v: unknown) => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return v;
  const o = v as Record<string, unknown>;
  if (o.intro !== undefined) return o;
  const { eyebrow, heading, title, headline, body, text, description, actions, align } = o;
  return { ...o, intro: { eyebrow, heading, title, headline, body, text, description, actions, align } };
};

const SectionObject = z
  .object({
    id: text(48).catch(''),
    type: pick(V.SECTION_TYPES, 'features'),
    tone: pick(V.TONES, 'base'),
    edge: pick(V.EDGES, 'none'),
    backdrop: pick(V.BACKDROPS, 'none'),
    pad: pick(V.PADS, 'md'),
    layout: LayoutSchema,
    intro: IntroSchema,
    media: optImage,
    blocks: listOf(BlockSchema, 12),
  })
  // A section with nothing to show is not a section.
  .refine((s) => !!(s.intro.heading || s.intro.body || s.blocks.length || s.media), 'empty section');

export const SectionSchema = z.preprocess(liftIntro, SectionObject);

// ---------------------------------------------------------------- theme, nav, footer

export const ThemeSchema = z.preprocess(
  objOrEmpty,
  z.object({
    preset: pick(V.PRESETS, 'editorial'),
    palette: z.preprocess(objOrEmpty, z.object({ bg: hex, surface: hex, ink: hex, accent: hex, accent2: hex })),
    fonts: z.preprocess(objOrEmpty, z.object({ display: optPick(V.FONT_IDS), body: optPick(V.FONT_IDS) })),
    radius: optPick(V.RADII),
    density: optPick(V.DENSITIES),
    scale: optPick(V.SCALES),
    traits: z.preprocess(
      objOrEmpty,
      z.object({
        card: optPick(V.CARD_STYLES),
        button: optPick(V.BUTTON_STYLES),
        emphasis: optPick(V.EMPHASIS),
        divider: optPick(V.DIVIDERS),
        motif: optPick(V.MOTIFS),
        image: optPick(V.IMAGE_SHAPES),
        eyebrow: optPick(V.EYEBROWS),
        caps: z.boolean().optional().catch(undefined),
      }),
    ),
    imageStyle: opt(340),
  }),
);

const LinkSchema = z.preprocess(
  (v) => (typeof v === 'string' ? { label: v } : v),
  z.object({ label: req(28), href: text(120).catch('#') }),
);

export const NavSchema = z.preprocess(
  objOrEmpty,
  z.object({
    style: pick(V.NAV_STYLES, 'minimal'),
    brand: text(40).catch(''),
    links: listOf(LinkSchema, 6),
    cta: ActionSchema.optional().catch(undefined),
  }),
);

export const FooterSchema = z.preprocess(
  objOrEmpty,
  z.object({
    style: pick(V.FOOTER_STYLES, 'columns'),
    tone: pick(V.TONES, 'inverse'),
    tagline: opt(200),
    columns: listOf(z.object({ title: req(32), links: listOf(req(36), 6) }), 4),
    note: opt(140),
  }),
);

export const DocSchema = z.object({
  version: z.literal(1).catch(1),
  meta: z.preprocess(
    objOrEmpty,
    z.object({ name: text(60).catch('Untitled site'), description: text(400).catch('') }),
  ),
  theme: ThemeSchema,
  nav: NavSchema,
  footer: FooterSchema,
  sections: listOf(SectionSchema, 16),
});

export type SiteDoc = z.output<typeof DocSchema>;
export type Section = z.output<typeof SectionSchema>;
export type Block = z.output<typeof BlockSchema>;
export type Layout = z.output<typeof LayoutSchema>;
export type Intro = z.output<typeof IntroSchema>;
export type ImageRef = z.output<typeof ImageSchema>;
export type Action = z.output<typeof ActionSchema>;
export type Theme = z.output<typeof ThemeSchema>;
export type Nav = z.output<typeof NavSchema>;
export type Footer = z.output<typeof FooterSchema>;

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Give every section a unique, URL-safe id (they double as anchor targets). */
export function fixIds(sections: Section[]): Section[] {
  const seen = new Set<string>();
  return sections.map((s) => {
    const base = slug(s.id) || s.type;
    let id = base;
    for (let n = 2; seen.has(id); n++) id = `${base}-${n}`;
    seen.add(id);
    return id === s.id ? s : { ...s, id };
  });
}

/** Turn anything into a valid document. Never throws. */
export function parseDoc(raw: unknown): SiteDoc {
  const doc = DocSchema.parse(objOrEmpty(raw));
  return { ...doc, sections: fixIds(doc.sections) };
}

export const emptyDoc = (): SiteDoc => parseDoc({});
