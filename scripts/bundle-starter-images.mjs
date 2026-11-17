// Copies the pictures used by the bundled example sites out of the local image cache
// (.prototype-cache/images) into public/starter, so a fresh clone shows them without
// an API key and without paying to regenerate them.
//
// Run after generating a site you want to ship as an example:
//   1. Save its document (State drawer, Copy) as src/site/fixtures/<name>.json
//   2. Register it in src/site/fixtures/examples.ts
//   3. npm run bundle-images

import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURES = path.join(root, 'src', 'site', 'fixtures');
const CACHE = path.join(root, '.prototype-cache', 'images');
const OUT = path.join(root, 'public', 'starter');
const MODEL = process.env.OPENROUTER_IMAGE_MODEL || 'google/gemini-3.1-flash-lite-image';

// These three must match src/app/api/image/route.ts.
const RATIO = { wide: '21:9', landscape: '4:3', square: '1:1', portrait: '4:5' };
const sha = (parts) => createHash('sha256').update(parts.join('\n')).digest('hex').slice(0, 24);
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** Every image reference anywhere inside a document or a list of operations. */
function findImages(node, found = []) {
  if (Array.isArray(node)) node.forEach((n) => findImages(n, found));
  else if (node && typeof node === 'object') {
    if (typeof node.prompt === 'string' && ('alt' in node || 'aspect' in node)) found.push(node);
    else Object.values(node).forEach((v) => findImages(v, found));
  }
  return found;
}

/** The art direction a site applies to all its pictures. */
function imageStyle(data) {
  const theme = Array.isArray(data) ? data.find((op) => op?.op === 'theme')?.theme : data.theme;
  if (!theme?.imageStyle) throw new Error('needs an explicit theme.imageStyle');
  return theme.imageStyle;
}

await mkdir(OUT, { recursive: true });
const keep = new Set();
let missing = 0;

for (const file of (await readdir(FIXTURES)).filter((f) => f.endsWith('.json')).sort()) {
  const data = JSON.parse(await readFile(path.join(FIXTURES, file), 'utf8'));
  const style = imageStyle(data);
  for (const image of findImages(data)) {
    const ratio = RATIO[image.aspect] ?? RATIO.landscape;
    const cached = sha([MODEL, ratio, style, image.prompt]);
    const bundled = sha([ratio, style, image.prompt]);
    try {
      const meta = JSON.parse(await readFile(path.join(CACHE, `${cached}.json`), 'utf8'));
      const name = `${bundled}.${EXT[meta.mediaType] ?? 'jpg'}`;
      await copyFile(path.join(CACHE, `${cached}.bin`), path.join(OUT, name));
      keep.add(name);
      console.log(`ok       ${file}  ${name}  ${image.alt || image.prompt.slice(0, 50)}`);
    } catch {
      missing++;
      console.log(`MISSING  ${file}  not in the local cache: ${image.alt || image.prompt.slice(0, 50)}`);
    }
  }
}

for (const f of await readdir(OUT)) if (!keep.has(f)) await rm(path.join(OUT, f));
console.log(`\n${keep.size} bundled in public/starter${missing ? `, ${missing} missing (open the site with a key so they generate, then run this again)` : ''}`);
process.exit(missing ? 1 : 0);
