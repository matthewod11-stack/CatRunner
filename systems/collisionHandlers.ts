import type { EntityType } from '../types';
import type { TuningProfile } from './tuning/defaultTuning';

export const BOUNCE_POINTS = 10;

export interface CollisionResult {
  bounceForce?: number;
  jumpCount?: number;
  slowDuration?: number;
  points?: number;
  markAs: 'collected' | 'passed' | 'none';
  particleColor?: string;
  sounds: string[];
}

/**
 * Handle stomp-from-above collision on bounceable/stompable obstacles.
 * Covers: CRAB, BEACHBALL, SEAGULL (dive), SAND_PROJECTILE.
 */
export function handleBounceCollision(
  obsType: EntityType,
  tuning: TuningProfile
): CollisionResult {
  const base = { points: BOUNCE_POINTS };

  if (obsType === 'BEACHBALL') {
    return {
      ...base,
      bounceForce: tuning.bounceForce,
      jumpCount: 0,
      markAs: 'passed',
      particleColor: '#fde047',
      sounds: ['meow', 'boing-boing-bounce-454474'],
    };
  }

  if (obsType === 'CRAB') {
    return {
      ...base,
      bounceForce: 8,
      jumpCount: 0,
      markAs: 'collected',
      particleColor: '#ef4444',
      sounds: ['meow', 'cartoon-splat-310479'],
    };
  }

  if (obsType === 'SEAGULL') {
    return {
      ...base,
      bounceForce: 8,
      jumpCount: 1,
      markAs: 'collected',
      particleColor: '#ffffff',
      sounds: ['meow', 'cartoon-splat-310479'],
    };
  }

  // SAND_PROJECTILE
  return {
    ...base,
    bounceForce: 8,
    jumpCount: 1,
    markAs: 'collected',
    particleColor: '#ffffff',
    sounds: ['meow'],
  };
}

/**
 * Handle collision with slow-on-contact obstacles (SANDCASTLE, TIDEPOOL).
 */
export function handleSlowCollision(obsType: EntityType): CollisionResult {
  return {
    slowDuration: 2000,
    markAs: 'passed',
    particleColor: obsType === 'TIDEPOOL' ? '#60a5fa' : '#fbbf24',
    sounds: ['hit'],
  };
}

/**
 * Handle harmful collision (non-stomp hit from CRAB, BEACHBALL, PALM_TREE, SAND_PROJECTILE).
 * Engine is responsible for decrementing lives, invincibility, screen shake, etc.
 */
export function handleHarmfulCollision(): CollisionResult {
  return {
    markAs: 'none',
    sounds: ['hiss'],
  };
}
