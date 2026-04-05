/** Platformer-specific runtime types — enums, constants, interfaces for managers. */

export type PlatformerEnemyType = 'PIGEON' | 'RAT' | 'RACCOON';
export type PlatformerHazardType = 'AC_UNIT' | 'CLOTHESLINE' | 'SATELLITE_DISH' | 'NEON_SIGN';
export type PlatformerPowerupType = 'TRIPLE_JUMP' | 'GLIDE' | 'SHIELD';

export interface BuildingData {
  x: number;
  width: number;
  height: number;
  rooftopY: number;
  zoneIndex: number;
}

export interface FireEscapeData {
  x: number;
  y: number;
  width: number;
  buildingIndex: number;
  side: 'left' | 'right';
}

export interface EnemySpawn {
  type: PlatformerEnemyType;
  buildingIndex: number;
  x: number;
  rooftopY: number;
  rooftopWidth: number;
}

export interface HazardSpawn {
  type: PlatformerHazardType;
  x: number;
  y: number;
  config?: Record<string, unknown>;
}

export type BossPhaseId = 1 | 2 | 3;

export interface BossPhaseState {
  phase: BossPhaseId;
  hp: number;
  swoopCount: number;
  isLanded: boolean;
  landTimer: number;
  miniPigeonCount: number;
}

/** Depth layer constants for platformer scene */
export const DEPTH = {
  BG_FAR: 0,
  BG_MID: 1,
  BUILDINGS: 5,
  PLATFORMS: 10,
  HAZARDS: 12,
  COINS: 15,
  POWERUPS: 16,
  ENEMIES: 18,
  PLAYER: 20,
  EFFECTS: 30,
  HUD: 50,
} as const;

/** Manager contract — all managers implement this */
export interface SceneManager {
  create(): void;
  update(time: number, delta: number): void;
  destroy(): void;
}
