import { apiKey, chatStream, pickModel, replayStream } from '@/ai/openrouter';
import { editPrompt } from '@/ai/prompt';
import { parseDoc } from '@/site/schema';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { doc?: unknown; message?: string; selectedId?: string | null; pageId?: string | null; model?: string };
  if (!body.message?.trim()) return Response.json({ error: 'Missing message' }, { status: 400 });

  if (!apiKey()) {
    return replayStream([{ op: 'say', text: 'AI edits need an OpenRouter key. Add OPENROUTER_API_KEY to .env.local and restart the dev server. Everything else in the editor works without it.' }], 60);
  }

  const { system, user } = editPrompt(parseDoc(body.doc), body.message, body.selectedId ?? null, body.pageId ?? null);
  return chatStream({ model: pickModel('edit', body.model), system, user, maxTokens: 6000 });
}
