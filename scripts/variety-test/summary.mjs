// A short readout of one run: for each site its pages, the pieces it used, its main
// button and how many pictures it has, then what the run cost. Use it after generating
// sample sites for new business types, to see at a glance whether each followed its recipe.
//
//   node scripts/variety-test/summary.mjs <run>
//
// Needs analysis.json (analyze.mjs). Cost needs spend-before.json and spend-after.json
// written by spend.mjs around the run; without them the cost line is left out.

import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const batch = process.argv[2];
if (!batch) {
  console.error('Name a run, for example: node scripts/variety-test/summary.mjs library-3');
  process.exit(1);
}
const RUN = path.join(root, '.prototype-cache', 'runs', batch);
const json = async (file) => JSON.parse(await readFile(file, 'utf8'));

const analysis = await json(path.join(RUN, 'analysis.json'));
for (const site of analysis.sites) {
  const run = await json(path.join(RUN, `${site.id}.json`));
  const sections = run.doc.pages.flatMap((p) => p.sections);
  const blocks = sections.flatMap((s) => s.blocks);
  const count = (kind) => blocks.filter((b) => b.kind === kind).length;
  const used = ['beforeafter', 'project', 'person', 'plan', 'row', 'check', 'quote', 'qa', 'form', 'image']
    .map((k) => [k, count(k)])
    .filter(([, n]) => n)
    .map(([k, n]) => `${k} ${n}`)
    .join(', ');
  const hero = run.doc.pages[0].sections[0];
  const buttons = hero.intro.actions.map((a) => `${a.label} [${a.href.startsWith('tel:') ? 'call' : a.href}]`).join(' / ');
  console.log(`${site.id}  (${site.typeLabel})`);
  console.log(`   pages     ${site.pages.map((p) => p.title).join(', ')}`);
  console.log(`   home      ${site.home.map((s) => `${s.type}/${s.layout}`).join(' > ')}`);
  console.log(`   uses      ${used}`);
  console.log(`   buttons   ${buttons}`);
  console.log(`   pictures  ${site.counts.images}   rating shown: ${run.doc.business.rating ? 'yes' : 'no'}   testimonials sections: ${sections.filter((s) => s.type === 'testimonials').length}   rejected: ${run.rejected.length}`);
}

// What the run cost: the key's spend before and after, split by the pictures made in between.
try {
  const before = await json(path.join(RUN, 'spend-before.json'));
  const after = await json(path.join(RUN, 'spend-after.json'));
  const images = path.join(root, '.prototype-cache', 'images');
  const since = new Date(before.at).getTime();
  let pictures = 0;
  let picturesUsd = 0;
  for (const f of (await readdir(images)).filter((f) => f.endsWith('.json'))) {
    if ((await stat(path.join(images, f))).mtimeMs < since) continue;
    pictures++;
    picturesUsd += (await json(path.join(images, f))).costUsd || 0;
  }
  const totalUsd = Number((after.usageUsd - before.usageUsd).toFixed(2));
  const cost = { totalUsd, pictures, picturesUsd: Number(picturesUsd.toFixed(2)), textUsd: Number((totalUsd - picturesUsd).toFixed(2)) };
  await writeFile(path.join(RUN, 'cost.json'), JSON.stringify(cost));
  console.log(`\ncost  $${cost.totalUsd} in total: text $${cost.textUsd}, ${cost.pictures} pictures $${cost.picturesUsd}`);
} catch {
  console.log('\ncost  not recorded for this run');
}
