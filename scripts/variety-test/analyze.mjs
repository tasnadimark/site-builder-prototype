// Reads a test run and tabulates what the AI chose for each site: the look, the hero,
// the order and layout of the sections on Home. It then measures how alike the sites
// are, and lists the options in the vocabulary that no site used.
//
//   node --import ./scripts/variety-test/hooks.mjs scripts/variety-test/analyze.mjs [batch]
//
// Prints a summary and writes .prototype-cache/runs/<batch>/analysis.json for the report.

import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BRIEFS, TYPES } from './briefs.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { parseDoc } = await import('@/site/schema');
const { resolveTheme } = await import('@/site/theme');
const { planSections } = await import('@/site/plan');
const V = await import('@/site/vocab');

const batch = process.argv[2] || 'variety-1';
const RUN = path.join(root, '.prototype-cache', 'runs', batch);

const tally = (values) => {
  const t = {};
  for (const v of values) t[String(v)] = (t[String(v)] ?? 0) + 1;
  return Object.fromEntries(Object.entries(t).sort((a, b) => b[1] - a[1]));
};

/** Every image reference anywhere inside a document. */
function findImages(node, found = []) {
  if (Array.isArray(node)) node.forEach((n) => findImages(n, found));
  else if (node && typeof node === 'object') {
    if (typeof node.prompt === 'string' && ('alt' in node || 'aspect' in node)) found.push(node);
    else Object.values(node).forEach((v) => findImages(v, found));
  }
  return found;
}

/** How alike two sequences are, 0 to 1: the longest run of items in the same order, over the longer length. */
function alike(a, b) {
  if (!a.length || !b.length) return 0;
  const row = new Array(b.length + 1).fill(0);
  for (const x of a) {
    let diag = 0;
    for (let j = 1; j <= b.length; j++) {
      const up = row[j];
      row[j] = x === b[j - 1] ? diag + 1 : Math.max(row[j], row[j - 1]);
      diag = up;
    }
  }
  return row[b.length] / Math.max(a.length, b.length);
}

// ---------------------------------------------------------------- one site

