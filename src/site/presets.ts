// Presets are bundles of defaults, nothing more. The renderer only ever sees the
// resolved traits and tokens, so a preset plus overrides is still one coherent look.

import type { FontId, Preset } from './vocab';

export type FontDef = {
  label: string;
  css: string;
  /** Google Fonts css2 family spec. */
  google: string;
  /** How this face wants to be set as a heading. */
  weight: number;
  tracking: string;
  leading: number;
  /** Optical size correction so different faces look the same size. */
  adjust: number;
};

const sans = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const serif = 'ui-serif, Georgia, "Times New Roman", serif';

export const FONTS: Record<FontId, FontDef> = {
  fraunces: { label: 'Fraunces', css: `'Fraunces', ${serif}`, google: 'Fraunces:ital,opsz,wght@0,9..144,300..800;1,9..144,300..800', weight: 400, tracking: '-0.028em', leading: 1.02, adjust: 1 },
  'instrument-serif': { label: 'Instrument Serif', css: `'Instrument Serif', ${serif}`, google: 'Instrument+Serif:ital@0;1', weight: 400, tracking: '-0.02em', leading: 1, adjust: 1.14 },
  playfair: { label: 'Playfair Display', css: `'Playfair Display', ${serif}`, google: 'Playfair+Display:ital,wght@0,400..900;1,400..900', weight: 500, tracking: '-0.02em', leading: 1.06, adjust: 0.98 },
  newsreader: { label: 'Newsreader', css: `'Newsreader', ${serif}`, google: 'Newsreader:ital,opsz,wght@0,6..72,300..700;1,6..72,300..700', weight: 400, tracking: '-0.025em', leading: 1.04, adjust: 1.06 },
  'dm-serif': { label: 'DM Serif Display', css: `'DM Serif Display', ${serif}`, google: 'DM+Serif+Display:ital@0;1', weight: 400, tracking: '-0.012em', leading: 1.05, adjust: 1 },
  'source-serif': { label: 'Source Serif', css: `'Source Serif 4', ${serif}`, google: 'Source+Serif+4:ital,opsz,wght@0,8..60,400..700;1,8..60,400..700', weight: 500, tracking: '-0.02em', leading: 1.08, adjust: 1 },
  bricolage: { label: 'Bricolage Grotesque', css: `'Bricolage Grotesque', ${sans}`, google: 'Bricolage+Grotesque:opsz,wght@12..96,300..800', weight: 700, tracking: '-0.04em', leading: 1, adjust: 1 },
  'space-grotesk': { label: 'Space Grotesk', css: `'Space Grotesk', ${sans}`, google: 'Space+Grotesk:wght@300..700', weight: 500, tracking: '-0.04em', leading: 1.02, adjust: 0.98 },
  sora: { label: 'Sora', css: `'Sora', ${sans}`, google: 'Sora:wght@300..800', weight: 600, tracking: '-0.04em', leading: 1.06, adjust: 0.9 },
  syne: { label: 'Syne', css: `'Syne', ${sans}`, google: 'Syne:wght@400..800', weight: 700, tracking: '-0.035em', leading: 1, adjust: 0.98 },
  unbounded: { label: 'Unbounded', css: `'Unbounded', ${sans}`, google: 'Unbounded:wght@300..900', weight: 700, tracking: '-0.035em', leading: 1.06, adjust: 0.76 },
  'archivo-black': { label: 'Archivo Black', css: `'Archivo Black', ${sans}`, google: 'Archivo+Black', weight: 400, tracking: '-0.025em', leading: 0.98, adjust: 0.9 },
  anton: { label: 'Anton', css: `'Anton', ${sans}`, google: 'Anton', weight: 400, tracking: '0.004em', leading: 0.98, adjust: 1.18 },
  'inter-tight': { label: 'Inter Tight', css: `'Inter Tight', ${sans}`, google: 'Inter+Tight:wght@400..800', weight: 600, tracking: '-0.035em', leading: 1.02, adjust: 1 },
  inter: { label: 'Inter', css: `'Inter', ${sans}`, google: 'Inter:wght@400..700', weight: 600, tracking: '-0.035em', leading: 1.05, adjust: 0.96 },
  'dm-sans': { label: 'DM Sans', css: `'DM Sans', ${sans}`, google: 'DM+Sans:opsz,wght@9..40,400..700', weight: 600, tracking: '-0.035em', leading: 1.04, adjust: 1 },
  manrope: { label: 'Manrope', css: `'Manrope', ${sans}`, google: 'Manrope:wght@400..800', weight: 700, tracking: '-0.035em', leading: 1.06, adjust: 0.96 },
  figtree: { label: 'Figtree', css: `'Figtree', ${sans}`, google: 'Figtree:wght@400..800', weight: 700, tracking: '-0.03em', leading: 1.04, adjust: 1 },
  geist: { label: 'Geist', css: `'Geist', ${sans}`, google: 'Geist:wght@400..700', weight: 600, tracking: '-0.04em', leading: 1.04, adjust: 0.98 },
  'ibm-plex-sans': { label: 'IBM Plex Sans', css: `'IBM Plex Sans', ${sans}`, google: 'IBM+Plex+Sans:wght@400;500;600;700', weight: 600, tracking: '-0.025em', leading: 1.08, adjust: 0.96 },
  'jetbrains-mono': { label: 'JetBrains Mono', css: `'JetBrains Mono', ui-monospace, monospace`, google: 'JetBrains+Mono:wght@400..700', weight: 600, tracking: '-0.05em', leading: 1.08, adjust: 0.84 },
};

