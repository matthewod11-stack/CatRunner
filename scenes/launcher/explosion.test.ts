import { describe, it, expect } from 'vitest';
import {
  areCardinalNeighbors,
  findExplosionNeighborIds,
  type BlockBounds,
} from './explosion';

describe('areCardinalNeighbors', () => {
  it('detects two blocks side-by-side on the counter', () => {
    const a: BlockBounds = { id: 'a', cx: 50, cy: 100, width: 40, height: 40 };
    const b: BlockBounds = { id: 'b', cx: 90, cy: 100, width: 40, height: 40 };
    expect(areCardinalNeighbors(a, b, 4)).toBe(true);
  });

  it('detects block stacked above another', () => {
    const base: BlockBounds = { id: 'base', cx: 100, cy: 200, width: 60, height: 30 };
    const top: BlockBounds = { id: 'top', cx: 100, cy: 170, width: 60, height: 30 };
    expect(areCardinalNeighbors(base, top, 4)).toBe(true);
  });

  it('returns false for diagonal-only corner contact', () => {
    const a: BlockBounds = { id: 'a', cx: 0, cy: 0, width: 40, height: 40 };
    const b: BlockBounds = { id: 'b', cx: 40, cy: 40, width: 40, height: 40 };
    expect(areCardinalNeighbors(a, b, 4)).toBe(false);
  });

  it('returns false when separated by a gap beyond tolerance', () => {
    const a: BlockBounds = { id: 'a', cx: 50, cy: 100, width: 40, height: 40 };
    const b: BlockBounds = { id: 'b', cx: 110, cy: 100, width: 40, height: 40 };
    expect(areCardinalNeighbors(a, b, 4)).toBe(false);
  });
});

describe('findExplosionNeighborIds', () => {
  it('returns horizontally adjacent ids', () => {
    const blocks: BlockBounds[] = [
      { id: 'a', cx: 50, cy: 100, width: 40, height: 40 },
      { id: 'b', cx: 90, cy: 100, width: 40, height: 40 },
      { id: 'c', cx: 200, cy: 100, width: 40, height: 40 },
    ];
    expect(findExplosionNeighborIds(blocks, 'a').sort()).toEqual(['b']);
  });

  it('returns empty for unknown source id', () => {
    const blocks: BlockBounds[] = [{ id: 'a', cx: 0, cy: 0, width: 10, height: 10 }];
    expect(findExplosionNeighborIds(blocks, 'missing')).toEqual([]);
  });
});
