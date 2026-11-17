import { readFile } from 'node:fs/promises';
import path from 'node:path';

const CACHE_DIR = path.join(process.cwd(), '.prototype-cache', 'images');

export async function GET(_req: Request, ctx: { params: Promise<{ hash: string }> }) {
  const { hash } = await ctx.params;
  if (!/^[a-f0-9]{24}$/.test(hash)) return new Response('Not found', { status: 404 });
  try {
    const meta = JSON.parse(await readFile(path.join(CACHE_DIR, `${hash}.json`), 'utf8')) as { mediaType: string };
    const bytes = await readFile(path.join(CACHE_DIR, `${hash}.bin`));
    return new Response(new Uint8Array(bytes), {
      headers: { 'Content-Type': meta.mediaType, 'Cache-Control': 'public, max-age=31536000, immutable' },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
