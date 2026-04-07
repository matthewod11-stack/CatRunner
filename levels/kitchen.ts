import type {
  LauncherActConfig,
  LauncherBossConfig,
  LauncherHazardConfig,
  LauncherLevelConfig,
  LauncherStructure,
} from '../types';

// ─── Pre-built structures ───────────────────────────────────────────

const SIMPLE_TOWER: LauncherStructure = {
  offsetX: 500,
  blocks: [
    { x: 0, y: 0, width: 60, height: 30, health: 1, material: 'glass', points: 10 },
    { x: 0, y: -30, width: 60, height: 30, health: 1, material: 'glass', points: 10 },
    { x: 0, y: -60, width: 60, height: 30, health: 2, material: 'wood', points: 20 },
  ],
};

const WIDE_WALL: LauncherStructure = {
  offsetX: 450,
  blocks: [
    { x: -40, y: 0, width: 40, height: 40, health: 2, material: 'wood', points: 20 },
    { x: 0, y: 0, width: 40, height: 40, health: 2, material: 'wood', points: 20 },
    { x: 40, y: 0, width: 40, height: 40, health: 2, material: 'wood', points: 20 },
    { x: -20, y: -40, width: 40, height: 30, health: 1, material: 'glass', points: 10 },
    { x: 20, y: -40, width: 40, height: 30, health: 1, material: 'glass', points: 10 },
    { x: 0, y: -70, width: 50, height: 25, health: 3, material: 'metal', points: 50 },
  ],
};

const PYRAMID: LauncherStructure = {
  offsetX: 480,
  blocks: [
    // Bottom row
    { x: -50, y: 0, width: 50, height: 30, health: 2, material: 'wood', points: 20 },
    { x: 0, y: 0, width: 50, height: 30, health: 2, material: 'wood', points: 20 },
    { x: 50, y: 0, width: 50, height: 30, health: 2, material: 'wood', points: 20 },
    // Middle row (one explosive glass for chain reactions)
    { x: -25, y: -30, width: 50, height: 30, health: 1, material: 'glass', points: 10, kind: 'explosive' },
    { x: 25, y: -30, width: 50, height: 30, health: 1, material: 'glass', points: 10 },
    // Top
    { x: 0, y: -60, width: 40, height: 25, health: 3, material: 'metal', points: 50 },
  ],
};

const FORTRESS: LauncherStructure = {
  offsetX: 420,
  blocks: [
    // Left pillar
    { x: -60, y: 0, width: 30, height: 50, health: 3, material: 'metal', points: 50 },
    { x: -60, y: -50, width: 30, height: 30, health: 2, material: 'wood', points: 20 },
    // Right pillar
    { x: 60, y: 0, width: 30, height: 50, health: 3, material: 'metal', points: 50 },
    { x: 60, y: -50, width: 30, height: 30, health: 2, material: 'wood', points: 20 },
    // Bridge
    { x: 0, y: -80, width: 150, height: 15, health: 1, material: 'glass', points: 10 },
    // Inner glass
    { x: -20, y: 0, width: 25, height: 30, health: 1, material: 'glass', points: 10 },
    { x: 20, y: 0, width: 25, height: 30, health: 1, material: 'glass', points: 10 },
    { x: 0, y: -30, width: 30, height: 25, health: 1, material: 'glass', points: 15 },
  ],
};

/** Fortress variant with a breakable power crate on the glass bridge (act 2+). */
const FORTRESS_WITH_CRATE: LauncherStructure = {
  offsetX: 420,
  blocks: [
    { x: -60, y: 0, width: 30, height: 50, health: 3, material: 'metal', points: 50 },
    { x: -60, y: -50, width: 30, height: 30, health: 2, material: 'wood', points: 20 },
    { x: 60, y: 0, width: 30, height: 50, health: 3, material: 'metal', points: 50 },
    { x: 60, y: -50, width: 30, height: 30, health: 2, material: 'wood', points: 20 },
    {
      x: 0,
      y: -80,
      width: 150,
      height: 15,
      health: 1,
      material: 'glass',
      points: 10,
      kind: 'power_crate',
    },
    { x: -20, y: 0, width: 25, height: 30, health: 1, material: 'glass', points: 10 },
    { x: 20, y: 0, width: 25, height: 30, health: 1, material: 'glass', points: 10 },
    { x: 0, y: -30, width: 30, height: 25, health: 1, material: 'glass', points: 15 },
  ],
};

