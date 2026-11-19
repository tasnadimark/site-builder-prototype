// Prints how much the OpenRouter key in .env.local has spent in total, so a test run can
// be costed by reading it before and after. Only the figure is printed, never the key.
//
//   node scripts/variety-test/spend.mjs

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const env = await readFile(path.join(root, '.env.local'), 'utf8').catch(() => '');
const key = env.match(/^OPENROUTER_API_KEY=(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '');
if (!key) {
  console.log('no key in .env.local');
  process.exit(1);
}

for (const url of ['https://openrouter.ai/api/v1/key', 'https://openrouter.ai/api/v1/auth/key']) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } }).catch(() => null);
  if (!res?.ok) continue;
  const usage = (await res.json().catch(() => null))?.data?.usage;
  if (typeof usage === 'number') {
    console.log(JSON.stringify({ usageUsd: Number(usage.toFixed(4)), at: new Date().toISOString() }));
    process.exit(0);
  }
}
console.log('could not read usage');
process.exit(1);
