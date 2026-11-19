// Puts two test runs next to each other: the same measures for each, so a change to the
// builder can be judged by what it did to twenty sites rather than to one.
//
//   node scripts/variety-test/compare.mjs [before] [after]
//
// Both runs must have been analysed (analyze.mjs) and photographed (shots.mjs) first.
// Prints a table and writes .prototype-cache/runs/<after>/compare.json.

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const [before = 'variety-1', after = 'variety-2'] = process.argv.slice(2);
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
      ['Staff cards without a portrait', `${people.filter((p) => !p).length} of ${people.length}`],
      ['Mosaics that mix pictures with text-only tiles', `${mosaics.filter((s) => s.blocks.some(isPicture) && s.blocks.some((b) => !isPicture(b))).length} of ${mosaics.length}`],
      ['Operations rejected', `${runs.reduce((k, r) => k + r.rejected.length, 0)} of ${runs.reduce((k, r) => k + r.applied + r.rejected.length, 0)}`],
      ['Seconds per site, average', (a.sites.reduce((k, s) => k + s.seconds, 0) / n).toFixed(1)],
      ['Pictures in the whole run', a.sites.reduce((k, s) => k + s.counts.images, 0)],
    ],
    followed: a.shape.followed && { ...a.shape.followed, of: a.shape.directed },
  };
}

const [b, a] = await Promise.all([measure(before), measure(after)]);
const rows = a.rows.map(([label, value], i) => ({ label, before: b.rows[i][1], after: value }));
await writeFile(path.join(dir(after), 'compare.json'), JSON.stringify({ before, after, rows, followed: a.followed }, null, 1));

const wide = Math.max(...rows.map((r) => r.label.length));
console.log(`${''.padEnd(wide)}  ${before.padEnd(16)} ${after}`);
for (const r of rows) console.log(`${r.label.padEnd(wide)}  ${String(r.before).padEnd(16)} ${r.after}`);
if (a.followed) console.log(`\nThe AI followed its direction before the code enforced it, of ${a.followed.of} sites: first screen ${a.followed.hero}, divider rule ${a.followed.edges}, order of Home ${a.followed.angle}, ending ${a.followed.ending}`);
