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
      const health = row < 2 ? 3 : row < 4 ? 2 : 1;
      const points = health * 10;
      const color = COLORS[row % COLORS.length];
      const b: BreakoutBrick = { col, row, health, color, points };

      if (row === 0 && col === Math.floor(cols / 2)) {
        b.kind = 'EXPLOSIVE';
      }
      if (row === 3 && col === 2) {
        b.kind = 'POWERUP_CARRIER';
        b.powerupDrop = 'WIDE_PADDLE';
      }
      if (row === 3 && col === 7) {
        b.kind = 'POWERUP_CARRIER';
        b.powerupDrop = 'MULTI_BALL';
      }

      bricks.push(b);
    }
  }
  return bricks;
}

function generateWaveTwoBricks(): BreakoutBrick[] {
  return generateBrickGrid(8, 5).map((brick) =>
    brick.col === 4 && brick.row === 2
      ? { ...brick, kind: 'YARN_KNOT' as const, health: 8, points: 200, color: 0xaa66ee }
      : brick
  );
}

// ─── Level Config ───────────────────────────────────────────────────

const wave0Bricks = generateBrickGrid(10, 7);
const wave1Bricks = generateWaveTwoBricks();

export const YARN_LEVEL_CONFIG: BreakoutLevelConfig = {
  id: 'YARN',
  name: 'Yarn Ball Bounce',
  genre: 'breakout',
  description: 'Break through the yarn wall with your bouncing ball!',
  catPose: 'paddle',
  victoryCondition: { type: 'clear', description: 'Break all blocks' },
  starThresholds: [200, 500, 800],

  bricks: wave0Bricks,
  waves: [wave0Bricks, wave1Bricks],

  miniboss: {
    patrolSpeedPx: 120,
    bonusDestroyPoints: 200,
  },

  waveTransition: {
    minDelayMs: 300,
    skippableWithSpace: true,
    autoAdvanceMs: 1200,
  },
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

  bgColor: '#1a1028',

  background: {
    floorBandColor: '#2a1820',
    floorBandHeightPx: 56,
  },

  powerups: {
    widePaddleScale: 1.45,
    widePaddleDurationMs: 12000,
    slowBallDurationMs: 8000,
    slowMaxSpeedFactor: 0.5,
    maxBalls: 3,
    carrierDropChance: 1,
    randomDropChance: 0.04,
    pitySlowThreshold: 12,
    pityMultiThreshold: 14,
  },

  hazards: {
    enableDriftingFluff: false,
    fluffNudgeRad: 0.1,
  },

  finale: {
    enableUnravelCelebration: true,
    unravelDurationMs: 1600,
  },

  startLives: 3,
};
