import type { ClimberLevelConfig } from '../types';

export const CAT_TREE_LEVEL_CONFIG: ClimberLevelConfig = {
  id: 'CAT_TREE',
  name: 'The Cat Tree',
  genre: 'climber',
  description: 'Climb to the top of the ultimate cat tree!',
  catPose: 'climber',
  victoryCondition: { type: 'goal', description: 'Reach the top' },
  starThresholds: [250, 500, 1000],

  scrollSpeed: 30,
  scrollAcceleration: 0.005,
  maxScrollSpeed: 80,

  platformConfig: {
    widthRange: [60, 140],
    gapYRange: [60, 120],
    springChance: 0.15,
    breakableChance: 0.1,
  },

  enemyConfig: {
    spawnDensity: 0.35,
    patrolSpeed: 80,
    hitboxWidth: 28,
    hitboxHeight: 24,
  },
  prickleConfig: {
    chancePerPlatform: 0.06,
    stripWidthFraction: 0.35,
  },
  stickyPawsConfig: {
    durationMs: 3200,
    spawnDensity: 0.12,
    verticalStripWidth: 14,
    verticalStripHeight: 72,
    maxSlideSpeed: 120,
    horizontalSlideAccel: 280,
  },
  summitConfig: {
    entryWorldY: -9200,
    parTimeMs: 240000,
  },

  moveSpeed: 300,
  bounceForce: 500,
  victoryHeight: 10000,

  bgColor: '#1a1a2e',
  startLives: 3,
};
