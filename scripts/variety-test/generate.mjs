// Generates every brief in briefs.mjs through the running app (the same /api/generate
// the editor calls, so the API key stays on the server), then builds each document
// with the app's own operation code, exactly as the editor does.
//
//   node --import ./scripts/variety-test/hooks.mjs scripts/variety-test/generate.mjs [batch] [concurrency] [ids]
//
// Results land in .prototype-cache/runs/<batch>/<id>.json. A site that already has a
// result is skipped, so an interrupted run can be resumed without paying twice.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// BRIEFS=./briefs-library-1.mjs runs another set of briefs with the same tools.
const { BRIEFS, TYPES } = await import(process.env.BRIEFS || './briefs.mjs');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { createOpStream } = await import('@/site/ops');
const { emptyDoc } = await import('@/site/schema');
const { createObjectStream } = await import('@/site/stream');
const { STRINGS } = await import('@/site/strings');
const { describeDirection, directionFor, directionOps, heroWritten: whichHero } = await import('@/site/direction');

const batch = process.argv[2] || 'variety-1';
const concurrency = Number(process.argv[3]) || 4;
const APP = process.env.APP_URL || 'http://localhost:3210';
const OUT = path.join(root, '.prototype-cache', 'runs', batch);
await mkdir(OUT, { recursive: true });

async function generate(b) {
  const file = path.join(OUT, `${b.id}.json`);
  try {
    const prev = JSON.parse(await readFile(file, 'utf8'));
    if (!prev.error && prev.applied) return { ...prev, skipped: true };
  } catch {}

  const kind = TYPES[b.type].kind;
  const t0 = performance.now();
  let firstMs = 0;
  let doc = emptyDoc();
  let applied = 0;
  let said = '';
  let error = '';
  let raw = '';
  const ops = [];
  const rejected = [];
  const apply = createOpStream();

  const parser = createObjectStream((obj) => {
    ops.push(obj);
    if (obj?.op === 'say') return void (said = String(obj.text ?? ''));
    if (obj?.op === 'error') return void (error = String(obj.message ?? 'Something went wrong'));
    const r = apply(doc, obj);
    if (r.doc !== doc) {
      applied++;
      if (!firstMs) firstMs = performance.now() - t0;
    }
    if (!r.ok) rejected.push({ op: obj?.op ?? '?', note: r.note });
    doc = r.doc;
  });

  try {
    const res = await fetch(`${APP}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief: b.brief, kind }),
    });
    if (!res.ok || !res.body) throw new Error(`Request failed (${res.status})`);
    const decoder = new TextDecoder();
    for await (const chunk of res.body) {
      const text = decoder.decode(chunk, { stream: true });
      raw += text;
      parser.push(text);
    }
  } catch (err) {
    error = error || err.message;
  }

  // The page rule in code, as in the editor: several locations means a page for each.
  let locationsAdded = false;
  if (applied && !error) {
    const r = apply(doc, { op: 'ensureLocations', group: STRINGS[doc.meta.language].locations });
    locationsAdded = r.doc !== doc;
    doc = r.doc;
  }

  // The direction in code, as in the editor. What the AI wrote for the first screen is
  // kept, so the run shows whether it followed the direction before it was enforced.
  const direction = directionFor(b.brief);
  const first = doc.pages[0]?.sections[0];
  const heroWritten = first && { hero: first.hero, layout: first.layout.kind, flip: first.layout.flip, backdrop: first.backdrop, align: first.intro.align };
  const edgesWritten = doc.theme.traits?.edges ?? null;
  // Which of the three first screens it chose, and whether it chose one of them at all.
  const heroChoice = first?.type === 'hero' ? whichHero(first, direction) : null;
  const variantsWritten = doc.pages.flatMap((p) => p.sections).filter((s) => s.variant).length;
  if (applied && !error) for (const op of directionOps(doc, direction)) doc = apply(doc, op).doc;

  const result = {
    id: b.id,
    type: b.type,
    kind,
    angle: b.angle,
    brief: b.brief,
    ms: Math.round(performance.now() - t0),
    firstMs: Math.round(firstMs),
    applied,
    rejected,
    locationsAdded,
    direction: describeDirection(direction),
    heroWritten,
    heroPicked: heroChoice && { id: heroChoice.plan.id, followed: heroChoice.followed },
    edgesWritten,
    variantsWritten,
    truncated: parser.pending,
    said,
    error,
    chars: raw.length,
    ops,
    doc,
  };
  await writeFile(file, JSON.stringify(result, null, 1));
  return result;
}

// An optional third argument limits the run to some briefs: a comma-separated list of ids.
const only = process.argv[4]?.split(',');
const queue = BRIEFS.filter((b) => !only || only.includes(b.id));
const results = [];
await Promise.all(
  Array.from({ length: concurrency }, async () => {
    for (let b; (b = queue.shift()); ) {
      const r = await generate(b);
      results.push(r);
      const flags = [
        r.skipped ? 'already done' : `${(r.ms / 1000).toFixed(1)}s`,
        `${r.doc.pages.length} pages`,
        `${r.applied} applied`,
        r.rejected.length ? `${r.rejected.length} REJECTED` : null,
        r.truncated ? 'CUT OFF MID-OBJECT' : null,
        r.locationsAdded ? 'location pages added by code' : null,
        r.error ? `ERROR: ${r.error}` : null,
      ].filter(Boolean);
      console.log(`${r.id.padEnd(24)} ${flags.join(' · ')}`);
    }
  }),
);

const failed = results.filter((r) => r.error || !r.applied);
console.log(`\n${results.length - failed.length} of ${results.length} sites generated into ${path.relative(root, OUT)}`);
process.exit(failed.length ? 1 : 0);
