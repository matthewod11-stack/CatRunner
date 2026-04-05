export const DEPTH = {
  BG: 0,
  WALLS: 5,
  FOOD: 8,
  DOG: 9,
  SNAKE: 10,
  EFFECTS: 30,
  HUD: 50,
} as const;

export interface SceneManager {
  create(): void;
  update(time: number, delta: number): void;
  destroy(): void;
}

export function gridKey(col: number, row: number): string {
  return `${col},${row}`;
}
