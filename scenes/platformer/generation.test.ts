import { describe, it, expect } from 'vitest';
import { resolveZoneParams, getZoneIndex } from './generation';
import type { PlatformGenerationConfig, ZoneConfig } from '../../types';

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
