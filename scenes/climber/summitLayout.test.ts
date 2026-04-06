import { describe, it, expect } from 'vitest';
import { SUMMIT_SEGMENTS, buildSummitPlatforms } from './summitLayout';

const MARGIN = 20;

describe('SUMMIT_SEGMENTS', () => {
  it('has between 8 and 12 platforms', () => {
    expect(SUMMIT_SEGMENTS.length).toBeGreaterThanOrEqual(8);
    expect(SUMMIT_SEGMENTS.length).toBeLessThanOrEqual(12);
  });
});

describe('buildSummitPlatforms', () => {
  it('worldY is strictly decreasing (climbing order)', () => {
    const placed = buildSummitPlatforms(-9000, 640);
    for (let i = 1; i < placed.length; i += 1) {
      expect(placed[i].worldY).toBeLessThan(placed[i - 1].worldY);
    }
  });

  it('all widths are positive', () => {
    const placed = buildSummitPlatforms(-9200, 480);
    for (const p of placed) {
      expect(p.width).toBeGreaterThan(0);
    }
  });

  it('platforms stay on-screen with margin', () => {
    const w = 720;
    const placed = buildSummitPlatforms(-9100, w);
    for (const p of placed) {
      const left = p.centerX - p.width / 2;
      const right = p.centerX + p.width / 2;
      expect(left).toBeGreaterThanOrEqual(MARGIN - 1e-6);
      expect(right).toBeLessThanOrEqual(w - MARGIN + 1e-6);
    }
  });
});
