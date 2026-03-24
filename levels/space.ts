import type { ShooterLevelConfig, ShooterWave } from '../types';

// ─── Wave definitions ───────────────────────────────────────────────

const WAVE_1: ShooterWave = {
  rows: [
    ['mouse', 'mouse', 'mouse', 'mouse', 'mouse'],
    [null, 'mouse', 'mouse', 'mouse', null],
  ],
  startY: 60,
  descentSpeed: 8,
  swayAmplitude: 80,
};

const WAVE_2: ShooterWave = {
  rows: [
    ['rat', null, 'rat', null, 'rat'],
    ['mouse', 'mouse', 'mouse', 'mouse', 'mouse'],
    [null, 'mouse', null, 'mouse', null],
  ],
  startY: 50,
  descentSpeed: 12,
  swayAmplitude: 100,
};

const WAVE_3: ShooterWave = {
  rows: [
    ['bat', 'bat', null, 'bat', 'bat'],
    ['rat', 'mouse', 'rat', 'mouse', 'rat'],
    ['mouse', 'mouse', 'mouse', 'mouse', 'mouse'],
  ],
  startY: 40,
  descentSpeed: 15,
  swayAmplitude: 120,
};

const WAVE_4: ShooterWave = {
  rows: [
    [null, 'bat', 'bat', 'bat', null],
    ['rat', 'rat', null, 'rat', 'rat'],
    ['mouse', 'rat', 'mouse', 'rat', 'mouse'],
    [null, 'mouse', 'mouse', 'mouse', null],
  ],
  startY: 30,
  descentSpeed: 18,
  swayAmplitude: 100,
};

// Boss wave — single large enemy
const BOSS_WAVE: ShooterWave = {
  rows: [
    [null, null, 'boss', null, null],
  ],
  startY: 80,
  descentSpeed: 5,
  swayAmplitude: 150,
};

// ─── Level Config ───────────────────────────────────────────────────

export const SPACE_LEVEL_CONFIG: ShooterLevelConfig = {
  id: 'SPACE',
  name: 'Cardboard Cosmos',
  genre: 'shooter',
  description: 'Defend your cardboard spaceship from alien mice!',
  catPose: 'pilot',
  victoryCondition: { type: 'boss', bossId: 'mouseKing' },
  starThresholds: [300, 600, 1000],

  theme: {
    starDensity: 0.3,
    bgColor: '#0a0a1a',
    nebulaColor: '#2d1b4e',
    particleColors: {
      dust: '#8888ff',
      impact: '#ff4444',
      coinCollect: '#ffdd44',
    },
  },

  enemies: {
    mouse: { type: 'mouse', health: 1, points: 10, speed: 40, shoots: false },
    rat:   { type: 'rat',   health: 2, points: 25, speed: 50, shoots: true, fireRate: 0.5 },
    bat:   { type: 'bat',   health: 1, points: 15, speed: 70, shoots: false },
    boss:  { type: 'mouse', health: 20, points: 500, speed: 30, shoots: true, fireRate: 2 },
  },

  waves: [WAVE_1, WAVE_2, WAVE_3, WAVE_4, BOSS_WAVE],

  playerConfig: {
    moveSpeed: 350,
    fireRate: 5,     // 5 shots per second
    bulletSpeed: 500,
  },

  startLives: 3,
};
