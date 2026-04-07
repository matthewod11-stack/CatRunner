/** Breakout scene — depth layers and manager contract (campaign types live in `types.ts`). */

export const DEPTH = {
  BG: 0,
  BRICKS: 10,
  BALL: 15,
  PADDLE: 20,
  POWERUP: 18,
  HAZARD: 8,
  EFFECTS: 30,
  HUD: 50,
} as const;

export interface SceneManager {
  create(): void;
  update(time: number, delta: number): void;
  destroy(): void;
}
