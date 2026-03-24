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

  moveSpeed: 300,
  bounceForce: 500,
  victoryHeight: 10000,

  bgColor: '#1a1a2e',
  startLives: 3,
};
