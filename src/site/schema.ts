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
    body: opt(520),
    image: optImage,
  }),
  z.object({ kind: z.literal('stat'), size, value: req(14), label: req(90) }),
  z.object({
    kind: z.literal('quote'),
    size,
    text: req(380),
    author: req(60),
    role: opt(80),
    stars: z.coerce.number().int().min(1).max(5).optional().catch(undefined),
    source: opt(24),
  }),
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
  z.object({ kind: z.literal('step'), size, title: req(70), body: opt(320) }),
  z.object({ kind: z.literal('logo'), size, name: req(32) }),
  // A line with a value on the right: a price, a menu item, a class in a timetable.
  // Neighbouring rows that share a "group" are drawn together under that heading.
  z.object({ kind: z.literal('row'), size, group: opt(40), title: req(80), detail: opt(160), value: opt(28) }),
  z.object({ kind: z.literal('person'), size, name: req(60), role: opt(60), bio: opt(340), image: optImage }),
  // Address, phone, hours and map for one location. It holds no content of its own:
  // everything comes from the business facts, so a phone number is only ever typed once.
  z.object({ kind: z.literal('contact'), size, location: opt(40), map: z.boolean().catch(true) }),
  z.object({
    kind: z.literal('form'),
    size,
    title: opt(60),
    fields: listOf(z.enum(V.FORM_FIELDS), 6),
    submit: opt(32),
    note: opt(160),
  }),
  // The business's overall review score, also read from the business facts.
  z.object({ kind: z.literal('rating'), size }),
  z.object({ kind: z.literal('check'), size, label: req(80), detail: opt(140) }),
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
    edge: pick(V.EDGES, 'auto'),
    backdrop: pick(V.BACKDROPS, 'none'),
    pad: pick(V.PADS, 'md'),
    /** Only used when the section is a hero. */
    hero: pick(V.HERO_STYLES, 'standard'),
    layout: LayoutSchema,
    intro: IntroSchema,
    media: optImage,
    blocks: listOf(BlockSchema, 24),
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
        edges: optPick(V.EDGE_RHYTHMS),
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

// ---------------------------------------------------------------- business facts

const LocationSchema = z.object({
  id: text(40).catch(''),
  name: req(48),
  address: req(140),
  phone: opt(30),
  hours: listOf(z.object({ days: req(32), time: req(32) }), 7),
  note: opt(140),
});

/**
 * Facts about the business, stored once. The contact block, the footer, the legal pages
 * and the review score all read from here instead of each holding their own copy.
 */
export const BusinessSchema = z.preprocess(
  objOrEmpty,
  z.object({
    phone: opt(30),
    email: opt(80),
    bookingUrl: opt(200),
    socials: listOf(z.object({ kind: z.enum(V.SOCIALS), url: req(200) }), 5),
    rating: z
      .object({ value: req(4), count: opt(12), source: text(24).catch('Google') })
      .optional()
      .catch(undefined),
    locations: listOf(LocationSchema, 6),
    areas: listOf(req(40), 16),
    company: opt(80),
    taxId: opt(40),
    registration: opt(60),
  }),
);

// ---------------------------------------------------------------- pages

export const PageSchema = z.object({
  id: text(40).catch(''),
  title: req(32),
  role: pick(V.PAGE_ROLES, 'offer'),
  /** Pages that share a group are listed together under one dropdown in the menu. */
  group: opt(24),
  menu: z.boolean().catch(true),
  sections: listOf(SectionSchema, 14),
});

/** A version 1 document was a single list of sections; it becomes the Home page. */
const migrate = (v: unknown) => {
  const o = { ...(objOrEmpty(v) as Record<string, unknown>) };
  if (!Array.isArray(o.pages) && Array.isArray(o.sections)) {
    o.pages = [{ id: 'home', title: 'Home', role: 'home', sections: o.sections }];
  }
  return o;
};

export const DocSchema = z.preprocess(
  migrate,
  z.object({
    version: z.literal(2).catch(2),
    meta: z.preprocess(
      objOrEmpty,
      z.object({
        name: text(60).catch('Untitled site'),
        description: text(400).catch(''),
        language: pick(V.LANGUAGES, 'en'),
        /** The kind of business, as chosen from the page rule (for example "hairdresser"). */
        kind: opt(40),
      }),
    ),
    business: BusinessSchema,
    theme: ThemeSchema,
    nav: NavSchema,
    footer: FooterSchema,
    pages: listOf(PageSchema, 14),
  }),
);

export type SiteDoc = z.output<typeof DocSchema>;
export type Page = z.output<typeof PageSchema>;
export type Business = z.output<typeof BusinessSchema>;
export type Location = z.output<typeof LocationSchema>;
export type Section = z.output<typeof SectionSchema>;
export type Block = z.output<typeof BlockSchema>;
export type Layout = z.output<typeof LayoutSchema>;
export type Intro = z.output<typeof IntroSchema>;
export type ImageRef = z.output<typeof ImageSchema>;
export type Action = z.output<typeof ActionSchema>;
export type Theme = z.output<typeof ThemeSchema>;
export type Nav = z.output<typeof NavSchema>;
export type Footer = z.output<typeof FooterSchema>;

/** Built-in pages every site has. They are generated from the business facts, not stored. */
export const LEGAL_PAGES = ['privacy', 'imprint'] as const;
export type LegalPage = (typeof LEGAL_PAGES)[number];

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function unique(base: string, seen: Set<string>): string {
  let id = base;
  for (let n = 2; seen.has(id); n++) id = `${base}-${n}`;
  seen.add(id);
  return id;
}

/**
 * Give pages, sections and locations unique, URL-safe ids. Section ids are unique across
 * the whole site, so an operation can name a section without saying which page it is on.
 */
function fixIds(doc: SiteDoc): SiteDoc {
  const pageIds = new Set<string>(LEGAL_PAGES);
  const sectionIds = new Set<string>();
  const pages = (doc.pages.length ? doc.pages : [{ id: 'home', title: 'Home', role: 'home' as const, group: undefined, menu: true, sections: [] }]).map(
    (page, i) => ({
      ...page,
      // The first page is always Home, and there is only one.
      role: i === 0 ? ('home' as const) : page.role === 'home' ? ('offer' as const) : page.role,
      id: i === 0 ? unique('home', pageIds) : unique(slug(page.id) || slug(page.title) || 'page', pageIds),
      sections: page.sections.map((s) => ({ ...s, id: unique(slug(s.id) || s.type, sectionIds) })),
    }),
  );
  const locationIds = new Set<string>();
  const locations = doc.business.locations.map((l) => ({ ...l, id: unique(slug(l.id) || slug(l.name) || 'location', locationIds) }));
  return { ...doc, pages, business: { ...doc.business, locations } };
}

/** Turn anything into a valid document. Never throws. */
export function parseDoc(raw: unknown): SiteDoc {
  return fixIds(DocSchema.parse(objOrEmpty(raw)));
}

export const emptyDoc = (): SiteDoc => parseDoc({});

/** Where a section lives. */
export function findSection(doc: SiteDoc, id: unknown): { page: number; index: number } | null {
  for (let p = 0; p < doc.pages.length; p++) {
    const index = doc.pages[p].sections.findIndex((s) => s.id === id);
    if (index >= 0) return { page: p, index };
  }
  return null;
}
