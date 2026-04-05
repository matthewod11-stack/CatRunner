import type { SnakeLevelConfig } from '../types';

export const GARDEN_SNAKE_LEVEL_CONFIG: SnakeLevelConfig = {
  id: 'GARDEN_SNAKE',
  name: 'Garden Snake',
  genre: 'snake',
  description: 'Grow your tail in the garden — then survive the patrol!',
  catPose: 'slitherer',
  victoryCondition: { type: 'goal', description: 'Survive the garden patrol' },
  starThresholds: [200, 500, 900],

  gridCols: 20,
  gridRows: 15,
  cellSize: 36,

  startLength: 3,
  baseMoveInterval: 180,
  minMoveInterval: 70,
  wallCount: 8,
  normalPhaseMs: 75_000,
  finaleDurationMs: 20_000,
  escalation: {
    speedStepAmount: 4,
    speedStepEveryMs: 10_000,
    extraWallAtElapsedMs: [25_000, 50_000],
  },

  bgColor: '#1a2e1a',
  startLives: 3,
};
