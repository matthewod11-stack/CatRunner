import type { PlatformKind } from './types';

/** Relative summit gauntlet segment (anchor is typically summit entry world Y). */
export interface SummitSegmentDef {
  /** Added to anchorWorldY; negative = higher on the tree */
  yOffset: number;
  /** 0–1 across the space between left/right screen margins (0.5 = horizontal center) */
  centerXFraction: number;
  width: number;
  kind: PlatformKind;
}

/** Fixed routing layout: 10 platforms, bottom → top. */
export const SUMMIT_SEGMENTS: readonly SummitSegmentDef[] = [
  { yOffset: -90, centerXFraction: 0.52, width: 110, kind: 'solid' },
  { yOffset: -220, centerXFraction: 0.28, width: 95, kind: 'spring' },
  { yOffset: -360, centerXFraction: 0.72, width: 100, kind: 'solid' },
  { yOffset: -500, centerXFraction: 0.45, width: 88, kind: 'breakable' },
  { yOffset: -640, centerXFraction: 0.62, width: 105, kind: 'solid' },
  { yOffset: -790, centerXFraction: 0.35, width: 92, kind: 'spring' },
  { yOffset: -940, centerXFraction: 0.55, width: 98, kind: 'solid' },
  { yOffset: -1090, centerXFraction: 0.78, width: 85, kind: 'breakable' },
  { yOffset: -1240, centerXFraction: 0.42, width: 112, kind: 'solid' },
  { yOffset: -1400, centerXFraction: 0.5, width: 130, kind: 'solid' },
];

const SCREEN_MARGIN = 20;

export interface SummitPlatformPlaced {
  worldY: number;
  centerX: number;
  width: number;
  kind: PlatformKind;
}

export function buildSummitPlatforms(
  anchorWorldY: number,
  screenWidth: number,
): SummitPlatformPlaced[] {
  return SUMMIT_SEGMENTS.map((seg) => {
    const worldY = anchorWorldY + seg.yOffset;
    const half = seg.width / 2;
    const minCx = half + SCREEN_MARGIN;
    const maxCx = screenWidth - half - SCREEN_MARGIN;
    const innerLeft = SCREEN_MARGIN;
    const innerRight = screenWidth - SCREEN_MARGIN;
    const innerSpan = Math.max(0, innerRight - innerLeft);
    const rawCenter = innerSpan > 0 ? innerLeft + seg.centerXFraction * innerSpan : screenWidth / 2;
    const centerX = minCx <= maxCx ? Math.min(maxCx, Math.max(minCx, rawCenter)) : screenWidth / 2;
    return { worldY, centerX, width: seg.width, kind: seg.kind };
  });
}
