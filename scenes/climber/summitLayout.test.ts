import { describe, it, expect } from 'vitest';
import { buildSummitPlatforms, SUMMIT_SEGMENTS } from './summitLayout';

describe('buildSummitPlatforms', () => {
  it('produces strictly decreasing worldY (climbing order)', () => {
    const plats = buildSummitPlatforms(-9200, 800);
    for (let i = 1; i < plats.length; i += 1) {
      expect(plats[i].worldY).toBeLessThan(plats[i - 1].worldY);
    }
  });

  it('keeps every width positive and within screen', () => {
    const w = 640;
    const plats = buildSummitPlatforms(-9000, w, 12);
    for (const p of plats) {
      expect(p.width).toBeGreaterThan(0);
      expect(p.width).toBeLessThan(w);
    }
  });

  it('keeps platform spans inside horizontal margins', () => {
    const screenWidth = 480;
    const margin = 16;
    const plats = buildSummitPlatforms(-9100, screenWidth, margin);
    for (const p of plats) {
      const left = p.centerX - p.width / 2;
      const right = p.centerX + p.width / 2;
      expect(left).toBeGreaterThanOrEqual(margin - 1e-6);
      expect(right).toBeLessThanOrEqual(screenWidth - margin + 1e-6);
    }
  });

  it('offsets worldY from anchor by segment table', () => {
    const anchor = -5000;
    const plats = buildSummitPlatforms(anchor, 600);
    expect(plats.length).toBe(SUMMIT_SEGMENTS.length);
    expect(plats[0].worldY).toBe(anchor + SUMMIT_SEGMENTS[0].yOffset);
  });
});
