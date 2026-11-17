'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Effective } from '../plan';
import type { ImageRef, Section, SiteDoc } from '../schema';
import type { Strings } from '../strings';
import type { Resolved } from '../theme';

export type Path = (string | number)[];
export type Selection = { sectionId: string; block?: number } | null;

/** Supplied by an editor. Without it the renderer draws a plain, read-only site. */
export type EditApi = {
  selection: Selection;
  select(sectionId: string | null, block?: number): void;
  /** Returns false when the edit was rejected, so the text can snap back. */
  setText(path: Path, value: string): boolean;
  /** Any other operation an on-canvas control needs. Returns whether it was applied. */
  run(op: unknown): boolean;
  sectionChrome?(section: Section, index: number, total: number, eff: Effective): ReactNode;
};

export type ImageState = { status: 'idle' | 'queued' | 'loading' | 'ready' | 'error' | 'off'; url?: string };

/** Supplied by the host. Maps an image description to a URL whenever one is ready. */
export type ImageApi = {
  request(image: ImageRef, style: string): void;
  snapshot(image: ImageRef, style: string): ImageState;
  subscribe(cb: () => void): () => void;
};

export type SiteContext = {
  doc: SiteDoc;
  theme: Resolved;
  /** Built-in labels in the site's language. */
  t: Strings;
  edit: EditApi | null;
  images: ImageApi | null;
  /** Go to another page of the site. */
  navigate(pageId: string): void;
};

export const SiteCtx = createContext<SiteContext | null>(null);

export function useSite(): SiteContext {
  const ctx = useContext(SiteCtx);
  if (!ctx) throw new Error('useSite outside <Site>');
  return ctx;
}

/** Renders children as read-only (used for the duplicated half of a marquee). */
export function ReadOnly({ children }: { children: ReactNode }) {
  const ctx = useSite();
  return <SiteCtx.Provider value={{ ...ctx, edit: null }}>{children}</SiteCtx.Provider>;
}
