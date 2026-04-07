import { it, expect } from 'vitest';
import { getBricksForWave, waveCount } from './breakoutWaves';
import type { BreakoutBrick, BreakoutLevelConfig } from '../../types';

const base = {
  id: 'YARN',
  name: 't',
  genre: 'breakout' as const,
  description: '',
  catPose: 'paddle' as const,
  victoryCondition: { type: 'clear' as const, description: '' },
  starThresholds: [1, 2, 3],
  gridCols: 1,
  gridRows: 1,
  brickWidth: 10,
  brickHeight: 10,
  paddleConfig: { width: 1, height: 1, speed: 1, y: 1 },
  ballConfig: { radius: 1, speed: 1, speedIncrement: 0, maxSpeed: 1 },
  bgColor: '#000',
  startLives: 3,
};

it('uses waves when present', () => {
  const a: BreakoutBrick = { col: 0, row: 0, health: 1, color: 0xff0000, points: 1 };
  const b: BreakoutBrick = { col: 0, row: 0, health: 2, color: 0x00ff00, points: 2 };
  const cfg = { ...base, bricks: [a], waves: [[a], [b]] } as BreakoutLevelConfig;
  expect(getBricksForWave(cfg, 0)).toEqual([a]);
  expect(getBricksForWave(cfg, 1)).toEqual([b]);
  expect(waveCount(cfg)).toBe(2);
});

it('falls back to bricks for single wave', () => {
  const a: BreakoutBrick = { col: 0, row: 0, health: 1, color: 0xff0000, points: 1 };
  const cfg = { ...base, bricks: [a] } as BreakoutLevelConfig;
  expect(getBricksForWave(cfg, 0)).toEqual([a]);
  expect(getBricksForWave(cfg, 1)).toEqual([]);
  expect(waveCount(cfg)).toBe(1);
});
