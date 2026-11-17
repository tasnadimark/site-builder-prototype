'use client';

// The renderer. A pure function of the document: no code is generated, every pixel
// comes from these components and site.css. It has no dependency on the editor or on
// Next.js, so it can be lifted into another React app as is.

import { ChevronDown, Menu, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import { planSections, type Effective } from '../plan';
import { LEGAL_PAGES, type Footer, type LegalPage, type Nav, type Section, type SiteDoc } from '../schema';
import { STRINGS, legalPage } from '../strings';
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
          <Txt as={level === 1 ? 'h1' : 'h2'} className={level === 1 && s.type === 'hero' ? 'h1' : level === 1 ? 'h2 h2-page' : 'h2'} rich value={i.heading} path={[...base, 'heading']} />
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
  const level = first ? 1 : 2;

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

// ---------------------------------------------------------------- menu

type MenuLink = { label: string; page?: string; href?: string; path?: Path };
type MenuItem = MenuLink & { children?: MenuLink[] };

/**
 * The menu is derived from the pages, so it can never point at a page that does not
 * exist. Pages that share a group become one dropdown. At most five items are shown.
 */
function buildMenu(doc: SiteDoc): MenuItem[] {
  const items: MenuItem[] = [];
  for (const page of doc.pages.slice(1)) {
    if (!page.menu) continue;
    const link: MenuLink = { label: page.title, page: page.id, path: ['page', page.id, 'title'] };
    if (!page.group) items.push(link);
    else {
      let group = items.find((i) => i.children && i.label === page.group);
      if (!group) items.push((group = { label: page.group, children: [] }));
      group.children!.push(link);
    }
  }
  // A one-page site can still link to sections of that page.
  doc.nav.links.forEach((l, i) => items.push({ label: l.label, href: l.href, path: ['nav', 'links', i, 'label'] }));
  return items.slice(0, 5);
}

function MenuLinkView({ link, current, onGo }: { link: MenuLink; current: string; onGo?: () => void }) {
  const { navigate } = useSite();
  if (!link.page) {
    return (
      <a href={link.href} onClick={onGo}>
        <Txt value={link.label} path={link.path} />
      </a>
    );
  }
  return (
    <a
      href={`/${link.page}`}
      aria-current={current === link.page ? 'page' : undefined}
      onClick={(e) => {
        e.preventDefault();
        navigate(link.page!);
        onGo?.();
      }}
    >
      {link.label}
    </a>
  );
}

/** After a choice is made the dropdown stays closed until the pointer leaves it. */
const SHUT = '\u0000shut';

function NavView({ nav, name, tone, overlay, current }: { nav: Nav; name: string; tone: ToneColors; overlay: boolean; current: string }) {
  const { doc, navigate } = useSite();
  const menu = useMemo(() => buildMenu(doc), [doc]);
  const [open, setOpen] = useState(false);
  const [drop, setDrop] = useState<string | null>(null);

  return (
    <header className="nav" data-style={nav.style} data-overlay={overlay || undefined} data-open={open || undefined} style={toneVars(tone)}>
      <div className="nav-in">
        <a
          className="brand"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate('home');
          }}
        >
          <Txt value={nav.brand || name} path={['nav', 'brand']} />
        </a>
        <nav className="nav-links">
          {menu.map((item) =>
            item.children ? (
              <div key={item.label} className="nav-group" data-open={drop === item.label || undefined} data-shut={drop === SHUT || undefined} onMouseLeave={() => setDrop(null)}>
                <button type="button" aria-expanded={drop === item.label} onClick={() => setDrop(drop === item.label ? null : item.label)}>
                  {item.label} <ChevronDown size={14} aria-hidden />
                </button>
                <div className="nav-drop">
                  {item.children.map((c) => (
                    <MenuLinkView key={c.page} link={c} current={current} onGo={() => setDrop(SHUT)} />
                  ))}
                </div>
              </div>
            ) : (
              <MenuLinkView key={item.page ?? item.href} link={item} current={current} />
            ),
          )}
        </nav>
        <div className="nav-end">
          {nav.cta && <Btn action={nav.cta} path={['nav', 'cta', 'label']} className="nav-cta" />}
          {menu.length > 0 && (
            <button type="button" className="nav-burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}
        </div>
      </div>
      {open && (
        <nav className="nav-panel">
          {menu.map((item) =>
            item.children ? (
              <div key={item.label} className="nav-panel-group">
                <span>{item.label}</span>
                {item.children.map((c) => (
                  <MenuLinkView key={c.page} link={c} current={current} onGo={() => setOpen(false)} />
                ))}
              </div>
            ) : (
              <MenuLinkView key={item.page ?? item.href} link={item} current={current} onGo={() => setOpen(false)} />
            ),
          )}
          {nav.cta && <Btn action={nav.cta} className="nav-panel-cta" />}
        </nav>
      )}
    </header>
  );
}

// ---------------------------------------------------------------- footer

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

function PageLink({ page, label }: { page: string; label: string }) {
  const { navigate } = useSite();
  return (
    <a
      href={`/${page}`}
      onClick={(e) => {
        e.preventDefault();
        navigate(page);
      }}
    >
      {label}
    </a>
  );
}

function FooterView({ footer, name, tone }: { footer: Footer; name: string; tone: ToneColors }) {
  const { doc, t } = useSite();
  const biz = doc.business;
  const loc = biz.locations[0];
  const phone = biz.phone ?? loc?.phone;
  // Older single-page documents wrote their own footer columns. Everything newer gets
  // columns built from the real pages and the business facts.
  const authored = footer.columns.length > 0;
  const pages = doc.pages.filter((p) => p.menu);

  return (
    <footer className="foot" data-style={footer.style} style={toneVars(tone)}>
      <div className="wrap">
        <div className="foot-top">
          <div className="foot-brand">
            <span className="brand">{name}</span>
            {footer.tagline && <Txt as="p" className="foot-tagline" value={footer.tagline} path={['footer', 'tagline']} />}
            {biz.socials.length > 0 && (
              <p className="foot-socials">
                {biz.socials.map((s) => (
                  <a key={s.kind} href={s.url} target="_blank" rel="noreferrer">
                    {s.kind}
                  </a>
                ))}
              </p>
            )}
          </div>
          {footer.style !== 'minimal' && (
            <div className="foot-cols">
              {authored
                ? footer.columns.map((c, i) => (
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
                  ))
                : pages.length > 1 && (
                    <div>
                      <p className="foot-title">{t.pages}</p>
                      <ul className="foot-links">
                        {pages.map((p) => (
                          <li key={p.id}>
                            <PageLink page={p.id} label={p.id === 'home' ? t.home : p.title} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              {!authored && (loc || phone || biz.email) && (
                <div>
                  <p className="foot-title">{t.contact}</p>
                  <ul className="foot-links">
                    {loc && <li>{loc.address}</li>}
                    {phone && (
                      <li>
                        <a href={`tel:${phone.replace(/[^\d+]/g, '')}`}>{phone}</a>
                      </li>
                    )}
                    {biz.email && (
                      <li>
                        <a href={`mailto:${biz.email}`}>{biz.email}</a>
                      </li>
                    )}
                  </ul>
                </div>
              )}
              {!authored && loc && loc.hours.length > 0 && (
                <div>
                  <p className="foot-title">{t.hours}</p>
                  <ul className="foot-links foot-hours">
                    {loc.hours.map((h, k) => (
                      <li key={k}>
                        <span>{h.days}</span>
                        <span>{h.time}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        {footer.style === 'big' && <FitText text={name} className="foot-word" />}
        <div className="foot-note">
          {footer.note ? <Txt as="span" value={footer.note} path={['footer', 'note']} /> : <span>© {name}</span>}
          <span className="foot-legal">
            <PageLink page="privacy" label={t.privacy} />
            <PageLink page="imprint" label={t.imprint} />
          </span>
        </div>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------- legal pages

/** Privacy notice and company details. Built from the business facts, not stored in the document. */
function LegalView({ which, tone }: { which: LegalPage; tone: ToneColors }) {
  const { doc, t } = useSite();
  const page = legalPage(which, doc.meta.language, doc.nav.brand || doc.meta.name, doc.business);
  return (
    <section className="sec legal" data-first style={toneVars(tone)}>
      <div className="wrap">
        <header className="intro" data-align="start">
          <div className="intro-main">
            <h1 className="h2 h2-page">{page.title}</h1>
          </div>
        </header>
        <p className="legal-notice">{t.legalNotice}</p>
        <div className="legal-body">
          {page.parts.map((part) => (
            <div key={part.heading}>
              <h2 className="h3">{part.heading}</h2>
              {part.lines.map((line, i) => (
                <p key={i} className="body">
                  {line}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- site

export type SiteProps = {
  doc: SiteDoc;
  /** Which page to draw: a page id, or "privacy" / "imprint". Defaults to Home. */
  pageId?: string;
  onNavigate?: (pageId: string) => void;
  edit?: EditApi | null;
  images?: ImageApi | null;
};

const isLegal = (id: string): id is LegalPage => (LEGAL_PAGES as readonly string[]).includes(id);

export function Site({ doc, pageId = 'home', onNavigate, edit = null, images = null }: SiteProps) {
  const theme = useMemo(() => resolveTheme(doc.theme), [doc.theme]);
  const legal = isLegal(pageId) ? pageId : null;
  const page = doc.pages.find((p) => p.id === pageId) ?? doc.pages[0];
  const sections = legal ? [] : page.sections;
  const plan = useMemo(() => planSections(sections, theme, doc.footer.tone), [sections, theme, doc.footer.tone]);
  const ctx = useMemo<SiteContext>(
    () => ({ doc, theme, t: STRINGS[doc.meta.language], edit, images, navigate: (id) => onNavigate?.(id) }),
    [doc, theme, edit, images, onNavigate],
  );
  useFontLinks(theme.fontLinks);

  const name = doc.nav.brand || doc.meta.name;
  const first = sections[0];
  const firstTone = first ? (plan[0].cover ? theme.cover : theme.tones[first.tone]) : theme.tones.base;
  let eyebrowCount = 0;

  return (
    <SiteCtx.Provider value={ctx}>
      <div
        className="site"
        lang={doc.meta.language}
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
        <NavView nav={doc.nav} name={name} tone={firstTone} overlay={!!first || !!legal} current={legal ?? page.id} />
        {legal && <LegalView which={legal} tone={theme.tones.base} />}
        {sections.map((s, i) => {
          if (s.intro.eyebrow) eyebrowCount++;
          return <SectionView key={s.id} s={s} e={plan[i]} index={i} total={sections.length} first={i === 0} n={String(eyebrowCount).padStart(2, '0')} />;
        })}
        <FooterView footer={doc.footer} name={name} tone={theme.tones[doc.footer.tone]} />
      </div>
    </SiteCtx.Provider>
  );
}
