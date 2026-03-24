import type { SnakeLevelConfig } from '../types';

export const GARDEN_SNAKE_LEVEL_CONFIG: SnakeLevelConfig = {
  id: 'GARDEN_SNAKE',
  name: 'Garden Snake',
  genre: 'snake',
  description: 'Grow your tail by eating treats in the garden!',
  catPose: 'slitherer',
  victoryCondition: { type: 'survive', durationMs: 120000 },
  starThresholds: [200, 500, 900],

  gridCols: 20,
  gridRows: 15,
  cellSize: 36,

  startLength: 3,
  baseMoveInterval: 180,
  minMoveInterval: 80,
  wallCount: 8,
  surviveTimeMs: 120000, // 2 minutes

  bgColor: '#1a2e1a',
  startLives: 3,
};
