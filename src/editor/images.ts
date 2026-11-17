// Client-side image queue. The renderer asks for a picture by description; this turns
// that into a request to /api/image (three at a time) and tells the renderer when a URL exists.

import type { ImageApi, ImageState } from '@/site/render/context';
import type { ImageRef } from '@/site/schema';

const IDLE: ImageState = { status: 'idle' };
const OFF: ImageState = { status: 'off' };

type Job = { prompt: string; style: string; aspect: string };

export function createImageStore(): ImageApi {
  const entries = new Map<string, ImageState>();
  const jobs = new Map<string, Job>();
  const listeners = new Set<() => void>();
  const queue: string[] = [];
  let active = 0;

  const keyOf = (image: ImageRef, style: string) => [image.aspect, style, image.prompt].join('\u0001');
  const emit = () => listeners.forEach((l) => l());
  const put = (key: string, state: ImageState) => {
    entries.set(key, state);
    emit();
  };

  function pump() {
    while (active < 3 && queue.length) {
      const key = queue.shift()!;
      active++;
      put(key, { status: 'loading' });
      fetch('/api/image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(jobs.get(key)) })
        .then((r) => r.json())
        .then((j: { url?: string; error?: string }) => {
          if (j.url) put(key, { status: 'ready', url: j.url });
          // No key on the server: this slot keeps its placeholder. Later requests still go
          // out, because pictures for the bundled examples resolve without a key.
          else if (j.error === 'no-key') put(key, OFF);
          else put(key, { status: 'error' });
        })
        .catch(() => put(key, { status: 'error' }))
        .finally(() => {
          active--;
          pump();
        });
    }
  }

  return {
    request(image, style) {
      const key = keyOf(image, style);
      if (entries.has(key)) return;
      jobs.set(key, { prompt: image.prompt, style, aspect: image.aspect });
      entries.set(key, { status: 'queued' });
      queue.push(key);
      emit();
      pump();
    },
    snapshot: (image, style) => entries.get(keyOf(image, style)) ?? IDLE,
    subscribe(cb) {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
  };
}
