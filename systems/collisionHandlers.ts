import type { EntityType, ObstacleDefinition } from '../types';
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

function defaultBounceForce(obsType: EntityType, tuning: TuningProfile): number {
  return obsType === 'BEACHBALL' ? tuning.bounceForce : 8;
}

/**
 * Handle stomp-from-above collision on bounceable/stompable obstacles.
 * Prefers `obstacleDef.stompCollision` when present.
 */
export function handleBounceCollision(
  obsType: EntityType,
  tuning: TuningProfile,
  obstacleDef?: ObstacleDefinition
): CollisionResult {
  const c = obstacleDef?.stompCollision;
  if (c) {
    const bounceForce = c.bounceForce ?? defaultBounceForce(obsType, tuning);
    return {
      points: c.points ?? BOUNCE_POINTS,
      bounceForce,
      jumpCount: c.jumpCount,
      markAs: c.markAs,
      particleColor: c.particleColor,
      sounds: c.sounds,
    };
  }

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
 * Handle collision with slow-on-contact obstacles.
 * Prefers `obstacleDef.slowCollision` when present.
 */
export function handleSlowCollision(
  obsType: EntityType,
  obstacleDef?: ObstacleDefinition
): CollisionResult {
  const c = obstacleDef?.slowCollision;
  if (c) {
    return {
      slowDuration: c.durationMs,
      markAs: 'passed',
      particleColor: c.particleColor,
      sounds: ['hit'],
    };
  }

  return {
    slowDuration: 2000,
    markAs: 'passed',
    particleColor: obsType === 'TIDEPOOL' ? '#60a5fa' : '#fbbf24',
    sounds: ['hit'],
  };
}

export function handleHarmfulCollision(): CollisionResult {
  return {
    markAs: 'none',
    sounds: ['hiss'],
  };
}
