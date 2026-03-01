import type { LevelConfig } from '../types';

export const BEACH_LEVEL_CONFIG: LevelConfig = {
  id: 'BEACH',
  name: 'Sunny Shore',
  description: 'Dodge crabs, beachballs, and seagulls on a sunny beach run!',

  obstacles: [
    { type: 'CRAB', width: 130, height: 110, behaviors: [{ type: 'static' }], isHarmful: true, spawnWeight: 2, spawnY: 100 },
    { type: 'BEACHBALL', width: 140, height: 120, behaviors: [{ type: 'bounce' }], isHarmful: true, spawnWeight: 2, spawnY: 100 },
    { type: 'SEAGULL', width: 110, height: 90, behaviors: [{ type: 'swoop' }, { type: 'dropProjectile' }], isHarmful: false, spawnWeight: 1, spawnY: { min: 220, max: 600 } },
    { type: 'SANDCASTLE', width: 160, height: 130, behaviors: [{ type: 'slowOnContact' }], isHarmful: false, spawnWeight: 1, spawnY: 100 },
    { type: 'TIDEPOOL', width: 220, height: 50, behaviors: [{ type: 'slowOnContact' }], isHarmful: false, spawnWeight: 1, spawnY: 100 },
    { type: 'PALM_TREE', width: 100, height: 180, behaviors: [{ type: 'static' }], isHarmful: true, spawnWeight: 1, spawnY: 100 },
    { type: 'SAND_PROJECTILE', width: 100, height: 100, behaviors: [{ type: 'static' }], isHarmful: true, spawnWeight: 0 },
  ],

  patterns: [
    [{ type: 'CRAB', delay: 700 }, { type: 'COIN', delay: 400, y: 200 }],
    [{ type: 'BEACHBALL', delay: 800 }, { type: 'COIN', delay: 400, y: 200 }, { type: 'BEACHBALL', delay: 800 }],
    [{ type: 'CRAB', delay: 600 }, { type: 'COIN', delay: 400, y: 220 }, { type: 'SEAGULL', delay: 700 }],
    [{ type: 'BEACHBALL', delay: 700 }, { type: 'SANDCASTLE', delay: 900 }, { type: 'COIN', delay: 400, y: 200 }],
    [{ type: 'CRAB', delay: 600 }, { type: 'SEAGULL', delay: 500, y: 150 }, { type: 'COIN', delay: 300, y: 250 }],
    [{ type: 'CRAB', delay: 600 }, { type: 'BEACHBALL', delay: 500 }, { type: 'CRAB', delay: 600 }, { type: 'COIN', delay: 400, y: 200 }],
    [{ type: 'SEAGULL', delay: 700, y: 180 }, { type: 'CRAB', delay: 600 }, { type: 'SEAGULL', delay: 700, y: 200 }, { type: 'COIN', delay: 400, y: 250 }],
    [{ type: 'CRAB', delay: 550 }, { type: 'SEAGULL', delay: 450, y: 140 }, { type: 'BEACHBALL', delay: 600 }, { type: 'SEAGULL', delay: 500, y: 160 }, { type: 'COIN', delay: 350, y: 240 }],
  ],

  theme: {
    groundY: 100,
    skyGradient: ['#bfdbfe', '#fef3c7'],
    particleColors: { dust: '#fbdb74', impact: '#ff6b6b', coinCollect: '#facc15' },
    speedLineThreshold: 10,
    screenShakeDecay: 0.92,
  },

  boss: {
    health: 100,
    damagePerHit: 4,
    width: 320,
    height: 320,
    spawnYOffset: 100,
    movement: { swayAmountNormal: 15, swayAmountLow: 30, swayFrequency: 800, bobFrequency: 500, bobAmplitude: 50 },
    projectile: { baseSpeed: 12, speedRange: 4, spawnRateByHealth: { high: 0.4, mid: 0.5, low: 0.65 } },
  },

  background: {
    entities: [
      { type: 'CLOUD', width: 100, height: 60, speedMultiplier: 0.1, depth: 'far' },
      { type: 'BOAT', width: 240, height: 120, speedMultiplier: 0.4, depth: 'mid' },
      { type: 'SURFER', width: 70, height: 50, speedMultiplier: 0.5, depth: 'mid' },
      { type: 'AIRPLANE', width: 160, height: 60, speedMultiplier: 0.6, depth: 'mid' },
      { type: 'JETSKI', width: 80, height: 60, speedMultiplier: 0.7, depth: 'mid' },
      { type: 'BOAT_SINKING', width: 260, height: 140, speedMultiplier: 1.2, depth: 'mid' },
      { type: 'AIRPLANE_FIRE', width: 180, height: 80, speedMultiplier: 1.5, depth: 'mid' },
    ],
    spawnInterval: { normal: 4000, boss: 2000 },
  },

  harmfulTypes: ['CRAB', 'BEACHBALL', 'SAND_PROJECTILE', 'PALM_TREE'],
};
