// Photographs a run at phone width, one picture per section, and looks for the two
// things that go wrong on a narrow screen: something running off the side, and text
// that is cut off.
//
//   node scripts/variety-test/phone.mjs <run> [--first] [--only=a,b]
//
// --first    only the first section of each Home page (enough for hero styles).
// --only=    just those sites.
//
// Writes .prototype-cache/runs/<run>/phone/<site>--<page>--<n>-<section>.jpg and
// phone.json, which lists every section with what was found. Tile them with
// phone-sheets.py to look at many at once.

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP, capture, evaluate, launch, requireApp, settle } from './chrome.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const batch = process.argv[2];
if (!batch) {
  console.error('Name a run, for example: node scripts/variety-test/phone.mjs variety-3');
  process.exit(1);
}
const firstOnly = process.argv.includes('--first');
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7).split(',');
const WIDTH = 390;
const HEIGHT = 844;
const RUN = path.join(root, '.prototype-cache', 'runs', batch);
const OUT = path.join(RUN, 'phone');

// Every section of the page in front: where it is, how it is drawn, and what is wrong with it.
// Parts that are meant to run past the edge (a moving strip, a picture behind the text) are skipped.
const SECTIONS = `(() => {
  const vw = document.documentElement.clientWidth;
  const meant = (el) => el.closest('.marquee, .marquee-track, .hero-ticker, .backdrop, .edge');
  const name = (el) => el.tagName.toLowerCase() + (el.classList[0] ? '.' + el.classList[0] : '');
  const sections = [...document.querySelectorAll('.site .sec')].map((sec) => {
    const r = sec.getBoundingClientRect();
    const issues = new Set();
    for (const el of sec.querySelectorAll('*')) {
      if (meant(el)) continue;
      const b = el.getBoundingClientRect();
      if (!b.width || !b.height) continue;
      const over = Math.round(Math.max(b.right - vw, -b.left));
      if (over > 2) issues.add(name(el) + ' runs ' + over + 'px off the screen');
      else if (!el.children.length && el.scrollWidth > el.clientWidth + 3 && getComputedStyle(el).overflowX !== 'visible') issues.add(name(el) + ' has text cut off');
    }
    return {
      id: sec.id, type: sec.dataset.type, layout: sec.dataset.layout || '', hero: sec.dataset.hero || '', family: sec.dataset.family || '', variant: sec.dataset.variant || '',
      y: Math.round(r.top + scrollY), height: Math.round(r.height), issues: [...issues].slice(0, 5),
    };
  });
  return { sideways: document.documentElement.scrollWidth - vw, sections };
})()`;

await requireApp();
await mkdir(OUT, { recursive: true });
const sites = [];
for (const f of (await readdir(RUN)).filter((f) => f.endsWith('.json')).sort()) {
  const run = JSON.parse(await readFile(path.join(RUN, f), 'utf8'));
  if (run?.doc?.pages?.[0]?.sections?.length && (!only || only.includes(run.id))) sites.push({ id: run.id, pages: run.doc.pages.map((p) => p.id) });
}

const manifest = {};
const { tab, quit } = await launch({ width: WIDTH, height: HEIGHT, mobile: true });
let found = 0;

for (const site of sites) {
  const entries = [];
  for (const page of firstOnly ? site.pages.slice(0, 1) : site.pages) {
    await settle(tab, `${APP}/preview/${batch}/${site.id}?page=${encodeURIComponent(page)}${firstOnly ? '&first=1' : ''}`, { draft: true });
    const seen = await evaluate(tab, SECTIONS);
    for (const [n, s] of seen.sections.entries()) {
      const file = `${site.id}--${page}--${String(n + 1).padStart(2, '0')}-${s.id}.jpg`;
      await capture(tab, path.join(OUT, file), { y: s.y, height: Math.max(s.height, 1) });
      if (seen.sideways > 2 && n === 0) s.issues.unshift(`the page scrolls sideways by ${seen.sideways}px`);
      entries.push({ page, file, ...s });
    }
  }
  manifest[site.id] = entries;
  const bad = entries.filter((e) => e.issues.length);
  found += bad.length;
  console.log(`${site.id.padEnd(24)} ${entries.length} sections${bad.length ? ` · ${bad.length} with something off` : ''}`);
  for (const e of bad) console.log(`   ${e.page}/${e.id} (${[e.type, e.hero, e.variant].filter(Boolean).join(', ')}): ${e.issues.join('; ')}`);
}

await writeFile(path.join(RUN, 'phone.json'), JSON.stringify(manifest, null, 1));
await quit();
console.log(`\n${Object.values(manifest).flat().length} sections photographed at ${WIDTH}px into ${path.relative(root, OUT)}, ${found} flagged`);
process.exit(0);
