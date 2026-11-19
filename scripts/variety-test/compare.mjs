// Puts test runs next to each other: the same measures for each, so a change to the
// builder can be judged by what it did to twenty sites rather than to one.
//
//   node scripts/variety-test/compare.mjs <run> <run> [<run> ...]
//
// Every run must have been analysed (analyze.mjs) and photographed (shots.mjs) first.
// Prints a table and writes .prototype-cache/runs/<last run>/compare.json.

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const batches = process.argv.slice(2).length ? process.argv.slice(2) : ['variety-1', 'variety-2'];
const dir = (batch) => path.join(root, '.prototype-cache', 'runs', batch);
const json = async (file) => JSON.parse(await readFile(file, 'utf8'));
const pct = (x) => `${Math.round(x * 100)}%`;
const most = (values) => {
  const t = {};
  for (const v of values) t[v] = (t[v] ?? 0) + 1;
  const [name, n] = Object.entries(t).sort((a, b) => b[1] - a[1])[0];
  return { name, n, kinds: Object.keys(t).length };
};

async function measure(batch) {
  const a = await json(path.join(dir(batch), 'analysis.json'));
  const shots = await json(path.join(dir(batch), 'shots.json'));
  const runs = await Promise.all(a.sites.map((s) => json(path.join(dir(batch), `${s.id}.json`))));
  const n = a.sites.length;

  const homes = a.sites.map((s) => s.home);
  const inner = a.sites.flatMap((s) => s.pages.slice(1));
  const innerShots = Object.values(shots).flatMap((pages) => pages.slice(1));
  const sections = runs.flatMap((r) => r.doc.pages.flatMap((p) => p.sections));
  const people = runs.flatMap((r) => {
    const all = r.doc.pages.flatMap((p) => p.sections).flatMap((s) => s.blocks.filter((b) => b.kind === 'person'));
    const pictured = new Set(all.filter((b) => b.image).map((b) => b.name.trim().toLowerCase()));
    return [...new Set(all.map((b) => b.name.trim().toLowerCase()))].map((name) => pictured.has(name));
  });
  const mosaics = sections.filter((s) => s.layout.kind === 'bento');
  const isPicture = (b) => b.kind === 'image' || (b.kind === 'card' && !!b.image);
  const first = most(a.sites.map((s) => s.composition));
  const textLeft = a.sites.filter((s) => ['edge-right', 'split-right', 'overlap'].includes(s.composition)).length;
  const plain = (family, name) => `${a.shape.arranged[family].drawn[name] ?? 0} of ${a.shape.arranged[family].total}`;

  return {
    batch,
    sites: n,
    rows: [
      ['First screen: different compositions used', first.kinds],
      ['First screen: sites sharing the commonest one', `${first.n} (${first.name})`],
      ['First screen: text left, picture right', textLeft],
      ['Home ends with the call-to-action band', a.sites.filter((s) => s.ending === 'band').length],
      ['Home ends with a contact section', a.sites.filter((s) => s.ending === 'contact').length],
      ['Home ends with a call to action and a picture', a.sites.filter((s) => s.ending === 'picture').length],
      ['Reviews are the second-to-last section of Home', homes.filter((h) => h[h.length - 2]?.type === 'testimonials').length],
      ['Second section is a grid of features', homes.filter((h) => h[1]?.type === 'features' && h[1]?.layout === 'grid').length],
      ['Dividers drawn, all pages', a.shape.dividersDrawn],
      ['Sites with no divider at all', a.sites.filter((s) => !(s.counts.edges.divider > 0)).length],
      ['Section order shared by two sites of one type', pct(a.likeness.sameType.order)],
      ['Order and layout shared by two sites of one type', pct(a.likeness.sameType.layout)],
      ['Look settings shared by two sites of one type', pct(a.likeness.sameType.look)],
      ['Inner pages that end with the band', `${inner.filter((p) => p.sections[p.sections.length - 1]?.startsWith('cta')).length} of ${inner.length}`],
      ['Inner pages with no picture', `${innerShots.filter((p) => p.pics === 0).length} of ${innerShots.length}`],
      ['Calls to action drawn as the plain centred band', plain('cta', 'band')],
      ['Inner-page titles drawn as a plain title', plain('title', 'plain')],
      ['Card sections drawn as a plain row of cards', plain('features', 'cards')],
      ['Review sections drawn as a plain row of cards', plain('testimonials', 'cards')],
      ['Arrangements that fell back to the plain one', Object.values(a.shape.arranged).reduce((k, f) => k + f.fellBack, 0)],
      ['Staff cards without a portrait', `${people.filter((p) => !p).length} of ${people.length}`],
      ['Mosaics that mix pictures with text-only tiles', `${mosaics.filter((s) => s.blocks.some(isPicture) && s.blocks.some((b) => !isPicture(b))).length} of ${mosaics.length}`],
      ['Operations rejected', `${runs.reduce((k, r) => k + r.rejected.length, 0)} of ${runs.reduce((k, r) => k + r.applied + r.rejected.length, 0)}`],
      ['Seconds per site, average', (a.sites.reduce((k, s) => k + s.seconds, 0) / n).toFixed(1)],
      ['Pictures in the whole run', a.sites.reduce((k, s) => k + s.counts.images, 0)],
    ],
    followed: a.shape.followed && { ...a.shape.followed, of: a.shape.directed },
  };
}

const runs = await Promise.all(batches.map(measure));
const last = runs[runs.length - 1];
const rows = last.rows.map(([label], i) => ({ label, values: runs.map((r) => r.rows[i][1]) }));
await writeFile(path.join(dir(last.batch), 'compare.json'), JSON.stringify({ batches, rows, followed: last.followed }, null, 1));

const wide = Math.max(...rows.map((r) => r.label.length));
console.log(`${''.padEnd(wide)}  ${batches.map((b) => b.padEnd(16)).join(' ')}`);
for (const r of rows) console.log(`${r.label.padEnd(wide)}  ${r.values.map((v) => String(v).padEnd(16)).join(' ')}`);
const f = last.followed;
if (f) console.log(`\nThe AI followed its direction before the code enforced it, of ${f.of} sites: first screen ${f.hero}, divider rule ${f.edges}, order of Home ${f.angle}, ending ${f.ending}`);
