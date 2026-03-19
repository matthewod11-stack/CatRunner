import { describe, expect, it, vi } from 'vitest';
import { spawnBackgroundEntities } from './backgroundSpawn';
import type { BackgroundConfig, BackgroundEntityDefinition, BackgroundEntityType } from '../types';

function def(
  type: BackgroundEntityType,
  overrides: Partial<BackgroundEntityDefinition> = {}
): BackgroundEntityDefinition {
  return {
    type,
    width: 100,
    height: 50,
    speedMultiplier: 0.5,
    depth: 'mid',
    ...overrides,
  };
}

const beachLikeEntities: BackgroundEntityDefinition[] = [
  def('CLOUD', { depth: 'far', speedMultiplier: 0.1, spawnYRange: { min: 0.5, max: 0.6 } }),
  def('BOAT', { spawnYRange: { min: 0.3, max: 0.4 } }),
  def('BOAT_SINKING', { spawnYRange: { min: 0.32, max: 0.4 } }),
  def('AIRPLANE_FIRE', { spawnYRange: { min: 0.5, max: 0.6 }, defaultBannerText: 'HELP!' }),
];

function makeGetDef(entities: BackgroundEntityDefinition[]) {
  const map = new Map(entities.map(e => [e.type, e]));
  return (t: BackgroundEntityType) => map.get(t);
}

describe('spawnBackgroundEntities', () => {
  it('chaos mode returns one chaos entity when types configured', () => {
    const background: BackgroundConfig = {
      entities: beachLikeEntities,
      spawnInterval: { normal: 1, boss: 1 },
      chaosSpawnTypes: ['BOAT_SINKING', 'AIRPLANE_FIRE'],
    };
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const out = spawnBackgroundEntities({
      isChaosMode: true,
      gameSpeed: 10,
      innerWidth: 800,
      innerHeight: 600,
      getBgEntityDef: makeGetDef(beachLikeEntities),
      background,
    });
    expect(out).toHaveLength(1);
    expect(out[0].isChaos).toBe(true);
    expect(['BOAT_SINKING', 'AIRPLANE_FIRE']).toContain(out[0].type);
    vi.restoreAllMocks();
  });

  it('chaos mode returns empty when chaosSpawnTypes is empty', () => {
    const background: BackgroundConfig = {
      entities: beachLikeEntities,
      spawnInterval: { normal: 1, boss: 1 },
      chaosSpawnTypes: [],
    };
    const out = spawnBackgroundEntities({
      isChaosMode: true,
      gameSpeed: 10,
      innerWidth: 800,
      innerHeight: 600,
      getBgEntityDef: makeGetDef(beachLikeEntities),
      background,
    });
    expect(out).toEqual([]);
  });

  it('normal mode skips cloud when cloudSpawnChance is 0', () => {
    const background: BackgroundConfig = {
      entities: beachLikeEntities,
      spawnInterval: { normal: 1, boss: 1 },
      cloudSpawnChance: 0,
      midLayerSpawnTypes: ['BOAT'],
    };
    const out = spawnBackgroundEntities({
      isChaosMode: false,
      gameSpeed: 10,
      innerWidth: 800,
      innerHeight: 600,
      getBgEntityDef: makeGetDef(beachLikeEntities),
      background,
    });
    expect(out.every(e => e.type !== 'CLOUD')).toBe(true);
    expect(out.some(e => e.type === 'BOAT')).toBe(true);
  });

  it('normal mode skips mid layer when midLayerSpawnTypes is empty', () => {
    const background: BackgroundConfig = {
      entities: beachLikeEntities,
      spawnInterval: { normal: 1, boss: 1 },
      cloudSpawnChance: 0,
      midLayerSpawnTypes: [],
    };
    const out = spawnBackgroundEntities({
      isChaosMode: false,
      gameSpeed: 10,
      innerWidth: 800,
      innerHeight: 600,
      getBgEntityDef: makeGetDef(beachLikeEntities),
      background,
    });
    expect(out).toEqual([]);
  });
});
