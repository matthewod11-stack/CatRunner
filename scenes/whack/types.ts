/** Whack scene managers — shared contract (matches platformer pattern). */

export interface SceneManager {
  create(): void;
  update(time: number, delta: number): void;
  destroy(): void;
}

export const DEPTH = {
  BG: 0,
  HOLES: 5,
  MICE: 10,
  BOSS: 12,
  EFFECTS: 30,
  HUD: 50,
} as const;
