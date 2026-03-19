import { describe, it, expect } from 'vitest';
import { computeSwoopY } from './behaviors';

describe('computeSwoopY', () => {
  const w = 800;

  it('uses default anchors when params omitted', () => {
    const yRight = computeSwoopY(700, w);
    expect(yRight).toBeGreaterThan(170);
    expect(yRight).toBeLessThanOrEqual(400);
  });

  it('respects custom swoop anchors', () => {
    const custom = { swoopStartY: 500, swoopLowY: 100, swoopEndY: 200 };
    const y = computeSwoopY(700, w, custom);
    expect(y).toBeGreaterThanOrEqual(100);
    expect(y).toBeLessThanOrEqual(500);
  });
});
