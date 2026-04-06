export const DEPTH = {
  BG: 0,
  BG_PARALLAX_1: 1,
  BG_PARALLAX_2: 2,
  PLATFORMS: 10,
  PRICKLE: 11,
  POWERUP: 14,
  ENEMY: 16,
  PLAYER: 20,
  SUMMIT: 18,
  EFFECTS: 30,
  HUD: 50,
} as const;

export interface SceneManager {
  create(): void;
  update(time: number, delta: number): void;
  destroy(): void;
}

export type PlatformKind = 'solid' | 'spring' | 'breakable';

export interface GeneratedPlatformRow {
  worldY: number;
  centerX: number;
  width: number;
  kind: PlatformKind;
  /** If true, a vertical sticky strip exists centered on this platform */
  hasStickyStrip: boolean;
}