function describe(run) {
  const doc = parseDoc(run.doc);
  const theme = resolveTheme(doc.theme);
  const set = doc.theme;

  const pages = doc.pages.map((p) => {
    const plan = planSections(p.sections, theme, doc.footer.tone);
    return {
      id: p.id,
      title: p.title,
      role: p.role,
      group: p.group ?? null,
      sections: p.sections.map((s, i) => ({
        type: s.type,
        layout: plan[i].layout,
        cols: plan[i].cols,
        tone: plan[i].cover ? 'photo' : s.tone,
        edge: plan[i].edge,
        edgeAsked: s.edge,
        backdrop: plan[i].backdrop,
        backdropAsked: s.backdrop,
        blocks: s.blocks.map((b) => b.kind),
        heroAsked: s.type === 'hero' ? s.hero : null,
        heroShown: s.type === 'hero' ? plan[i].hero : null,
        media: !!s.media,
        align: s.intro.align,
      })),
    };
  });

  const home = pages[0];
  const hero = home.sections[0];
  const all = pages.flatMap((p) => p.sections);

  // The first screen as drawn, named the way direction.ts names its compositions.
  const flip = doc.pages[0].sections[0]?.layout.flip;
  const composition =
    hero?.heroShown === 'edge'
      ? `edge-${flip ? 'left' : 'right'}`
      : hero?.heroShown !== 'standard'
        ? hero?.heroShown
        : hero.tone === 'photo'
          ? 'photo'
          : hero.layout === 'split'
            ? `split-${flip ? 'left' : 'right'}`
            : 'centred';

  // Whether Home follows the order and the ending it was given.
  const FAMILY = { offer: ['features', 'prices', 'pricing', 'timetable'], people: ['team', 'story'], proof: ['testimonials', 'stats', 'gallery', 'logos'], process: ['steps'] };
  const early = home.sections.slice(1, 3).map((s) => s.type);
  const last = home.sections[home.sections.length - 1];
  const lastDoc = doc.pages[0].sections[doc.pages[0].sections.length - 1];
  const ending = last?.type === 'contact' ? 'contact' : last?.type === 'cta' ? (lastDoc.media && last.layout === 'split' ? 'picture' : 'band') : 'other';
  const d = run.direction ?? null;
  const w = run.heroWritten ?? null;

  return {
    id: run.id,
    type: run.type,
    typeLabel: TYPES[run.type].label,
    angle: run.angle,
    thin: run.brief.length < 200,
    name: doc.nav.brand || doc.meta.name,
    seconds: Math.round(run.ms / 100) / 10,
    rejected: run.rejected.length,
    locationsAdded: run.locationsAdded,
    look: {
      preset: theme.preset,
      display: theme.fonts.display,
      body: theme.fonts.body,
      card: theme.traits.card,
      button: theme.traits.button,
      emphasis: theme.traits.emphasis,
      divider: theme.traits.divider,
      motif: theme.traits.motif,
      image: theme.traits.image,
      eyebrow: theme.traits.eyebrow,
      caps: theme.traits.caps,
      radius: theme.radius,
      density: theme.density,
      scale: theme.scale,
      dark: theme.isDark,
      nav: doc.nav.style,
      footer: doc.footer.style,
    },
    // What the AI set itself, as opposed to inheriting from the preset.
    chosen: {
      palette: Object.keys(set.palette ?? {}).filter((k) => set.palette[k]),
      fonts: Object.keys(set.fonts ?? {}).filter((k) => set.fonts[k]),
      traits: Object.keys(set.traits ?? {}).filter((k) => set.traits[k] !== undefined),
      imageStyle: !!set.imageStyle,
    },
    palette: { bg: theme.palette.bg, ink: theme.palette.ink, accent: theme.palette.accent, accent2: theme.palette.accent2 },
    composition,
    direction: d,
    followed: d && {
      // Before the code enforced it: did the AI write the first screen it was given?
      hero: !!w && w.hero === hero?.heroShown && (composition.startsWith('edge') || composition.startsWith('split') ? !!w.flip === !!flip : true) && (composition === 'photo') === (w.backdrop === 'media'),
      edges: run.edgesWritten === d.edges,
      angle: early.some((t) => FAMILY[d.angle]?.includes(t)),
      ending: ending === d.ending,
    },
    ending,
    edgeRhythm: theme.traits.edges,
    explicitEdges: all.filter((s) => s.edgeAsked !== 'auto').length,
    hero: {
      asked: hero?.heroAsked ?? null,
      shown: hero?.heroShown ?? null,
      layout: hero?.layout ?? null,
      tone: hero?.tone ?? null,
      backdrop: hero?.backdrop ?? null,
      media: hero?.media ?? false,
      align: hero?.align ?? null,
      blocks: hero?.blocks ?? [],
    },
    home: home.sections.map((s) => ({ type: s.type, layout: s.layout, cols: s.cols, tone: s.tone, edge: s.edge, backdrop: s.backdrop })),
    pages: pages.map((p) => ({ id: p.id, title: p.title, role: p.role, group: p.group, sections: p.sections.map((s) => `${s.type}/${s.layout}`) })),
    counts: {
      sections: all.length,
      images: new Set(findImages(doc).map((i) => `${i.aspect}|${i.prompt}`)).size,
      types: tally(all.map((s) => s.type)),
      layouts: tally(all.map((s) => s.layout)),
      tones: tally(all.map((s) => s.tone)),
      edges: tally(all.map((s) => s.edge)),
      edgesAsked: tally(all.map((s) => s.edgeAsked)),
      backdrops: tally(all.map((s) => s.backdrop)),
      backdropsAsked: tally(all.map((s) => s.backdropAsked)),
      blocks: tally(all.flatMap((s) => s.blocks)),
    },
  };
}

// ---------------------------------------------------------------- the whole run

const order = new Map(BRIEFS.map((b, i) => [b.id, i]));
const sites = [];
for (const f of (await readdir(RUN)).filter((f) => f.endsWith('.json'))) {
  const run = JSON.parse(await readFile(path.join(RUN, f), 'utf8'));
  // A run that failed (no credit, a dropped connection) leaves an empty site behind; leave it out.
  if (run?.doc?.pages?.[0]?.sections?.length && !run.error && order.has(run.id)) sites.push(describe(run));
}
sites.sort((a, b) => order.get(a.id) - order.get(b.id));

