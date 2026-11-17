// Render-time guardrails. The document can ask for any combination of options; this
// works out what is actually drawn so that no combination looks broken. The stored
// document is never changed, so a choice that is ignored now (overlap with nothing to
// overlap, say) starts working the moment its precondition is met.

import type { Section, SiteDoc } from './schema';
import type { Resolved } from './theme';
import type { Backdrop, LayoutKind, Size } from './vocab';

export type EffectiveEdge = 'none' | 'divider' | 'rule' | 'overlap' | 'fade';

export type Effective = {
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

export function planSections(doc: SiteDoc, theme: Resolved): Effective[] {
  const { sections } = doc;
  const isCover = (s: Section) => s.backdrop === 'media' && !!s.media;
  const bgOf = (i: number) => {
    const s = sections[i];
    if (!s) return theme.tones[doc.footer.tone].bg;
    return isCover(s) ? theme.cover.bg : theme.tones[s.tone].bg;
  };

  return sections.map((s, i) => {
    const notes: string[] = [];
    const n = s.blocks.length;
    const cover = isCover(s);
    const mediaInFlow = !!s.media && !cover;
    const bg = bgOf(i);
    const nextBg = bgOf(i + 1);
    const nextCover = !!sections[i + 1] && isCover(sections[i + 1]);

    let backdrop: Backdrop = s.backdrop;
    if (backdrop === 'media' && !cover) {
      backdrop = 'none';
      notes.push('Photo backdrop needs a section image.');
    }
    if (backdrop === 'motif' && theme.traits.motif === 'none') backdrop = 'glow';

    let layout: LayoutKind = s.layout.kind;
    if (layout === 'split' && !mediaInFlow && n === 0) layout = 'stack';
    if ((layout === 'bento' || layout === 'marquee') && n < 3) {
      notes.push(`${layout === 'bento' ? 'Bento' : 'Marquee'} needs at least 3 blocks, showing a grid.`);
      layout = 'grid';
    }
    if (layout === 'grid' && n === 0) layout = 'stack';

    const allOf = (kinds: string[]) => n > 0 && s.blocks.every((b) => kinds.includes(b.kind));
    let cols = s.layout.columns;
    if (layout === 'grid') {
      cols = Math.min(cols, Math.max(n, 1));
      // Avoid a single orphan on the last row.
      if (cols > 2 && n > cols && n <= cols * 2 && n % cols === 1) cols -= 1;
    } else if (layout === 'bento') {
      cols = Math.max(3, cols);
    } else if (layout === 'split') {
      if (mediaInFlow) cols = allOf(['stat', 'logo']) ? Math.min(n, 3) : 1;
      // Beside the intro, blocks read as a list unless two columns were asked for explicitly.
      else cols = cols === 2 && n >= 4 ? 2 : 1;
    } else {
      cols = 1;
    }

    let edge: EffectiveEdge = s.edge;
    let overlapTarget: Effective['overlapTarget'] = null;
    if (edge !== 'none' && nextCover) {
      edge = 'none';
      notes.push('Edges are skipped before a photo-backed section.');
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
 * whatever sizes were asked for.
 */
export function packBento(sizes: Size[], cols: number): Cell[] {
  const first = pack(sizes.map((s) => SPAN[s]), cols);
  if (!first.gaps) return first.cells;
  return pack(sizes.map((s) => [SPAN[s][0], 1] as [number, number]), cols).cells;
}

function pack(spans: [number, number][], cols: number): { cells: Cell[]; gaps: number } {
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
        if (canLeft && !bar(left)) growLeft();
        else if (canRight && !bar(right)) growRight();
        else if (canUp) growUp();
        else if (canLeft) growLeft();
        else if (canRight) growRight();
        else continue;
        changed = true;
      }
    }
    if (!changed) break;
  }
  return { cells, gaps: grid.flat().filter((v) => v === -1).length };
}
