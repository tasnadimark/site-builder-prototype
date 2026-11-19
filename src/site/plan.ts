// Render-time guardrails. The document can ask for any combination of options; this
// works out what is actually drawn so that no combination looks broken. The stored
// document is never changed, so a choice that is ignored now (overlap with nothing to
// overlap, say) starts working the moment its precondition is met.

import type { Block, Section } from './schema';
import type { Resolved } from './theme';
import { VARIANTS, type Backdrop, type HeroStyle, type LayoutKind, type Size, type Tone, type VariantFamily } from './vocab';

type RowBlock = Extract<Block, { kind: 'row' }>;

/**
 * What a layout arranges. Usually one block is one item, but neighbouring rows that
 * share a group (a price category, a day in a timetable) are laid out as a single item.
 */
export type Item =
  | { kind: 'block'; block: Exclude<Block, RowBlock>; index: number; size: Size }
  | { kind: 'rows'; group?: string; rows: { block: RowBlock; index: number }[]; index: number; size: Size };

export function layoutItems(blocks: Block[]): Item[] {
  const items: Item[] = [];
  blocks.forEach((block, index) => {
    if (block.kind !== 'row') return void items.push({ kind: 'block', block, index, size: block.size });
    const last = items[items.length - 1];
    if (last?.kind === 'rows' && (last.group ?? '') === (block.group ?? '')) last.rows.push({ block, index });
    else items.push({ kind: 'rows', group: block.group, rows: [{ block, index }], index, size: block.size });
  });
  return items;
}

export const itemKind = (item: Item) => (item.kind === 'rows' ? 'rows' : item.block.kind);

export type EffectiveEdge = 'none' | 'divider' | 'rule' | 'overlap' | 'fade';

/**
 * The hero style that will actually be drawn. A style that needs something the section
 * does not have (a picture, a short heading) falls back to the nearest one that works.
 */
export function heroStyle(s: Section): { style: HeroStyle; note?: string } {
  if (s.type !== 'hero' || s.hero === 'standard') return { style: 'standard' };
  const heading = (s.intro.heading ?? '').replace(/\*/g, '');
  if (!heading) return { style: 'standard', note: 'This hero style needs a heading.' };
  if (s.hero !== 'ticker' && !s.media) return { style: 'standard', note: 'This hero style needs a section picture.' };
  if (s.hero === 'wordmark' && heading.length > 22) return { style: 'overlap', note: 'Wordmark suits one or two words. Showing the overlap style for this longer heading.' };
  return { style: s.hero };
}

/** What the planner needs to know beyond the sections themselves. */
export type PlanFacts = {
  /** The business has a review score. */
  rating: boolean;
  /** The business has a phone number or opening hours. */
  contact: boolean;
  /** These are the sections of a page other than Home. */
  inner: boolean;
};
const NO_FACTS: PlanFacts = { rating: false, contact: false, inner: false };

type CardBlock = Extract<Block, { kind: 'card' }>;

/** Which family of arrangements a section belongs to, if any. */
export function variantFamily(s: Section, index: number, inner: boolean): VariantFamily | null {
  // The first section of an inner page is its title, whatever type an older document gave it.
  if (s.type === 'title' || (inner && index === 0 && s.type !== 'hero' && s.blocks.length === 0)) return 'title';
  if (s.type === 'cta') return 'cta';
  const kinds = s.blocks.map((b) => b.kind);
  if (s.type === 'features' && kinds.length >= 2 && kinds.every((k) => k === 'card')) return 'features';
  if (s.type === 'testimonials' && kinds.includes('quote') && kinds.every((k) => k === 'quote' || k === 'rating')) return 'testimonials';
  return null;
}

/**
 * The arrangement that will actually be drawn. One that needs something the section or
 * the business does not have falls back to the plain one, with a note saying why.
 */
