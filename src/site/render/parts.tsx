'use client';

import {
  Award, BookOpen, Calendar, Camera, ChartColumn, Check, Clock, Code, Coffee, Cpu, CreditCard, Droplet, Flame, Gift,
  Globe, Heart, House, Layers, Leaf, Lock, Mail, MapPin, Moon, Music, Package, Phone, RefreshCw, Rocket, Scissors,
  Shield, Smile, Sparkles, Star, Sun, Target, Truck, Users, WandSparkles, Wrench, Zap, type LucideIcon,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useSyncExternalStore, type ElementType } from 'react';
import type { Action, ImageRef } from '../schema';
import type { IconName } from '../vocab';
import { useSite, type ImageApi, type ImageState, type Path } from './context';

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

// ---------------------------------------------------------------- text

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Headings may mark a few words with *asterisks*; the theme decides how they look.
 * With `perWord`, each word gets its own element so a marker-style highlight can wrap
 * across lines word by word.
 */
const richToHtml = (s: string, perWord: boolean) =>
  escapeHtml(s).replace(/\*([^*]+)\*/g, (_m, phrase: string) =>
    perWord
      ? phrase
          .trim()
          .split(/\s+/)
          .map((w, i) => `<em class="em${i ? ' em-c' : ''}">${w}</em>`)
          .join(' ')
      : `<em class="em">${phrase}</em>`,
  );

function serializeRich(el: HTMLElement): string {
  let out = '';
  el.childNodes.forEach((n) => {
    const t = n.textContent ?? '';
    if (n.nodeType === 1 && (n as HTMLElement).tagName === 'EM' && t.trim()) {
      out += (/^\s/.test(t) ? ' ' : '') + `*${t.trim()}*` + (/\s$/.test(t) ? ' ' : '');
    } else out += t;
  });
  // Neighbouring emphasised words are one phrase.
  return out.replace(/\s+/g, ' ').replace(/\* \*/g, ' ').trim();
}

let measurer: CanvasRenderingContext2D | null = null;

/**
 * Shrinks a heading just enough that its longest word fits on one line. Long compound
 * words are everywhere in Hungarian ("Villanyszerelés", "Időpontfoglalás"), and a
 * headline broken mid-word looks like a mistake. Hyphenation stays as the last resort.
 */
function useFitLongestWord(enabled: boolean, text: string, font: string) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    const fit = () => {
      el.style.fontSize = '';
      const cs = getComputedStyle(el);
      const size = parseFloat(cs.fontSize);
      const room = (el.parentElement ?? el).clientWidth;
      if (!size || !room) return;
      measurer ??= document.createElement('canvas').getContext('2d');
      if (!measurer) return;
      measurer.font = `${cs.fontWeight} ${size}px ${cs.fontFamily}`;
      const spacing = parseFloat(cs.letterSpacing) || 0;
      let widest = 0;
      for (const raw of (el.textContent ?? '').split(/\s+/)) {
        const word = cs.textTransform === 'uppercase' ? raw.toUpperCase() : raw;
        widest = Math.max(widest, measurer.measureText(word).width + spacing * word.length);
      }
      // A little slack for italics and the padding of highlighted words.
      widest *= 1.07;
      const scale = widest > room ? room / widest : 1;
      if (scale < 1) el.style.fontSize = `${(size * Math.max(0.6, scale)).toFixed(1)}px`;
      // Once every word fits, nothing may be split: balanced wrapping would otherwise
      // hyphenate a word that fits, just to even out the lines. Only a word that is still
      // too long at the smallest size is allowed to break.
      el.style.hyphens = scale < 0.6 ? 'auto' : 'manual';
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el.parentElement ?? el);
    void document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, [enabled, text, font]);
  return ref;
}

type TxtProps = {
  as?: ElementType;
  value: string;
  /** Where the text lives in the document. Typing commits a `set` operation there. */
  path?: Path;
  /** For text that is not a single field (a heading shared by several rows). */
  commit?: (value: string) => boolean;
  className?: string;
  rich?: boolean;
  [attr: `data-${string}`]: string | undefined;
};

