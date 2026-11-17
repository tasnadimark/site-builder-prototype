'use client';

import { Plus } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { packBento, type Effective } from '../plan';
import type { Block, Section } from '../schema';
import { toneVars } from '../theme';
import { ReadOnly, useSite, type Path } from './context';
import { CheckIcon, Icon, Pic, Txt, cx } from './parts';

type BlockProps = { s: Section; b: Block; i: number; boxed: boolean; asList: boolean; stepNo: number; style?: CSSProperties };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

function Qa({ b, base, open0, common }: { b: Extract<Block, { kind: 'qa' }>; base: Path; open0: boolean; common: object }) {
  const { edit } = useSite();
  const [open, setOpen] = useState(open0);
  return (
    <div className="blk qa" data-open={open || undefined} {...common}>
      <div
        className="qa-head"
        onClick={(e) => {
          // In the editor a click on the question is for typing; only the button toggles.
          if (edit && !(e.target as HTMLElement).closest('.qa-toggle')) return;
          setOpen((v) => !v);
        }}
      >
        <Txt as="h3" value={b.q} path={[...base, 'q']} />
        <button type="button" className="qa-toggle" aria-expanded={open} aria-label="Toggle answer">
          <Plus size={16} />
        </button>
      </div>
      <div className="qa-body">
        <div>
          <Txt as="p" value={b.a} path={[...base, 'a']} />
        </div>
      </div>
    </div>
  );
}

export function BlockView({ s, b, i, boxed, asList, stepNo, style }: BlockProps) {
  const { edit, theme } = useSite();
  const base: Path = ['section', s.id, 'blocks', i];
  const selected = edit?.selection?.sectionId === s.id && edit.selection.block === i;
  const common = { 'data-block': i, 'data-kind': b.kind, 'data-size': b.size, 'data-selected': selected || undefined, style };

  switch (b.kind) {
    case 'card':
      return (
        <article className="blk card boxed" {...common}>
          {b.image && <Pic image={b.image} className="card-pic" />}
          <div className="card-body">
            {b.icon && (
              <span className="icon-chip">
                <Icon name={b.icon} />
              </span>
            )}
            {b.tag && <Txt className="tag" value={b.tag} path={[...base, 'tag']} />}
            <Txt as="h3" className="h3" value={b.title} path={[...base, 'title']} />
            {b.body && <Txt as="p" className="body" value={b.body} path={[...base, 'body']} />}
          </div>
        </article>
      );

    case 'stat':
      return (
        <div className={cx('blk stat', boxed && 'boxed')} {...common}>
          <Txt as="p" className="stat-value" value={b.value} path={[...base, 'value']} />
          <Txt as="p" className="stat-label" value={b.label} path={[...base, 'label']} />
        </div>
      );

    case 'quote':
      return (
        <figure className="blk quote boxed" {...common}>
          <blockquote>
            <Txt as="p" className="quote-text" value={b.text} path={[...base, 'text']} />
          </blockquote>
          <figcaption>
            <span className="avatar" aria-hidden>
              {initials(b.author)}
            </span>
            <span>
              <Txt className="quote-author" value={b.author} path={[...base, 'author']} />
              {b.role && <Txt className="quote-role" value={b.role} path={[...base, 'role']} />}
            </span>
          </figcaption>
        </figure>
      );

    case 'image':
      return (
        <figure className="blk pic-block" {...common}>
          <Pic image={b.image} />
          {b.caption && <Txt as="figcaption" value={b.caption} path={[...base, 'caption']} />}
        </figure>
      );

    case 'plan': {
      // A featured plan borrows a contrasting tone so it stands out on any section.
      const tone = s.tone === 'inverse' ? theme.tones.accent : theme.tones.inverse;
      const planStyle = b.featured ? { ...style, ...toneVars(tone) } : style;
      return (
        <article className="blk plan boxed" {...common} data-featured={b.featured || undefined} style={planStyle}>
          <div className="plan-top">
            <Txt as="h3" className="plan-name" value={b.name} path={[...base, 'name']} />
            {b.featured && <span className="plan-badge">Most popular</span>}
          </div>
          <p className="plan-price">
            <Txt className="price" value={b.price} path={[...base, 'price']} />
            {b.period && <Txt className="period" value={b.period} path={[...base, 'period']} />}
          </p>
          {b.blurb && <Txt as="p" className="body" value={b.blurb} path={[...base, 'blurb']} />}
          <ul className="plan-features">
            {b.features.map((f, k) => (
              <li key={k}>
                <CheckIcon size={16} strokeWidth={2.2} aria-hidden />
                <Txt value={f} path={[...base, 'features', k]} />
              </li>
            ))}
          </ul>
          <a className={cx('btn', b.featured ? 'btn-primary' : 'btn-secondary')} href="#">
            <Txt value={b.cta} path={[...base, 'cta']} />
          </a>
        </article>
      );
    }

    case 'qa':
      if (asList) return <Qa b={b} base={base} open0={i === 0} common={common} />;
      return (
        <article className="blk card boxed" {...common}>
          <div className="card-body">
            <Txt as="h3" className="h3" value={b.q} path={[...base, 'q']} />
            <Txt as="p" className="body" value={b.a} path={[...base, 'a']} />
          </div>
        </article>
      );

    case 'step':
      return (
        <div className={cx('blk step', boxed && 'boxed')} {...common}>
          <span className="step-n" aria-hidden>
            {String(stepNo).padStart(2, '0')}
          </span>
          <Txt as="h3" className="h3" value={b.title} path={[...base, 'title']} />
          {b.body && <Txt as="p" className="body" value={b.body} path={[...base, 'body']} />}
        </div>
      );

    case 'logo':
      return (
        <div className="blk logo" {...common}>
          <Txt className="logo-word" value={b.name} path={[...base, 'name']} />
        </div>
      );
  }
}

