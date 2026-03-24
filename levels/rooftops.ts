import type { PlatformerLevelConfig } from '../types';

export const ROOFTOPS_LEVEL_CONFIG: PlatformerLevelConfig = {
  id: 'ROOFTOPS',
  name: 'City Heights',
  genre: 'platformer',
  description: 'Jump across rooftops and dodge pigeons above the city!',
  catPose: 'platformer',
  victoryCondition: { type: 'goal', description: 'Reach the penthouse' },
  starThresholds: [150, 400, 700],

  theme: {
    skyGradient: ['#0a0a2e', '#1a1a4e'], // deep night sky
    platformColor: '#4a4a5a',              // concrete rooftops
    platformEdgeColor: '#6a6a7a',          // lighter edge
    buildingColors: ['#1a1a2e', '#2a2a3e', '#1e1e30', '#252540'],
    particleColors: {
      dust: '#8888aa',
      impact: '#ff6644',
      coinCollect: '#ffdd44',
    },
  },

  generation: {
    platformWidthRange: [120, 280],
    gapRange: [80, 160],
    heightStepRange: [-60, 80], // can go down a bit, mostly climbs
    gapScaling: 0.008,          // gaps widen 8px per 1000px traveled
    startY: 500,                // starting platform Y (from top)
    deathY: 800,                // fall below this = death
  },

  victoryDistance: 15_000, // ~15k pixels to reach the penthouse

  playerConfig: {
    moveSpeed: 250,   // pixels/sec horizontal
    jumpForce: 480,   // pixels/sec upward impulse
    gravity: 1000,    // pixels/sec² downward
    maxJumps: 2,      // double jump
  },

  startLives: 3,
};
