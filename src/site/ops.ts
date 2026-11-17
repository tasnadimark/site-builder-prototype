// Every change to a site, whether it comes from the AI, the inspector or typing on the
// canvas, is one of these operations. An operation either produces a new valid document
// or is rejected and leaves the document exactly as it was.

import { BlockSchema, FooterSchema, NavSchema, SectionSchema, emptyDoc, parseDoc, type SiteDoc } from './schema';

export type OpResult = { doc: SiteDoc; ok: boolean; note: string; kind: string };

const isObj = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** How much content a document holds. Used to refuse edits that would silently delete something. */
function weight(doc: SiteDoc): number {
  let n = doc.sections.length + doc.nav.links.length + (doc.nav.cta ? 1 : 0) + doc.footer.columns.length;
  for (const c of doc.footer.columns) n += c.links.length;
  for (const s of doc.sections) {
    n += s.blocks.length + s.intro.actions.length + (s.media ? 1 : 0);
    for (const b of s.blocks) if (b.kind === 'plan') n += b.features.length;
  }
  return n;
}

export function applyOp(doc: SiteDoc, raw: unknown): OpResult {
  if (!isObj(raw) || typeof raw.op !== 'string') return { doc, ok: false, note: 'Not an operation', kind: 'invalid' };
  const o = raw;
  const kind: string = o.op;
  const ok = (next: unknown, note: string): OpResult => ({ doc: parseDoc(next), ok: true, note, kind });
  const fail = (note: string): OpResult => ({ doc, ok: false, note, kind });
  const find = (id: unknown) => doc.sections.findIndex((s) => s.id === id);
  const withSections = (sections: unknown[]) => ({ ...doc, sections });

  switch (kind) {
    case 'say':
    case 'error':
      return { doc, ok: kind === 'say', note: String(o.text ?? o.message ?? ''), kind };

    case 'reset':
      return ok(emptyDoc(), 'Started a blank page');

    case 'load':
      if (!isObj(o.doc)) return fail('Not a document');
      return ok(o.doc, 'Loaded document');

    case 'meta':
      return ok({ ...doc, meta: { ...doc.meta, ...o } }, 'Named the site');

    case 'theme': {
      const t = isObj(o.theme) ? o.theme : {};
      const cur = doc.theme;
      // Switching preset (or an explicit reset) starts from that preset's own look; old overrides
      // are dropped. The image art direction is kept so the photos stay as they are.
      const switching = o.reset === true || (typeof t.preset === 'string' && t.preset !== cur.preset);
      const base: Record<string, any> = switching ? { imageStyle: cur.imageStyle } : cur;
      const part = (k: string) => ({ ...(isObj(base[k]) ? base[k] : {}), ...(isObj(t[k]) ? t[k] : {}) });
      const next = { ...base, ...t, palette: part('palette'), fonts: part('fonts'), traits: part('traits') };
      const what = Object.keys(t)
        .flatMap((k) => (isObj(t[k]) ? Object.keys(t[k]).map((x) => (k === 'traits' ? x : `${k}.${x}`)) : [k]))
        .slice(0, 6)
        .join(', ');
      return ok({ ...doc, theme: next }, `Theme: ${what || 'no change'}`);
    }

    case 'nav': {
      const r = NavSchema.safeParse({ ...doc.nav, ...(isObj(o.nav) ? o.nav : {}) });
      return r.success ? ok({ ...doc, nav: r.data }, 'Updated navigation') : fail('Navigation did not match the schema');
    }

    case 'footer': {
      const r = FooterSchema.safeParse({ ...doc.footer, ...(isObj(o.footer) ? o.footer : {}) });
      return r.success ? ok({ ...doc, footer: r.data }, 'Updated footer') : fail('Footer did not match the schema');
    }

    case 'add': {
      const r = SectionSchema.safeParse(o.section);
      if (!r.success) return fail('Section did not match the schema');
      const sections = doc.sections.slice();
      let at = sections.length;
      if (typeof o.after === 'string' && find(o.after) >= 0) at = find(o.after) + 1;
      if (typeof o.at === 'number') at = clamp(Math.round(o.at), 0, sections.length);
      sections.splice(at, 0, r.data);
      return ok(withSections(sections), `Added ${r.data.type} section`);
    }

    case 'replace': {
      const i = find(o.id);
      if (i < 0) return fail(`No section "${o.id}"`);
      const r = SectionSchema.safeParse({ ...(isObj(o.section) ? o.section : {}), id: doc.sections[i].id });
      if (!r.success) return fail('Section did not match the schema');
      const sections = doc.sections.slice();
      sections[i] = r.data;
      return ok(withSections(sections), `Rebuilt ${r.data.type} section`);
    }

    case 'update': {
      const i = find(o.id);
      if (i < 0) return fail(`No section "${o.id}"`);
      const cur = doc.sections[i];
      const p = isObj(o.patch) ? o.patch : {};
      const merged: Record<string, any> = { ...cur, ...p, id: cur.id };
      if (p.layout !== undefined) {
        merged.layout = { ...cur.layout, ...(typeof p.layout === 'string' ? { kind: p.layout } : isObj(p.layout) ? p.layout : {}) };
      }
      if (p.intro !== undefined) merged.intro = { ...cur.intro, ...(isObj(p.intro) ? p.intro : {}) };
      if (p.media === null) merged.media = undefined;
      const r = SectionSchema.safeParse(merged);
      if (!r.success) return fail('That would leave the section empty');
      if (Array.isArray(p.blocks) && p.blocks.length && !r.data.blocks.length) return fail('None of the blocks matched the schema');
      const sections = doc.sections.slice();
      sections[i] = r.data;
      const what = Object.keys(p)
        .map((k) => (k === 'layout' ? `layout ${r.data.layout.kind}` : k === 'tone' ? `tone ${r.data.tone}` : k === 'edge' ? `edge ${r.data.edge}` : k))
        .join(', ');
      return ok(withSections(sections), `${cur.type}: ${what || 'no change'}`);
    }

    case 'remove': {
      const i = find(o.id);
      if (i < 0) return fail(`No section "${o.id}"`);
      return ok(withSections(doc.sections.filter((_, k) => k !== i)), `Removed ${doc.sections[i].type} section`);
    }

    case 'duplicate': {
      const i = find(o.id);
      if (i < 0) return fail(`No section "${o.id}"`);
      const sections = doc.sections.slice();
      sections.splice(i + 1, 0, structuredClone(doc.sections[i]));
      return ok(withSections(sections), `Duplicated ${doc.sections[i].type} section`);
    }

    case 'move': {
      const i = find(o.id);
      if (i < 0) return fail(`No section "${o.id}"`);
      const to = clamp(Math.round(typeof o.to === 'number' ? o.to : i + (Number(o.by) || 0)), 0, doc.sections.length - 1);
      if (to === i) return fail('Already there');
      const sections = doc.sections.slice();
      const [s] = sections.splice(i, 1);
      sections.splice(to, 0, s);
      return ok(withSections(sections), `Moved ${s.type} section`);
    }

    case 'block': {
      const i = find(o.id);
      if (i < 0) return fail(`No section "${o.id}"`);
      const cur = doc.sections[i];
      const bi = Number(o.index);
      if (!Number.isInteger(bi) || !cur.blocks[bi]) return fail(`No block ${o.index} in "${o.id}"`);
      const blocks: unknown[] = cur.blocks.slice();
      if (o.remove === true) {
        blocks.splice(bi, 1);
      } else if (typeof o.to === 'number') {
        const [b] = blocks.splice(bi, 1);
        blocks.splice(clamp(Math.round(o.to), 0, blocks.length), 0, b);
      } else {
        const patch = isObj(o.patch) ? o.patch : {};
        const merged: Record<string, any> = { ...cur.blocks[bi], ...patch };
        if (patch.image === null) merged.image = undefined;
        const r = BlockSchema.safeParse(merged);
        if (!r.success) return fail('Block did not match the schema');
        blocks[bi] = r.data;
      }
      const r = SectionSchema.safeParse({ ...cur, blocks });
      if (!r.success) return fail('That would leave the section empty');
      const sections = doc.sections.slice();
      sections[i] = r.data;
      return ok(withSections(sections), `${cur.type}: ${o.remove ? 'removed' : 'changed'} a ${cur.blocks[bi].kind}`);
    }

    case 'addBlock': {
      const i = find(o.id);
      if (i < 0) return fail(`No section "${o.id}"`);
      const r = BlockSchema.safeParse(o.block);
      if (!r.success) return fail('Block did not match the schema');
      const cur = doc.sections[i];
      if (cur.blocks.length >= 12) return fail('A section holds at most 12 blocks');
      const blocks = cur.blocks.slice();
      blocks.splice(typeof o.at === 'number' ? clamp(Math.round(o.at), 0, blocks.length) : blocks.length, 0, r.data);
      const sections = doc.sections.slice();
      sections[i] = { ...cur, blocks };
      return ok(withSections(sections), `${cur.type}: added a ${r.data.kind}`);
    }

    // Direct edits from the canvas and inspector: set one value at a path.
    case 'set': {
      const path: unknown[] = Array.isArray(o.path) ? o.path : [];
      const next: any = structuredClone(doc);
      let target: any = next;
      let keys = path.slice();
      if (keys[0] === 'section') {
        const i = find(keys[1]);
        if (i < 0) return fail('No such section');
        target = next.sections[i];
        keys = keys.slice(2);
      }
      if (!keys.length) return fail('Empty path');
      for (const k of keys.slice(0, -1)) {
        if (!target || typeof target !== 'object') return fail('Bad path');
        target = target[k as any];
      }
      if (!target || typeof target !== 'object') return fail('Bad path');
      target[keys[keys.length - 1] as any] = o.value;
      const parsed = parseDoc(next);
      if (weight(parsed) < weight(doc)) return fail('That text cannot be empty');
      return { doc: parsed, ok: true, note: `Edited ${keys.join('.')}`, kind };
    }

    default:
      return fail(`Unknown operation "${kind}"`);
  }
}

/** Build a document by applying a list of operations to a blank one. */
export function docFromOps(ops: unknown[]): SiteDoc {
  return ops.reduce<SiteDoc>((doc, op) => applyOp(doc, op).doc, emptyDoc());
}
