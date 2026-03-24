import type { BreakoutLevelConfig, BreakoutBrick } from '../types';

// ─── Brick layout generator ─────────────────────────────────────────

const COLORS = [
  0xff4444, // red
  0xff8844, // orange
  0xffcc44, // yellow
  0x44cc44, // green
  0x4488ff, // blue
  0x8844ff, // purple
  0xff44cc, // pink
];

function generateBrickGrid(cols: number, rows: number): BreakoutBrick[] {
  const bricks: BreakoutBrick[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Top rows are tougher
      const health = row < 2 ? 3 : row < 4 ? 2 : 1;
      const points = health * 10;
      const color = COLORS[row % COLORS.length];
      bricks.push({ col, row, health, color, points });
    }
  }
  return bricks;
}

// ─── Level Config ───────────────────────────────────────────────────

export const YARN_LEVEL_CONFIG: BreakoutLevelConfig = {
  id: 'YARN',
  name: 'Yarn Ball Bounce',
  genre: 'breakout',
  description: 'Break through the yarn wall with your bouncing ball!',
  catPose: 'paddle',
  victoryCondition: { type: 'clear', description: 'Break all blocks' },
  starThresholds: [200, 500, 800],

  bricks: generateBrickGrid(10, 7),
  gridCols: 10,
  gridRows: 7,
  brickWidth: 80,
  brickHeight: 24,

  paddleConfig: {
    width: 120,
    height: 16,
    speed: 500,
    y: 60, // from bottom
  },

  ballConfig: {
    radius: 8,
    speed: 350,
    speedIncrement: 3,
    maxSpeed: 600,
  },

  bgColor: '#1a1028', // dark purple

  startLives: 3,
};
