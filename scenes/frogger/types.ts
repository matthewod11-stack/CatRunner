import type Phaser from 'phaser';
import type { FroggerLane } from '../../types';

export interface SceneManager {
  create(): void;
  update(time: number, delta: number): void;
  destroy(): void;
}

export const DEPTH = {
  BG: 0,
  LANES: 2,
  OBJECTS: 10,
  PLAYER: 20,
  EFFECTS: 30,
  HUD: 50,
} as const;

export interface TrafficEntry {
  sprite: Phaser.GameObjects.Rectangle;
  laneIndex: number;
  lane: FroggerLane;
}
