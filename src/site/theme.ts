// Turns the stored theme (a preset plus optional overrides) into concrete CSS
// variables. All colour safety lives here: whatever palette comes in, text ends up
// readable on every section tone.

import type { CSSProperties } from 'react';
import { FONTS, PRESET_DEFS, type Palette, type Traits } from './presets';
import type { Theme } from './schema';
import type { FontId, Tone } from './vocab';

type RGB = [number, number, number];

export function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const toHex = (c: RGB) => '#' + c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('');

/** Blend `a` toward `b` by `t` (0..1). */
export function mix(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return toHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Nudge `fg` toward black or white until it clears `min` contrast on `bg`. */
export function ensureContrast(fg: string, bg: string, min: number): string {
  if (contrast(fg, bg) >= min) return fg;
  const target = contrast('#000000', bg) >= contrast('#ffffff', bg) ? '#000000' : '#ffffff';
  for (let t = 0.1; t < 1; t += 0.1) {
    const c = mix(fg, target, t);
    if (contrast(c, bg) >= min) return c;
  }
  return target;
}

/** Text colour for a filled area: prefer the palette, fall back to black or white. */
function onColor(fill: string, preferred: string[]): string {
  const best = preferred.map((c) => ({ c, k: contrast(c, fill) })).sort((x, y) => y.k - x.k)[0];
  if (best && best.k >= 4.5) return best.c;
  return contrast('#ffffff', fill) >= contrast('#111111', fill) ? '#ffffff' : '#111111';
}

export type ToneColors = {
  bg: string;
  ink: string;
  soft: string;
  line: string;
  line2: string;
  surf: string;
  /** A lifted surface for raised cards and floating bars. */
  raise: string;
  acc: string;
  accInk: string;
  accText: string;
  acc2: string;
  acc2Text: string;
};

function buildTone(bg: string, inkWanted: string, accent: string, accent2: string, surfWanted?: string): ToneColors {
  const ink = ensureContrast(inkWanted, bg, 7);
  const acc = contrast(accent, bg) >= 1.5 ? accent : ink;
  const surf = surfWanted && contrast(surfWanted, ink) >= 4.5 ? surfWanted : mix(bg, ink, 0.06);
  return {
    bg,
    ink,
    soft: mix(ink, bg, 0.32),
    line: mix(bg, ink, 0.14),
    line2: mix(bg, ink, 0.3),
    surf,
    raise: luminance(bg) > 0.2 ? mix(bg, '#ffffff', 0.72) : mix(bg, '#ffffff', 0.08),
    acc,
    accInk: onColor(acc, [ink, bg]),
    accText: ensureContrast(accent, bg, 3.6),
    acc2: accent2,
    acc2Text: ensureContrast(accent2, bg, 3.2),
  };
}

export const toneVars = (t: ToneColors): CSSProperties =>
  ({
    '--sbg': t.bg,
    '--sink': t.ink,
    '--ssoft': t.soft,
    '--sline': t.line,
    '--sline2': t.line2,
    '--ssurf': t.surf,
    '--sraise': t.raise,
    '--sacc': t.acc,
    '--sacc-ink': t.accInk,
    '--sacc-text': t.accText,
    '--sacc2': t.acc2,
    '--sacc2-text': t.acc2Text,
  }) as CSSProperties;

export type Resolved = {
  preset: Theme['preset'];
  palette: Palette;
  fonts: { display: FontId; body: FontId };
  traits: Traits;
  radius: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  density: 'tight' | 'regular' | 'airy';
  scale: 'compact' | 'regular' | 'dramatic';
  imageStyle: string;
  isDark: boolean;
  tones: Record<Tone, ToneColors>;
  /** Fixed dark scheme for sections whose backdrop is a photo. */
  cover: ToneColors;
  vars: CSSProperties;
  attrs: Record<string, string>;
  fontLinks: string[];
};

const defined = <T extends object>(o: T): Partial<T> =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null)) as Partial<T>;

const RADIUS = { none: 0, sm: 6, md: 12, lg: 20, xl: 28 };
const SCALE = { compact: [0.84, 0.9], regular: [1, 1], dramatic: [1.2, 1.1] };
const DENSITY = { tight: 0.72, regular: 1, airy: 1.28 };

