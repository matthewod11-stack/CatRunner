import sharp from 'sharp';
import { matCatSpriteRgbaInPlace } from '../services/catSpriteMattingCore';

const MAX_MAT_DIMENSION = 4096;

/**
 * Decode PNG data URL, run the same RGBA matting as the client, re-encode PNG.
 * Returns the original data URL if input is not a PNG data URL or matting fails.
 */
export async function matPngDataUrlServer(dataUrl: string): Promise<string> {
  const m = /^data:image\/png;base64,(.+)$/i.exec(dataUrl.trim());
  if (!m) {
    console.warn('[matCustomCatSprite] expected PNG data URL, skipping server matting');
    return dataUrl;
  }

  const input = Buffer.from(m[1], 'base64');
  const meta = await sharp(input).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (!w || !h || w > MAX_MAT_DIMENSION || h > MAX_MAT_DIMENSION) {
    console.warn('[matCustomCatSprite] invalid or oversized dimensions, skipping matting', { w, h });
    return dataUrl;
  }

  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.channels !== 4) {
    console.warn('[matCustomCatSprite] expected RGBA after ensureAlpha');
    return dataUrl;
  }

  const rgba = Uint8ClampedArray.from(data);
  matCatSpriteRgbaInPlace(rgba, info.width, info.height);

  const out = await sharp(Buffer.from(rgba), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();

  return `data:image/png;base64,${out.toString('base64')}`;
}

export async function tryMatPngDataUrlServer(dataUrl: string): Promise<string> {
  try {
    return await matPngDataUrlServer(dataUrl);
  } catch (err) {
    console.error('[matCustomCatSprite] server matting failed, returning raw image', err);
    return dataUrl;
  }
}
