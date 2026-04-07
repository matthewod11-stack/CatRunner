import { describe, it, expect } from 'vitest';
import { orthogonalNeighborKeys, initialAliveCells } from './brickDamage';

describe('orthogonalNeighborKeys', () => {
  it('returns only orthogonal keys present in alive set', () => {
    const alive = new Set(['1,0', '0,1', '2,1', '1,2']);
    const out = orthogonalNeighborKeys(1, 1, alive);
    expect(out).toEqual(
      expect.arrayContaining([
        [1, 0],
        [0, 1],
        [2, 1],
        [1, 2],
      ])
    );
    expect(out).toHaveLength(4);
  });

  it('omits missing neighbors', () => {
    const alive = new Set(['1,0']);
    const out = orthogonalNeighborKeys(1, 1, alive);
    expect(out).toEqual([[1, 0]]);
  });
});

describe('initialAliveCells', () => {
  it('includes all brick coordinates', () => {
    const s = initialAliveCells([
      { col: 0, row: 0 },
      { col: 1, row: 0 },
    ]);
    expect(s.has('0,0')).toBe(true);
    expect(s.has('1,0')).toBe(true);
  });
});
