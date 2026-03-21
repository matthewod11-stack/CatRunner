import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { computeStars, loadLevelResult, saveLevelResult } from './levelCompletion';

describe('computeStars', () => {
  const thresholds: [number, number, number] = [100, 300, 500];

  it('returns 1 for scores below second threshold', () => {
    expect(computeStars(50, thresholds)).toBe(1);
    expect(computeStars(100, thresholds)).toBe(1);
    expect(computeStars(299, thresholds)).toBe(1);
  });

  it('returns 2 for scores at or above second threshold', () => {
    expect(computeStars(300, thresholds)).toBe(2);
    expect(computeStars(499, thresholds)).toBe(2);
  });

  it('returns 3 for scores at or above third threshold', () => {
    expect(computeStars(500, thresholds)).toBe(3);
    expect(computeStars(9999, thresholds)).toBe(3);
  });
});

describe('loadLevelResult / saveLevelResult', () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    globalThis.localStorage = {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
      key: () => null,
      length: 0,
    } as Storage;
  });

  afterEach(() => {
    delete (globalThis as { localStorage?: Storage }).localStorage;
  });

  it('returns null when no result saved', () => {
    expect(loadLevelResult('BEACH')).toBeNull();
  });

  it('saves and loads a result', () => {
    saveLevelResult({ levelId: 'BEACH', score: 250, stars: 2 });
    const result = loadLevelResult('BEACH');
    expect(result).toEqual({ levelId: 'BEACH', score: 250, stars: 2 });
  });

  it('merges with best-of on score and stars independently', () => {
    saveLevelResult({ levelId: 'BEACH', score: 400, stars: 2 });
    saveLevelResult({ levelId: 'BEACH', score: 200, stars: 3 });
    const result = loadLevelResult('BEACH');
    expect(result).toEqual({ levelId: 'BEACH', score: 400, stars: 3 });
  });

  it('does not downgrade score or stars', () => {
    saveLevelResult({ levelId: 'BEACH', score: 500, stars: 3 });
    saveLevelResult({ levelId: 'BEACH', score: 100, stars: 1 });
    const result = loadLevelResult('BEACH');
    expect(result).toEqual({ levelId: 'BEACH', score: 500, stars: 3 });
  });
});
