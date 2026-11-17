// Every change to a site, whether it comes from the AI, the inspector or typing on the
// canvas, is one of these operations. An operation either produces a new valid document
// or is rejected and leaves the document exactly as it was.

import {
  BlockSchema,
  BusinessSchema,
  FooterSchema,
  NavSchema,
  PageSchema,
  SectionSchema,
  emptyDoc,
  findSection,
  parseDoc,
  type SiteDoc,
} from './schema';

export type OpResult = { doc: SiteDoc; ok: boolean; note: string; kind: string };

/** Where an operation lands when it does not say: the page being built or looked at. */
export type OpContext = { page?: string };

const isObj = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** How much content a document holds. Used to refuse edits that would silently delete something. */
function weight(doc: SiteDoc): number {
  let n = doc.pages.length + doc.nav.links.length + (doc.nav.cta ? 1 : 0) + doc.footer.columns.length;
  n += doc.business.locations.length + doc.business.socials.length + doc.business.areas.length;
  for (const l of doc.business.locations) n += l.hours.length;
  for (const c of doc.footer.columns) n += c.links.length;
  for (const page of doc.pages) {
    n += page.sections.length;
    for (const s of page.sections) {
      n += s.blocks.length + s.intro.actions.length + (s.media ? 1 : 0);
      for (const b of s.blocks) if (b.kind === 'plan') n += b.features.length;
    }
  }
  return n;
}

