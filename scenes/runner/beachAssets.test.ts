import { describe, expect, it } from 'vitest';
import {
  BEACH_BACKGROUND_TEXTURES,
  BEACH_BOSS_TEXTURES,
  BEACH_IMAGE_LOADS,
  BEACH_OBSTACLE_TEXTURES,
  BEACH_OBSTACLE_VARIANTS,
  BEACH_SHELL_PROJECTILE_TEXTURE,
} from './beachAssets';

describe('Beach asset manifest', () => {
  const loadedKeys = new Set(BEACH_IMAGE_LOADS.map(asset => asset.key));

  it('uses unique Phaser texture keys', () => {
    expect(loadedKeys.size).toBe(BEACH_IMAGE_LOADS.length);
  });

  it('loads every mapped gameplay texture', () => {
    for (const textureKey of Object.values(BEACH_OBSTACLE_TEXTURES)) {
      expect(loadedKeys.has(textureKey)).toBe(true);
    }
    for (const variantKeys of Object.values(BEACH_OBSTACLE_VARIANTS)) {
      for (const textureKey of variantKeys) {
        expect(loadedKeys.has(textureKey)).toBe(true);
      }
    }
    for (const textureKey of Object.values(BEACH_BACKGROUND_TEXTURES)) {
      expect(loadedKeys.has(textureKey)).toBe(true);
    }
    for (const textureKey of Object.values(BEACH_BOSS_TEXTURES)) {
      expect(loadedKeys.has(textureKey)).toBe(true);
    }
    expect(loadedKeys.has(BEACH_SHELL_PROJECTILE_TEXTURE)).toBe(true);
  });

  it('does not reuse the coin texture for non-coin gameplay elements', () => {
    expect(BEACH_OBSTACLE_TEXTURES.SAND_PROJECTILE).not.toBe(BEACH_OBSTACLE_TEXTURES.COIN);
    expect(BEACH_OBSTACLE_TEXTURES.SPEED).not.toBe(BEACH_OBSTACLE_TEXTURES.COIN);
    expect(BEACH_OBSTACLE_TEXTURES.MAGNET).not.toBe(BEACH_OBSTACLE_TEXTURES.COIN);
    expect(BEACH_OBSTACLE_TEXTURES.SUPER_SIZE).not.toBe(BEACH_OBSTACLE_TEXTURES.COIN);
  });

  it('loads Beach gameplay art from committed bundled assets only', () => {
    for (const asset of BEACH_IMAGE_LOADS) {
      expect(asset.path).not.toMatch(/^(https?:|blob:)/);
      expect(
        asset.path.startsWith('data:image/svg+xml') || asset.path.includes('/assets/'),
      ).toBe(true);
    }
  });
});
