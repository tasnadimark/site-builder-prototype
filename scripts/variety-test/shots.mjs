// Opens every page of every site in a test run in headless Chrome (through the app's
// /preview route), waits for its pictures, and saves screenshots. Opening a page is
// also what makes the app generate that page's pictures, so this step is where the
// image cost of a run is spent. Pictures are cached, so a second run is free.
//
//   node scripts/variety-test/shots.mjs [run] [--first] [--draft] [--only=a,b]
//
// --first    only the first screen of each Home page: one picture per site, not all.
// --draft    a picture that cannot be generated (no credit, say) stays a placeholder.
// --only=    photograph just those sites and keep the rest of an earlier run.
//
// Writes .prototype-cache/runs/<run>/shots/<id>--<page>--full.jpg (whole page) and
// <id>--home--fold.jpg (what a visitor sees first), plus shots.json describing them.
// For phone widths see phone.mjs.

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP, capture, launch, requireApp, settle } from './chrome.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const batch = process.argv[2] || 'variety-1';
const firstOnly = process.argv.includes('--first');
const draft = process.argv.includes('--draft');
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7).split(',');
const WIDTH = 1440;
const HEIGHT = 900;
const RUN = path.join(root, '.prototype-cache', 'runs', batch);
const OUT = path.join(RUN, 'shots');

await requireApp();
await mkdir(OUT, { recursive: true });
const sites = [];
for (const f of (await readdir(RUN)).filter((f) => f.endsWith('.json')).sort()) {
  const run = JSON.parse(await readFile(path.join(RUN, f), 'utf8'));
  if (run?.doc?.pages?.[0]?.sections?.length && (!only || only.includes(run.id))) sites.push({ id: run.id, pages: run.doc.pages.map((p) => p.id) });
}

const manifestFile = path.join(RUN, firstOnly ? 'shots-first.json' : 'shots.json');
const manifest = only ? JSON.parse(await readFile(manifestFile, 'utf8').catch(() => '{}')) : {};
const { tab, quit } = await launch({ width: WIDTH, height: HEIGHT });

for (const site of sites) {
  const t0 = Date.now();
  const pages = [];
  for (const page of firstOnly ? site.pages.slice(0, 1) : site.pages) {
    const state = await settle(tab, `${APP}/preview/${batch}/${site.id}?page=${encodeURIComponent(page)}${firstOnly ? '&first=1' : ''}`, { draft });
    const { cssContentSize } = await tab.cmd('Page.getLayoutMetrics');
    const height = Math.ceil(cssContentSize.height);
    const entry = { page, height, pics: state?.pics ?? 0, failed: state?.failed ?? 0, pending: state?.pending ?? 0 };
    if (!firstOnly) {
      entry.full = `${site.id}--${page}--full.jpg`;
      await capture(tab, path.join(OUT, entry.full), { height, scale: 0.4 });
    }
    if (page === site.pages[0]) {
      entry.fold = `${site.id}--${page}--fold.jpg`;
      await capture(tab, path.join(OUT, entry.fold), { height: HEIGHT, scale: 0.5 });
    }
    pages.push(entry);
  }
  manifest[site.id] = pages;
  const bad = pages.reduce((n, p) => n + p.failed + p.pending, 0);
  console.log(`${site.id.padEnd(24)} ${pages.length} pages · ${pages.reduce((n, p) => n + p.pics, 0)} picture slots · ${((Date.now() - t0) / 1000).toFixed(0)}s${bad ? ` · ${bad} PICTURES MISSING` : ''}`);
}

await writeFile(manifestFile, JSON.stringify(manifest, null, 1));
await quit();
const missing = Object.values(manifest).flat().reduce((n, p) => n + p.failed + p.pending, 0);
console.log(`\n${Object.keys(manifest).length} sites photographed into ${path.relative(root, OUT)}${missing ? `, ${missing} pictures missing` : ''}`);
process.exit(0);
