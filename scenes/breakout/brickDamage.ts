/**
 * Orthogonal neighbors for explosive splash (no diagonal).
 * `aliveCells` is a Set of "col,row" keys for cells that still have a brick.
 */
export function orthogonalNeighborKeys(col: number, row: number, aliveCells: Set<string>): [number, number][] {
  const candidates: [number, number][] = [
    [col, row - 1],
    [col, row + 1],
    [col - 1, row],
    [col + 1, row],
  ];
  const out: [number, number][] = [];
  for (const [c, r] of candidates) {
    if (aliveCells.has(`${c},${r}`)) out.push([c, r]);
  }
  return out;
}

/** Build alive set from brick definitions (all start alive at level load). */
export function initialAliveCells(
  bricks: { col: number; row: number }[]
): Set<string> {
  const s = new Set<string>();
  for (const b of bricks) s.add(`${b.col},${b.row}`);
  return s;
}
