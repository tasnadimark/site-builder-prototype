'use client';

import { Plus } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { itemKind, layoutItems, packBento, type Effective, type Item } from '../plan';
import type { Block, Section } from '../schema';
import { toneVars } from '../theme';
import { ReadOnly, useSite, type Path } from './context';
import { CheckIcon, Icon, Pic, Stars, Txt, cx } from './parts';

type Common = { 'data-block': number; 'data-kind': string; 'data-size': string; 'data-selected'?: true; style?: CSSProperties };
type BlockProps = { s: Section; b: Exclude<Block, { kind: 'row' }>; i: number; boxed: boolean; asList: boolean; stepNo: number; style?: CSSProperties };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

function Qa({ b, base, open0, common }: { b: Extract<Block, { kind: 'qa' }>; base: Path; open0: boolean; common: Common }) {
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

/** Address, phone, hours and map for one location, all read from the business facts. */
function Contact({ b, common }: { b: Extract<Block, { kind: 'contact' }>; common: Common }) {
  const { doc, t, edit } = useSite();
  const biz = doc.business;
  const li = Math.max(0, biz.locations.findIndex((l) => l.id === b.location));
  const loc = biz.locations[li];
  const phone = loc?.phone ?? biz.phone;
  const phonePath: Path = loc?.phone ? ['business', 'locations', li, 'phone'] : ['business', 'phone'];

  if (!loc && !phone && !biz.email) {
    return edit ? (
      <div className="blk contact boxed" {...common}>
        <p className="body">Add an address, phone number and opening hours in the Business tab and they will appear here.</p>
      </div>
    ) : null;
  }

  return (
    <div className="blk contact boxed" {...common}>
      {loc && biz.locations.length > 1 && <Txt as="h3" className="h3" value={loc.name} path={['business', 'locations', li, 'name']} />}
      <dl className="facts">
        {loc && (
          <div>
            <dt>{t.address}</dt>
            <dd>
              <Txt value={loc.address} path={['business', 'locations', li, 'address']} />
              <a className="facts-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address)}`} target="_blank" rel="noreferrer">
                {t.directions}
              </a>
            </dd>
          </div>
        )}
        {phone && (
          <div>
            <dt>{t.phone}</dt>
            <dd>
              <a href={`tel:${phone.replace(/[^\d+]/g, '')}`}>
                <Txt value={phone} path={phonePath} />
              </a>
            </dd>
          </div>
        )}
        {biz.email && (
          <div>
            <dt>{t.email}</dt>
            <dd>
              <a href={`mailto:${biz.email}`}>
                <Txt value={biz.email} path={['business', 'email']} />
              </a>
            </dd>
          </div>
        )}
        {loc && loc.hours.length > 0 && (
          <div>
            <dt>{t.hours}</dt>
            <dd>
              <ul className="hours">
                {loc.hours.map((h, k) => (
                  <li key={k}>
                    <Txt value={h.days} path={['business', 'locations', li, 'hours', k, 'days']} />
                    <Txt value={h.time} path={['business', 'locations', li, 'hours', k, 'time']} />
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        )}
      </dl>
      {b.map && loc && (
        <div className="map">
          <span className="map-fallback">{loc.address}</span>
          <iframe title={loc.name} src={`https://www.google.com/maps?q=${encodeURIComponent(loc.address)}&output=embed`} loading="lazy" referrerPolicy="no-referrer" />
        </div>
      )}
    </div>
  );
}

/** An enquiry form. It is not connected to anything yet; submitting only shows a note. */
function Form({ b, base, common }: { b: Extract<Block, { kind: 'form' }>; base: Path; common: Common }) {
  const { t } = useSite();
  const [sent, setSent] = useState(false);
  const fields = b.fields.length ? b.fields : (['name', 'email', 'message'] as const);
  const type = { name: 'text', email: 'email', phone: 'tel', service: 'text', date: 'date', message: 'text' } as const;
  return (
    <form
      className="blk form boxed"
      {...common}
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      {b.title && <Txt as="h3" className="h3" value={b.title} path={[...base, 'title']} />}
      <div className="form-fields">
        {fields.map((f) => (
          <label key={f} data-field={f}>
            <span>{t.field[f]}</span>
            {f === 'message' ? <textarea rows={4} name={f} /> : <input type={type[f]} name={f} />}
          </label>
        ))}
      </div>
      <button type="submit" className="btn btn-primary">
        {b.submit ?? t.send}
      </button>
      {sent && (
        <p className="form-sent" role="status">
          {t.sent}
        </p>
      )}
      {b.note && <Txt as="p" className="form-note" value={b.note} path={[...base, 'note']} />}
    </form>
  );
}

function Rating({ common }: { common: Common }) {
  const { doc, t, edit } = useSite();
  const r = doc.business.rating;
  if (!r) return edit ? <p className="blk body" {...common}>Add a review score in the Business tab to show it here.</p> : null;
  return (
    <div className="blk rating" {...common}>
      <Stars value={parseFloat(r.value.replace(',', '.')) || 5} />
      <b>{r.value}</b>
      <span>
        {r.count ? `${r.count} ${t.reviews} · ` : ''}
        {r.source}
      </span>
    </div>
  );
}

/** A run of rows under one heading: a price group, a menu course, a day of classes. */
function RowGroup({ s, item, boxed, selected, style }: { s: Section; item: Extract<Item, { kind: 'rows' }>; boxed: boolean; selected?: number; style?: CSSProperties }) {
  const { edit } = useSite();
  return (
    <div className={cx('blk rowgroup', boxed && 'boxed')} data-kind="rows" data-size={item.size} style={style}>
      {item.group && (
        <Txt as="h3" className="h3 rowgroup-title" value={item.group} commit={(v) => !!edit?.run({ op: 'regroup', id: s.id, from: item.group, to: v })} />
      )}
      <ul className="rows">
        {item.rows.map(({ block: b, index: i }) => {
          const base: Path = ['section', s.id, 'blocks', i];
          return (
            <li key={i} className="row" data-block={i} data-selected={selected === i || undefined}>
              <span className="row-main">
                <Txt className="row-title" value={b.title} path={[...base, 'title']} />
                {b.detail && <Txt className="row-detail" value={b.detail} path={[...base, 'detail']} />}
              </span>
              {b.value && (
                <>
                  <span className="row-dots" aria-hidden />
                  <Txt className="row-value" value={b.value} path={[...base, 'value']} />
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function BlockView({ s, b, i, boxed, asList, stepNo, style }: BlockProps) {
  const { edit, theme, t } = useSite();
  const base: Path = ['section', s.id, 'blocks', i];
  const selected = edit?.selection?.sectionId === s.id && edit.selection.block === i;
  const common: Common = { 'data-block': i, 'data-kind': b.kind, 'data-size': b.size, 'data-selected': selected || undefined, style };

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
            {b.stars && <Stars value={b.stars} />}
            <Txt as="p" className="quote-text" value={b.text} path={[...base, 'text']} />
          </blockquote>
          <figcaption>
            <span className="avatar" aria-hidden>
              {initials(b.author)}
            </span>
            <span>
              <Txt className="quote-author" value={b.author} path={[...base, 'author']} />
              {(b.role || b.source) && (
                <span className="quote-role">
                  {b.role && <Txt value={b.role} path={[...base, 'role']} />}
                  {b.role && b.source ? ' · ' : ''}
                  {b.source}
                </span>
              )}
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
            {b.featured && <span className="plan-badge">{t.mostPopular}</span>}
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

    case 'person':
      return (
        <article className="blk person" {...common}>
          {b.image ? (
            <Pic image={b.image} className="person-pic" />
          ) : (
            <div className="person-pic person-initials" aria-hidden>
              {initials(b.name)}
            </div>
          )}
          <div className="person-body">
            <Txt as="h3" className="h3" value={b.name} path={[...base, 'name']} />
            {b.role && <Txt className="person-role" value={b.role} path={[...base, 'role']} />}
            {b.bio && <Txt as="p" className="body" value={b.bio} path={[...base, 'bio']} />}
          </div>
        </article>
      );

    case 'contact':
      return <Contact b={b} common={common} />;

    case 'form':
      return <Form b={b} base={base} common={common} />;

    case 'rating':
      return <Rating common={common} />;

    case 'check':
      return (
        <div className="blk check" {...common}>
          <CheckIcon size={18} strokeWidth={2.4} aria-hidden />
          <span>
            <Txt className="check-label" value={b.label} path={[...base, 'label']} />
            {b.detail && <Txt className="check-detail" value={b.detail} path={[...base, 'detail']} />}
          </span>
        </div>
      );
  }
}

/** Lays a section's blocks out according to the planned layout. */
export function BlocksView({ s, e, layout, cols, overlap }: { s: Section; e: Effective; layout: Effective['layout']; cols: number; overlap: boolean }) {
  const { theme, edit } = useSite();
  const items = layoutItems(s.blocks);
  const n = items.length;
  if (!n) return null;

  const kinds = new Set(items.map(itemKind));
  const kindAttr = kinds.size === 1 ? [...kinds][0] : 'mixed';
  // Cards without a surface cannot form bento cells or straddle two tones.
  const card = e.solid && theme.traits.card === 'plain' ? 'tinted' : theme.traits.card;
  const asList = layout === 'stack' || (layout === 'split' && cols === 1);
  // Several groups of rows side by side read as panels; a single list does not need a box.
  const boxRows = e.solid || (!asList && n > 1);
  const selected = edit?.selection?.sectionId === s.id ? edit.selection.block : undefined;

  const render = (cells?: { lg: CSSProperties[]; md: CSSProperties[] }) => {
    let stepNo = 0;
    return items.map((item, k) => {
      const style = cells ? ({ ...cells.lg[k], ...cells.md[k] } as CSSProperties) : undefined;
      if (item.kind === 'rows') return <RowGroup key={`rows-${item.index}`} s={s} item={item} boxed={boxRows} selected={selected} style={style} />;
      if (item.block.kind === 'step') stepNo++;
      return <BlockView key={item.index} s={s} b={item.block} i={item.index} boxed={e.solid} asList={asList} stepNo={stepNo} style={style} />;
    });
  };

  if (layout === 'marquee') {
    const dur = `${Math.max(26, n * 8)}s`;
    return (
      <div className="marquee" data-card={card} data-kinds={kindAttr}>
        <div className="marquee-track" style={{ '--dur': dur } as CSSProperties}>
          <div className="marquee-group">{render()}</div>
          <ReadOnly>
            <div className="marquee-group" aria-hidden inert>
              {render()}
            </div>
          </ReadOnly>
        </div>
      </div>
    );
  }

  let cells: { lg: CSSProperties[]; md: CSSProperties[] } | undefined;
  if (layout === 'bento') {
    const sizes = items.map((it) => it.size);
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
