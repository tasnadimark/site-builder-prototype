'use client';

// PROTOTYPE editor shell. Question being tested: can a schema-driven document, edited
// only through validated operations, produce sites that look designed, appear fast,
// and feel free to edit without ever breaking?
//
// State lives in memory, plus session storage so a reload of the tab keeps the current
// site. Use the State drawer to copy the document out.

import { ArrowDown, ArrowUp, Braces, Copy, Monitor, Plus, Redo2, Smartphone, Tablet, Trash2, Undo2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { EXAMPLE_BRIEFS, NORTHFOLD_OPS } from '@/site/fixtures/northfold';
import { applyOp, docFromOps, type OpResult } from '@/site/ops';
import { planSections } from '@/site/plan';
import type { EditApi, Selection } from '@/site/render/context';
import { Site } from '@/site/render/Site';
import { parseDoc, type Section, type SiteDoc } from '@/site/schema';
import { createObjectStream } from '@/site/stream';
import { resolveTheme } from '@/site/theme';
import { Chat, type Msg } from './Chat';
import { createImageStore } from './images';
import { Inspector } from './Inspector';
import './editor.css';

type Device = 'desktop' | 'tablet' | 'mobile';
const DEVICE_WIDTH: Record<Device, number> = { desktop: 1280, tablet: 834, mobile: 390 };

type LogEntry = { id: number; source: 'you' | 'ai'; kind: string; ok: boolean; note: string; op: unknown };
type Status = { hasKey: boolean; models: { id: string; label: string }[]; defaults: { generate: string; edit: string; image: string } };
type RunOpts = { source?: 'you' | 'ai'; record?: boolean; quiet?: boolean };

const STORE_KEY = 'site-builder-prototype:doc';

let uid = 0;

const WELCOME: Msg = {
  id: ++uid,
  role: 'assistant',
  text: 'This is the starter site. Click any text to rewrite it, pick a section to change its layout, or tell me what to change.',
  notes: [],
};

export default function Editor() {
  const [doc, setDoc] = useState<SiteDoc>(() => docFromOps(NORTHFOLD_OPS));
  const docRef = useRef(doc);
  // Undo history. Kept in a ref because it changes together with the document, which is
  // what triggers the re-render.
  const hist = useRef<{ past: SiteDoc[]; future: SiteDoc[] }>({ past: [], future: [] });
  const [selection, setSelection] = useState<Selection>(null);
  const [device, setDevice] = useState<Device>('desktop');
  const [tab, setTab] = useState<'theme' | 'section'>('theme');
  const [log, setLog] = useState<LogEntry[]>([]);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [busy, setBusy] = useState<null | 'generate' | 'edit'>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [model, setModel] = useState('auto');
  const [showState, setShowState] = useState(false);
  const [showNew, setShowNew] = useState(false);

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
      if (doc?.sections.length) {
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
    const r = applyOp(before, op);
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
        }
        const r = run(obj, { source: 'ai', record: !recorded });
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
    [run],
  );

  const generate = (brief: string) => {
    setShowNew(false);
    void streamOps('generate', '/api/generate', { brief, model }, `New site: ${brief}`);
  };
  const sendEdit = (text: string) =>
    void streamOps('edit', '/api/edit', { doc: docRef.current, message: text, selectedId: selection?.sectionId ?? null, model }, text);

  // ------------------------------------------------------------ canvas

  const theme = useMemo(() => resolveTheme(doc.theme), [doc.theme]);
  const plan = useMemo(() => planSections(doc, theme), [doc, theme]);

  const select = useCallback((sectionId: string | null, block?: number) => {
    setSelection(sectionId ? { sectionId, block } : null);
    if (sectionId) setTab('section');
  }, []);

  const edit = useMemo<EditApi>(
    () => ({
      selection,
      select,
      setText: (path, value) => run({ op: 'set', path, value }).ok,
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

      <div className="work">
        <Chat messages={messages} busy={!!busy} hasKey={status ? status.hasKey : null} selected={selection?.sectionId ?? null} onSend={sendEdit} onStop={() => abortRef.current?.abort()} />

        <main className="canvas" ref={canvasRef} onClick={(e) => e.target === e.currentTarget && setSelection(null)}>
          <div className="stage" style={{ width: virtual * scale, height: frameH * scale }}>
            <div className="frame" ref={frameRef} style={{ width: virtual, transform: `scale(${scale})`, '--stage-scale': scale } as CSSProperties}>
              <Site doc={doc} edit={edit} images={images} />
              {busy === 'generate' && (
                <div className="building">
                  <span /> Building the next section
                </div>
              )}
            </div>
          </div>
        </main>

        <Inspector doc={doc} theme={theme} plan={plan} selection={selection} select={select} run={run} runBurst={runBurst} tab={tab} setTab={setTab} />
      </div>

      {showState && <StateDrawer doc={doc} log={log} onClose={() => setShowState(false)} onLoad={(raw) => run({ op: 'load', doc: raw })} onStarter={() => run({ op: 'load', doc: docFromOps(NORTHFOLD_OPS) })} />}
      {showNew && <NewSite hasKey={!!status?.hasKey} onClose={() => setShowNew(false)} onGenerate={generate} />}
    </div>
  );
}

// ---------------------------------------------------------------- state drawer

function StateDrawer({ doc, log, onClose, onLoad, onStarter }: { doc: SiteDoc; log: LogEntry[]; onClose(): void; onLoad(raw: unknown): void; onStarter(): void }) {
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
            The whole site is this one document: {doc.sections.length} sections, {(json.length / 1024).toFixed(1)} KB.
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
          <button
            type="button"
            className="link"
            onClick={() => {
              onStarter();
              setView('doc');
            }}
          >
            Or load the starter coffee site
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- new site

function NewSite({ hasKey, onClose, onGenerate }: { hasKey: boolean; onClose(): void; onGenerate(brief: string): void }) {
  const [brief, setBrief] = useState('');
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
            <button key={b.label} type="button" onClick={() => setBrief(b.brief)}>
              {b.label}
            </button>
          ))}
        </div>
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
          <button type="button" className="btn-solid" disabled={!brief.trim()} onClick={() => onGenerate(brief)}>
            Generate
          </button>
        </footer>
      </div>
    </div>
  );
}