// How often each option of each setting was picked, and which were never picked.
const LOOK_OPTIONS = {
  preset: V.PRESETS,
  display: V.FONT_IDS,
  body: V.FONT_IDS,
  card: V.CARD_STYLES,
  button: V.BUTTON_STYLES,
  emphasis: V.EMPHASIS,
  divider: V.DIVIDERS,
  motif: V.MOTIFS,
  image: V.IMAGE_SHAPES,
  eyebrow: V.EYEBROWS,
  radius: V.RADII,
  density: V.DENSITIES,
  scale: V.SCALES,
  nav: V.NAV_STYLES,
  footer: V.FOOTER_STYLES,
};
const look = {};
for (const [key, options] of Object.entries(LOOK_OPTIONS)) {
  const picked = tally(sites.map((s) => s.look[key]));
  look[key] = { picked, unused: options.filter((o) => !(o in picked)), options: options.length };
}
look.caps = { picked: tally(sites.map((s) => s.look.caps)), unused: [], options: 2 };
look.dark = { picked: tally(sites.map((s) => s.look.dark)), unused: [], options: 2 };

const SECTION_OPTIONS = { layouts: V.LAYOUTS, tones: [...V.TONES, 'photo'], edges: V.EDGES, edgesAsked: V.EDGES, backdrops: V.BACKDROPS, backdropsAsked: V.BACKDROPS, types: V.SECTION_TYPES, blocks: V.BLOCK_KINDS };
const structure = {};
for (const [key, options] of Object.entries(SECTION_OPTIONS)) {
  const total = {};
  const sitesUsing = {};
  for (const s of sites)
    for (const [k, n] of Object.entries(s.counts[key])) {
      total[k] = (total[k] ?? 0) + n;
      sitesUsing[k] = (sitesUsing[k] ?? 0) + 1;
    }
  structure[key] = {
    total: Object.fromEntries(Object.entries(total).sort((a, b) => b[1] - a[1])),
    sitesUsing,
    unused: options.filter((o) => !(o in total)),
  };
}
const heroes = { asked: tally(sites.map((s) => s.hero.asked)), shown: tally(sites.map((s) => s.hero.shown)), unused: V.HERO_STYLES.filter((h) => !sites.some((s) => s.hero.shown === h)) };
const directed = sites.filter((s) => s.followed);
const shape = {
  composition: tally(sites.map((s) => s.composition)),
  ending: tally(sites.map((s) => s.ending)),
  second: tally(sites.map((s) => s.home[1]?.type)),
  edgeRhythm: tally(sites.map((s) => s.edgeRhythm)),
  explicitEdges: sites.reduce((n, s) => n + s.explicitEdges, 0),
  dividersDrawn: sites.reduce((n, s) => n + (s.counts.edges.divider ?? 0), 0),
  followed: directed.length ? Object.fromEntries(['hero', 'edges', 'angle', 'ending'].map((k) => [k, directed.filter((s) => s.followed[k]).length])) : null,
  directed: directed.length,
};

// How alike the Home pages are: same kinds of section in the same order, and the same layouts too.
const pairs = [];
for (let i = 0; i < sites.length; i++)
  for (let j = i + 1; j < sites.length; j++) {
    const a = sites[i];
    const b = sites[j];
    pairs.push({
      a: a.id,
      b: b.id,
      sameType: a.type === b.type,
      order: alike(a.home.map((s) => s.type), b.home.map((s) => s.type)),
      layout: alike(a.home.map((s) => `${s.type}/${s.layout}`), b.home.map((s) => `${s.type}/${s.layout}`)),
      sameLook: ['preset', 'display', 'body', 'card', 'button', 'emphasis', 'divider', 'motif', 'image', 'eyebrow', 'radius', 'nav', 'footer'].filter((k) => a.look[k] === b.look[k]).length / 13,
    });
  }
