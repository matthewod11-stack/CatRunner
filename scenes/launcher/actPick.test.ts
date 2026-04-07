import { describe, it, expect } from 'vitest';
import { pickStructureKey, resolveActForRound } from './actPick';
import type { LauncherActConfig } from '../../types';

const ACTS: LauncherActConfig[] = [
  { id: 'morning', roundStart: 1, roundEnd: 2, structurePool: ['A', 'B'] },
  { id: 'raid', roundStart: 3, roundEnd: 4, structurePool: ['C', 'D'] },
  { id: 'rush', roundStart: 5, roundEnd: 5, structurePool: ['E'] },
];

describe('resolveActForRound', () => {
  it('returns null when acts undefined', () => {
    expect(resolveActForRound(1, undefined)).toBeNull();
  });

  it('maps round 1 to first act', () => {
    expect(resolveActForRound(1, ACTS)?.id).toBe('morning');
  });

  it('maps round 4 to raid act', () => {
    expect(resolveActForRound(4, ACTS)?.id).toBe('raid');
  });

  it('maps round 5 to rush act', () => {
    expect(resolveActForRound(5, ACTS)?.id).toBe('rush');
  });

  it('falls back to last act for out-of-range high round', () => {
    expect(resolveActForRound(99, ACTS)?.id).toBe('rush');
  });
});

describe('pickStructureKey', () => {
  it('returns only keys from pool', () => {
    const act = ACTS[0];
    for (let i = 0; i < 20; i++) {
      const k = pickStructureKey(act, Math.random);
      expect(['A', 'B']).toContain(k);
    }
  });

  it('respects weights toward heavier key', () => {
    const act: LauncherActConfig = {
      id: 'w',
      roundStart: 1,
      roundEnd: 1,
      structurePool: ['light', 'heavy'],
      weights: [1, 99],
    };
    const counts = { light: 0, heavy: 0 };
    for (let i = 0; i < 400; i++) {
      const k = pickStructureKey(act, Math.random);
      counts[k as 'light' | 'heavy']++;
    }
    expect(counts.heavy).toBeGreaterThan(counts.light);
  });
});