export function variantOf(s: Section, index: number, facts: PlanFacts): { family: VariantFamily; variant: string; note?: string } | null {
  const family = variantFamily(s, index, facts.inner);
  if (!family) return null;
  const list: readonly string[] = VARIANTS[family];
  const asked = s.variant && list.includes(s.variant) ? s.variant : list[0];
  const plain = (note: string) => ({ family, variant: list[0], note });
  const cards = s.blocks.filter((b): b is CardBlock => b.kind === 'card');
  const quotes = s.blocks.filter((b) => b.kind === 'quote').length;

  if (asked === 'picture' && !s.media) return plain('This arrangement needs a section picture.');
  if (family === 'cta' && asked === 'facts' && !facts.contact) return plain('This arrangement shows the phone number and opening hours. Add them in the Business tab.');
  if (family === 'title' && asked === 'facts' && !s.blocks.length) return plain('This arrangement needs two or three blocks to show beside the title.');
  if (asked === 'rows' && cards.filter((c) => c.image).length < 2) return plain('Picture rows need at least two cards with a picture.');
  if (asked === 'lead' && cards.length < 3) return plain('This arrangement needs at least three cards.');
  if (asked === 'score' && !facts.rating) return plain('This arrangement needs a review score in the Business tab.');
  if (asked === 'wall' && quotes < 3) return plain('A wall needs at least three reviews.');
  return { family, variant: asked };
}

/** The layout an arrangement brings with it. The plain ones keep whatever the section asked for. */
const VARIANT_LAYOUT: Record<string, LayoutKind> = {
  'cta/facts': 'stack',
  'cta/statement': 'stack',
  'cta/picture': 'split',
  'title/picture': 'stack',
  'title/facts': 'split',
  'title/links': 'stack',
  'features/list': 'grid',
  'features/rows': 'grid',
  'features/lead': 'grid',
  'testimonials/single': 'grid',
  'testimonials/score': 'grid',
  'testimonials/wall': 'grid',
};

export type Effective = {
  /** How the first screen is composed. Always "standard" for sections that are not heroes. */
  hero: HeroStyle;
  /** The family of arrangements this section belongs to, and the one drawn. */
  family: VariantFamily | null;
  variant: string | null;
  layout: LayoutKind;
  cols: number;
  edge: EffectiveEdge;
  backdrop: Backdrop;
  /** The section's photo is used as a full-bleed background. */
  cover: boolean;
  mediaInFlow: boolean;
  /** Which element straddles the boundary when the edge is "overlap". */
  overlapTarget: 'blocks' | 'media' | null;
  /** Blocks must have a solid surface (bento cells, or cards that straddle two tones). */
  solid: boolean;
  bg: string;
  nextBg: string;
  /** Requested options that were ignored, for the inspector to explain. */
  notes: string[];
};