export function applyOp(doc: SiteDoc, raw: unknown, ctx: OpContext = {}): OpResult {
  if (!isObj(raw) || typeof raw.op !== 'string') return { doc, ok: false, note: 'Not an operation', kind: 'invalid' };
  const o = raw;
  const kind: string = o.op;
  const ok = (next: unknown, note: string): OpResult => ({ doc: parseDoc(next), ok: true, note, kind });
  const fail = (note: string): OpResult => ({ doc, ok: false, note, kind });

  const pageIndex = (id: unknown) => doc.pages.findIndex((p) => p.id === id);
  /** Replace one page's sections, leaving every other page untouched. */
  const withSections = (p: number, sections: unknown[]) => ({
    ...doc,
    pages: doc.pages.map((page, i) => (i === p ? { ...page, sections } : page)),
  });
  const noSection = () => fail(`No section "${o.id}"`);

  switch (kind) {
    case 'say':
    case 'error':
      return { doc, ok: kind === 'say', note: String(o.text ?? o.message ?? ''), kind };

    case 'reset':
      return ok(emptyDoc(), 'Started a blank site');

    case 'load':
      if (!isObj(o.doc)) return fail('Not a document');
      return ok(o.doc, 'Loaded document');

    case 'meta':
      return ok({ ...doc, meta: { ...doc.meta, ...o } }, 'Named the site');

    case 'business': {
      const b = isObj(o.business) ? o.business : {};
      const r = BusinessSchema.safeParse({ ...doc.business, ...b, rating: b.rating === null ? undefined : (b.rating ?? doc.business.rating) });
      if (!r.success) return fail('Business facts did not match the schema');
      return ok({ ...doc, business: r.data }, `Business facts: ${Object.keys(b).slice(0, 6).join(', ') || 'no change'}`);
    }

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

    // ------------------------------------------------------------ pages

    case 'page': {
      const p = isObj(o.page) ? o.page : {};
      const i = pageIndex(p.id);
      if (i >= 0) {
        const r = PageSchema.safeParse({ ...doc.pages[i], ...p, sections: Array.isArray(p.sections) ? p.sections : doc.pages[i].sections });
        if (!r.success) return fail('Page did not match the schema');
        return ok({ ...doc, pages: doc.pages.map((page, k) => (k === i ? r.data : page)) }, `Updated page “${r.data.title}”`);
      }
      const r = PageSchema.safeParse({ sections: [], ...p });
      if (!r.success) return fail('Page did not match the schema');
      if (doc.pages.length >= 14) return fail('A site holds at most 14 pages');
      const pages = doc.pages.slice();
      const after = pageIndex(o.after);
      pages.splice(after >= 0 ? after + 1 : pages.length, 0, r.data);
      return ok({ ...doc, pages }, `Added page “${r.data.title}”`);
    }

    case 'removePage': {
      const i = pageIndex(o.id);
      if (i < 0) return fail(`No page "${o.id}"`);
      if (i === 0) return fail('The Home page cannot be removed');
      return ok({ ...doc, pages: doc.pages.filter((_, k) => k !== i) }, `Removed page “${doc.pages[i].title}”`);
    }

    case 'movePage': {
      const i = pageIndex(o.id);
      if (i < 0) return fail(`No page "${o.id}"`);
      if (i === 0) return fail('Home is always the first page');
      const to = clamp(Math.round(typeof o.to === 'number' ? o.to : i + (Number(o.by) || 0)), 1, doc.pages.length - 1);
      if (to === i) return fail('Already there');
      const pages = doc.pages.slice();
      const [page] = pages.splice(i, 1);
      pages.splice(to, 0, page);
      return ok({ ...doc, pages }, `Moved page “${page.title}”`);
    }

    // The page rule says a business with several locations gets a page for each, grouped
    // under one dropdown. This enforces it: any location without a page gets one. It is
    // applied after a site is generated, so the rule does not depend on the model.
    case 'ensureLocations': {
      const locs = doc.business.locations;
      const covered = new Set<string>();
      for (const page of doc.pages) {
        if (page.role !== 'location') continue;
        for (const s of page.sections) for (const b of s.blocks) if (b.kind === 'contact') covered.add(b.location ?? locs[0]?.id);
      }
      const missing = locs.length >= 2 ? locs.filter((l) => !covered.has(l.id)) : [];
      if (!missing.length) return { doc, ok: true, note: 'Every location has a page', kind };
      const group = doc.pages.find((p) => p.role === 'location' && p.group)?.group ?? String(o.group || 'Locations');
      const added = missing.map((l) => ({
        id: l.id,
        title: l.name,
        role: 'location',
        group,
        sections: [
          {
            id: `${l.id}-details`,
            type: 'contact',
            layout: { kind: 'stack', width: 'wide' },
            intro: { heading: l.name, body: l.address, align: 'start' },
            blocks: [{ kind: 'contact', location: l.id, map: true }],
          },
        ],
      }));
      // Location pages sit just before the contact page, which is where the menu ends.
      const pages: unknown[] = doc.pages.slice();
      const at = doc.pages.findIndex((p) => p.role === 'contact');
      pages.splice(at > 0 ? at : pages.length, 0, ...added);
      return ok({ ...doc, pages }, `Added a page for each location: ${missing.map((l) => l.name).join(', ')}`);
    }

    // ------------------------------------------------------------ sections

    case 'add': {
      const r = SectionSchema.safeParse(o.section);
      if (!r.success) return fail('Section did not match the schema');
      const anchor = typeof o.after === 'string' ? findSection(doc, o.after) : null;
      const target = o.page ?? ctx.page ?? 'home';
      const p = anchor ? anchor.page : pageIndex(target);
      if (p < 0) return fail(`No page "${target}". Add the page before its sections.`);
      const sections = doc.pages[p].sections.slice();
      if (sections.length >= 14) return fail('A page holds at most 14 sections');
      let at = anchor ? anchor.index + 1 : sections.length;
      if (typeof o.at === 'number') at = clamp(Math.round(o.at), 0, sections.length);
      sections.splice(at, 0, r.data);
      return ok(withSections(p, sections), `Added ${r.data.type} section${p > 0 ? ` to “${doc.pages[p].title}”` : ''}`);
    }

    case 'replace': {
      const w = findSection(doc, o.id);
      if (!w) return noSection();
      const r = SectionSchema.safeParse({ ...(isObj(o.section) ? o.section : {}), id: o.id });
      if (!r.success) return fail('Section did not match the schema');
      const sections = doc.pages[w.page].sections.slice();
      sections[w.index] = r.data;
      return ok(withSections(w.page, sections), `Rebuilt ${r.data.type} section`);
    }

    case 'update': {
      const w = findSection(doc, o.id);
      if (!w) return noSection();
      const cur = doc.pages[w.page].sections[w.index];
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
      const sections = doc.pages[w.page].sections.slice();
      sections[w.index] = r.data;
      const what = Object.keys(p)
        .map((k) => (k === 'layout' ? `layout ${r.data.layout.kind}` : k === 'tone' ? `tone ${r.data.tone}` : k === 'edge' ? `edge ${r.data.edge}` : k))
        .join(', ');
      return ok(withSections(w.page, sections), `${cur.type}: ${what || 'no change'}`);
    }

    case 'remove': {
      const w = findSection(doc, o.id);
      if (!w) return noSection();
      const sections = doc.pages[w.page].sections;
      return ok(withSections(w.page, sections.filter((_, k) => k !== w.index)), `Removed ${sections[w.index].type} section`);
    }

    case 'duplicate': {
      const w = findSection(doc, o.id);
      if (!w) return noSection();
      const sections = doc.pages[w.page].sections.slice();
      sections.splice(w.index + 1, 0, structuredClone(sections[w.index]));
      return ok(withSections(w.page, sections), `Duplicated ${sections[w.index].type} section`);
    }

    case 'move': {
      const w = findSection(doc, o.id);
      if (!w) return noSection();
      const sections = doc.pages[w.page].sections.slice();
      const to = clamp(Math.round(typeof o.to === 'number' ? o.to : w.index + (Number(o.by) || 0)), 0, sections.length - 1);
      if (to === w.index) return fail('Already there');
      const [s] = sections.splice(w.index, 1);
      sections.splice(to, 0, s);
      return ok(withSections(w.page, sections), `Moved ${s.type} section`);
    }

    // ------------------------------------------------------------ blocks

    case 'block': {
      const w = findSection(doc, o.id);
      if (!w) return noSection();
      const cur = doc.pages[w.page].sections[w.index];
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
      const sections = doc.pages[w.page].sections.slice();
      sections[w.index] = r.data;
      return ok(withSections(w.page, sections), `${cur.type}: ${o.remove ? 'removed' : 'changed'} a ${cur.blocks[bi].kind}`);
    }

    case 'addBlock': {
      const w = findSection(doc, o.id);
      if (!w) return noSection();
      const r = BlockSchema.safeParse(o.block);
      if (!r.success) return fail('Block did not match the schema');
      const cur = doc.pages[w.page].sections[w.index];
      if (cur.blocks.length >= 24) return fail('A section holds at most 24 blocks');
      const blocks = cur.blocks.slice();
      blocks.splice(typeof o.at === 'number' ? clamp(Math.round(o.at), 0, blocks.length) : blocks.length, 0, r.data);
      const sections = doc.pages[w.page].sections.slice();
      sections[w.index] = { ...cur, blocks };
      return ok(withSections(w.page, sections), `${cur.type}: added a ${r.data.kind}`);
    }

    // Rename the heading shared by a run of rows (a price group, a day in a timetable).
    case 'regroup': {
      const w = findSection(doc, o.id);
      if (!w) return noSection();
      const cur = doc.pages[w.page].sections[w.index];
      const to = String(o.to ?? '').trim();
      const blocks = cur.blocks.map((b) => (b.kind === 'row' && (b.group ?? '') === String(o.from ?? '') ? { ...b, group: to || undefined } : b));
      const sections = doc.pages[w.page].sections.slice();
      sections[w.index] = { ...cur, blocks };
      return ok(withSections(w.page, sections), `${cur.type}: renamed a group`);
    }

    // Direct edits from the canvas and inspector: set one value at a path.
    case 'set': {
      const path: unknown[] = Array.isArray(o.path) ? o.path : [];
      const next: any = structuredClone(doc);
      let target: any = next;
      let keys = path.slice();
      if (keys[0] === 'section') {
        const w = findSection(doc, keys[1]);
        if (!w) return fail('No such section');
        target = next.pages[w.page].sections[w.index];
        keys = keys.slice(2);
      } else if (keys[0] === 'page') {
        const i = pageIndex(keys[1]);
        if (i < 0) return fail('No such page');
        target = next.pages[i];
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

/**
 * Applies a stream of operations in order. Sections that do not name a page go to the
 * page most recently declared in the stream, which is how a model naturally writes them.
 */
export function createOpStream(initialPage?: string) {
  let page = initialPage;
  return (doc: SiteDoc, raw: unknown): OpResult => {
    const result = applyOp(doc, raw, { page });
    const declared = (raw as { op?: string; page?: { id?: unknown } } | null)?.op === 'page' ? (raw as any).page?.id : undefined;
    if (result.ok && typeof declared === 'string') {
      // The id may have been normalised, so look the page up rather than trusting the input.
      page = result.doc.pages.find((p) => p.id === declared)?.id ?? result.doc.pages[result.doc.pages.length - 1].id;
    }
    return result;
  };
}

/** Build a document by applying a list of operations to a blank one. */
export function docFromOps(ops: unknown[]): SiteDoc {
  const apply = createOpStream();
  return ops.reduce<SiteDoc>((doc, op) => apply(doc, op).doc, emptyDoc());
}
