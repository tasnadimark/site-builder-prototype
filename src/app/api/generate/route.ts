import { apiKey, chatStream, pickModel, replayStream } from '@/ai/openrouter';
import { generatePrompt } from '@/ai/prompt';
import { NORTHFOLD_OPS } from '@/site/fixtures/northfold';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { brief, model, kind } = (await req.json().catch(() => ({}))) as { brief?: string; model?: string; kind?: string };
  if (!brief?.trim()) return Response.json({ error: 'Missing brief' }, { status: 400 });

  // No key: replay the starter site through the same stream, so the pipeline can be seen working.
  if (!apiKey()) {
    return replayStream([
      ...NORTHFOLD_OPS,
      { op: 'say', text: 'Demo mode: no OpenRouter key is set, so this replayed the built-in Northfold site instead of using your brief.' },
    ]);
  }

  const { system, user } = generatePrompt(brief, kind);
  // A site of several pages is a long answer; leave room for it.
  return chatStream({ model: pickModel('generate', model), system, user, maxTokens: 28000 });
}
