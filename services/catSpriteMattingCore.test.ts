import { describe, it, expect } from 'vitest';
import { matCatSpriteRgbaInPlace } from './catSpriteMattingCore';

function rgba3x3(
  fill: (x: number, y: number) => [number, number, number, number]
): Uint8ClampedArray {
  const w = 3;
  const h = 3;
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = fill(x, y);
      const i = (y * w + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }
  }
  return data;
}

describe('matCatSpriteRgbaInPlace', () => {
  it('flood-removes white edge but keeps opaque center (non-background color)', () => {
    const data = rgba3x3((x, y) => {
      if (x === 1 && y === 1) return [255, 0, 0, 255];
      return [255, 255, 255, 255];
    });
    matCatSpriteRgbaInPlace(data, 3, 3);
    const center = 1 * 3 + 1;
    expect(data[center * 4 + 3]).toBe(255);
    expect(data[0 * 4 + 3]).toBe(0);
    expect(data[2 * 4 + 3]).toBe(0);
  });
});