const mean = (xs) => (xs.length ? xs.reduce((n, x) => n + x, 0) / xs.length : 0);
const pct = (x) => `${Math.round(x * 100)}%`;
const likeness = {
  sameType: { order: mean(pairs.filter((p) => p.sameType).map((p) => p.order)), layout: mean(pairs.filter((p) => p.sameType).map((p) => p.layout)), look: mean(pairs.filter((p) => p.sameType).map((p) => p.sameLook)) },
  otherType: { order: mean(pairs.filter((p) => !p.sameType).map((p) => p.order)), layout: mean(pairs.filter((p) => !p.sameType).map((p) => p.layout)), look: mean(pairs.filter((p) => !p.sameType).map((p) => p.sameLook)) },
  byType: Object.fromEntries(
    Object.keys(TYPES).map((t) => {
      const own = pairs.filter((p) => p.sameType && sites.find((s) => s.id === p.a).type === t);
      return [t, { order: mean(own.map((p) => p.order)), layout: mean(own.map((p) => p.layout)), look: mean(own.map((p) => p.sameLook)) }];
    }),
  ),
};

await writeFile(path.join(RUN, 'analysis.json'), JSON.stringify({ batch, sites, look, structure, heroes, shape, likeness, pairs }, null, 1));

// ---------------------------------------------------------------- printed summary

const line = (t) => Object.entries(t).map(([k, n]) => `${k} ${n}`).join(', ');
console.log(`${sites.length} sites\n`);
console.log('LOOK (sites that ended up with each option)');
for (const [key, v] of Object.entries(look)) console.log(`  ${key.padEnd(9)} ${line(v.picked)}${v.unused.length ? `   | never: ${v.unused.join(', ')}` : ''}`);
console.log('\nHERO');
console.log(`  asked for  ${line(heroes.asked)}`);
console.log(`  shown      ${line(heroes.shown)}${heroes.unused.length ? `   | never: ${heroes.unused.join(', ')}` : ''}`);
console.log(`  layout     ${line(tally(sites.map((s) => s.hero.layout)))}`);
console.log(`  backdrop   ${line(tally(sites.map((s) => s.hero.backdrop)))}`);
console.log(`  tone       ${line(tally(sites.map((s) => s.hero.tone)))}`);
console.log('\nSHAPE');
console.log(`  first screen   ${line(shape.composition)}`);
console.log(`  2nd section    ${line(shape.second)}`);
console.log(`  Home ends with ${line(shape.ending)}`);
console.log(`  divider rule   ${line(shape.edgeRhythm)}   | dividers drawn ${shape.dividersDrawn}, edges set by hand ${shape.explicitEdges}`);
if (shape.followed) console.log(`  AI followed its direction (of ${shape.directed}): first screen ${shape.followed.hero}, divider rule ${shape.followed.edges}, order ${shape.followed.angle}, ending ${shape.followed.ending}`);
console.log('\nSECTIONS ACROSS ALL PAGES (count, then sites using it)');
for (const [key, v] of Object.entries(structure)) {
  console.log(`  ${key.padEnd(14)} ${Object.entries(v.total).map(([k, n]) => `${k} ${n}/${v.sitesUsing[k]}`).join(', ')}${v.unused.length ? `   | never: ${v.unused.join(', ')}` : ''}`);
}
console.log('\nHOME, SECTION BY SECTION');
for (const s of sites) {
  console.log(`  ${s.id.padEnd(22)} ${s.look.preset.padEnd(9)} ${String(s.composition).padEnd(11)} ${s.direction ? `${s.direction.angle}/${s.direction.ending}`.padEnd(16) : ''} ${s.home.map((x) => `${x.type}/${x.layout}`).join(' > ')}`);
}
console.log('\nPAGES');
for (const s of sites) console.log(`  ${s.id.padEnd(22)} ${s.pages.map((p) => `${p.title}${p.group ? ` [${p.group}]` : ''}`).join(' | ')}`);
console.log('\nHOW ALIKE (average over pairs of sites)');
console.log(`  same business type:   section order ${pct(likeness.sameType.order)}, order and layout ${pct(likeness.sameType.layout)}, look settings ${pct(likeness.sameType.look)}`);
console.log(`  different types:      section order ${pct(likeness.otherType.order)}, order and layout ${pct(likeness.otherType.layout)}, look settings ${pct(likeness.otherType.look)}`);
for (const [t, v] of Object.entries(likeness.byType)) console.log(`  ${TYPES[t].label.padEnd(20)}  section order ${pct(v.order)}, order and layout ${pct(v.layout)}, look settings ${pct(v.look)}`);
