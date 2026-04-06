import { describe, it, expect } from 'vitest';
import { computeClimberStars } from './climberStars';

describe('computeClimberStars', () => {
  it('returns 3 when no deaths and within par time', () => {
    expect(computeClimberStars({ deathCount: 0, elapsedMs: 1000, parTimeMs: 2000 })).toBe(3);
  });
  it('returns 2 when no deaths but over par', () => {
    expect(computeClimberStars({ deathCount: 0, elapsedMs: 9999, parTimeMs: 5000 })).toBe(2);
  });
  it('returns 1 when any death', () => {
    expect(computeClimberStars({ deathCount: 1, elapsedMs: 1000, parTimeMs: 99999 })).toBe(1);
  });
});