export type Palette = { bg: string; surface: string; ink: string; accent: string; accent2: string };

export type Traits = {
  card: 'plain' | 'outline' | 'raised' | 'tinted' | 'hard';
  button: 'solid' | 'pill' | 'hard' | 'underline';
  emphasis: 'italic' | 'highlight' | 'gradient' | 'underline' | 'outline';
  divider: 'wave' | 'curve' | 'slant' | 'zigzag' | 'scallop' | 'line';
  motif: 'none' | 'grid' | 'dots' | 'lines' | 'rings' | 'blobs' | 'grain';
  image: 'plain' | 'rounded' | 'arch' | 'blob' | 'tilt' | 'frame';
  eyebrow: 'caps' | 'pill' | 'mono' | 'rule' | 'number';
  caps: boolean;
};

export type PresetDef = {
  label: string;
  blurb: string;
  palette: Palette;
  fonts: { display: FontId; body: FontId };
  radius: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  density: 'tight' | 'regular' | 'airy';
  scale: 'compact' | 'regular' | 'dramatic';
  traits: Traits;
  imageStyle: string;
};

export const PRESET_DEFS: Record<Preset, PresetDef> = {
  editorial: {
    label: 'Editorial',
    blurb: 'Serif headlines, hairlines, lots of air',
    palette: { bg: '#f4efe6', surface: '#e9e2d3', ink: '#1b1915', accent: '#b4532a', accent2: '#2e4b3c' },
    fonts: { display: 'fraunces', body: 'inter' },
    radius: 'none',
    density: 'airy',
    scale: 'dramatic',
    traits: { card: 'plain', button: 'solid', emphasis: 'italic', divider: 'line', motif: 'grain', image: 'plain', eyebrow: 'number', caps: false },
    imageStyle: 'Editorial film photography, soft natural window light, shallow depth of field, muted earthy colours, calm and unstaged',
  },
  soft: {
    label: 'Soft',
    blurb: 'Rounded, friendly, colour washes',
    palette: { bg: '#fff9f1', surface: '#fdecd8', ink: '#2a2233', accent: '#ff6b4a', accent2: '#7c5cff' },
    fonts: { display: 'bricolage', body: 'dm-sans' },
    radius: 'xl',
    density: 'regular',
    scale: 'regular',
    traits: { card: 'tinted', button: 'pill', emphasis: 'highlight', divider: 'wave', motif: 'blobs', image: 'rounded', eyebrow: 'pill', caps: false },
    imageStyle: 'Bright, friendly lifestyle photography, soft daylight, pastel backdrop, gentle shadows, candid and warm',
  },
  technical: {
    label: 'Technical',
    blurb: 'Dark, precise, grid and mono details',
    palette: { bg: '#0a0c10', surface: '#131820', ink: '#e9edf3', accent: '#7cf2a4', accent2: '#5bb8ff' },
    fonts: { display: 'space-grotesk', body: 'inter' },
    radius: 'sm',
    density: 'regular',
    scale: 'regular',
    traits: { card: 'outline', button: 'solid', emphasis: 'gradient', divider: 'line', motif: 'grid', image: 'frame', eyebrow: 'mono', caps: false },
    imageStyle: 'Clean dark-mode product visualisation, abstract 3D render, soft rim lighting, deep charcoal background with one glowing accent colour',
  },
  bold: {
    label: 'Bold',
    blurb: 'Heavy type, hard edges, loud colour',
    palette: { bg: '#f3eee2', surface: '#ffd84a', ink: '#0e0e0e', accent: '#ff4b1f', accent2: '#2b4bff' },
    fonts: { display: 'archivo-black', body: 'figtree' },
    radius: 'sm',
    density: 'tight',
    scale: 'dramatic',
    traits: { card: 'hard', button: 'hard', emphasis: 'highlight', divider: 'zigzag', motif: 'dots', image: 'tilt', eyebrow: 'caps', caps: true },
    imageStyle: 'Punchy studio photography with hard flash, saturated solid colour backdrop, high contrast, playful props',
  },
};
