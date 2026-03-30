import { describe, it, expect, vi } from 'vitest';
import { computeSwoopY, checkPoopDrop, DropProjectileSpawnSpec } from './behaviors';
import type { WorldEntity } from '../types';

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

  it('reaches lowest point near screen center', () => {
    const yAtCenter = computeSwoopY(400, w);
    const yFarRight = computeSwoopY(750, w);
    expect(yAtCenter).toBeLessThan(yFarRight);
  });

  it('recovers upward on left half of screen', () => {
    const yCenter = computeSwoopY(400, w);
    const yLeft = computeSwoopY(100, w);
    expect(yLeft).toBeGreaterThan(yCenter);
  });
});

describe('checkPoopDrop', () => {
  const spec: DropProjectileSpawnSpec = {
    type: 'POOP' as any,
    width: 20,
    height: 20,
    poopDelayBase: 2000,
    poopDelayRange: 0,
  };

  function makeSeagull(overrides?: Partial<WorldEntity>): WorldEntity {
    return {
      id: 1,
      type: 'SEAGULL',
      seagullType: 'poop',
      x: 400,
      y: 300,
      width: 60,
      height: 40,
      speed: 3,
      vx: -3,
      vy: 0,
      rotation: 0,
      isPassed: false,
      lastPoopTime: 1000,
      ...overrides,
    };
  }

  it('returns null when spec is null', () => {
    const obs = makeSeagull();
    expect(checkPoopDrop(obs, 5000, false, true, null)).toBeNull();
  });

  it('returns null for non-SEAGULL types', () => {
    const obs = makeSeagull({ type: 'CRAB' as any });
    expect(checkPoopDrop(obs, 5000, false, true, spec)).toBeNull();
  });

  it('returns null for non-poop seagull variants', () => {
    const obs = makeSeagull({ seagullType: 'dive' });
    expect(checkPoopDrop(obs, 5000, false, true, spec)).toBeNull();
  });

  it('returns null when canSpawnPoop is false', () => {
    const obs = makeSeagull();
    expect(checkPoopDrop(obs, 5000, false, false, spec)).toBeNull();
  });

  it('returns null when not enough time has elapsed', () => {
    const obs = makeSeagull({ lastPoopTime: 4000 });
    expect(checkPoopDrop(obs, 5000, false, true, spec)).toBeNull();
  });

  it('spawns projectile when delay has elapsed', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const obs = makeSeagull({ lastPoopTime: 1000 });
    const result = checkPoopDrop(obs, 3100, false, true, spec);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('POOP');
    expect(result!.x).toBe(obs.x + obs.width / 2);
    expect(result!.width).toBe(20);
    expect(result!.height).toBe(20);
    vi.restoreAllMocks();
  });

  it('uses low-lives delay values when lowLivesMode is true', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const lowLivesSpec: DropProjectileSpawnSpec = {
      ...spec,
      poopDelayBaseLowLives: 1000,
      poopDelayRangeLowLives: 0,
    };
    const obs = makeSeagull({ lastPoopTime: 1000 });
    // With lowLives delay of 1000ms, should spawn at 2100ms
    const result = checkPoopDrop(obs, 2100, true, true, lowLivesSpec);
    expect(result).not.toBeNull();
    vi.restoreAllMocks();
  });
});
