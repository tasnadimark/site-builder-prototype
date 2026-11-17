// The whole design vocabulary in one place. The schema, the renderer, the inspector
// and the AI prompt are all built from these lists, so adding an option here is the
// only step needed to make it available everywhere.

export const PRESETS = ['editorial', 'soft', 'technical', 'bold'] as const;

export const TONES = ['base', 'muted', 'inverse', 'accent'] as const;
export const EDGES = ['none', 'divider', 'overlap', 'fade'] as const;
export const BACKDROPS = ['none', 'motif', 'glow', 'media'] as const;
export const PADS = ['sm', 'md', 'lg'] as const;

export const LAYOUTS = ['stack', 'split', 'grid', 'bento', 'marquee'] as const;
export const RATIOS = ['even', 'media', 'text'] as const;
export const WIDTHS = ['narrow', 'normal', 'wide'] as const;
export const ALIGNS = ['start', 'center', 'split'] as const;

export const SECTION_TYPES = [
  'hero',
  'logos',
  'features',
  'steps',
  'story',
  'stats',
  'testimonials',
  'pricing',
  'faq',
  'gallery',
  'cta',
  'prices',
  'timetable',
  'team',
  'contact',
] as const;

export const BLOCK_KINDS = [
  'card', 'stat', 'quote', 'image', 'plan', 'qa', 'step', 'logo',
  // Added for local service businesses. Each is general on purpose: a "row" is a price,
  // a menu line, a class in a timetable or a line of opening hours.
  'row', 'person', 'contact', 'form', 'rating', 'check',
] as const;

/**
 * What a page is for. Every site is built from these roles; the kind of business decides
 * which of them get a page of their own and which stay a section on Home.
 */
export const PAGE_ROLES = ['home', 'offer', 'approach', 'proof', 'people', 'contact', 'location'] as const;

export const LANGUAGES = ['en', 'hu'] as const;
export const SOCIALS = ['facebook', 'instagram', 'tiktok', 'youtube', 'linkedin'] as const;
export const FORM_FIELDS = ['name', 'email', 'phone', 'service', 'date', 'message'] as const;
export const SIZES = ['sm', 'wide', 'tall', 'feature'] as const;
export const ASPECTS = ['wide', 'landscape', 'square', 'portrait'] as const;

export const CARD_STYLES = ['plain', 'outline', 'raised', 'tinted', 'hard'] as const;
export const BUTTON_STYLES = ['solid', 'pill', 'hard', 'underline'] as const;
export const EMPHASIS = ['italic', 'highlight', 'gradient', 'underline', 'outline'] as const;
export const DIVIDERS = ['wave', 'curve', 'slant', 'zigzag', 'scallop', 'line'] as const;
export const MOTIFS = ['none', 'grid', 'dots', 'lines', 'rings', 'blobs', 'grain'] as const;
export const IMAGE_SHAPES = ['plain', 'rounded', 'arch', 'blob', 'tilt', 'frame'] as const;
export const EYEBROWS = ['caps', 'pill', 'mono', 'rule', 'number'] as const;

export const RADII = ['none', 'sm', 'md', 'lg', 'xl'] as const;
export const DENSITIES = ['tight', 'regular', 'airy'] as const;
export const SCALES = ['compact', 'regular', 'dramatic'] as const;

export const NAV_STYLES = ['minimal', 'bar', 'floating'] as const;
export const FOOTER_STYLES = ['columns', 'minimal', 'big'] as const;

export const ICONS = [
  'sparkles', 'leaf', 'coffee', 'truck', 'clock', 'shield', 'heart', 'star', 'zap', 'globe',
  'users', 'chart', 'calendar', 'package', 'flame', 'droplet', 'sun', 'moon', 'map-pin', 'phone',
  'mail', 'credit-card', 'lock', 'code', 'cpu', 'layers', 'wand', 'camera', 'music', 'book',
  'gift', 'award', 'target', 'rocket', 'smile', 'check', 'refresh', 'scissors', 'home', 'wrench',
] as const;

export const FONT_IDS = [
  'fraunces', 'instrument-serif', 'playfair', 'newsreader', 'dm-serif', 'source-serif',
  'bricolage', 'space-grotesk', 'sora', 'syne', 'unbounded', 'archivo-black', 'anton',
  'inter-tight', 'inter', 'dm-sans', 'manrope', 'figtree', 'geist', 'ibm-plex-sans', 'jetbrains-mono',
] as const;

export type Preset = (typeof PRESETS)[number];
export type Tone = (typeof TONES)[number];
export type Edge = (typeof EDGES)[number];
export type Backdrop = (typeof BACKDROPS)[number];
export type LayoutKind = (typeof LAYOUTS)[number];
export type Size = (typeof SIZES)[number];
export type Aspect = (typeof ASPECTS)[number];
export type IconName = (typeof ICONS)[number];
export type FontId = (typeof FONT_IDS)[number];
export type Divider = (typeof DIVIDERS)[number];
export type PageRole = (typeof PAGE_ROLES)[number];
export type Language = (typeof LANGUAGES)[number];
export type FormField = (typeof FORM_FIELDS)[number];
