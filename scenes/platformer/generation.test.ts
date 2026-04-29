import { describe, it, expect } from 'vitest';
import { resolveZoneParams, getZoneIndex, isBeforeOpeningRouteHandoff, validateOpeningRouteConfig } from './generation';
import type { PlatformGenerationConfig, PlatformerLevelConfig, ZoneConfig } from '../../types';
import { ROOFTOPS_LEVEL_CONFIG } from '../../levels/rooftops';

const BASE_GEN: PlatformGenerationConfig = {
  platformWidthRange: [120, 280],
  gapRange: [80, 160],
  heightStepRange: [-60, 80],
  gapScaling: 0.008,
  startY: 500,
  deathY: 800,
};

const ZONES: ZoneConfig[] = [
  {
    startDistance: 0, endDistance: 4000,
    generation: { platformWidthRange: [140, 240], gapRange: [60, 100], heightStepRange: [-30, 50] },
    enemies: [{ type: 'PIGEON', density: 2 }],
    hazards: [{ type: 'AC_UNIT', frequency: 1.5 }],
    fireEscapeChance: 0.1, coinDensity: 0.7,
  },
  {
    startDistance: 4000, endDistance: 9000,
    generation: { platformWidthRange: [100, 200], gapRange: [80, 140] },
    enemies: [{ type: 'PIGEON', density: 1.5 }, { type: 'RAT', density: 1 }],
    hazards: [{ type: 'AC_UNIT', frequency: 1 }, { type: 'CLOTHESLINE', frequency: 0.5 }, { type: 'SATELLITE_DISH', frequency: 0.5 }],
    fireEscapeChance: 0.25, coinDensity: 0.5,
  },
  {
    startDistance: 9000, endDistance: 14000,
    generation: { platformWidthRange: [80, 160], gapRange: [100, 180], heightStepRange: [-60, 90] },
    enemies: [{ type: 'PIGEON', density: 1 }, { type: 'RAT', density: 1 }, { type: 'RACCOON', density: 0.8 }],
    hazards: [{ type: 'AC_UNIT', frequency: 0.8 }, { type: 'NEON_SIGN', frequency: 1 }],
    fireEscapeChance: 0.4, coinDensity: 0.3,
  },
];

describe('getZoneIndex', () => {
  it('returns 0 for distances in zone 1', () => {
    expect(getZoneIndex(ZONES, 0)).toBe(0);
    expect(getZoneIndex(ZONES, 2000)).toBe(0);
    expect(getZoneIndex(ZONES, 3999)).toBe(0);
  });

  it('returns 1 for distances in zone 2', () => {
    expect(getZoneIndex(ZONES, 4000)).toBe(1);
    expect(getZoneIndex(ZONES, 7000)).toBe(1);
  });

  it('returns 2 for distances in zone 3', () => {
    expect(getZoneIndex(ZONES, 9000)).toBe(2);
    expect(getZoneIndex(ZONES, 13000)).toBe(2);
  });

  it('clamps to last zone for distances past all zones', () => {
    expect(getZoneIndex(ZONES, 15000)).toBe(2);
  });
});

describe('resolveZoneParams', () => {
  it('merges zone overrides onto base generation config', () => {
    const resolved = resolveZoneParams(BASE_GEN, ZONES[0]);
    expect(resolved.platformWidthRange).toEqual([140, 240]);
    expect(resolved.gapRange).toEqual([60, 100]);
    expect(resolved.heightStepRange).toEqual([-30, 50]);
    expect(resolved.gapScaling).toBe(0.008);
    expect(resolved.startY).toBe(500);
    expect(resolved.deathY).toBe(800);
  });

  it('uses base values when zone has no override for a field', () => {
    const resolved = resolveZoneParams(BASE_GEN, ZONES[1]);
    expect(resolved.heightStepRange).toEqual([-60, 80]);
  });
});

describe('opening route helpers', () => {
  it('validates the City Heights opening route', () => {
    expect(validateOpeningRouteConfig(ROOFTOPS_LEVEL_CONFIG.openingRoute!, ROOFTOPS_LEVEL_CONFIG)).toEqual([]);
  });

  it('reports unsafe opening-route geometry', () => {
    const config: PlatformerLevelConfig = {
      ...ROOFTOPS_LEVEL_CONFIG,
      openingRoute: {
        id: '',
        handoffX: 100,
        platforms: [
          { x: 300, width: 100, rooftopY: 900 },
          { x: 350, width: -10, rooftopY: 500 },
        ],
        enemies: [{ type: 'PIGEON', x: 900, platformIndex: 99 }],
        hazards: [{ type: 'AC_UNIT', x: Number.NaN, platformIndex: 0 }],
        coins: [{ x: Number.NaN, y: 12 }],
        powerups: [{ type: 'GLIDE', x: 10, y: Number.NaN }],
      },
    };

    expect(validateOpeningRouteConfig(config.openingRoute!, config)).toEqual([
      'openingRoute.id is required',
      'openingRoute.platforms[0].rooftopY must stay inside the playable vertical band',
      'openingRoute.platforms[1].width must be positive',
      'openingRoute.platforms[1] overlaps or is out of order',
      'openingRoute first platform must support the default player start x=200',
      'openingRoute.handoffX must be at or beyond the final opening-route platform',
      'openingRoute.enemies[0].platformIndex must reference an existing platform',
      'openingRoute.enemies[0].x must be finite and inside the opening slice',
      'openingRoute.hazards[0].x must be finite and inside the opening slice',
      'openingRoute.coins[0] must use finite x and y values',
      'openingRoute.powerups[0] must use finite x and y values',
    ]);
  });

  it('validates authored boss arena coverage', () => {
    const config: PlatformerLevelConfig = {
      ...ROOFTOPS_LEVEL_CONFIG,
      openingRoute: {
        id: 'bad-boss-arena',
        handoffX: 1200,
        platforms: [
          { x: 100, width: 320, rooftopY: 500 },
          { x: 500, width: 220, rooftopY: 480 },
        ],
        bossArena: {
          triggerX: 1300,
          arenaX: 700,
          arenaY: 500,
          width: 400,
        },
      },
    };

    expect(validateOpeningRouteConfig(config.openingRoute!, config)).toEqual([
      'openingRoute.bossArena.triggerX must be positive and inside the opening slice',
      'openingRoute.bossArena must be backed by one authored platform at arenaY',
    ]);
  });

  it('identifies positions still inside the hand-authored slice', () => {
    expect(isBeforeOpeningRouteHandoff(ROOFTOPS_LEVEL_CONFIG, 0)).toBe(true);
    expect(isBeforeOpeningRouteHandoff(ROOFTOPS_LEVEL_CONFIG, ROOFTOPS_LEVEL_CONFIG.openingRoute!.handoffX - 1)).toBe(true);
    expect(isBeforeOpeningRouteHandoff(ROOFTOPS_LEVEL_CONFIG, ROOFTOPS_LEVEL_CONFIG.openingRoute!.handoffX)).toBe(false);
    expect(isBeforeOpeningRouteHandoff({ ...ROOFTOPS_LEVEL_CONFIG, openingRoute: undefined }, 0)).toBe(false);
  });
});
