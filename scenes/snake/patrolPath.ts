export type PatrolAxis = 'row' | 'col';

export interface PatrolSegment {
  axis: PatrolAxis;
  /** Fixed row index if axis==='row', else fixed col */
  fixed: number;
  /** Inclusive range on the varying axis */
  a: number;
  b: number;
}

export interface PatrolState {
  varying: number;
  direction: 1 | -1;
}

export function pickLongestPatrolSegment(
  gridCols: number,
  gridRows: number,
  wallKeys: Set<string>,
  rng: () => number
): PatrolSegment | null {
  const key = (c: number, r: number) => `${c},${r}`;
  let best: PatrolSegment | null = null;
  let bestLen = 0;

  const consider = (seg: PatrolSegment, len: number) => {
    if (len < 3) return;
    if (len > bestLen || (len === bestLen && rng() < 0.5)) {
      bestLen = len;
      best = seg;
    }
  };

  for (let r = 1; r < gridRows - 1; r++) {
    let runStart: number | null = null;
    for (let c = 1; c < gridCols - 1; c++) {
      if (wallKeys.has(key(c, r))) {
        if (runStart !== null) {
          const runEnd = c - 1;
          consider({ axis: 'row', fixed: r, a: runStart, b: runEnd }, runEnd - runStart + 1);
          runStart = null;
        }
      } else if (runStart === null) {
        runStart = c;
      }
    }
    if (runStart !== null) {
      const runEnd = gridCols - 2;
      consider({ axis: 'row', fixed: r, a: runStart, b: runEnd }, runEnd - runStart + 1);
    }
  }

  for (let c = 1; c < gridCols - 1; c++) {
    let runStart: number | null = null;
    for (let r = 1; r < gridRows - 1; r++) {
      if (wallKeys.has(key(c, r))) {
        if (runStart !== null) {
          const runEnd = r - 1;
          consider({ axis: 'col', fixed: c, a: runStart, b: runEnd }, runEnd - runStart + 1);
          runStart = null;
        }
      } else if (runStart === null) {
        runStart = r;
      }
    }
    if (runStart !== null) {
      const runEnd = gridRows - 2;
      consider({ axis: 'col', fixed: c, a: runStart, b: runEnd }, runEnd - runStart + 1);
    }
  }

  return best;
}

export function stepPatrol(seg: PatrolSegment, state: PatrolState): PatrolState {
  let next = state.varying + state.direction;
  let dir = state.direction;
  if (next > seg.b) {
    next = seg.b;
    dir = -1;
  } else if (next < seg.a) {
    next = seg.a;
    dir = 1;
  }
  return { varying: next, direction: dir };
}

export function patrolCell(seg: PatrolSegment, state: PatrolState): { col: number; row: number } {
  if (seg.axis === 'row') return { col: state.varying, row: seg.fixed };
  return { col: seg.fixed, row: state.varying };
}
