'use client';

// PROTOTYPE editor shell. Question being tested: can a schema-driven document, edited
// only through validated operations, produce sites that look designed, appear fast,
// and feel free to edit without ever breaking?
//
// State lives in memory, plus session storage so a reload of the tab keeps the current
// site. Use the State drawer to copy the document out.

import { ArrowDown, ArrowUp, Braces, Copy, Monitor, PanelLeftOpen, PanelRightOpen, Plus, Redo2, Smartphone, Tablet, Trash2, Undo2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { EXAMPLES, starterDoc, type Example } from '@/site/fixtures/examples';
import { EXAMPLE_BRIEFS } from '@/site/fixtures/northfold';
import { BUSINESS_KINDS } from '@/site/recipes';
import { applyOp, createOpStream, type OpResult } from '@/site/ops';
import { planSections } from '@/site/plan';
import type { EditApi, Selection } from '@/site/render/context';
import { Site } from '@/site/render/Site';
import { LEGAL_PAGES, parseDoc, type Section, type SiteDoc } from '@/site/schema';
import { STRINGS } from '@/site/strings';
import { directionFor, directionOps } from '@/site/direction';
import { createObjectStream } from '@/site/stream';
import { resolveTheme } from '@/site/theme';
import { Chat, type Msg } from './Chat';
import { createImageStore } from './images';
import { Inspector } from './Inspector';
import { PAGE_TEMPLATES } from './templates';
import './editor.css';

type Device = 'desktop' | 'tablet' | 'mobile';
const DEVICE_WIDTH: Record<Device, number> = { desktop: 1280, tablet: 834, mobile: 390 };

type LogEntry = { id: number; source: 'you' | 'ai'; kind: string; ok: boolean; note: string; op: unknown };
type Status = { hasKey: boolean; models: { id: string; label: string }[]; defaults: { generate: string; edit: string; image: string } };
type RunOpts = { source?: 'you' | 'ai'; record?: boolean; quiet?: boolean; apply?: (doc: SiteDoc, op: unknown) => OpResult };
type Tab = 'theme' | 'section' | 'business';

const STORE_KEY = 'site-builder-prototype:doc';
const PANELS_KEY = 'site-builder-prototype:panels';

let uid = 0;

const WELCOME: Msg = {
  id: ++uid,
  role: 'assistant',
  text: 'This starter site was generated from a three-sentence brief. Click any text to rewrite it, pick a section to change its layout, or tell me what to change.',
  notes: [],
};

export default function Editor() {
  const [doc, setDoc] = useState<SiteDoc>(starterDoc);
  const docRef = useRef(doc);
  // Undo history. Kept in a ref because it changes together with the document, which is
  // what triggers the re-render.
  const hist = useRef<{ past: SiteDoc[]; future: SiteDoc[] }>({ past: [], future: [] });
  const [selection, setSelection] = useState<Selection>(null);
  const [device, setDevice] = useState<Device>('desktop');
  const [tab, setTab] = useState<Tab>('theme');
  // Which page of the site is on the canvas: a page id, or one of the built-in legal pages.
  const [pageId, setPageId] = useState('home');
  const pageRef = useRef(pageId);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [busy, setBusy] = useState<null | 'generate' | 'edit'>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const hasKey = useRef(false);
  hasKey.current = !!status?.hasKey;
  const [model, setModel] = useState('auto');
  const [showState, setShowState] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Either side panel can be minimised to give the page more room. The choice is
  // remembered on this device.
  const [panels, setPanels] = useState({ left: true, right: true });
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PANELS_KEY) ?? 'null');
      if (saved) setPanels({ left: saved.left !== false, right: saved.right !== false });
    } catch {}
  }, []);
  const togglePanel = (side: 'left' | 'right') =>
    setPanels((p) => {
      const next = { ...p, [side]: !p[side] };
      try {
        localStorage.setItem(PANELS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

  const images = useMemo(() => createImageStore(), []);
  const abortRef = useRef<AbortController | null>(null);
  const burstRef = useRef({ key: '', at: 0 });

  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ hasKey: false, models: [], defaults: { generate: '', edit: '', image: '' } }));
  }, []);

  // A generated site costs money, so the current document survives a reload of this tab.
  // It is session storage only: closing the tab starts again from the starter site.
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORE_KEY);
      const doc = saved ? parseDoc(JSON.parse(saved)) : null;
      if (doc?.pages.some((p) => p.sections.length)) {
        docRef.current = doc;
        setDoc(doc);
      }
    } catch {}
    setRestored(true);
  }, []);
  useEffect(() => {
    if (!restored) return;
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(doc));
    } catch {}
  }, [doc, restored]);

  // ------------------------------------------------------------ the one way to change the document

  const run = useCallback((op: unknown, opts: RunOpts = {}): OpResult & { changed: boolean } => {
    const before = docRef.current;
    // Sections added by hand go to the page on the canvas; a stream brings its own rule.
    const r = opts.apply ? opts.apply(before, op) : applyOp(before, op, { page: pageRef.current });
    const changed = r.ok && JSON.stringify(r.doc) !== JSON.stringify(before);
    if (!opts.quiet) {
      const entry: LogEntry = { id: ++uid, source: opts.source ?? 'you', kind: r.kind, ok: r.ok, note: r.note, op };
      setLog((l) => [...l.slice(-299), entry]);
    }
    if (changed) {
      if (opts.record !== false) hist.current = { past: [...hist.current.past.slice(-59), before], future: [] };
      docRef.current = r.doc;
      setDoc(r.doc);
    }
    return { ...r, changed };
  }, []);

  /** Rapid repeats of the same control (dragging a colour) collapse into one undo step. */
  const runBurst = useCallback(
    (key: string, op: unknown) => {
      const now = Date.now();
      const continuing = burstRef.current.key === key && now - burstRef.current.at < 900;
      burstRef.current = { key, at: now };
      run(op, { record: !continuing, quiet: continuing });
    },
    [run],
  );

  const undo = useCallback(() => {
    const { past, future } = hist.current;
    const prev = past[past.length - 1];
    if (!prev) return;
    hist.current = { past: past.slice(0, -1), future: [docRef.current, ...future] };
    docRef.current = prev;
    setDoc(prev);
  }, []);

  const redo = useCallback(() => {
    const { past, future } = hist.current;
    const next = future[0];
    if (!next) return;
    hist.current = { past: [...past, docRef.current], future: future.slice(1) };
    docRef.current = next;
    setDoc(next);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
      if (typing) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (e.key === 'Escape') setSelection(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  const goTo = useCallback((id: string) => {
    pageRef.current = id;
    setPageId(id);
    setSelection(null);
    canvasRef.current?.scrollTo({ top: 0 });
  }, []);

  // ------------------------------------------------------------ AI: a stream of operations

  const streamOps = useCallback(
    async (kind: 'generate' | 'edit', url: string, body: object, userText: string) => {
      const ac = new AbortController();
      abortRef.current = ac;
      setBusy(kind);
      const msgId = ++uid;
      const opening: Msg[] = [
        { id: ++uid, role: 'user', text: userText, notes: [] },
        { id: msgId, role: 'assistant', text: '', notes: [], pending: true },
      ];
      setMessages((m) => [...m, ...opening]);
      const patch = (fn: (m: Msg) => Msg) => setMessages((ms) => ms.map((m) => (m.id === msgId ? fn(m) : m)));

      const t0 = performance.now();
      let firstAt = 0;
      let recorded = false;
      let started = false;
      let applied = 0;
      let rejected = 0;
      let said = '';
      let error = '';

      // A new site declares its pages as it goes; an edit lands on the page being looked at.
      const apply = createOpStream(kind === 'edit' ? pageRef.current : undefined);

      const parser = createObjectStream((obj) => {
        const o = obj as { op?: string; text?: string; message?: string };
        if (o?.op === 'say') return void (said = String(o.text ?? ''));
        if (o?.op === 'error') return void (error = String(o.message ?? 'Something went wrong'));
        // A new site replaces the old one, but only once the first real operation has arrived,
        // so a failed request never leaves a blank page.
        if (kind === 'generate' && !started) {
          started = true;
          recorded = run({ op: 'reset' }, { source: 'ai', record: true, quiet: true }).changed;
          setSelection(null);
          goTo('home');
        }
        const r = run(obj, { source: 'ai', record: !recorded, apply });
        if (r.changed) {
          recorded = true;
          applied++;
          if (!firstAt) firstAt = performance.now();
        }
        if (!r.ok) rejected++;
        patch((m) => ({ ...m, notes: [...m.notes, { ok: r.ok, text: r.note }] }));
      });

      try {
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ac.signal });
        if (!res.ok || !res.body) throw new Error(`Request failed (${res.status})`);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          parser.push(decoder.decode(value, { stream: true }));
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') said = 'Stopped.';
        else error = (err as Error).message;
      }

      // The page rule in code: a business with several locations gets a page for each.
      if (kind === 'generate' && applied && !error) {
        const r = run({ op: 'ensureLocations', group: STRINGS[docRef.current.meta.language].locations }, { source: 'ai', record: false });
        if (r.changed) {
          applied++;
          patch((m) => ({ ...m, notes: [...m.notes, { ok: true, text: r.note }] }));
        }
        // The direction in code: the first screen and the divider placement drawn for this brief.
        // Without a key the reply is the built-in demo site, which no brief shaped.
        const brief = (body as { brief?: string }).brief;
        if (brief && hasKey.current) {
          for (const op of directionOps(docRef.current, directionFor(brief))) run(op, { source: 'ai', record: false, quiet: true });
        }
      }

      const secs = (ms: number) => `${(ms / 1000).toFixed(1)}s`;
      const total = performance.now() - t0;
      const meta = [
        applied ? `${applied} change${applied === 1 ? '' : 's'} applied` : null,
        rejected ? `${rejected} rejected by the schema` : null,
        firstAt ? `first change after ${secs(firstAt - t0)}` : null,
        `finished in ${secs(total)}`,
      ]
        .filter(Boolean)
        .join(' · ');
      patch((m) => ({ ...m, pending: false, text: error ? `That did not work: ${error}` : said || (applied ? 'Done.' : 'Nothing needed changing.'), meta }));
      setBusy(null);
      abortRef.current = null;
    },
    [run, goTo],
  );

  const generate = (brief: string, kind: string) => {
    setShowNew(false);
    void streamOps('generate', '/api/generate', { brief, kind, model }, `New site: ${brief}`);
  };
  const openExample = (ex: Example) => {
    setShowNew(false);
    setSelection(null);
    goTo('home');
    run({ op: 'load', doc: ex.load() });
  };
  const sendEdit = (text: string) =>
    void streamOps('edit', '/api/edit', { doc: docRef.current, message: text, selectedId: selection?.sectionId ?? null, pageId: pageRef.current, model }, text);

  // ------------------------------------------------------------ canvas

  const theme = useMemo(() => resolveTheme(doc.theme), [doc.theme]);
  const legal = (LEGAL_PAGES as readonly string[]).includes(pageId);
  // If the page on the canvas is deleted (or a different site is loaded), fall back to Home.
  const page = legal ? null : (doc.pages.find((p) => p.id === pageId) ?? doc.pages[0]);
  useEffect(() => {
    if (page && page.id !== pageRef.current) {
      pageRef.current = page.id;
      setPageId(page.id);
    }
  }, [page]);
  const plan = useMemo(
    () =>
      planSections(page?.sections ?? [], theme, doc.footer.tone, {
        rating: !!doc.business.rating,
        contact: !!doc.business.phone || doc.business.locations.some((l) => l.hours.length > 0),
        inner: !!page && page !== doc.pages[0],
      }),
    [page, theme, doc.footer.tone, doc.business, doc.pages],
  );

  const addPage = (role: keyof typeof PAGE_TEMPLATES) => {
    const before = new Set(doc.pages.map((p) => p.id));
    const lang = doc.meta.language;
    const tpl = PAGE_TEMPLATES[role];
    const r = run({ op: 'page', page: { title: tpl.title[lang], role, sections: tpl.sections } });
    const added = r.doc.pages.find((p) => !before.has(p.id));
    if (added) goTo(added.id);
  };

  const select = useCallback((sectionId: string | null, block?: number) => {
    setSelection(sectionId ? { sectionId, block } : null);
    if (sectionId) setTab('section');
  }, []);

  const edit = useMemo<EditApi>(
    () => ({
      selection,
      select,
      setText: (path, value) => run({ op: 'set', path, value }).ok,
      run: (op) => run(op).ok,
      sectionChrome: (s: Section, i: number, total: number) => (
        <>
          <div className="sec-ring" />
          {selection?.sectionId === s.id && (
            <div className="sec-tools" onClick={(e) => e.stopPropagation()}>
              <span>{s.type}</span>
              <button type="button" disabled={i === 0} onClick={() => run({ op: 'move', id: s.id, by: -1 })} aria-label="Move up">
                <ArrowUp size={14} />
              </button>
              <button type="button" disabled={i === total - 1} onClick={() => run({ op: 'move', id: s.id, by: 1 })} aria-label="Move down">
                <ArrowDown size={14} />
              </button>
              <button type="button" onClick={() => run({ op: 'duplicate', id: s.id })} aria-label="Duplicate">
                <Copy size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  run({ op: 'remove', id: s.id });
                  setSelection(null);
                }}
                aria-label="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </>
      ),
    }),
    [selection, select, run],
  );

  const canvasRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [avail, setAvail] = useState(1100);
  const [frameH, setFrameH] = useState(0);

  useEffect(() => {
    const measure = () => {
      if (canvasRef.current) setAvail(Math.max(320, canvasRef.current.clientWidth - 40));
      if (frameRef.current) setFrameH(frameRef.current.offsetHeight);
    };
    const ro = new ResizeObserver(measure);
    if (canvasRef.current) ro.observe(canvasRef.current);
    if (frameRef.current) ro.observe(frameRef.current);
    measure();
    return () => ro.disconnect();
  }, []);

  // The page is laid out at a real device width and scaled to fit, so "desktop" always
  // shows the desktop layout however narrow this window is.
  const virtual = device === 'desktop' ? Math.max(DEVICE_WIDTH.desktop, avail) : DEVICE_WIDTH[device];
  const scale = Math.min(1, avail / virtual);

  return (
    <div className="app">
      <header className="topbar">
        <span className="badge">Prototype</span>
        <strong className="site-name">{doc.meta.name}</strong>
        <div className="spacer" />
        <div className="seg tight">
          <button type="button" onClick={undo} disabled={!hist.current.past.length} aria-label="Undo" title="Undo">
            <Undo2 size={15} />
          </button>
          <button type="button" onClick={redo} disabled={!hist.current.future.length} aria-label="Redo" title="Redo">
            <Redo2 size={15} />
          </button>
        </div>
        <div className="seg tight">
          {(
            [
              ['desktop', Monitor],
              ['tablet', Tablet],
              ['mobile', Smartphone],
            ] as const
          ).map(([d, I]) => (
            <button key={d} type="button" data-on={device === d || undefined} onClick={() => setDevice(d)} aria-label={d} title={d}>
              <I size={15} />
            </button>
          ))}
        </div>
        <select className="model" value={model} onChange={(e) => setModel(e.target.value)} title="Model used for generating and editing">
          {(status?.models.length ? status.models : [{ id: 'auto', label: 'Auto' }]).map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        <button type="button" className="btn-quiet" data-on={showState || undefined} onClick={() => setShowState((v) => !v)}>
          <Braces size={15} /> State
        </button>
        <button type="button" className="btn-solid" onClick={() => setShowNew(true)} disabled={!!busy}>
          <Plus size={15} /> New site
        </button>
      </header>

      <div className="work" data-left-closed={!panels.left || undefined} data-right-closed={!panels.right || undefined}>
        {panels.left ? (
          <Chat messages={messages} busy={!!busy} hasKey={status ? status.hasKey : null} selected={selection?.sectionId ?? null} onSend={sendEdit} onStop={() => abortRef.current?.abort()} onCollapse={() => togglePanel('left')} />
        ) : (
          <Rail side="left" label="AI editor" busy={!!busy} onOpen={() => togglePanel('left')} />
        )}

        <div className="center">
          <PageBar doc={doc} pageId={pageId} goTo={goTo} onAdd={(role) => addPage(role)} />
          <main className="canvas" ref={canvasRef} onClick={(e) => e.target === e.currentTarget && setSelection(null)}>
          <div className="stage" style={{ width: virtual * scale, height: frameH * scale }}>
            <div className="frame" ref={frameRef} style={{ width: virtual, transform: `scale(${scale})`, '--stage-scale': scale } as CSSProperties}>
              <Site doc={doc} pageId={pageId} onNavigate={goTo} edit={edit} images={images} />
              {busy === 'generate' && (
                <div className="building">
                  <span /> Building the next section
                </div>
              )}
            </div>
          </div>
          </main>
        </div>

        {panels.right ? (
          <Inspector doc={doc} page={page} goTo={goTo} theme={theme} plan={plan} selection={selection} select={select} run={run} runBurst={runBurst} tab={tab} setTab={setTab} onCollapse={() => togglePanel('right')} />
        ) : (
          <Rail side="right" label="inspector" onOpen={() => togglePanel('right')} />
        )}
      </div>

      {showState && <StateDrawer doc={doc} log={log} onClose={() => setShowState(false)} onLoad={(raw) => run({ op: 'load', doc: raw })} />}
      {showNew && <NewSite hasKey={!!status?.hasKey} onClose={() => setShowNew(false)} onGenerate={generate} onExample={openExample} />}
    </div>
  );
}

// ---------------------------------------------------------------- minimised panel

/** What a minimised side panel leaves behind: a slim strip with a button to bring it back. */
function Rail({ side, label, busy, onOpen }: { side: 'left' | 'right'; label: string; busy?: boolean; onOpen(): void }) {
  const Icon = side === 'left' ? PanelLeftOpen : PanelRightOpen;
  return (
    <aside className="rail" data-side={side}>
      <button type="button" onClick={onOpen} aria-label={`Show the ${label}`} title={`Show the ${label}`}>
        <Icon size={16} />
      </button>
      <span>{label}</span>
      {busy && <i className="rail-busy" title="Working" />}
    </aside>
  );
}

// ---------------------------------------------------------------- page bar

function PageBar({ doc, pageId, goTo, onAdd }: { doc: SiteDoc; pageId: string; goTo(id: string): void; onAdd(role: keyof typeof PAGE_TEMPLATES): void }) {
  const t = STRINGS[doc.meta.language];
  return (
    <nav className="pagebar" aria-label="Pages">
      {doc.pages.map((p) => (
        <button key={p.id} type="button" data-on={p.id === pageId || undefined} onClick={() => goTo(p.id)} title={`${p.role} page`}>
          {p.group && <small>{p.group} /</small>}
          {p.id === 'home' ? t.home : p.title}
          <i>{p.sections.length}</i>
        </button>
      ))}
      <select value="" onChange={(e) => e.target.value && onAdd(e.target.value as keyof typeof PAGE_TEMPLATES)} aria-label="Add a page">
        <option value="">+ Page</option>
        {Object.entries(PAGE_TEMPLATES).map(([role, tpl]) => (
          <option key={role} value={role}>
            {tpl.label}
          </option>
        ))}
      </select>
      <span className="spacer" />
      {LEGAL_PAGES.map((id) => (
        <button key={id} type="button" className="legal" data-on={id === pageId || undefined} onClick={() => goTo(id)} title="Built from the business facts">
          {t[id]}
        </button>
      ))}
    </nav>
  );
}

// ---------------------------------------------------------------- state drawer

function StateDrawer({ doc, log, onClose, onLoad }: { doc: SiteDoc; log: LogEntry[]; onClose(): void; onLoad(raw: unknown): void }) {
  const [view, setView] = useState<'doc' | 'log' | 'load'>('doc');
  const [draft, setDraft] = useState('');
  const [problem, setProblem] = useState('');
  const json = useMemo(() => JSON.stringify(doc, null, 2), [doc]);

  return (
    <div className="drawer">
      <header>
        <div className="tabs">
          <button type="button" data-on={view === 'doc' || undefined} onClick={() => setView('doc')}>
            Document
          </button>
          <button type="button" data-on={view === 'log' || undefined} onClick={() => setView('log')}>
            Operations ({log.length})
          </button>
          <button type="button" data-on={view === 'load' || undefined} onClick={() => setView('load')}>
            Load
          </button>
        </div>
        <button type="button" className="icon" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
      </header>

      {view === 'doc' && (
        <>
          <p className="hint">
            The whole site is this one document: {doc.pages.length} {doc.pages.length === 1 ? 'page' : 'pages'}, {doc.pages.reduce((n, p) => n + p.sections.length, 0)} sections, {(json.length / 1024).toFixed(1)} KB.
            <button type="button" className="link" onClick={() => void navigator.clipboard?.writeText(json)}>
              <Copy size={12} /> Copy
            </button>
          </p>
          <pre>{json}</pre>
        </>
      )}

      {view === 'log' && (
        <ol className="oplog">
          {log.length === 0 && <li className="hint">Nothing yet. Every change you or the AI make appears here.</li>}
          {log
            .slice()
            .reverse()
            .map((e) => (
              <li key={e.id} data-ok={e.ok}>
                <header>
                  <b>{e.source}</b>
                  <code>{e.kind}</code>
                  <span>{e.ok ? 'applied' : 'rejected'}</span>
                </header>
                <p>{e.note}</p>
                <details>
                  <summary>payload</summary>
                  <pre>{JSON.stringify(e.op, null, 2)}</pre>
                </details>
              </li>
            ))}
        </ol>
      )}

      {view === 'load' && (
        <div className="load">
          <p className="hint">Paste a document. It goes through the same validation as everything else, so anything it does not understand is dropped.</p>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder='{ "theme": { "preset": "soft" }, "sections": [] }' />
          {problem && <p className="hint warn">{problem}</p>}
          <button
            type="button"
            className="btn-solid"
            onClick={() => {
              try {
                onLoad(JSON.parse(draft));
                setProblem('');
                setView('doc');
              } catch {
                setProblem('That is not valid JSON.');
              }
            }}
          >
            Load document
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- new site

function NewSite({ hasKey, onClose, onGenerate, onExample }: { hasKey: boolean; onClose(): void; onGenerate(brief: string, kind: string): void; onExample(ex: Example): void }) {
  const [brief, setBrief] = useState('');
  const [kind, setKind] = useState('auto');
  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog">
        <header>
          <h2>New site</h2>
          <button type="button" className="icon" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </header>
        <p>Describe the business. The page appears section by section while it is being written.</p>
        <textarea autoFocus rows={5} value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="What it sells, who it is for, and how it should feel." />
        <div className="chips">
          {EXAMPLE_BRIEFS.map((b) => (
            <button
              key={b.label}
              type="button"
              onClick={() => {
                setBrief(b.brief);
                setKind(b.kind ?? 'auto');
              }}
            >
              {b.label}
            </button>
          ))}
        </div>
        <label className="kind">
          <span>Business type</span>
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="auto">Work it out from the brief</option>
            {BUSINESS_KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        {!hasKey && (
          <p className="hint warn">
            No OpenRouter key is set, so this will replay the built-in coffee site through the streaming pipeline instead of using your brief. Add OPENROUTER_API_KEY to .env.local and
            restart to generate for real.
          </p>
        )}
        <footer>
          <button type="button" className="btn-quiet" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-solid" disabled={!brief.trim()} onClick={() => onGenerate(brief, kind)}>
            Generate
          </button>
        </footer>
        <div className="examples">
          <h3>Or open a finished example</h3>
          {EXAMPLES.map((ex) => (
            <button key={ex.id} type="button" onClick={() => onExample(ex)}>
              <b>{ex.label}</b>
              <span>{ex.note}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
