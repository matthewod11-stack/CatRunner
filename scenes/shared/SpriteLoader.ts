import Phaser from 'phaser';

/** Phaser texture key for the player's cat sprite. */
export const CAT_TEXTURE_KEY = 'cat-sprite';

/**
 * Load a cat sprite blob URL into Phaser's texture cache.
 * Call this in a scene's `preload()` method — the texture
 * will be available by the time `create()` runs.
 *
 * If blobUrl is null, no texture is loaded (use a fallback in create).
 */
export function loadCatSprite(scene: Phaser.Scene, blobUrl: string | null): void {
  if (!blobUrl) return;
  scene.load.image(CAT_TEXTURE_KEY, blobUrl);
}