/** Lays a section's blocks out according to the planned layout. */
export function BlocksView({ s, e, layout, cols, overlap }: { s: Section; e: Effective; layout: Effective['layout']; cols: number; overlap: boolean }) {
  const { theme } = useSite();
  const n = s.blocks.length;
  if (!n) return null;

  const kinds = new Set(s.blocks.map((b) => b.kind));
  const kindAttr = kinds.size === 1 ? [...kinds][0] : 'mixed';
  // Cards without a surface cannot form bento cells or straddle two tones.
  const card = e.solid && theme.traits.card === 'plain' ? 'tinted' : theme.traits.card;
  const asList = layout === 'stack' || (layout === 'split' && cols === 1);

  let stepNo = 0;
  const render = (cells?: { lg: CSSProperties[]; md: CSSProperties[] }) =>
    s.blocks.map((b, i) => {
      if (b.kind === 'step') stepNo++;
      const style = cells ? ({ ...cells.lg[i], ...cells.md[i] } as CSSProperties) : undefined;
      return <BlockView key={i} s={s} b={b} i={i} boxed={e.solid} asList={asList} stepNo={stepNo} style={style} />;
    });

  if (layout === 'marquee') {
    const dur = `${Math.max(26, n * 8)}s`;
    return (
      <div className="marquee" data-card={card} data-kinds={kindAttr}>
        <div className="marquee-track" style={{ '--dur': dur } as CSSProperties}>
          <div className="marquee-group">{render()}</div>
          <ReadOnly>
            <div className="marquee-group" aria-hidden inert>
              {((stepNo = 0), render())}
            </div>
          </ReadOnly>
        </div>
      </div>
    );
  }

  let cells: { lg: CSSProperties[]; md: CSSProperties[] } | undefined;
  if (layout === 'bento') {
    const sizes = s.blocks.map((b) => b.size);
    const place = (c: { col: number; row: number; w: number; h: number }, p: string) =>
      ({ [`--${p}c`]: `${c.col + 1} / span ${c.w}`, [`--${p}r`]: `${c.row + 1} / span ${c.h}` }) as CSSProperties;
    cells = { lg: packBento(sizes, cols).map((c) => place(c, 'l')), md: packBento(sizes, 2).map((c) => place(c, 'm')) };
  }

  return (
    <div
      className={cx('blocks', overlap && 'ov')}
      data-layout={layout === 'split' ? 'grid' : layout}
      data-cols={cols}
      data-count={n}
      data-kinds={kindAttr}
      data-card={card}
      data-width={s.layout.width}
    >
      {render(cells)}
    </div>
  );
}
