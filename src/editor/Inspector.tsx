'use client';

// The hand controls. Every control here issues one operation; none of them can put the
// document into a state the renderer cannot draw.

import {
  ArrowDown, ArrowUp, Columns2, GalleryHorizontalEnd, LayoutDashboard, LayoutGrid, PanelRightClose, Plus, Rows3, Shuffle, Trash2,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { OpResult } from '@/site/ops';
import type { Effective } from '@/site/plan';
import { FONTS, PRESET_DEFS } from '@/site/presets';
import type { Selection } from '@/site/render/context';
import type { Block, Location, Page, Section, SiteDoc } from '@/site/schema';
import type { Resolved } from '@/site/theme';
import * as V from '@/site/vocab';
import { LOOKS } from './looks';
import { BLOCK_TEMPLATES, SECTION_TEMPLATES } from './templates';

type Run = (op: unknown) => OpResult;

type Tab = 'theme' | 'section' | 'business';

export type InspectorProps = {
  doc: SiteDoc;
  /** The page on the canvas, or null when a built-in legal page is showing. */
  page: Page | null;
  goTo(pageId: string): void;
  theme: Resolved;
  plan: Effective[];
  selection: Selection;
  select(sectionId: string | null, block?: number): void;
  run: Run;
  runBurst(key: string, op: unknown): void;
  tab: Tab;
  setTab(t: Tab): void;
  onCollapse(): void;
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

/** A one-line text box that commits when you leave it or press Enter. */
function Line({ value, onCommit, placeholder }: { value: string; onCommit(v: string): void; placeholder?: string }) {
  return (
    <input
      key={value}
      type="text"
      defaultValue={value}
      placeholder={placeholder}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
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
        <Field label="Divider placement">
          <Pick value={theme.traits.edges} options={V.EDGE_RHYTHMS} onChange={(v) => set({ traits: { edges: v } })} label={(v) => RHYTHM_LABEL[v]} />
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

const VARIANT_LABEL: Record<string, string> = {
  'cta/band': 'Centred band',
  'cta/facts': 'With phone and opening hours',
  'cta/statement': 'Large statement, buttons beside it',
  'cta/picture': 'Beside a picture',
  'title/plain': 'Title and one sentence',
  'title/picture': 'On a picture',
  'title/facts': 'With key facts beside it',
  'title/links': 'With links to the sections below',
  'features/cards': 'Row of cards',
  'features/list': 'Numbered list with rules',
  'features/rows': 'Picture and text rows',
  'features/lead': 'One large card, the rest beside it',
  'testimonials/cards': 'Row of review cards',
  'testimonials/single': 'One large review',
  'testimonials/score': 'The score beside the reviews',
  'testimonials/wall': 'Staggered wall',
};

const RHYTHM_LABEL: Record<(typeof V.EDGE_RHYTHMS)[number], string> = {
  cut: 'Nowhere (clean cuts)',
  strong: 'Around dark and accent sections',
  every: 'Wherever the colour changes',
};

const EDGE_LABEL: Record<(typeof V.EDGES)[number], string> = {
  auto: 'Automatic (follows the theme)',
  none: 'Clean cut',
  divider: 'Divider',
  overlap: 'Overlap',
  fade: 'Fade',
};

const HERO_LABEL: Record<(typeof V.HERO_STYLES)[number], string> = {
  standard: 'Standard (follows the layout below)',
  overlap: 'Giant heading over the picture',
  wordmark: 'One giant word, picture in the middle',
  ticker: 'Photo with a moving headline',
  edge: 'Picture to the edge of the screen',
};

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
    case 'row': return `${b.title}${b.value ? ` · ${b.value}` : ''}`;
    case 'person': return b.name;
    case 'contact': return 'from the business facts';
    case 'form': return (b.fields.length ? b.fields : ['name', 'email', 'message']).join(', ');
    case 'rating': return 'from the business facts';
    case 'check': return b.label;
  }
}

function BlockDetail({ s, b, i, run, doc }: { s: Section; b: Block; i: number; run: Run; doc: SiteDoc }) {
  const patch = (p: object) => run({ op: 'block', id: s.id, index: i, patch: p });
  const image = b.kind === 'card' || b.kind === 'image' || b.kind === 'person' ? b.image : undefined;
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
      {b.kind === 'row' && (
        <Field label="Group">
          <Line value={b.group ?? ''} onCommit={(v) => patch({ group: v || null })} placeholder="Heading above this row" />
        </Field>
      )}
      {b.kind === 'quote' && (
        <Field label="Stars">
          <select value={b.stars ?? ''} onChange={(e) => patch({ stars: e.target.value ? Number(e.target.value) : null })}>
            <option value="">none</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </Field>
      )}
      {b.kind === 'contact' && (
        <>
          {doc.business.locations.length > 1 && (
            <Field label="Location">
              <select value={b.location ?? doc.business.locations[0].id} onChange={(e) => patch({ location: e.target.value })}>
                {doc.business.locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <label className="check">
            <input type="checkbox" checked={b.map} onChange={(e) => patch({ map: e.target.checked })} /> Show a map
          </label>
          <p className="hint">The details come from the Business tab, so they are the same everywhere.</p>
        </>
      )}
      {b.kind === 'form' && (
        <>
          <div className="checks">
            {V.FORM_FIELDS.map((f) => {
              const fields = b.fields.length ? b.fields : (['name', 'email', 'message'] as (typeof V.FORM_FIELDS)[number][]);
              return (
                <label key={f} className="check">
                  <input
                    type="checkbox"
                    checked={fields.includes(f)}
                    onChange={(e) => patch({ fields: V.FORM_FIELDS.filter((x) => (x === f ? e.target.checked : fields.includes(x))) })}
                  />
                  {f}
                </label>
              );
            })}
          </div>
          <Field label="Button">
            <Line value={b.submit ?? ''} onCommit={(v) => patch({ submit: v || null })} placeholder="Send" />
          </Field>
          <p className="hint">Not connected yet: submitting shows a note and sends nothing.</p>
        </>
      )}
      {image && (
        <Field label="Picture">
          <Commit value={image.prompt} onCommit={(v) => v && patch({ image: { ...image, prompt: v } })} />
        </Field>
      )}
      {(b.kind === 'card' || b.kind === 'person') &&
        (image ? (
          <button type="button" className="link" onClick={() => patch({ image: null })}>
            Remove picture
          </button>
        ) : (
          <button type="button" className="link" onClick={() => patch({ image: { prompt: b.kind === 'person' ? 'Portrait of a person, shoulders up, plain background' : 'Describe the picture for this card', alt: '', aspect: b.kind === 'person' ? 'portrait' : 'landscape' } })}>
            <Plus size={13} /> Add a picture
          </button>
        ))}
    </div>
  );
}

function SectionTab({ doc, page, goTo, theme, plan, selection, select, run }: InspectorProps) {
  if (!page) return <p className="empty">This page is generated from the business facts. Edit them in the Business tab.</p>;
  const sections = page.sections;
  const pi = doc.pages.findIndex((p) => p.id === page.id);
  const idx = sections.findIndex((s) => s.id === selection?.sectionId);
  const s = sections[idx] as Section | undefined;
  const e = plan[idx] as Effective | undefined;
  const up = (patch: object) => s && run({ op: 'update', id: s.id, patch });

  const addSection = (type: (typeof V.SECTION_TYPES)[number]) => {
    const before = new Set(doc.pages.flatMap((p) => p.sections.map((x) => x.id)));
    const r = run({ op: 'add', page: page.id, section: SECTION_TEMPLATES[type].section, after: s?.id });
    const added = r.doc.pages.flatMap((p) => p.sections).find((x) => !before.has(x.id));
    if (added) select(added.id);
  };

  return (
    <>
      <Group title={`Page: ${page.title}`}>
        {pi > 0 && (
          <>
            <Field label="Menu name">
              <Line value={page.title} onCommit={(v) => v && run({ op: 'page', page: { id: page.id, title: v } })} />
            </Field>
            <Field label="Purpose">
              <Pick value={page.role} options={V.PAGE_ROLES.filter((r) => r !== 'home')} onChange={(v) => run({ op: 'page', page: { id: page.id, role: v } })} />
            </Field>
            <Field label="Dropdown">
              <Line value={page.group ?? ''} onCommit={(v) => run({ op: 'page', page: { id: page.id, group: v || null } })} placeholder="None. Type a name to group pages" />
            </Field>
            <label className="check">
              <input type="checkbox" checked={page.menu} onChange={(e) => run({ op: 'page', page: { id: page.id, menu: e.target.checked } })} /> Show in the menu
            </label>
            <div className="rowbtns">
              <button type="button" className="link" disabled={pi <= 1} onClick={() => run({ op: 'movePage', id: page.id, by: -1 })}>
                <ArrowUp size={13} /> Earlier
              </button>
              <button type="button" className="link" disabled={pi === doc.pages.length - 1} onClick={() => run({ op: 'movePage', id: page.id, by: 1 })}>
                <ArrowDown size={13} /> Later
              </button>
              <button
                type="button"
                className="link danger"
                onClick={() => {
                  run({ op: 'removePage', id: page.id });
                  goTo('home');
                }}
              >
                <Trash2 size={13} /> Delete page
              </button>
            </div>
          </>
        )}
        <ol className="outline">
          {sections.map((sec, i) => (
            <li key={sec.id} data-on={sec.id === s?.id || undefined}>
              <button type="button" className="row" onClick={() => select(sec.id)}>
                <b>{sec.type}</b>
                <span>{strip(sec.intro.heading ?? sec.intro.eyebrow) || sec.layout.kind}</span>
              </button>
              <button type="button" className="icon" disabled={i === 0} onClick={() => run({ op: 'move', id: sec.id, by: -1 })} aria-label="Move up">
                <ArrowUp size={13} />
              </button>
              <button type="button" className="icon" disabled={i === sections.length - 1} onClick={() => run({ op: 'move', id: sec.id, by: 1 })} aria-label="Move down">
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
          {s.type === 'hero' && (
            <Group title="Hero style">
              <Pick value={s.hero} options={V.HERO_STYLES} onChange={(v) => up({ hero: v })} label={(v) => HERO_LABEL[v]} />
              <p className="hint">Every style uses the same heading, text, buttons and picture, so you can switch freely.</p>
            </Group>
          )}

          {e?.family && (
            <Group title="Arrangement">
              <Pick value={s.variant && (V.VARIANTS[e.family] as readonly string[]).includes(s.variant) ? s.variant : V.VARIANTS[e.family][0]} options={V.VARIANTS[e.family] as readonly string[]} onChange={(v) => up({ variant: v })} label={(v) => VARIANT_LABEL[`${e.family}/${v}`] ?? v} />
              <p className="hint">Another way to draw the same content. Nothing is lost by switching.</p>
            </Group>
          )}

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
              <Pick value={s.edge} options={V.EDGES} onChange={(v) => up({ edge: v })} label={(v) => EDGE_LABEL[v]} />
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
                  {selection?.block === i && <BlockDetail s={s} b={b} i={i} run={run} doc={doc} />}
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

// ---------------------------------------------------------------- business tab

/**
 * Facts about the business, typed once. The contact block, the footer, the legal pages
 * and the review score all read from here.
 */
function BusinessTab({ doc, run }: InspectorProps) {
  const b = doc.business;
  const set = (patch: object) => run({ op: 'business', business: patch });
  const setLocation = (i: number, patch: Partial<Location>) => set({ locations: b.locations.map((l, k) => (k === i ? { ...l, ...patch } : l)) });

  return (
    <>
      <Group title="Site">
        <Field label="Name">
          <Line value={doc.meta.name} onCommit={(v) => v && run({ op: 'meta', name: v })} />
        </Field>
        <Field label="Language">
          <Seg value={doc.meta.language} options={V.LANGUAGES} onChange={(v) => run({ op: 'meta', language: v })} render={(v) => (v === 'hu' ? 'Magyar' : 'English')} />
        </Field>
        <p className="hint">The language sets the built-in labels (form fields, “Opening hours”, the legal pages). The copy itself is whatever was written.</p>
      </Group>

      <Group title="Contact">
        <Field label="Phone">
          <Line value={b.phone ?? ''} onCommit={(v) => set({ phone: v || null })} />
        </Field>
        <Field label="Email">
          <Line value={b.email ?? ''} onCommit={(v) => set({ email: v || null })} />
        </Field>
        <Field label="Booking link">
          <Line value={b.bookingUrl ?? ''} onCommit={(v) => set({ bookingUrl: v || null })} placeholder="https://" />
        </Field>
      </Group>

      <Group title="Reviews">
        <Field label="Score">
          <Line value={b.rating?.value ?? ''} onCommit={(v) => set({ rating: v ? { ...b.rating, value: v } : null })} placeholder="4.9" />
        </Field>
        {b.rating && (
          <>
            <Field label="How many">
              <Line value={b.rating.count ?? ''} onCommit={(v) => set({ rating: { ...b.rating, count: v || null } })} />
            </Field>
            <Field label="Source">
              <Line value={b.rating.source} onCommit={(v) => set({ rating: { ...b.rating, source: v || 'Google' } })} />
            </Field>
          </>
        )}
      </Group>

      {b.locations.map((l, i) => (
        <Group
          key={l.id}
          title={b.locations.length > 1 ? `Location ${i + 1}` : 'Location'}
          aside={
            <button type="button" className="link danger" onClick={() => set({ locations: b.locations.filter((_, k) => k !== i) })}>
              Remove
            </button>
          }
        >
          <Field label="Name">
            <Line value={l.name} onCommit={(v) => v && setLocation(i, { name: v })} />
          </Field>
          <Field label="Address">
            <Line value={l.address} onCommit={(v) => v && setLocation(i, { address: v })} />
          </Field>
          <Field label="Phone">
            <Line value={l.phone ?? ''} onCommit={(v) => setLocation(i, { phone: v || undefined })} placeholder="Same as above" />
          </Field>
          <div className="hours-edit">
            {l.hours.map((h, k) => (
              <div key={k}>
                <Line value={h.days} onCommit={(v) => v && setLocation(i, { hours: l.hours.map((x, j) => (j === k ? { ...x, days: v } : x)) })} />
                <Line value={h.time} onCommit={(v) => v && setLocation(i, { hours: l.hours.map((x, j) => (j === k ? { ...x, time: v } : x)) })} />
                <button type="button" className="icon" onClick={() => setLocation(i, { hours: l.hours.filter((_, j) => j !== k) })} aria-label="Remove hours">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <button type="button" className="link" onClick={() => setLocation(i, { hours: [...l.hours, { days: 'Mon–Fri', time: '9:00–17:00' }] })}>
              <Plus size={13} /> Opening hours
            </button>
          </div>
        </Group>
      ))}
      <Group title="Locations">
        <button type="button" className="link" onClick={() => set({ locations: [...b.locations, { name: `Location ${b.locations.length + 1}`, address: 'Street and number, town', hours: [] }] })}>
          <Plus size={13} /> Add a location
        </button>
        <p className="hint">With two or more, give each a page with the purpose “location” and the same dropdown name.</p>
      </Group>

      <Group title="Areas covered">
        <Commit value={b.areas.join(', ')} onCommit={(v) => set({ areas: v.split(',').map((x) => x.trim()).filter(Boolean) })} rows={2} placeholder="Towns or districts, separated by commas" />
      </Group>

      <Group title="Company details">
        <Field label="Legal name">
          <Line value={b.company ?? ''} onCommit={(v) => set({ company: v || null })} />
        </Field>
        <Field label="Tax number">
          <Line value={b.taxId ?? ''} onCommit={(v) => set({ taxId: v || null })} />
        </Field>
        <Field label="Register no.">
          <Line value={b.registration ?? ''} onCommit={(v) => set({ registration: v || null })} />
        </Field>
        <p className="hint">Used on the generated privacy and company-details pages.</p>
      </Group>
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
        <button type="button" data-on={props.tab === 'business' || undefined} onClick={() => props.setTab('business')}>
          Business
        </button>
        <button type="button" className="icon" onClick={props.onCollapse} aria-label="Hide the inspector" title="Hide this panel">
          <PanelRightClose size={15} />
        </button>
      </div>
      <div className="scroll">{props.tab === 'theme' ? <ThemeTab {...props} /> : props.tab === 'section' ? <SectionTab {...props} /> : <BusinessTab {...props} />}</div>
    </aside>
  );
}
