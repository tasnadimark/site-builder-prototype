// Development aid: shows one site from a test run (.prototype-cache/runs/<batch>/<id>.json,
// written by scripts/variety-test/generate.mjs) on its own, with no editor around it.
// The screenshot script and the test report both point here.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { notFound } from 'next/navigation';
import Preview from '../../Preview';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ batch: string; id: string }>; searchParams: Promise<{ page?: string; first?: string }> };

export default async function Page({ params, searchParams }: Props) {
  const { batch, id } = await params;
  const { page, first } = await searchParams;
  if (![batch, id].every((s) => /^[a-z0-9-]+$/.test(s))) notFound();

  const file = path.join(process.cwd(), '.prototype-cache', 'runs', batch, `${id}.json`);
  const run = await readFile(file, 'utf8')
    .then((text) => JSON.parse(text) as { doc?: unknown })
    .catch(() => null);
  if (!run?.doc) notFound();

  return <Preview doc={run.doc} page={page ?? 'home'} firstOnly={first === '1'} />;
}
