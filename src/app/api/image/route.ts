import { createHash } from 'node:crypto';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { apiKey, baseUrl, imageModel } from '@/ai/openrouter';

export const dynamic = 'force-dynamic';

// PROTOTYPE cache, safe to delete. Each distinct prompt is only ever paid for once.
const CACHE_DIR = path.join(process.cwd(), '.prototype-cache', 'images');

// Pictures for the bundled example sites, committed to the repository (see scripts/bundle-starter-images.mjs).
const BUNDLED_DIR = path.join(process.cwd(), 'public', 'starter');

const RATIO: Record<string, string> = { wide: '21:9', landscape: '4:3', square: '1:1', portrait: '4:5' };

export async function POST(req: Request) {
  const { prompt, style, aspect } = (await req.json().catch(() => ({}))) as { prompt?: string; style?: string; aspect?: string };
  if (!prompt?.trim()) return Response.json({ error: 'missing-prompt' }, { status: 400 });

  const model = imageModel();
  const ratio = RATIO[aspect ?? ''] ?? RATIO.landscape;
  const hash = createHash('sha256').update([model, ratio, style ?? '', prompt].join('\n')).digest('hex').slice(0, 24);
  const url = `/api/image/${hash}`;

  // The file's timestamp goes into the URL so a regenerated picture is never served from
  // the browser's cache under the old address.
  try {
    const { mtimeMs } = await stat(path.join(CACHE_DIR, `${hash}.bin`));
    return Response.json({ url: `${url}?v=${Math.round(mtimeMs)}`, cached: true });
  } catch {}

  // A bundled picture is keyed by what it shows, not by which model made it, so it is
  // found whatever image model is configured. No key and no paid call are needed.
  const bundled = createHash('sha256').update([ratio, style ?? '', prompt].join('\n')).digest('hex').slice(0, 24);
  for (const ext of ['jpg', 'png', 'webp']) {
    try {
      await stat(path.join(BUNDLED_DIR, `${bundled}.${ext}`));
      return Response.json({ url: `/starter/${bundled}.${ext}`, cached: true, bundled: true });
    } catch {}
  }

  if (!apiKey()) return Response.json({ error: 'no-key' });

  const full = `${prompt.trim()}.${style ? ` Style: ${style.trim()}.` : ''} No text, lettering, logos or watermarks anywhere in the image.`;
  const res = await fetch(`${baseUrl()}/images`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt: full, aspect_ratio: ratio }),
  }).catch(() => null);

  if (!res?.ok) {
    const detail = res ? (await res.text().catch(() => '')).slice(0, 300) : 'network error';
    return Response.json({ error: 'failed', status: res?.status ?? 0, detail });
  }
  const json = (await res.json().catch(() => null)) as { data?: { b64_json?: string; media_type?: string }[]; usage?: { cost?: number } } | null;
  const item = json?.data?.[0];
  if (!item?.b64_json) return Response.json({ error: 'failed', detail: 'No image in the response' });

  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(path.join(CACHE_DIR, `${hash}.bin`), Buffer.from(item.b64_json, 'base64'));
  await writeFile(path.join(CACHE_DIR, `${hash}.json`), JSON.stringify({ mediaType: item.media_type ?? 'image/png', model, prompt: full, costUsd: json?.usage?.cost ?? null }));
  return Response.json({ url: `${url}?v=${Date.now()}`, cached: false });
}
