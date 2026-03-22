import type { LevelConfig } from '../types';

export const BEACH_LEVEL_CONFIG: LevelConfig = {
  id: 'BEACH',
  name: 'Sunny Shore',
  description: 'Dodge crabs, beachballs, and seagulls on a sunny beach run!',
  genre: 'runner',
  catPose: 'runner',
  victoryCondition: { type: 'boss', bossId: 'sandMonster' },
  starThresholds: [100, 300, 500],

  obstacles: [
    {
      type: 'CRAB',
      width: 130,
      height: 110,
      behaviors: [{ type: 'static' }, { type: 'stomp' }],
      isHarmful: true,
      spawnWeight: 2,
      spawnY: 100,
      stompCollision: {
        bounceForce: 8,
        jumpCount: 0,
        markAs: 'collected',
        particleColor: '#ef4444',
        sounds: ['meow', 'cartoon-splat-310479'],
      },
    },
    {
      type: 'BEACHBALL',
      width: 140,
      height: 120,
      behaviors: [{ type: 'bounce' }],
      isHarmful: true,
      spawnWeight: 2,
      spawnY: 100,
      stompCollision: {
        jumpCount: 0,
        markAs: 'passed',
        particleColor: '#fde047',
        sounds: ['meow', 'boing-boing-bounce-454474'],
      },
    },
    {
      type: 'SEAGULL',
      width: 110,
      height: 90,
      behaviors: [
        { type: 'swoop' },
        { type: 'dropProjectile', projectileType: 'SAND_PROJECTILE' },
      ],
      /** Body collision hurts unless stomped / invincible — matches "dodge seagulls" gameplay. */
      isHarmful: true,
      spawnWeight: 1,
      spawnY: { min: 350, max: 600 },
      stompCollision: {
        bounceForce: 8,
        jumpCount: 1,
        markAs: 'collected',
        particleColor: '#ffffff',
        sounds: ['meow', 'cartoon-splat-310479'],
      },
    },
    {
      type: 'SANDCASTLE',
      width: 160,
      height: 130,
      behaviors: [{ type: 'slowOnContact' }],
      isHarmful: false,
      spawnWeight: 1,
      spawnY: 100,
      slowCollision: { durationMs: 2000, particleColor: '#fbbf24' },
    },
    {
      type: 'TIDEPOOL',
      width: 220,
      height: 50,
      behaviors: [{ type: 'slowOnContact' }],
      isHarmful: false,
      spawnWeight: 1,
      spawnY: 100,
      slowCollision: { durationMs: 2000, particleColor: '#60a5fa' },
    },
    { type: 'PALM_TREE', width: 100, height: 180, behaviors: [{ type: 'static' }], isHarmful: true, spawnWeight: 1, spawnY: 100 },
    {
      type: 'SAND_PROJECTILE',
      width: 100,
      height: 100,
      behaviors: [{ type: 'arcProjectile' }],
      isHarmful: true,
      spawnWeight: 0,
      stompCollision: {
        bounceForce: 8,
        jumpCount: 1,
        markAs: 'collected',
        particleColor: '#ffffff',
        sounds: ['meow'],
      },
    },
  ],

  patterns: [
    // Early phase — single obstacles, generous gaps
    { phase: 'early', steps: [{ type: 'CRAB', delay: 700 }, { type: 'COIN', delay: 400, y: 200 }] },
    { phase: 'early', steps: [{ type: 'BEACHBALL', delay: 800 }, { type: 'COIN', delay: 400, y: 200 }] },
    { phase: 'any', steps: [{ type: 'BEACHBALL', delay: 800 }, { type: 'COIN', delay: 400, y: 200 }, { type: 'BEACHBALL', delay: 800 }] },
    // Mid phase — combos
    { phase: 'mid', steps: [{ type: 'CRAB', delay: 600 }, { type: 'COIN', delay: 400, y: 220 }, { type: 'SEAGULL', delay: 700 }] },
    { phase: 'mid', steps: [{ type: 'BEACHBALL', delay: 700 }, { type: 'SANDCASTLE', delay: 900 }, { type: 'COIN', delay: 400, y: 200 }] },
    { phase: 'any', steps: [{ type: 'CRAB', delay: 600 }, { type: 'SEAGULL', delay: 500, y: 150 }, { type: 'COIN', delay: 300, y: 250 }] },
    // Late phase — dense gauntlets
    { phase: 'late', steps: [{ type: 'CRAB', delay: 600 }, { type: 'BEACHBALL', delay: 500 }, { type: 'CRAB', delay: 600 }, { type: 'COIN', delay: 400, y: 200 }] },
    { phase: 'late', steps: [{ type: 'SEAGULL', delay: 700, y: 180 }, { type: 'CRAB', delay: 600 }, { type: 'SEAGULL', delay: 700, y: 200 }, { type: 'COIN', delay: 400, y: 250 }] },
    // Dense 5-step gauntlet (carried from original pattern 8)
    { phase: 'late', steps: [{ type: 'CRAB', delay: 550 }, { type: 'SEAGULL', delay: 450, y: 140 }, { type: 'BEACHBALL', delay: 600 }, { type: 'SEAGULL', delay: 500, y: 160 }, { type: 'COIN', delay: 350, y: 240 }] },
  ],

  theme: {
    groundY: 100,
    skyProgressMode: 'coinsToBoss',
    skyGradient: ['#bfdbfe', '#fef3c7'],
    particleColors: { dust: '#fbdb74', impact: '#ff6b6b', coinCollect: '#facc15' },
    speedLineThreshold: 10,
    screenShakeDecay: 0.92,
    groundKickParticles: true,
    playerAnchorLeftPx: 100,
    playerAnchorLeftPxSuperSized: 40,
  },

  boss: {
    health: 20,        // Was 100 — now 5-hit fight
    damagePerHit: 4,   // Unchanged
    width: 320,
    height: 320,
    spawnYOffset: 100,
    movement: { swayAmountNormal: 15, swayAmountLow: 30, swayFrequency: 800, bobFrequency: 500, bobAmplitude: 50 },
    projectile: { baseSpeed: 12, speedRange: 4, spawnRateByHealth: { high: 0.4, mid: 0.5, low: 0.65 } },
    componentId: 'sandMonster',
    projectileObstacleType: 'SAND_PROJECTILE',
  },

  magnetAttractTypes: ['COIN'],

  bossEntryCoinThreshold: 25,

  background: {
    // Y ranges are proportional (0.0 = top, 1.0 = bottom) of 720px canvas.
    // Sky ~0.00–0.68, ocean ~0.68–0.82, foam/sand ~0.82–1.0.
    // Distant objects scroll slower (lower speedMultiplier).
    entities: [
      {
        type: 'CLOUD',
        width: 80,
        height: 48,
        speedMultiplier: 0.05,
        depth: 'far',
        spawnYRange: { min: 0.04, max: 0.18 },
      },
      {
        type: 'BOAT',
        width: 120,
        height: 60,
        speedMultiplier: 0.15,
        depth: 'mid',
        spawnYRange: { min: 0.66, max: 0.74 },
      },
      {
        type: 'SURFER',
        width: 48,
        height: 34,
        speedMultiplier: 0.25,
        depth: 'mid',
        spawnYRange: { min: 0.70, max: 0.76 },
      },
      {
        type: 'AIRPLANE',
        width: 100,
        height: 38,
        speedMultiplier: 0.3,
        depth: 'mid',
        spawnYRange: { min: 0.08, max: 0.22 },
        defaultBannerText: 'WHO FARTED?',
      },
      {
        type: 'JETSKI',
        width: 52,
        height: 38,
        speedMultiplier: 0.35,
        depth: 'mid',
        spawnYRange: { min: 0.68, max: 0.76 },
        spawnEdge: 'left',
      },
      {
        type: 'BOAT_SINKING',
        width: 140,
        height: 72,
        speedMultiplier: 0.5,
        depth: 'mid',
        spawnYRange: { min: 0.64, max: 0.72 },
      },
      {
        type: 'AIRPLANE_FIRE',
        width: 110,
        height: 50,
        speedMultiplier: 0.6,
        depth: 'mid',
        spawnYRange: { min: 0.10, max: 0.28 },
        defaultBannerText: 'HELP!',
      },
    ],
    spawnInterval: { normal: 4000, boss: 2000 },
    chaosSpawnTypes: ['BOAT_SINKING', 'AIRPLANE_FIRE'],
    midLayerSpawnTypes: ['BOAT', 'SURFER', 'AIRPLANE', 'JETSKI'],
    cloudSpawnChance: 0.3,
    cloudEntityType: 'CLOUD',
  },

  harmfulTypes: ['CRAB', 'BEACHBALL', 'SEAGULL', 'SAND_PROJECTILE', 'PALM_TREE'],
};