export function resolveTheme(theme: Theme): Resolved {
  const p = PRESET_DEFS[theme.preset];
  const palette: Palette = { ...p.palette, ...defined(theme.palette) };
  const fonts = { display: theme.fonts.display ?? p.fonts.display, body: theme.fonts.body ?? p.fonts.body };
  const traits: Traits = { ...p.traits, ...defined(theme.traits) };
  const radius = theme.radius ?? p.radius;
  const density = theme.density ?? p.density;
  const scale = theme.scale ?? p.scale;

  const base = buildTone(palette.bg, palette.ink, palette.accent, palette.accent2, palette.surface);
  const muted = buildTone(base.surf, palette.ink, palette.accent, palette.accent2, palette.bg);

  const invBg = base.ink;
  const invAccent =
    [palette.accent, palette.accent2].find((c) => contrast(c, invBg) >= 2.4) ?? ensureContrast(palette.accent, invBg, 3);
  const inverse = buildTone(invBg, palette.bg, invAccent, palette.accent2, mix(invBg, palette.bg, 0.1));

  const accBg = palette.accent;
  const accInk = onColor(accBg, [palette.ink, palette.bg]);
  const accent: ToneColors = {
    bg: accBg,
    ink: accInk,
    soft: mix(accInk, accBg, 0.18),
    line: mix(accBg, accInk, 0.2),
    line2: mix(accBg, accInk, 0.4),
    surf: mix(accBg, accInk, 0.1),
    raise: mix(accBg, accInk, 0.14),
    acc: accInk,
    accInk: accBg,
    accText: accInk,
    acc2: contrast(palette.accent2, accBg) >= 1.8 ? palette.accent2 : accInk,
    acc2Text: accInk,
  };

  const coverBg = '#0e0e0e';
  const cover: ToneColors = {
    ...buildTone(coverBg, '#ffffff', palette.accent, palette.accent2, mix(coverBg, '#ffffff', 0.14)),
    acc: '#ffffff',
    accInk: '#111111',
    accText: '#ffffff',
    soft: '#e4e4e4',
  };

  const isDark = luminance(base.bg) < 0.2;
  const display = FONTS[fonts.display];
  const body = FONTS[fonts.body];
  const r = RADIUS[radius];
  const [k1, k2] = SCALE[scale];
  const caps = traits.caps;
  const quoteInDisplay = display.weight <= 500 && !['anton', 'archivo-black', 'dm-serif'].includes(fonts.display);

  const vars = {
    '--page-bg': base.bg,
    '--page-ink': base.ink,
    '--font-display': display.css,
    '--font-body': body.css,
    '--font-mono': `'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace`,
    '--hw': String(display.weight),
    // Long quotes are set in the display face only when it is light enough to read at length.
    '--font-quote': quoteInDisplay ? display.css : body.css,
    '--quote-w': String(quoteInDisplay ? display.weight : 500),
    '--htrack': caps ? '-0.012em' : display.tracking,
    '--hlead': String(caps ? Math.min(display.leading, 0.98) : display.leading),
    '--hcase': caps ? 'uppercase' : 'none',
    '--dk': String(caps ? display.adjust * 0.9 : display.adjust),
    '--k1': String(k1),
    '--k2': String(k2),
    '--dn': String(DENSITY[density]),
    '--r': `${r}px`,
    '--r-sm': `${Math.round(r * 0.5)}px`,
    '--r-lg': `${Math.round(r * 1.4)}px`,
    '--r-btn': `${Math.min(r, 14)}px`,
    '--shadow': isDark
      ? '0 0 0 1px rgba(255,255,255,.07), 0 22px 44px -22px rgba(0,0,0,.8)'
      : '0 1px 2px rgba(24,18,8,.06), 0 16px 36px -16px rgba(24,18,8,.24)',
  } as CSSProperties;

  const attrs = {
    'data-button': traits.button,
    'data-emphasis': traits.emphasis,
    'data-motif': traits.motif,
    'data-image': traits.image,
    'data-eyebrow': traits.eyebrow,
    'data-dark': String(isDark),
  };

  const families = new Set([display.google, body.google]);
  if (traits.eyebrow === 'mono') families.add(FONTS['jetbrains-mono'].google);
  const fontLinks = [...families].map((f) => `https://fonts.googleapis.com/css2?family=${f}&display=swap`);

  return {
    preset: theme.preset,
    palette,
    fonts,
    traits,
    radius,
    density,
    scale,
    imageStyle: theme.imageStyle ?? p.imageStyle,
    isDark,
    tones: { base, muted, inverse, accent },
    cover,
    vars,
    attrs,
    fontLinks,
  };
}