export function planSections(sections: Section[], theme: Resolved, footerTone: Tone, facts: PlanFacts = NO_FACTS): Effective[] {
  const variants = sections.map((s, i) => variantOf(s, i, facts));
  // The picture fills the whole section behind the text: asked for directly, or implied by
  // the ticker style or by a page title set on a picture.
  const covers = sections.map((s, i) => {
    const hero = heroStyle(s).style;
    if (hero === 'ticker') return !!s.media;
    if (variants[i]?.family === 'title' && variants[i]?.variant === 'picture') return true;
    return hero === 'standard' && s.backdrop === 'media' && !!s.media;
  });
  const bgOf = (i: number) => {
    const s = sections[i];
    if (!s) return theme.tones[footerTone].bg;
    return covers[i] ? theme.cover.bg : theme.tones[s.tone].bg;
  };

  return sections.map((s, i) => {
    const notes: string[] = [];
    const items = layoutItems(s.blocks);
    const n = items.length;
    const cover = covers[i];
    const v = variants[i];
    if (v?.note) notes.push(v.note);
    const mediaInFlow = !!s.media && !cover;
    const bg = bgOf(i);
    const nextBg = bgOf(i + 1);
    const nextCover = !!covers[i + 1];

    const { style: hero, note: heroNote } = heroStyle(s);
    if (heroNote) notes.push(heroNote);

    let backdrop: Backdrop = cover ? 'media' : s.backdrop;
    if (backdrop === 'media' && !cover) {
      backdrop = 'none';
      if (hero === 'standard') notes.push('Photo backdrop needs a section image.');
    }
    if (backdrop === 'motif' && theme.traits.motif === 'none') backdrop = 'glow';

    let layout: LayoutKind = s.layout.kind;
    // A composed hero places its own picture; its blocks sit under the copy like a split's.
    if (hero !== 'standard') layout = 'split';
    if (hero === 'standard' && layout === 'split' && !mediaInFlow && n === 0) layout = 'stack';
    if ((layout === 'bento' || layout === 'marquee') && n < 3) {
      notes.push(`${layout === 'bento' ? 'Bento' : 'Marquee'} needs at least 3 blocks, showing a grid.`);
      layout = 'grid';
    }
    if (layout === 'grid' && n === 0) layout = 'stack';
    if (v) layout = VARIANT_LAYOUT[`${v.family}/${v.variant}`] ?? layout;

    const allOf = (kinds: string[]) => n > 0 && items.every((it) => kinds.includes(itemKind(it)));
    let cols = s.layout.columns;
    if (layout === 'grid') {
      cols = Math.min(cols, Math.max(n, 1));
      // Avoid a single orphan on the last row.
      if (cols > 2 && n > cols && n <= cols * 2 && n % cols === 1) cols -= 1;
    } else if (layout === 'bento') {
      cols = Math.max(3, cols);
    } else if (layout === 'split') {
      if (mediaInFlow || hero !== 'standard') cols = allOf(['stat', 'logo']) ? Math.min(n, 3) : 1;
      // Beside the intro, blocks read as a list unless two columns were asked for explicitly.
      else cols = cols === 2 && n >= 4 ? 2 : 1;
    } else {
      cols = 1;
    }
    // An arrangement sets its own columns: a list or rows run down the page, a lead card
    // sits beside the rest, a wall of reviews takes two or three columns.
    if (v?.family === 'features' && v.variant !== 'cards') cols = v.variant === 'lead' ? 2 : 1;
    if (v?.family === 'testimonials' && v.variant !== 'cards') cols = v.variant === 'wall' ? (n >= 5 ? 3 : 2) : v.variant === 'single' ? 2 : 1;

    // Left on "auto", a section takes its edge from the theme: a divider nowhere, around
    // the strong sections, or wherever the colour changes. Set by hand, it is an exception.
    const auto = s.edge === 'auto';
    const strong = (t: Tone) => t === 'inverse' || t === 'accent';
    const rhythm = theme.traits.edges;
    const wanted = rhythm === 'every' || (rhythm === 'strong' && (strong(s.tone) || strong(sections[i + 1]?.tone ?? footerTone)));
    let edge: EffectiveEdge = s.edge === 'auto' ? (wanted && bg !== nextBg ? 'divider' : 'none') : s.edge;
    let overlapTarget: Effective['overlapTarget'] = null;
    // These styles already end in something that runs edge to edge (a link bar, a moving line, a picture).
    if (hero === 'wordmark' || hero === 'ticker' || hero === 'edge') edge = 'none';
    if (edge !== 'none' && nextCover) {
      edge = 'none';
      if (!auto) notes.push('Edges are skipped before a photo-backed section.');
    }
    if (edge === 'overlap') {
      if (!cover && (layout === 'grid' || layout === 'bento') && n > 0) overlapTarget = 'blocks';
      else if (!cover && layout === 'stack' && mediaInFlow && n === 0) overlapTarget = 'media';
      if (!overlapTarget) {
        edge = 'none';
        notes.push('Overlap needs a grid or bento of blocks, or a stacked image.');
      } else if (bg === nextBg) {
        edge = 'none';
        overlapTarget = null;
        notes.push('Overlap only shows between two different tones.');
      }
    }
    // A straight-line divider between two tones is just the boundary itself.
    if (edge === 'divider' && theme.traits.divider === 'line' && bg !== nextBg) edge = 'none';
    if (edge === 'divider' && bg === nextBg) edge = 'rule';
    if (edge === 'fade' && bg === nextBg) edge = 'none';

    return {
      hero,
      family: v?.family ?? null,
      variant: v?.variant ?? null,
      layout,
      cols,
      edge,
      backdrop,
      cover,
      mediaInFlow,
      overlapTarget,
      solid: layout === 'bento' || overlapTarget === 'blocks',
      bg,
      nextBg,
      notes,
    };
  });
}

// ---------------------------------------------------------------- bento packing

export type Cell = { col: number; row: number; w: number; h: number };

const SPAN: Record<Size, [number, number]> = { sm: [1, 1], wide: [2, 1], tall: [1, 2], feature: [2, 2] };

