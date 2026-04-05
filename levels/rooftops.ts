import type { PlatformerLevelConfig } from '../types';

export const ROOFTOPS_LEVEL_CONFIG: PlatformerLevelConfig = {
  id: 'ROOFTOPS',
  name: 'City Heights',
  genre: 'platformer',
  description: 'Jump across rooftops and dodge pigeons above the city!',
  catPose: 'platformer',
  victoryCondition: { type: 'goal', description: 'Reach the penthouse' },
  starThresholds: [500, 1500, 3500],

  theme: {
    skyGradient: ['#ff6b35', '#1a1a3e'],
    skyGradientZone3: ['#e85d26', '#1a1a3e'],
    platformColor: '#8b7355',
    platformEdgeColor: '#a89070',
    buildingColors: ['#1a1a2e', '#151528', '#1e1e35', '#191930', '#252540'],
    farSkylineColor: '#0d0d2b',
    midSkylineColor: '#1a1a3e',
    particleColors: {
      dust: '#8888aa',
      impact: '#ff6644',
      coinCollect: '#ffdd44',
    },
  },

  generation: {
    platformWidthRange: [120, 280],
    gapRange: [80, 160],
    heightStepRange: [-60, 80],
    gapScaling: 0.008,
    startY: 500,
    deathY: 800,
  },

  zones: [
    {
      startDistance: 0,
      endDistance: 4000,
      generation: { platformWidthRange: [140, 240], gapRange: [60, 100], heightStepRange: [-30, 50] },
      enemies: [{ type: 'PIGEON', density: 2 }],
      hazards: [{ type: 'AC_UNIT', frequency: 1.5 }],
      fireEscapeChance: 0.1,
      coinDensity: 0.7,
    },
    {
      startDistance: 4000,
      endDistance: 9000,
      generation: { platformWidthRange: [100, 200], gapRange: [80, 140], heightStepRange: [-50, 70] },
      enemies: [{ type: 'PIGEON', density: 1.5 }, { type: 'RAT', density: 1 }],
      hazards: [{ type: 'AC_UNIT', frequency: 1 }, { type: 'CLOTHESLINE', frequency: 0.5 }, { type: 'SATELLITE_DISH', frequency: 0.5 }],
      fireEscapeChance: 0.25,
      coinDensity: 0.5,
    },
    {
      startDistance: 9000,
      endDistance: 14000,
      generation: { platformWidthRange: [80, 160], gapRange: [100, 180], heightStepRange: [-60, 90] },
      enemies: [{ type: 'PIGEON', density: 1 }, { type: 'RAT', density: 1 }, { type: 'RACCOON', density: 0.8 }],
      hazards: [{ type: 'AC_UNIT', frequency: 0.8 }, { type: 'NEON_SIGN', frequency: 1 }],
      fireEscapeChance: 0.4,
      coinDensity: 0.3,
    },
  ],

  victoryDistance: 15_000,

  playerConfig: {
    moveSpeed: 250,
    jumpForce: 480,
    gravity: 1000,
    maxJumps: 2,
  },

  startLives: 3,

  boss: {
    arenaWidth: 1200,
    phases: [
      { swoopSpeed: 200, feathersPerPass: 2, swoopsBeforeLand: 2, landDuration: 3, miniPigeonCount: 0, hasDiveBomb: false },
      { swoopSpeed: 280, feathersPerPass: 3, swoopsBeforeLand: 2, landDuration: 2, miniPigeonCount: 2, hasDiveBomb: false },
      { swoopSpeed: 350, feathersPerPass: 4, swoopsBeforeLand: 3, landDuration: 1.5, miniPigeonCount: 3, hasDiveBomb: true },
    ],
  },

  powerups: {
    tripleJumpDuration: 8000,
    glideDuration: 10000,
    glideGravityMultiplier: 0.3,
    spawnPerZone: 1,
    fireEscapeBonusChance: 0.1,
  },
};
