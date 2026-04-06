import { describe, it, expect } from 'vitest';
import type { ClimberLevelConfig } from '../../types';
import { createSeededRng, nextWorldY, rollPlatformRow } from './platformGen';

const PLATFORM: ClimberLevelConfig['platformConfig'] = {
  widthRange: [60, 140],
  gapYRange: [60, 120],
  springChance: 0.15,
  breakableChance: 0.1,
};

describe('createSeededRng', () => {
  it('produces identical sequences for the same seed', () => {
    const a = createSeededRng(42);
    const b = createSeededRng(42);
    for (let i = 0; i < 20; i++) {
      expect(a()).toBe(b());
    }
  });
});

describe('nextWorldY', () => {
  it('steps upward (more negative) with gap inside range', () => {
    const rng = createSeededRng(1);
    let prev = -100;
    for (let i = 0; i < 50; i++) {
      const y = nextWorldY(prev, 60, 120, rng);
      const gap = prev - y;
      expect(gap).toBeGreaterThanOrEqual(60);
      expect(gap).toBeLessThanOrEqual(120);
      prev = y;
    }
  });
});

describe('rollPlatformRow', () => {
  it('is deterministic for a fixed seed and inputs', () => {
    const rowA = rollPlatformRow({
      rng: createSeededRng(999),
      screenWidth: 360,
      prevWorldY: -500,
      platformConfig: PLATFORM,
      stickyStripChance: 0.25,
    });
    const rowB = rollPlatformRow({
      rng: createSeededRng(999),
      screenWidth: 360,
      prevWorldY: -500,
      platformConfig: PLATFORM,
      stickyStripChance: 0.25,
    });
    expect(rowA).toEqual(rowB);
  });

  it('never sets hasStickyStrip when stickyStripChance is 0', () => {
    const rng = createSeededRng(777);
    let prev = -200;
    for (let i = 0; i < 30; i++) {
      const row = rollPlatformRow({
        rng,
        screenWidth: 400,
        prevWorldY: prev,
        platformConfig: PLATFORM,
        stickyStripChance: 0,
      });
      expect(row.hasStickyStrip).toBe(false);
      prev = row.worldY;
    }
  });

  it('always sets hasStickyStrip when stickyStripChance is 1', () => {
    const rng = createSeededRng(888);
    let prev = -200;
    for (let i = 0; i < 30; i++) {
      const row = rollPlatformRow({
        rng,
        screenWidth: 400,
        prevWorldY: prev,
        platformConfig: PLATFORM,
        stickyStripChance: 1,
      });
      expect(row.hasStickyStrip).toBe(true);
      prev = row.worldY;
    }
  });
});
