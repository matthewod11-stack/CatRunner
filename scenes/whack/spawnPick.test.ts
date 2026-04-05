import { describe, it, expect } from 'vitest';
import { normalizeWeights, pickWeightedKey } from './spawnPick';

describe('normalizeWeights', () => {
  it('drops non-positive', () => {
    expect(normalizeWeights({ a: 1, b: 0, c: -1 })).toEqual({ a: 1 });
  });
  it('normalizes', () => {
    const n = normalizeWeights({ a: 1, b: 3 });
    expect(n.a).toBeCloseTo(0.25);
    expect(n.b).toBeCloseTo(0.75);
  });
});

describe('pickWeightedKey', () => {
  it('deterministic toward first bucket', () => {
    expect(pickWeightedKey({ a: 1, b: 1 }, () => 0.49)).toBe('a');
  });
  it('deterministic toward second bucket', () => {
    expect(pickWeightedKey({ a: 1, b: 1 }, () => 0.51)).toBe('b');
  });
  it('null when empty', () => {
    expect(pickWeightedKey({})).toBeNull();
  });
});
