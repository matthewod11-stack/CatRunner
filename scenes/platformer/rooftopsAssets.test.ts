import { describe, expect, it } from 'vitest';
import {
  ROOFTOPS_BACKGROUND_TEXTURES,
  ROOFTOPS_BOSS_TEXTURES,
  ROOFTOPS_COLLECTIBLE_TEXTURES,
  ROOFTOPS_ENEMY_TEXTURES,
  ROOFTOPS_ENEMY_VARIANTS,
  ROOFTOPS_ENTITY_TEXTURES,
  ROOFTOPS_FX_TEXTURES,
  ROOFTOPS_HAZARD_TEXTURES,
  ROOFTOPS_IMAGE_LOADS,
  ROOFTOPS_NEON_TEXTURES,
  ROOFTOPS_PIXELATED_TEXTURE_KEYS,
  ROOFTOPS_POWERUP_TEXTURES,
} from './rooftopsAssets';

describe('City Heights asset manifest', () => {
  const loadedKeys = new Set(ROOFTOPS_IMAGE_LOADS.map(asset => asset.key));

  it('uses unique Phaser texture keys', () => {
    expect(loadedKeys.size).toBe(ROOFTOPS_IMAGE_LOADS.length);
  });

  it('loads every mapped gameplay texture', () => {
    for (const textureKey of Object.values(ROOFTOPS_BACKGROUND_TEXTURES)) expect(loadedKeys.has(textureKey)).toBe(true);
    for (const textureKey of Object.values(ROOFTOPS_ENTITY_TEXTURES)) expect(loadedKeys.has(textureKey)).toBe(true);
    for (const textureKey of Object.values(ROOFTOPS_ENEMY_TEXTURES)) expect(loadedKeys.has(textureKey)).toBe(true);
    for (const variant of Object.values(ROOFTOPS_ENEMY_VARIANTS)) {
      for (const textureKey of Object.values(variant)) expect(loadedKeys.has(textureKey)).toBe(true);
    }
    for (const textureKey of Object.values(ROOFTOPS_HAZARD_TEXTURES)) expect(loadedKeys.has(textureKey)).toBe(true);
    for (const textureKey of Object.values(ROOFTOPS_NEON_TEXTURES)) expect(loadedKeys.has(textureKey)).toBe(true);
    for (const textureKey of Object.values(ROOFTOPS_COLLECTIBLE_TEXTURES)) expect(loadedKeys.has(textureKey)).toBe(true);
    for (const textureKey of Object.values(ROOFTOPS_POWERUP_TEXTURES)) expect(loadedKeys.has(textureKey)).toBe(true);
    for (const textureKey of Object.values(ROOFTOPS_FX_TEXTURES)) expect(loadedKeys.has(textureKey)).toBe(true);
    for (const textureKey of Object.values(ROOFTOPS_BOSS_TEXTURES)) expect(loadedKeys.has(textureKey)).toBe(true);
  });

  it('keeps the texture keys available for nearest-neighbor filtering', () => {
    expect(ROOFTOPS_PIXELATED_TEXTURE_KEYS).toEqual(ROOFTOPS_IMAGE_LOADS.map(asset => asset.key));
  });

  it('loads City Heights art from committed local pixel assets only', () => {
    for (const asset of ROOFTOPS_IMAGE_LOADS) {
      expect(asset.path).not.toMatch(/^(https?:|blob:)/);
      expect(asset.path).toContain('/assets/');
      expect(asset.path).toContain('.png');
    }
  });
});
