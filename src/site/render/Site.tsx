'use client';

// The renderer. A pure function of the document: no code is generated, every pixel
// comes from these components and site.css. It has no dependency on the editor or on
// Next.js, so it can be lifted into another React app as is.

import { useEffect, useId, useMemo, useRef, type CSSProperties } from 'react';
import { planSections, type Effective } from '../plan';
import type { Footer, Nav, Section, SiteDoc } from '../schema';
import { resolveTheme, toneVars, type ToneColors } from '../theme';
import type { Divider } from '../vocab';
import { BlocksView } from './blocks';
import { SiteCtx, useSite, type EditApi, type ImageApi, type Path, type SiteContext } from './context';
import { Btn, Pic, Txt, cx } from './parts';
import '../site.css';

function useFontLinks(hrefs: string[]) {
  const key = hrefs.join('|');
  useEffect(() => {
    for (const href of key.split('|')) {
      if (!href || document.head.querySelector(`link[href="${href}"]`)) continue;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
  }, [key]);
}

// ---------------------------------------------------------------- edges between sections

const SHAPES: Partial<Record<Divider, string>> = {
  wave: 'M0,58 C150,104 350,-4 600,46 C850,96 1050,6 1200,52 L1200,101 L0,101 Z',
  curve: 'M0,101 L0,100 Q600,-72 1200,100 L1200,101 Z',
  slant: 'M0,101 L1200,0 L1200,101 Z',
};

function EdgeView({ kind, shape, flip }: { kind: Effective['edge']; shape: Divider; flip: boolean }) {
  const uid = useId();
  if (kind === 'rule') return <div className="edge-rule" aria-hidden />;
  if (kind !== 'divider') return null;

  if (shape === 'zigzag' || shape === 'scallop') {
    const [w, h, d] = shape === 'zigzag' ? [28, 16, 'M0,16 L14,0 L28,16 Z'] : [44, 22, 'M0,22 A22,22 0 0 1 44,22 Z'];
    return (
      <div className="edge" aria-hidden>
        <svg width="100%" height={h}>
          <defs>
            <pattern id={uid} width={w} height={h} patternUnits="userSpaceOnUse">
              <path d={d as string} fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height={h} fill={`url(#${uid})`} />
        </svg>
      </div>
    );
  }

  return (
    <div className="edge" aria-hidden>
      <svg viewBox="0 0 1200 100" preserveAspectRatio="none" style={flip ? { transform: 'scaleX(-1)' } : undefined}>
        <path d={SHAPES[shape] ?? SHAPES.curve} fill="currentColor" />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------- section

function IntroView({ s, level, n }: { s: Section; level: 1 | 2; n: string }) {
  const i = s.intro;
  const base: Path = ['section', s.id, 'intro'];
  if (!i.eyebrow && !i.heading && !i.body && !i.actions.length) return null;
  return (
    <header className="intro" data-align={i.align}>
      <div className="intro-main">
        {i.eyebrow && <Txt as="p" className="eyebrow" value={i.eyebrow} path={[...base, 'eyebrow']} data-n={n} />}
        {i.heading && (
          <Txt as={level === 1 ? 'h1' : 'h2'} className={level === 1 ? 'h1' : 'h2'} rich value={i.heading} path={[...base, 'heading']} />
        )}
      </div>
      {(i.body || i.actions.length > 0) && (
        <div className="intro-side">
          {i.body && <Txt as="p" className="lead" value={i.body} path={[...base, 'body']} />}
          {i.actions.length > 0 && (
            <div className="actions">
              {i.actions.map((a, k) => (
                <Btn key={k} action={a} path={[...base, 'actions', k, 'label']} />
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );
}

type SectionProps = { s: Section; e: Effective; index: number; total: number; first: boolean; n: string };

function SectionView({ s, e, index, total, first, n }: SectionProps) {
  const { theme, edit } = useSite();
  const tone: ToneColors = e.cover ? theme.cover : theme.tones[s.tone];
  const style = { ...toneVars(tone), '--next-bg': e.nextBg } as CSSProperties;
  const selected = edit?.selection?.sectionId === s.id;
  const level = s.type === 'hero' && first ? 1 : 2;

  const media = e.mediaInFlow && s.media && (
    <div className={cx('sec-media', e.overlapTarget === 'media' && 'ov')}>
      <Pic image={s.media} className="is-media" />
    </div>
  );
  const blocks = (cols: number) => (
    <BlocksView s={s} e={e} layout={e.layout} cols={cols} overlap={e.overlapTarget === 'blocks'} />
  );

  return (
    <section
      id={s.id}
      className="sec"
      style={style}
      data-type={s.type}
      data-layout={e.layout}
      data-edge={e.edge}
      data-edge-shape={theme.traits.divider}
      data-backdrop={e.backdrop}
      data-pad={s.pad}
      data-first={first || undefined}
      data-selected={selected || undefined}
      onClick={
        edit
          ? (ev) => {
              const hit = (ev.target as HTMLElement).closest('[data-block]');
              const idx = hit ? Number(hit.getAttribute('data-block')) : undefined;
              edit.select(s.id, Number.isInteger(idx) ? idx : undefined);
            }
          : undefined
      }
    >
      {e.cover && s.media && (
        <div className="backdrop backdrop-cover">
          <Pic image={s.media} />
        </div>
      )}
      {e.backdrop === 'motif' && <div className="backdrop backdrop-motif" aria-hidden />}
      {e.backdrop === 'glow' && <div className="backdrop backdrop-glow" aria-hidden />}

      <div className="wrap">
        {e.layout === 'split' ? (
          <div className="split" data-ratio={s.layout.ratio} data-flip={s.layout.flip || undefined} data-sticky={(!media && s.blocks.length > 2) || undefined}>
            <div className="split-a">
              <IntroView s={s} level={level} n={n} />
              {media && blocks(e.cols)}
            </div>
            <div className="split-b">{media || blocks(e.cols)}</div>
          </div>
        ) : (
          <>
            <IntroView s={s} level={level} n={n} />
            {media}
            {blocks(e.cols)}
          </>
        )}
      </div>

      <EdgeView kind={e.edge} shape={theme.traits.divider} flip={index % 2 === 1} />
      {edit?.sectionChrome?.(s, index, total, e)}
    </section>
  );
}

// ---------------------------------------------------------------- nav and footer

function NavView({ nav, name, tone, overlay }: { nav: Nav; name: string; tone: ToneColors; overlay: boolean }) {
  return (
    <header className="nav" data-style={nav.style} data-overlay={overlay || undefined} style={toneVars(tone)}>
      <div className="nav-in">
        <a className="brand" href="#">
          <Txt value={nav.brand || name} path={['nav', 'brand']} />
        </a>
        <nav className="nav-links">
          {nav.links.map((l, i) => (
            <a key={i} href={l.href}>
              <Txt value={l.label} path={['nav', 'links', i, 'label']} />
            </a>
          ))}
        </nav>
        {nav.cta && <Btn action={nav.cta} path={['nav', 'cta', 'label']} className="nav-cta" />}
      </div>
    </header>
  );
}

/** Sets its text as large as the available width allows, whatever the name or typeface. */
function FitText({ text, className }: { text: string; className: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { theme } = useSite();
  useEffect(() => {
    const el = ref.current;
    const span = el?.firstElementChild as HTMLElement | null;
    if (!el || !span) return;
    const fit = () => {
      el.style.fontSize = '100px';
      const width = span.getBoundingClientRect().width / (el.getBoundingClientRect().width / el.offsetWidth || 1);
      if (width > 0) el.style.fontSize = `${Math.min((100 * el.offsetWidth) / width, el.offsetWidth * 0.32)}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    void document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, [text, theme.fonts.display, theme.traits.caps]);
  return (
    <p ref={ref} className={className} aria-hidden>
      <span>{text}</span>
    </p>
  );
}

function FooterView({ footer, name, tone }: { footer: Footer; name: string; tone: ToneColors }) {
  return (
    <footer className="foot" data-style={footer.style} style={toneVars(tone)}>
      <div className="wrap">
        <div className="foot-top">
          <div className="foot-brand">
            <span className="brand">{name}</span>
            {footer.tagline && <Txt as="p" className="foot-tagline" value={footer.tagline} path={['footer', 'tagline']} />}
          </div>
          {footer.style !== 'minimal' && footer.columns.length > 0 && (
            <div className="foot-cols">
              {footer.columns.map((c, i) => (
                <div key={i}>
                  <Txt as="p" className="foot-title" value={c.title} path={['footer', 'columns', i, 'title']} />
                  <ul className="foot-links">
                    {c.links.map((l, k) => (
                      <li key={k}>
                        <a href="#">
                          <Txt value={l} path={['footer', 'columns', i, 'links', k]} />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
        {footer.style === 'big' && <FitText text={name} className="foot-word" />}
        {footer.note && <Txt as="p" className="foot-note" value={footer.note} path={['footer', 'note']} />}
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------- site

export type SiteProps = { doc: SiteDoc; edit?: EditApi | null; images?: ImageApi | null };

export function Site({ doc, edit = null, images = null }: SiteProps) {
  const theme = useMemo(() => resolveTheme(doc.theme), [doc.theme]);
  const plan = useMemo(() => planSections(doc, theme), [doc, theme]);
  const ctx = useMemo<SiteContext>(() => ({ theme, edit, images }), [theme, edit, images]);
  useFontLinks(theme.fontLinks);

  const name = doc.nav.brand || doc.meta.name;
  const first = doc.sections[0];
  const firstTone = first ? (plan[0].cover ? theme.cover : theme.tones[first.tone]) : theme.tones.base;
  let eyebrowCount = 0;

  return (
    <SiteCtx.Provider value={ctx}>
      <div
        className="site"
        style={theme.vars}
        {...theme.attrs}
        data-editable={edit ? '' : undefined}
        onClickCapture={
          edit
            ? (e) => {
                if ((e.target as HTMLElement).closest('a')) e.preventDefault();
              }
            : undefined
        }
      >
        <NavView nav={doc.nav} name={name} tone={firstTone} overlay={!!first} />
        {doc.sections.map((s, i) => {
          if (s.intro.eyebrow) eyebrowCount++;
          return (
            <SectionView
              key={s.id}
              s={s}
              e={plan[i]}
              index={i}
              total={doc.sections.length}
              first={i === 0}
              n={String(eyebrowCount).padStart(2, '0')}
            />
          );
        })}
        <FooterView footer={doc.footer} name={name} tone={theme.tones[doc.footer.tone]} />
      </div>
    </SiteCtx.Provider>
  );
}
