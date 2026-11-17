'use client';

// The hand controls. Every control here issues one operation; none of them can put the
// document into a state the renderer cannot draw.

import {
  ArrowDown, ArrowUp, Columns2, GalleryHorizontalEnd, LayoutDashboard, LayoutGrid, Plus, Rows3, Shuffle, Trash2,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { OpResult } from '@/site/ops';
import type { Effective } from '@/site/plan';
import { FONTS, PRESET_DEFS } from '@/site/presets';
import type { Selection } from '@/site/render/context';
import type { Block, Section, SiteDoc } from '@/site/schema';
import type { Resolved } from '@/site/theme';
import * as V from '@/site/vocab';
import { LOOKS } from './looks';
import { BLOCK_TEMPLATES, SECTION_TEMPLATES } from './templates';

type Run = (op: unknown) => OpResult;

export type InspectorProps = {
  doc: SiteDoc;
  theme: Resolved;
  plan: Effective[];
  selection: Selection;
  select(sectionId: string | null, block?: number): void;
  run: Run;
  runBurst(key: string, op: unknown): void;
  tab: 'theme' | 'section';
  setTab(t: 'theme' | 'section'): void;
};

// ---------------------------------------------------------------- small controls

function Group({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="group">
      <header>
        <h3>{title}</h3>
        {aside}
      </header>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Seg<T extends string | number>({ value, options, onChange, render }: { value: T; options: readonly T[]; onChange(v: T): void; render?: (v: T) => ReactNode }) {
  return (
    <div className="seg" role="group">
      {options.map((o) => (
        <button key={String(o)} type="button" data-on={o === value || undefined} onClick={() => onChange(o)} title={String(o)}>
          {render ? render(o) : String(o)}
        </button>
      ))}
    </div>
  );
}

function Pick<T extends string>({ value, options, onChange, label }: { value: T; options: readonly T[]; onChange(v: T): void; label?: (v: T) => string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => (
        <option key={o} value={o}>
          {label ? label(o) : o}
        </option>
      ))}
    </select>
  );
}

/** A text box that commits when you leave it, so each edit is one operation. */
function Commit({ value, onCommit, rows = 3, placeholder }: { value: string; onCommit(v: string): void; rows?: number; placeholder?: string }) {
  return (
    <textarea
      key={value}
      defaultValue={value}
      rows={rows}
      placeholder={placeholder}
      onBlur={(e) => {
        const v = e.target.value.trim();
        if (v !== value) onCommit(v);
      }}
    />
  );
}

const LAYOUT_ICON: Record<string, ReactNode> = {
  stack: <Rows3 size={15} />,
  split: <Columns2 size={15} />,
  grid: <LayoutGrid size={15} />,
  bento: <LayoutDashboard size={15} />,
  marquee: <GalleryHorizontalEnd size={15} />,
};

// ---------------------------------------------------------------- theme tab

const PALETTE_LABEL = { bg: 'Page', surface: 'Panel', ink: 'Text', accent: 'Accent', accent2: 'Second' } as const;

function ThemeTab({ doc, theme, run, runBurst }: InspectorProps) {
  const set = (patch: object) => run({ op: 'theme', theme: patch });
  const [look, setLook] = useState(-1);

  const shuffle = () => {
    let next = look;
    while (next === look) next = Math.floor(Math.random() * LOOKS.length);
    setLook(next);
    // "reset" replaces the whole theme but keeps the image art direction, so a new look
    // does not regenerate every photo.
    run({ op: 'theme', theme: LOOKS[next].theme, reset: true });
  };

  return (
    <>
      <Group
        title="Look"
        aside={
          <button type="button" className="link" onClick={shuffle}>
            <Shuffle size={13} /> Shuffle
          </button>
        }
      >
        <div className="presets">
          {V.PRESETS.map((p) => {
            const d = PRESET_DEFS[p];
            return (
              <button key={p} type="button" data-on={doc.theme.preset === p || undefined} onClick={() => run({ op: 'theme', theme: { preset: p }, reset: true })}>
                <span className="dots">
                  {[d.palette.bg, d.palette.ink, d.palette.accent, d.palette.accent2].map((c, i) => (
                    <i key={i} style={{ background: c }} />
                  ))}
                </span>
                <b>{d.label}</b>
                <small>{d.blurb}</small>
              </button>
            );
          })}
        </div>
        {look >= 0 && <p className="hint">Shuffled to “{LOOKS[look].name}”.</p>}
      </Group>

      <Group title="Colour">
        <div className="swatches">
          {(Object.keys(PALETTE_LABEL) as (keyof typeof PALETTE_LABEL)[]).map((k) => (
            <label key={k} className="swatch">
              <input type="color" value={theme.palette[k]} onChange={(e) => runBurst(`palette.${k}`, { op: 'theme', theme: { palette: { [k]: e.target.value } } })} />
              <span>{PALETTE_LABEL[k]}</span>
            </label>
          ))}
        </div>
        <p className="hint">Text colours are corrected automatically so they stay readable on every tone.</p>
      </Group>

      <Group title="Type">
        <Field label="Headings">
          <Pick value={theme.fonts.display} options={V.FONT_IDS} onChange={(v) => set({ fonts: { display: v } })} label={(v) => FONTS[v].label} />
        </Field>
        <Field label="Body">
          <Pick value={theme.fonts.body} options={V.FONT_IDS} onChange={(v) => set({ fonts: { body: v } })} label={(v) => FONTS[v].label} />
        </Field>
        <Field label="Headline size">
          <Seg value={theme.scale} options={V.SCALES} onChange={(v) => set({ scale: v })} />
        </Field>
        <Field label="Emphasis">
          <Pick value={theme.traits.emphasis} options={V.EMPHASIS} onChange={(v) => set({ traits: { emphasis: v } })} />
        </Field>
        <Field label="Eyebrow">
          <Pick value={theme.traits.eyebrow} options={V.EYEBROWS} onChange={(v) => set({ traits: { eyebrow: v } })} />
        </Field>
        <label className="check">
          <input type="checkbox" checked={theme.traits.caps} onChange={(e) => set({ traits: { caps: e.target.checked } })} /> Uppercase headings
        </label>
      </Group>

      <Group title="Shape and space">
        <Field label="Corners">
          <Seg value={theme.radius} options={V.RADII} onChange={(v) => set({ radius: v })} />
        </Field>
        <Field label="Density">
          <Seg value={theme.density} options={V.DENSITIES} onChange={(v) => set({ density: v })} />
        </Field>
        <Field label="Cards">
          <Pick value={theme.traits.card} options={V.CARD_STYLES} onChange={(v) => set({ traits: { card: v } })} />
        </Field>
        <Field label="Buttons">
          <Pick value={theme.traits.button} options={V.BUTTON_STYLES} onChange={(v) => set({ traits: { button: v } })} />
        </Field>
        <Field label="Dividers">
          <Pick value={theme.traits.divider} options={V.DIVIDERS} onChange={(v) => set({ traits: { divider: v } })} />
        </Field>
        <Field label="Pattern">
          <Pick value={theme.traits.motif} options={V.MOTIFS} onChange={(v) => set({ traits: { motif: v } })} />
        </Field>
        <Field label="Picture shape">
          <Pick value={theme.traits.image} options={V.IMAGE_SHAPES} onChange={(v) => set({ traits: { image: v } })} />
        </Field>
      </Group>

      <Group title="Image style">
        <Commit value={theme.imageStyle} onCommit={(v) => set({ imageStyle: v })} rows={4} />
        <p className="hint">Added to every image prompt so all pictures share one look. Changing it regenerates them.</p>
      </Group>

      <Group title="Navigation and footer">
        <Field label="Nav">
          <Seg value={doc.nav.style} options={V.NAV_STYLES} onChange={(v) => run({ op: 'nav', nav: { style: v } })} />
        </Field>
        <Field label="Footer">
          <Seg value={doc.footer.style} options={V.FOOTER_STYLES} onChange={(v) => run({ op: 'footer', footer: { style: v } })} />
        </Field>
        <Field label="Footer tone">
          <Seg value={doc.footer.tone} options={V.TONES} onChange={(v) => run({ op: 'footer', footer: { tone: v } })} />
        </Field>
      </Group>
    </>
  );
}

// ---------------------------------------------------------------- section tab

const strip = (s?: string) => (s ?? '').replace(/\*/g, '');

function blockLabel(b: Block): string {
  switch (b.kind) {
    case 'card': return b.title;
    case 'stat': return `${b.value} ${b.label}`;
    case 'quote': return b.author;
    case 'image': return b.caption || b.image.alt || b.image.prompt;
    case 'plan': return `${b.name} ${b.price}`;
    case 'qa': return b.q;
    case 'step': return b.title;
    case 'logo': return b.name;
  }
}

function BlockDetail({ s, b, i, run }: { s: Section; b: Block; i: number; run: Run }) {
  const patch = (p: object) => run({ op: 'block', id: s.id, index: i, patch: p });
  const image = b.kind === 'card' || b.kind === 'image' ? b.image : undefined;
  return (
    <div className="detail">
      <Field label="Size in bento">
        <Seg value={b.size} options={V.SIZES} onChange={(v) => patch({ size: v })} />
      </Field>
      {b.kind === 'card' && (
        <Field label="Icon">
          <select value={b.icon ?? ''} onChange={(e) => patch({ icon: e.target.value || null })}>
            <option value="">none</option>
            {V.ICONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </Field>
      )}
      {b.kind === 'plan' && (
        <label className="check">
          <input type="checkbox" checked={b.featured} onChange={(e) => patch({ featured: e.target.checked })} /> Highlight this plan
        </label>
      )}
      {image && (
        <Field label="Picture">
          <Commit value={image.prompt} onCommit={(v) => v && patch({ image: { ...image, prompt: v } })} />
        </Field>
      )}
      {b.kind === 'card' &&
        (image ? (
          <button type="button" className="link" onClick={() => patch({ image: null })}>
            Remove picture
          </button>
        ) : (
          <button type="button" className="link" onClick={() => patch({ image: { prompt: 'Describe the picture for this card', alt: '', aspect: 'landscape' } })}>
            <Plus size={13} /> Add a picture
          </button>
        ))}
    </div>
  );
}

function SectionTab({ doc, theme, plan, selection, select, run }: InspectorProps) {
  const idx = doc.sections.findIndex((s) => s.id === selection?.sectionId);
  const s = doc.sections[idx] as Section | undefined;
  const e = plan[idx] as Effective | undefined;
  const up = (patch: object) => s && run({ op: 'update', id: s.id, patch });

  const addSection = (type: (typeof V.SECTION_TYPES)[number]) => {
    const before = new Set(doc.sections.map((x) => x.id));
    const r = run({ op: 'add', section: SECTION_TEMPLATES[type].section, after: s?.id });
    const added = r.doc.sections.find((x) => !before.has(x.id));
    if (added) select(added.id);
  };

  return (
    <>
      <Group title="Page">
        <ol className="outline">
          {doc.sections.map((sec, i) => (
            <li key={sec.id} data-on={sec.id === s?.id || undefined}>
              <button type="button" className="row" onClick={() => select(sec.id)}>
                <b>{sec.type}</b>
                <span>{strip(sec.intro.heading ?? sec.intro.eyebrow) || sec.layout.kind}</span>
              </button>
              <button type="button" className="icon" disabled={i === 0} onClick={() => run({ op: 'move', id: sec.id, by: -1 })} aria-label="Move up">
                <ArrowUp size={13} />
              </button>
              <button type="button" className="icon" disabled={i === doc.sections.length - 1} onClick={() => run({ op: 'move', id: sec.id, by: 1 })} aria-label="Move down">
                <ArrowDown size={13} />
              </button>
            </li>
          ))}
        </ol>
        <select className="add" value="" onChange={(ev) => ev.target.value && addSection(ev.target.value as (typeof V.SECTION_TYPES)[number])}>
          <option value="">+ Add a section{s ? ` after “${s.type}”` : ''}</option>
          {V.SECTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {SECTION_TEMPLATES[t].label}
            </option>
          ))}
        </select>
      </Group>

      {!s || !e ? (
        <p className="empty">Click a section on the page, or pick one above, to change its layout.</p>
      ) : (
        <>
          <Group title="Layout">
            <Seg
              value={s.layout.kind}
              options={V.LAYOUTS}
              onChange={(v) => up({ layout: { kind: v } })}
              render={(v) => (
                <>
                  {LAYOUT_ICON[v]}
                  <em>{v}</em>
                </>
              )}
            />
            {(s.layout.kind === 'grid' || s.layout.kind === 'bento' || s.layout.kind === 'split') && (
              <Field label="Columns">
                <Seg
                  value={s.layout.columns}
                  options={s.layout.kind === 'bento' ? ([3, 4] as const) : s.layout.kind === 'split' ? ([1, 2] as const) : ([1, 2, 3, 4] as const)}
                  onChange={(v) => up({ layout: { columns: v } })}
                />
              </Field>
            )}
            {s.layout.kind === 'split' && (
              <>
                <Field label="Wider side">
                  <Seg value={s.layout.ratio} options={V.RATIOS} onChange={(v) => up({ layout: { ratio: v } })} />
                </Field>
                <label className="check">
                  <input type="checkbox" checked={s.layout.flip} onChange={(ev) => up({ layout: { flip: ev.target.checked } })} /> Swap sides
                </label>
              </>
            )}
            {s.layout.kind === 'stack' && (
              <Field label="Width">
                <Seg value={s.layout.width} options={V.WIDTHS} onChange={(v) => up({ layout: { width: v } })} />
              </Field>
            )}
            <Field label="Heading">
              <Seg value={s.intro.align} options={V.ALIGNS} onChange={(v) => up({ intro: { align: v } })} />
            </Field>
            {e.notes.map((n) => (
              <p key={n} className="hint warn">
                {n}
              </p>
            ))}
          </Group>

          <Group title="Surface">
            <Field label="Tone">
              <div className="tones">
                {V.TONES.map((t) => (
                  <button key={t} type="button" data-on={s.tone === t || undefined} onClick={() => up({ tone: t })} title={t}>
                    <i style={{ background: theme.tones[t].bg, color: theme.tones[t].ink }}>Aa</i>
                    {t}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Edge below">
              <Seg value={s.edge} options={V.EDGES} onChange={(v) => up({ edge: v })} />
            </Field>
            <Field label="Backdrop">
              <Seg value={s.backdrop} options={V.BACKDROPS} onChange={(v) => up({ backdrop: v })} render={(v) => (v === 'media' ? 'photo' : v)} />
            </Field>
            <Field label="Spacing">
              <Seg value={s.pad} options={V.PADS} onChange={(v) => up({ pad: v })} />
            </Field>
            <Field label="Kind">
              <Pick value={s.type} options={V.SECTION_TYPES} onChange={(v) => up({ type: v })} />
            </Field>
          </Group>

          <Group title="Section picture">
            {s.media ? (
              <>
                <Commit value={s.media.prompt} onCommit={(v) => v && up({ media: { ...s.media, prompt: v } })} />
                <Field label="Shape">
                  <Seg value={s.media.aspect} options={V.ASPECTS} onChange={(v) => up({ media: { ...s.media, aspect: v } })} />
                </Field>
                <button type="button" className="link" onClick={() => up({ media: null })}>
                  Remove picture
                </button>
              </>
            ) : (
              <button type="button" className="link" onClick={() => up({ media: { prompt: 'Describe the picture for this section', alt: '', aspect: 'landscape' } })}>
                <Plus size={13} /> Add a picture
              </button>
            )}
          </Group>

          <Group title={`Blocks (${s.blocks.length})`}>
            <ol className="outline">
              {s.blocks.map((b, i) => (
                <li key={i} data-on={selection?.block === i || undefined}>
                  <button type="button" className="row" onClick={() => select(s.id, i)}>
                    <b>{b.kind}</b>
                    <span>{blockLabel(b)}</span>
                  </button>
                  <button type="button" className="icon" disabled={i === 0} onClick={() => run({ op: 'block', id: s.id, index: i, to: i - 1 })} aria-label="Move up">
                    <ArrowUp size={13} />
                  </button>
                  <button type="button" className="icon" disabled={i === s.blocks.length - 1} onClick={() => run({ op: 'block', id: s.id, index: i, to: i + 1 })} aria-label="Move down">
                    <ArrowDown size={13} />
                  </button>
                  <button type="button" className="icon" onClick={() => run({ op: 'block', id: s.id, index: i, remove: true })} aria-label="Delete block">
                    <Trash2 size={13} />
                  </button>
                  {selection?.block === i && <BlockDetail s={s} b={b} i={i} run={run} />}
                </li>
              ))}
            </ol>
            <select className="add" value="" onChange={(ev) => ev.target.value && run({ op: 'addBlock', id: s.id, block: BLOCK_TEMPLATES[ev.target.value as keyof typeof BLOCK_TEMPLATES] })}>
              <option value="">+ Add a block</option>
              {V.BLOCK_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </Group>
        </>
      )}
    </>
  );
}

export function Inspector(props: InspectorProps) {
  return (
    <aside className="panel inspector">
      <div className="tabs">
        <button type="button" data-on={props.tab === 'theme' || undefined} onClick={() => props.setTab('theme')}>
          Theme
        </button>
        <button type="button" data-on={props.tab === 'section' || undefined} onClick={() => props.setTab('section')}>
          Sections
        </button>
      </div>
      <div className="scroll">{props.tab === 'theme' ? <ThemeTab {...props} /> : <SectionTab {...props} />}</div>
    </aside>
  );
}
