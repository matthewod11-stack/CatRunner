/**
 * Pure helper: cardinal (edge-sharing) neighbors for explosive block chains.
 */

export interface BlockBounds {
  id: string;
  cx: number;
  cy: number;
  width: number;
  height: number;
}

function rect(b: BlockBounds) {
  const hw = b.width / 2;
  const hh = b.height / 2;
  return {
    left: b.cx - hw,
    right: b.cx + hw,
    top: b.cy - hh,
    bottom: b.cy + hh,
  };
}

/** True if a and b share a full edge (cardinal adjacency), within tolerance px. */
export function areCardinalNeighbors(a: BlockBounds, b: BlockBounds, tolerance: number): boolean {
  const A = rect(a);
  const B = rect(b);

  const overlapY = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);
  const overlapX = Math.min(A.right, B.right) - Math.max(A.left, B.left);

  /** Share a vertical edge (left/right neighbors): positive vertical overlap, touching on X. */
  const touchHorizontally =
    overlapY > 0 &&
    (Math.abs(B.left - A.right) <= tolerance || Math.abs(A.left - B.right) <= tolerance);

  /** Share a horizontal edge (stacked): positive horizontal overlap, touching on Y. */
  const touchVertically =
    overlapX > 0 &&
    (Math.abs(B.top - A.bottom) <= tolerance || Math.abs(A.top - B.bottom) <= tolerance);

  return touchHorizontally || touchVertically;
}

/** Ids of blocks cardinal-adjacent to `sourceId` (excluding self). */
export function findExplosionNeighborIds(
  blocks: BlockBounds[],
  sourceId: string,
  tolerance = 4
): string[] {
  const src = blocks.find((b) => b.id === sourceId);
  if (!src) return [];

  const out: string[] = [];
  for (const b of blocks) {
    if (b.id === sourceId) continue;
    if (areCardinalNeighbors(src, b, tolerance)) out.push(b.id);
  }
  return out;
}
