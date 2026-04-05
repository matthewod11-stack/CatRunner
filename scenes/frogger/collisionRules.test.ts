import { describe, it, expect } from 'vitest';
import { hazardOverlap } from './collisionRules';

const P = { x: 100, y: 200, halfCell: 24 };

describe('hazardOverlap', () => {
  it('returns false for safe', () => {
    expect(
      hazardOverlap(P, { x: 100, y: 200, halfWidth: 40, halfHeight: 20 }, 'safe')
    ).toBe(false);
  });
  it('detects road hit when aligned', () => {
    expect(
      hazardOverlap(P, { x: 100, y: 200, halfWidth: 30, halfHeight: 20 }, 'road')
    ).toBe(true);
  });
  it('misses when mover is far horizontally', () => {
    expect(
      hazardOverlap(P, { x: 200, y: 200, halfWidth: 10, halfHeight: 20 }, 'road')
    ).toBe(false);
  });
});
