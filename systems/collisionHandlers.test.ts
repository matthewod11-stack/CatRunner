import { describe, it, expect } from 'vitest';
import {
  handleBounceCollision,
  handleSlowCollision,
  handleHarmfulCollision,
  BOUNCE_POINTS,
} from './collisionHandlers';
import { DEFAULT_TUNING } from './tuning/defaultTuning';
import type { ObstacleDefinition } from '../types';

describe('handleBounceCollision', () => {
  it('uses obstacleDef.stompCollision when present', () => {
    const def: Partial<ObstacleDefinition> = {
      stompCollision: {
        bounceForce: 99,
        points: 77,
        jumpCount: 2,
        markAs: 'passed',
        particleColor: '#abc',
        sounds: ['a', 'b'],
      },
    };
    const r = handleBounceCollision('CRAB', DEFAULT_TUNING, def as ObstacleDefinition);
    expect(r).toEqual({
      bounceForce: 99,
      points: 77,
      jumpCount: 2,
      markAs: 'passed',
      particleColor: '#abc',
      sounds: ['a', 'b'],
    });
  });

  it('defaults BEACHBALL bounce to tuning.bounceForce', () => {
    const r = handleBounceCollision('BEACHBALL', { ...DEFAULT_TUNING, bounceForce: 42 });
    expect(r.bounceForce).toBe(42);
    expect(r.points).toBe(BOUNCE_POINTS);
    expect(r.markAs).toBe('passed');
  });

  it('SEAGULL stomp grants extra jump', () => {
    const r = handleBounceCollision('SEAGULL', DEFAULT_TUNING);
    expect(r.jumpCount).toBe(1);
    expect(r.markAs).toBe('collected');
  });
});

describe('handleSlowCollision', () => {
  it('uses obstacleDef.slowCollision when present', () => {
    const def: Partial<ObstacleDefinition> = {
      slowCollision: {
        durationMs: 3333,
        particleColor: '#123',
      },
    };
    const r = handleSlowCollision('TIDEPOOL', def as ObstacleDefinition);
    expect(r.slowDuration).toBe(3333);
    expect(r.particleColor).toBe('#123');
    expect(r.sounds).toEqual(['hit']);
  });

  it('defaults tidepool-ish color for TIDEPOOL', () => {
    const r = handleSlowCollision('TIDEPOOL');
    expect(r.slowDuration).toBe(2000);
    expect(r.particleColor).toBe('#60a5fa');
  });
});

describe('handleHarmfulCollision', () => {
  it('returns hiss and no collection', () => {
    expect(handleHarmfulCollision()).toEqual({
      markAs: 'none',
      sounds: ['hiss'],
    });
  });
});
