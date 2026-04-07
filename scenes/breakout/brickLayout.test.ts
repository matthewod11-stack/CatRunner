import { describe, it, expect } from 'vitest';
import { placeBricks, countBricks } from './brickLayout';
import type { BreakoutLevelConfig, BreakoutBrick } from '../../types';

const mkBrick = (col: number, row: number): BreakoutBrick => ({
  col,
  row,
  health: 1,
  color: 0xff0000,
  points: 10,
});

const baseConfig = (): BreakoutLevelConfig => ({
  id: 'YARN',
  name: 'Test',
  genre: 'breakout',
  description: '',
  catPose: 'paddle',
  victoryCondition: { type: 'clear', description: '' },
  starThresholds: [1, 2, 3],
  bricks: [mkBrick(0, 0), mkBrick(1, 0)],
  gridCols: 10,
  gridRows: 2,
  brickWidth: 80,
  brickHeight: 24,
  paddleConfig: { width: 120, height: 16, speed: 500, y: 60 },
  ballConfig: { radius: 8, speed: 350, speedIncrement: 3, maxSpeed: 600 },
  bgColor: '#000000',
  startLives: 3,
});

describe('placeBricks', () => {
  it('centers grid horizontally', () => {
    const cfg = baseConfig();
    const placed = placeBricks(800, cfg);
    const xs = placed.map((p) => p.centerX);
    expect(Math.min(...xs)).toBeGreaterThan(0);
    expect(Math.max(...xs)).toBeLessThan(800);
  });

  it('returns one entry per brick def', () => {
    const cfg = baseConfig();
    expect(countBricks(placeBricks(800, cfg))).toBe(2);
  });

  it('places col 0 at left half of centered grid', () => {
    const cfg = baseConfig();
    const placed = placeBricks(800, cfg);
    const left = placed.find((p) => p.def.col === 0)!;
    const right = placed.find((p) => p.def.col === 1)!;
    expect(left.centerX).toBeLessThan(right.centerX);
  });

  it('uses explicit brickList when provided instead of config.bricks', () => {
    const cfg = baseConfig();
    const override: BreakoutBrick[] = [mkBrick(2, 1)];
    const placed = placeBricks(800, cfg, override);
    expect(placed).toHaveLength(1);
    expect(placed[0].def).toBe(override[0]);
    expect(placed[0].centerX).toBeGreaterThan(0);
  });
});
