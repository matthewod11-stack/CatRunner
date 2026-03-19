/**
 * Shared flood-fill matting (RGBA in memory). Used by the browser canvas path and
 * Node/sharp server path so results stay aligned.
 */

/** Blue / periwinkle clothing (B > R with mid G) sits near #FF00FF in RGB distance — never treat as key. */
function isBlueShiftedFabric(r: number, g: number, b: number): boolean {
  return b > r + 26 && g > 88;
}

/**
 * Tan / beige fabric: R≈G≈B-ish, neither corner is screen-magenta (both R and B sky-high).
 * Excluded only from *distance* chroma — true #FF00FF family still hits isMagentaKey when G is low enough.
 */
function isLikelyWarmTanOrBeige(r: number, g: number, b: number): boolean {
  if (r > 228 && b > 228) return false;
  return (
    r > 135 &&
    g > 100 &&
    b > 60 &&
    r - g < 58 &&
    b - g < 48 &&
    g - b < 58
  );
}

function isBackgroundPixel(data: Uint8ClampedArray, i: number): boolean {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];

  const isLight = r > 230 && g > 230 && b > 230;

  if (isBlueShiftedFabric(r, g, b)) {
    return isLight;
  }

  const isMagentaKey =
    g < 168 &&
    r > 105 &&
    b > 105 &&
    r - g > 22 &&
    b - g > 18 &&
    r + b > g * 1.95;

  const distSq = (r - 255) * (r - 255) + g * g + (b - 255) * (b - 255);
  const rbVsG = Math.max(r, b) - g;
  const nearScreenMagenta =
    !isLikelyWarmTanOrBeige(r, g, b) && distSq < 64_000 && g < 195 && rbVsG >= 26;

  return isLight || isMagentaKey || nearScreenMagenta;
}

/** Magenta / chroma-hole pixels only — not white/light (never used for global white removal). */
function isRemainingChromaKey(data: Uint8ClampedArray, i: number): boolean {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];

  if (r > 230 && g > 230 && b > 230) return false;
  if (isBlueShiftedFabric(r, g, b)) return false;

  const distSq = (r - 255) * (r - 255) + g * g + (b - 255) * (b - 255);
  const rbVsG = Math.max(r, b) - g;
  const nearKey =
    !isLikelyWarmTanOrBeige(r, g, b) && distSq < 48_000 && rbVsG >= 26;

  const brightMagentaFringe =
    g < 148 &&
    r > 138 &&
    b > 138 &&
    r - g > 28 &&
    b - g > 22 &&
    r + b > g * 2.25;

  return nearKey || brightMagentaFringe;
}

/**
 * Mutates `data` in place (RGBA, row-major). Sets alpha to 0 for removed background / chroma-key.
 */
export function matCatSpriteRgbaInPlace(data: Uint8ClampedArray, width: number, height: number): void {
  const visited = new Set<number>();
  const toRemove = new Set<number>();
  const queue: number[] = [];

  for (let x = 0; x < width; x++) {
    queue.push(x);
    queue.push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    queue.push(y * width);
    queue.push(y * width + (width - 1));
  }

  while (queue.length > 0) {
    const pixelIndex = queue.shift()!;
    if (visited.has(pixelIndex)) continue;
    if (pixelIndex < 0 || pixelIndex >= width * height) continue;

    visited.add(pixelIndex);
    const i = pixelIndex * 4;

    if (!isBackgroundPixel(data, i)) continue;

    toRemove.add(pixelIndex);

    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);

    if (x > 0) queue.push(pixelIndex - 1);
    if (x < width - 1) queue.push(pixelIndex + 1);
    if (y > 0) queue.push(pixelIndex - width);
    if (y < height - 1) queue.push(pixelIndex + width);
  }

  for (const pixelIndex of toRemove) {
    data[pixelIndex * 4 + 3] = 0;
  }

  const len = width * height;
  for (let p = 0; p < len; p++) {
    const i = p * 4;
    if (data[i + 3] === 0) continue;
    if (isRemainingChromaKey(data, i)) {
      data[i + 3] = 0;
    }
  }
}