/** Mixer Mouse finale — cheese wards + core + topper glass. */
const MIXER_MOUSE_BOSS: LauncherStructure = {
  offsetX: 400,
  blocks: [
    { x: -95, y: 0, width: 36, height: 48, health: 2, material: 'wood', points: 30, kind: 'cheese_ward' },
    { x: 0, y: 0, width: 72, height: 48, health: 5, material: 'metal', points: 200, kind: 'mixer_core' },
    { x: 95, y: 0, width: 36, height: 48, health: 2, material: 'wood', points: 30, kind: 'cheese_ward' },
    { x: 0, y: -48, width: 56, height: 32, health: 1, material: 'glass', points: 20 },
  ],
};

const STRUCTURE_PRESETS: Record<string, LauncherStructure> = {
  SIMPLE_TOWER,
  WIDE_WALL,
  PYRAMID,
  FORTRESS,
  FORTRESS_WITH_CRATE,
  MIXER_MOUSE_BOSS,
};

const KITCHEN_ACTS: LauncherActConfig[] = [
  {
    id: 'morning_mess',
    roundStart: 1,
    roundEnd: 2,
    structurePool: ['SIMPLE_TOWER', 'WIDE_WALL'],
  },
  {
    id: 'pantry_raid',
    roundStart: 3,
    roundEnd: 4,
    structurePool: ['PYRAMID', 'FORTRESS', 'FORTRESS_WITH_CRATE', 'WIDE_WALL'],
    weights: [2, 2, 2, 1],
  },
  {
    id: 'dinner_rush',
    roundStart: 5,
    roundEnd: 5,
    structurePool: ['FORTRESS', 'PYRAMID', 'FORTRESS_WITH_CRATE'],
    weights: [2, 1, 2],
  },
];

const KITCHEN_HAZARDS: LauncherHazardConfig = {
  spill: { x: 180, y: 558, width: 320, height: 28 },
  bossFanEnabled: true,
};

const KITCHEN_BOSS: LauncherBossConfig = {
  roundIndex: 6,
  structure: MIXER_MOUSE_BOSS,
  shots: 6,
};

// ─── Level Config ───────────────────────────────────────────────────

export const KITCHEN_LEVEL_CONFIG: LauncherLevelConfig = {
  id: 'KITCHEN',
  name: 'Countertop Chaos',
  genre: 'launcher',
  description: 'Launch treats across the kitchen counter!',
  catPose: 'launcher',
  victoryCondition: { type: 'score', target: 500 },
  starThresholds: [200, 400, 600],

  theme: {
    bgGradient: ['#fef3c7', '#fde68a'], // warm kitchen yellow
    counterColor: '#92400e',             // dark wood counter
    wallColor: '#f5f0e8',               // cream kitchen wall
    particleColors: {
      dust: '#d4a574',
      impact: '#ef4444',
      coinCollect: '#ffdd44',
    },
  },

  counterY: 580,   // counter surface Y position
  launchX: 120,    // cat sits on the left

  structures: [SIMPLE_TOWER, WIDE_WALL, PYRAMID, FORTRESS],

  structurePresets: STRUCTURE_PRESETS,
  acts: KITCHEN_ACTS,
  hazards: KITCHEN_HAZARDS,
  boss: KITCHEN_BOSS,
  powerupsEnabled: true,

  projectilesPerRound: 3,
  totalRounds: 6,

  projectileConfig: {
    radius: 15,
    powerMultiplier: 8,
    gravity: 600,
    maxDragDistance: 150,
  },

  startLives: 3,
};
