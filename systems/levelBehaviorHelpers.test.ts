import { describe, it, expect } from 'vitest';
import {
  resolveObstacleSpawnY,
  resolveSwoopConfig,
  resolveDropProjectileSpec,
} from './levelBehaviorHelpers';
import type { LevelConfig } from '../types';

describe('resolveObstacleSpawnY', () => {
  it('uses fallback when spawnY is undefined', () => {
    expect(resolveObstacleSpawnY(undefined, () => 123)).toBe(123);
  });

  it('returns fixed number', () => {
    expect(resolveObstacleSpawnY(400, () => 0)).toBe(400);
  });

  it('returns value in min/max range', () => {
    const y = resolveObstacleSpawnY({ min: 10, max: 20 }, () => 0);
    expect(y).toBeGreaterThanOrEqual(10);
    expect(y).toBeLessThanOrEqual(20);
  });
});

describe('resolveSwoopConfig', () => {
  it('defaults when no swoop config', () => {
    expect(resolveSwoopConfig(undefined)).toEqual({
      swoopStartY: 400,
      swoopLowY: 170,
      swoopEndY: 280,
    });
  });

  it('reads swoop behavior config keys', () => {
    const def = {
      type: 'SEAGULL' as const,
      width: 1,
      height: 1,
      behaviors: [
        {
          type: 'swoop' as const,
          config: { swoopStartY: 1, swoopLowY: 2, swoopEndY: 3 },
        },
      ],
      isHarmful: false,
      spawnWeight: 1,
    };
    expect(resolveSwoopConfig(def)).toEqual({
      swoopStartY: 1,
      swoopLowY: 2,
      swoopEndY: 3,
    });
  });
});

describe('resolveDropProjectileSpec', () => {
  const miniLevel: LevelConfig = {
    id: 'BEACH',
    name: 't',
    description: 't',
    genre: 'runner',
    catPose: 'runner',
    victoryCondition: { type: 'boss', bossId: 'test' },
    starThresholds: [100, 300, 500],
    obstacles: [
      {
        type: 'SEAGULL',
        width: 10,
        height: 10,
        behaviors: [
          {
            type: 'dropProjectile',
            projectileType: 'SAND_PROJECTILE',
            config: {
              poopDelayBase: 100,
              poopDelayRange: 10,
              poopDelayBaseLowLives: 200,
              poopDelayRangeLowLives: 20,
            },
          },
        ],
        isHarmful: false,
        spawnWeight: 1,
      },
      {
        type: 'SAND_PROJECTILE',
        width: 50,
        height: 60,
        behaviors: [{ type: 'arcProjectile' }],
        isHarmful: true,
        spawnWeight: 0,
      },
    ],
    patterns: [],
    theme: {
      groundY: 0,
      skyGradient: ['#000', '#111'],
      particleColors: { dust: '#000', impact: '#000', coinCollect: '#000' },
      speedLineThreshold: 0,
      screenShakeDecay: 0.9,
    },
    boss: {
      health: 1,
      damagePerHit: 1,
      width: 1,
      height: 1,
      spawnYOffset: 0,
      movement: {
        swayAmountNormal: 1,
        swayAmountLow: 1,
        swayFrequency: 1,
        bobFrequency: 1,
        bobAmplitude: 1,
      },
      projectile: {
        baseSpeed: 1,
        speedRange: 1,
        spawnRateByHealth: { high: 1, mid: 1, low: 1 },
      },
    },
    background: {
      entities: [],
      spawnInterval: { normal: 1, boss: 1 },
    },
  };

  it('merges delay fields from dropProjectile config', () => {
    const spec = resolveDropProjectileSpec(miniLevel, 'SEAGULL');
    expect(spec).toMatchObject({
      type: 'SAND_PROJECTILE',
      width: 50,
      height: 60,
      poopDelayBase: 100,
      poopDelayRange: 10,
      poopDelayBaseLowLives: 200,
      poopDelayRangeLowLives: 20,
    });
  });
});
