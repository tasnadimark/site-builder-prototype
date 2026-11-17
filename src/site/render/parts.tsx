'use client';

import {
  Award, BookOpen, Calendar, Camera, ChartColumn, Check, Clock, Code, Coffee, Cpu, CreditCard, Droplet, Flame, Gift,
  Globe, Heart, House, Layers, Leaf, Lock, Mail, MapPin, Moon, Music, Package, Phone, RefreshCw, Rocket, Scissors,
  Shield, Smile, Sparkles, Star, Sun, Target, Truck, Users, WandSparkles, Wrench, Zap, type LucideIcon,
} from 'lucide-react';
import { useCallback, useEffect, useSyncExternalStore, type ElementType } from 'react';
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

type TxtProps = {
  as?: ElementType;
  value: string;
  path?: Path;
  className?: string;
  rich?: boolean;
  [attr: `data-${string}`]: string | undefined;
};

/** A piece of copy. In an editor it can be typed into directly; the change is one `set` operation. */
export function Txt({ as, value, path, className, rich, ...rest }: TxtProps) {
  const { edit, theme } = useSite();
  const Tag = (as ?? 'span') as ElementType;
  const html = rich ? richToHtml(value, theme.traits.emphasis === 'highlight') : escapeHtml(value);

  if (!edit || !path) return <Tag className={className} {...rest} dangerouslySetInnerHTML={{ __html: html }} />;

  return (
    <Tag
      className={className}
      {...rest}
      data-text=""
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck={false}
      dangerouslySetInnerHTML={{ __html: html }}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        e.stopPropagation();
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
        const next = rich ? serializeRich(el) : (el.textContent ?? '').replace(/\s+/g, ' ').trim();
        if (next === value || !edit.setText(path, next)) el.innerHTML = html;
      }}
    />
  );
}

// ---------------------------------------------------------------- buttons

export function Btn({ action, path, className }: { action: Action; path?: Path; className?: string }) {
  return (
    <a className={cx('btn', `btn-${action.kind}`, className)} href={action.href}>
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

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const C = ICON_MAP[name] ?? Sparkles;
  return <C size={size} strokeWidth={1.6} aria-hidden />;
}

export { Check as CheckIcon };
