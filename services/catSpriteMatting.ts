/**
 * Flood-fill matting from image edges: removes edge-connected light pixels
 * and chroma-key magenta (#FF00FF-style) while preserving interior white fur.
 *
 * A second pass removes magenta that is *enclosed* by the sprite (e.g. between
 * legs): edge BFS never reaches those pixels, so we strip remaining chroma-key
 * pixels globally — but never “light” pixels, so interior white fur stays safe.
 *
 * Pixel logic lives in `catSpriteMattingCore.ts` (shared with server/sharp).
 */

import { matCatSpriteRgbaInPlace } from './catSpriteMattingCore';

export function matCustomCatDataUrlFromImageData(
  imageData: ImageData,
  width: number,
  height: number
): string {
  matCatSpriteRgbaInPlace(imageData.data, width, height);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

export function matCustomCatDataUrl(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!dataUrl.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onerror = () => reject(new Error('Failed to load image for matting'));
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('2d context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      try {
        resolve(matCustomCatDataUrlFromImageData(imageData, canvas.width, canvas.height));
      } catch (e) {
        reject(e);
      }
    };
    img.src = dataUrl;
  });
}