/** A piece of copy. In an editor it can be typed into directly; the change is one `set` operation. */
export function Txt({ as, value, path, commit, className, rich, ...rest }: TxtProps) {
  const { edit, theme } = useSite();
  const Tag = (as ?? 'span') as ElementType;
  const html = rich ? richToHtml(value, theme.traits.emphasis === 'highlight') : escapeHtml(value);
  // Headings are the only rich text, and the only text large enough to need fitting.
  const ref = useFitLongestWord(!!rich, value, `${theme.fonts.display}/${theme.scale}/${theme.traits.caps}`);

  if (!edit || (!path && !commit)) return <Tag ref={ref} className={className} {...rest} dangerouslySetInnerHTML={{ __html: html }} />;

  const read = (el: HTMLElement) => (rich ? serializeRich(el) : (el.textContent ?? '').replace(/\s+/g, ' ').trim());

  return (
    <Tag
      ref={ref}
      className={className}
      {...rest}
      data-text=""
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck={false}
      dangerouslySetInnerHTML={{ __html: html }}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        e.stopPropagation();
        const el = e.currentTarget;
        if ((e.metaKey || e.ctrlKey) && /^[zy]$/i.test(e.key)) {
          // The browser's undo history knows nothing about committed edits and can replay
          // stale text into the field. The first press discards what was typed here; with
          // nothing typed it leaves the field, so the next press undoes the last change to the site.
          e.preventDefault();
          if (read(el) !== value) el.innerHTML = html;
          else el.blur();
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.blur();
        } else if (e.key === 'Escape') {
          e.currentTarget.innerHTML = html;
          e.currentTarget.blur();
        }
      }}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        const el = e.currentTarget;
        const next = read(el);
        if (next === value || !(commit ? commit(next) : edit.setText(path!, next))) el.innerHTML = html;
      }}
    />
  );
}

// ---------------------------------------------------------------- buttons

/**
 * Links inside a site. "/services" goes to another page, "#prices" to a section on this
 * one. In an editor a click is for typing, so nothing navigates.
 */
export function useLink(href: string) {
  const { navigate, edit, doc } = useSite();
  const page = href.startsWith('/') ? href.slice(1).split('#')[0] || 'home' : null;
  return {
    href,
    onClick: (e: React.MouseEvent) => {
      if (edit || !page) return;
      if (!doc.pages.some((p) => p.id === page) && page !== 'privacy' && page !== 'imprint') return;
      e.preventDefault();
      navigate(page);
    },
  };
}

export function Btn({ action, path, className }: { action: Action; path?: Path; className?: string }) {
  const link = useLink(action.href);
  return (
    <a className={cx('btn', `btn-${action.kind}`, className)} {...link}>
      <Txt value={action.label} path={path} />
    </a>
  );
}

// ---------------------------------------------------------------- images

const IDLE: ImageState = { status: 'idle' };

function useImage(api: ImageApi | null, image: ImageRef, style: string): ImageState {
  const subscribe = useCallback((cb: () => void) => (api ? api.subscribe(cb) : () => {}), [api]);
  const state = useSyncExternalStore(
    subscribe,
    () => (api ? api.snapshot(image, style) : IDLE),
    () => IDLE,
  );
  useEffect(() => {
    api?.request(image, style);
  }, [api, image, style]);
  return state;
}

const NOTE: Partial<Record<ImageState['status'], string>> = { loading: 'Generating image', queued: 'Queued', error: 'Image failed' };

/** An image slot. It shows a themed placeholder immediately and the photo once it exists. */
export function Pic({ image, className }: { image: ImageRef; className?: string }) {
  const { images, theme, edit } = useSite();
  const state = useImage(images, image, theme.imageStyle);
  return (
    <div className={cx('pic', className)} data-aspect={image.aspect} data-state={state.status}>
      {state.url ? (
        <img src={state.url} alt={image.alt} draggable={false} />
      ) : (
        edit && (
          <span className="pic-note">
            <b>{NOTE[state.status] ?? 'Image'}</b> {image.alt || image.prompt}
          </span>
        )
      )}
    </div>
  );
}

// ---------------------------------------------------------------- icons

const ICON_MAP: Record<IconName, LucideIcon> = {
  sparkles: Sparkles, leaf: Leaf, coffee: Coffee, truck: Truck, clock: Clock, shield: Shield, heart: Heart, star: Star,
  zap: Zap, globe: Globe, users: Users, chart: ChartColumn, calendar: Calendar, package: Package, flame: Flame,
  droplet: Droplet, sun: Sun, moon: Moon, 'map-pin': MapPin, phone: Phone, mail: Mail, 'credit-card': CreditCard,
  lock: Lock, code: Code, cpu: Cpu, layers: Layers, wand: WandSparkles, camera: Camera, music: Music, book: BookOpen,
  gift: Gift, award: Award, target: Target, rocket: Rocket, smile: Smile, check: Check, refresh: RefreshCw,
  scissors: Scissors, home: House, wrench: Wrench,
};

/** A row of five stars, filled up to `value` (halves and decimals included). */
export function Stars({ value }: { value: number }) {
  const pct = `${Math.max(0, Math.min(5, value)) * 20}%`;
  const row = (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} size={16} strokeWidth={0} fill="currentColor" aria-hidden />
      ))}
    </>
  );
  return (
    <span className="stars" role="img" aria-label={`${value} / 5`}>
      <span className="stars-off">{row}</span>
      <span className="stars-on" style={{ width: pct }}>
        {row}
      </span>
    </span>
  );
}

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const C = ICON_MAP[name] ?? Sparkles;
  return <C size={size} strokeWidth={1.6} aria-hidden />;
}

export { Check as CheckIcon };