/**
 * Place blocks on a grid from their size hints, then close any gaps by stretching a
 * neighbour. If an unusual mix of sizes still leaves a gap, the tall sizes are flattened
 * and the blocks are packed again, which always tiles. The result is a full rectangle
 * whatever sizes were asked for. "stretchy" marks the blocks that look right at any
 * shape (pictures); where there is a choice, they are the ones stretched.
 */
export function packBento(sizes: Size[], cols: number, stretchy: boolean[] = []): Cell[] {
  const first = pack(sizes.map((s) => SPAN[s]), cols, stretchy);
  if (!first.gaps) return first.cells;
  return pack(sizes.map((s) => [SPAN[s][0], 1] as [number, number]), cols, stretchy).cells;
}

function pack(spans: [number, number][], cols: number, stretchy: boolean[]): { cells: Cell[]; gaps: number } {
  const grid: number[][] = [];
  const at = (r: number, c: number) => grid[r]?.[c] ?? -1;
  const mark = (cell: Cell, i: number) => {
    for (let r = cell.row; r < cell.row + cell.h; r++) {
      grid[r] ??= Array(cols).fill(-1);
      for (let c = cell.col; c < cell.col + cell.w; c++) grid[r][c] = i;
    }
  };
  const fits = (r: number, c: number, w: number, h: number) => {
    if (c + w > cols) return false;
    for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) if (at(y, x) !== -1) return false;
    return true;
  };

  const cells: Cell[] = spans.map(([sw, h], i) => {
    const w = Math.min(sw, cols);
    for (let r = 0; ; r++) {
      for (let c = 0; c < cols; c++) {
        if (fits(r, c, w, h)) {
          const cell = { col: c, row: r, w, h };
          mark(cell, i);
          return cell;
        }
      }
    }
  });

  const rows = grid.length;
  for (let r = 0; r < rows; r++) grid[r] ??= Array(cols).fill(-1);
  const columnFree = (cell: Cell, col: number) => {
    for (let y = cell.row; y < cell.row + cell.h; y++) if (grid[y][col] !== -1) return false;
    return true;
  };

  for (let pass = 0; pass < rows * cols; pass++) {
    let changed = false;
    for (let r = 0; r < rows && !changed; r++) {
      for (let c = 0; c < cols && !changed; c++) {
        if (grid[r][c] !== -1) continue;
        const left = c > 0 ? grid[r][c - 1] : -1;
        const up = r > 0 ? grid[r - 1][c] : -1;
        const right = c < cols - 1 ? grid[r][c + 1] : -1;
        const canLeft = left !== -1 && columnFree(cells[left], c);
        const canRight = right !== -1 && columnFree(cells[right], c);
        let canUp = up !== -1;
        if (canUp) for (let x = cells[up].col; x < cells[up].col + cells[up].w; x++) if (grid[r][x] !== -1) canUp = false;
        // A one-row card stretched across every column reads as an empty bar, so it is the last resort.
        const bar = (i: number) => cols > 2 && cells[i].h === 1 && cells[i].w + 1 >= cols;
        const growLeft = () => {
          cells[left].w += 1;
          mark(cells[left], left);
        };
        const growRight = () => {
          cells[right].col -= 1;
          cells[right].w += 1;
          mark(cells[right], right);
        };
        const growUp = () => {
          cells[up].h += 1;
          mark(cells[up], up);
        };
        const options: { i: number; grow: () => void; bar: boolean }[] = [];
        if (canLeft) options.push({ i: left, grow: growLeft, bar: bar(left) });
        if (canRight) options.push({ i: right, grow: growRight, bar: bar(right) });
        if (canUp) options.push({ i: up, grow: growUp, bar: false });
        if (!options.length) continue;
        // Never a bar if anything else works; among the rest, a picture before a text tile.
        const cost = (o: (typeof options)[number]) => (o.bar ? 2 : 0) + (stretchy[o.i] ? 0 : 1);
        options.reduce((best, o) => (cost(o) < cost(best) ? o : best)).grow();
        changed = true;
      }
    }
    if (!changed) break;
  }
  return { cells, gaps: grid.flat().filter((v) => v === -1).length };
}
