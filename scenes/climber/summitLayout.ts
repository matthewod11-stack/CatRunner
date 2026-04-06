import type { PlatformKind } from './types';

const MARGIN = 16;

/** One summit gauntlet platform relative to the summit anchor (world Y). */
export interface SummitSegmentDef {
  /** Offset from anchor; negative = higher on the tree */
  relativeWorldY: number;
  /** Ideal center X as fraction of screen width [0, 1] before on-screen clamp */
  centerXFraction: number;
  width: number;
  kind: PlatformKind;
}

/** Fixed routing layout: 10 platforms zig-zagging toward the goal. */
export const SUMMIT_SEGMENTS: SummitSegmentDef[] = [
  { relativeWorldY: 0, centerXFraction: 0.5, width: 100, kind: 'solid' },
  { relativeWorldY: -72, centerXFraction: 0.28, width: 88, kind: 'solid' },
  { relativeWorldY: -144, centerXFraction: 0.72, width: 92, kind: 'spring' },
  { relativeWorldY: -220, centerXFraction: 0.4, width: 80, kind: 'solid' },
  { relativeWorldY: -300, centerXFraction: 0.6, width: 84, kind: 'breakable' },
  { relativeWorldY: -380, centerXFraction: 0.32, width: 76, kind: 'solid' },
  { relativeWorldY: -455, centerXFraction: 0.68, width: 88, kind: 'solid' },
  { relativeWorldY: -535, centerXFraction: 0.45, width: 72, kind: 'spring' },
  { relativeWorldY: -610, centerXFraction: 0.55, width: 80, kind: 'solid' },
  { relativeWorldY: -700, centerXFraction: 0.5, width: 96, kind: 'solid' },
];

export interface SummitPlatformInstance {
  worldY: number;
  centerX: number;
  width: number;
  kind: PlatformKind;
}

/**
 * Converts segment definitions to absolute world positions, clamping centers so each
 * platform fits inside the screen with `MARGIN` inset.
 */
export function buildSummitPlatforms(
  anchorWorldY: number,
  screenWidth: number,
): SummitPlatformInstance[] {
  return SUMMIT_SEGMENTS.map((seg) => {
    const worldY = anchorWorldY + seg.relativeWorldY;
    const idealCenterX = seg.centerXFraction * screenWidth;
    const halfW = seg.width / 2;
    const minC = MARGIN + halfW;
    const maxC = screenWidth - MARGIN - halfW;
    const centerX = Math.max(minC, Math.min(maxC, idealCenterX));
    return { worldY, centerX, width: seg.width, kind: seg.kind };
  });
}
