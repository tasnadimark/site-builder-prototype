// Server-side only. The key never leaves this module.

export const DEFAULT_MODELS = {
  generate: 'anthropic/claude-sonnet-5.5',
  edit: 'anthropic/claude-haiku-5.5',
  image: 'google/gemini-3.1-flash-lite-image',
};

export const TEXT_MODELS = [
  { id: 'auto', label: 'Auto (Sonnet builds, Haiku edits)' },
  { id: 'anthropic/claude-haiku-5.5', label: 'Claude Haiku 5.5 (fastest)' },
  { id: 'anthropic/claude-sonnet-5.5', label: 'Claude Sonnet 5.5' },
  { id: 'anthropic/claude-opus-5.5', label: 'Claude Opus 5.5' },
];

export const apiKey = () => process.env.OPENROUTER_API_KEY?.trim() || '';

/** Overridable so the routes can be pointed at a local mock. */
export const baseUrl = () => (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '');

export function pickModel(task: 'generate' | 'edit', requested?: string): string {
  if (requested && requested !== 'auto' && TEXT_MODELS.some((m) => m.id === requested)) return requested;
  return task === 'generate'
    ? process.env.OPENROUTER_MODEL_GENERATE || DEFAULT_MODELS.generate
    : process.env.OPENROUTER_MODEL_EDIT || DEFAULT_MODELS.edit;
}

export const imageModel = () => process.env.OPENROUTER_IMAGE_MODEL || DEFAULT_MODELS.image;

// Thinking delays the first visible section, so keep it as low as each model allows.
function reasoningFor(model: string) {
  if (model.includes('haiku')) return { effort: 'none' };
  if (model.startsWith('anthropic/')) return { effort: 'low', exclude: true };
  return undefined;
}

const encoder = new TextEncoder();
const opLine = (op: object) => encoder.encode(`\n${JSON.stringify(op)}\n`);

const STREAM_HEADERS = {
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'no-store, no-transform',
  'X-Accel-Buffering': 'no',
};

export function textStream(source: ReadableStream<Uint8Array>): Response {
  return new Response(source, { headers: STREAM_HEADERS });
}

/** A canned stream of operations, paced like a model, for running without a key. */
export function replayStream(ops: unknown[], msPerOp = 380): Response {
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const op of ops) {
        const line = JSON.stringify(op) + '\n';
        // Send each object in pieces so the client's incremental parser is exercised.
        const step = Math.max(40, Math.ceil(line.length / 6));
        for (let i = 0; i < line.length; i += step) {
          controller.enqueue(encoder.encode(line.slice(i, i + step)));
          await new Promise((r) => setTimeout(r, msPerOp / 6));
        }
      }
      controller.close();
    },
  });
  return textStream(stream);
}

/** Calls OpenRouter and relays only the text the model writes, as it arrives. */
export async function chatStream(opts: { model: string; system: string; user: string; maxTokens: number }): Promise<Response> {
  const fail = (message: string) =>
    textStream(
      new ReadableStream({
        start(c) {
          c.enqueue(opLine({ op: 'error', message }));
          c.close();
        },
      }),
    );

  let upstream: Response;
  try {
    upstream = await fetch(`${baseUrl()}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: opts.model,
        stream: true,
        max_tokens: opts.maxTokens,
        reasoning: reasoningFor(opts.model),
        messages: [
          { role: 'system', content: opts.system },
          { role: 'user', content: opts.user },
        ],
      }),
    });
  } catch (err) {
    return fail(`Could not reach OpenRouter: ${(err as Error).message}`);
  }

  if (!upstream.ok || !upstream.body) {
    const body = await upstream.text().catch(() => '');
    let message = body.slice(0, 300);
    try {
      message = JSON.parse(body).error?.message ?? message;
    } catch {}
    return fail(`OpenRouter ${upstream.status}: ${message}`);
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      // A pull must enqueue something or close, otherwise the stream is never pulled again.
      for (;;) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        let sent = false;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (!data || data === '[DONE]') continue;
          try {
            const json = JSON.parse(data);
            if (json.error) {
              controller.enqueue(opLine({ op: 'error', message: json.error.message ?? 'The model provider returned an error' }));
              sent = true;
            }
            const delta = json.choices?.[0]?.delta?.content;
            if (typeof delta === 'string' && delta) {
              controller.enqueue(encoder.encode(delta));
              sent = true;
            }
          } catch {}
        }
        if (sent) return;
      }
    },
    cancel() {
      void reader.cancel();
    },
  });
  return textStream(stream);
}
