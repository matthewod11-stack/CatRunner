import type { GameScore } from '../../types';

export const DEPTH = {
  BG: 0,
  WALL: 1,
  CABINET: 2,
  COUNTER: 5,
  SPILL: 6,
  BLOCKS: 10,
  CRITTERS: 12,
  PROJECTILE: 15,
  PLAYER: 20,
  AIM_LINE: 25,
  EFFECTS: 30,
  HUD: 50,
} as const;

/** Matches platformer `SceneManager` naming */
export interface SceneManager {
  create(): void;
  update(time: number, delta: number): void;
  destroy(): void;
}

/** Narrow facade passed to launcher managers from `LauncherScene` */
export interface LauncherSceneContext {
  getCounterY(): number;
  getLaunchPoint(): { x: number; y: number };
  addScore(delta: number, worldX: number, worldY: number, label?: string): void;
  getGameScore(): GameScore;
  onPowerCrateBroken(): void;
  loseLife(): void;
  emitLivesChanged(): void;
  playSfx(key: string): void;
  getCurrentRound(): number;
  isBossRound(): boolean;
}
