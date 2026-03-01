import type { TuningProfile } from './systems/tuning/defaultTuning';

export enum GameStatus {
  START = 'START',
  LEVEL_SELECTION = 'LEVEL_SELECTION',
  PLAYING = 'PLAYING',
  BOSS_INTRO = 'BOSS_INTRO',
  BOSS_FIGHT = 'BOSS_FIGHT',
  GAMEOVER = 'GAMEOVER',
  CUSTOMIZE = 'CUSTOMIZE',
  PAUSED = 'PAUSED',
  VICTORY = 'VICTORY'
}

export type LevelId = 'BEACH';

export interface LevelDef {
  id: LevelId;
  name: string;
  unlocked: boolean;
  theme: string;
  requirement: string;
}

export type ObstacleType = 
  | 'CRAB' | 'BEACHBALL' | 'SEAGULL' | 'SANDCASTLE' | 'SAND_PROJECTILE' | 'TIDEPOOL' | 'PALM_TREE';

export type PowerUpType = 'SPEED' | 'MAGNET' | 'SUPER_SIZE';
export type EntityType = ObstacleType | 'COIN' | 'SHELL' | PowerUpType | 'BOSS';

export interface WorldEntity {
  id: number;
  type: EntityType;
  x: number;
  y?: number;
  vy?: number;
  vx?: number; // Horizontal velocity for projectiles
  isSwooping?: boolean;
  seagullType?: 'dive' | 'poop'; // Seagull behavior type
  lastPoopTime?: number; // For tracking poop drops
  width: number;
  height: number;
  speed: number;
  isPassed: boolean;
  isCollected?: boolean;
  health?: number;
  maxHealth?: number;
  rotation?: number; // Rotation angle for projectiles
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  speed: number;
  size: number;
}

export interface Obstacle extends WorldEntity {}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  color?: string;
}

export type BackgroundEntityType = 'BOAT' | 'SURFER' | 'AIRPLANE' | 'CLOUD' | 'JETSKI' | 'BOAT_SINKING' | 'AIRPLANE_FIRE';
export interface BackgroundEntity {
  id: number;
  type: BackgroundEntityType;
  x: number;
  y: number;
  speed: number;
  width: number;
  height: number;
  bannerText?: string;
  depth?: 'far' | 'mid' | 'near'; // for parallax
  isChaos?: boolean; // For boss fight chaos variants
}

export interface PlayerState {
  y: number;
  vy: number;
  isJumping: boolean;
  isDucking: boolean;
  jumpCount: number;
  isHurt?: boolean;
}

export interface ActivePowerUp {
  type: PowerUpType;
  endTime: number;
}

export interface GameScore {
  current: number;
  high: number;
  coins: number;
  multiplier: number;
  streak: number;
  lives: number;
}

export interface HighScoreEntry {
  name: string;
  score: number;
  date: number;
  catUrl?: string; // Optional custom kitty image URL
  isVictory?: boolean; // True if player defeated the boss
}

export interface Outfit {
  id: string;
  name: string;
  url: string;
}

// ─── Phase 2: Multi-Level Type Foundation ───────────────────────────

/** A single step in a spawn pattern (promotes local interface from GameEngine.tsx) */
export interface PatternStep {
  type: EntityType;
  delay: number;
  y?: number;
}

/** Behavior archetypes for obstacle movement/interaction */
export type BehaviorType =
  | 'swoop'          // seagull dive trajectory
  | 'dropProjectile' // seagull poop drops
  | 'bounce'         // beachball bounce-on-stomp
  | 'slowOnContact'  // sandcastle/tidepool speed reduction
  | 'static';        // no special movement (crab, palm tree)

export interface BehaviorConfig {
  type: BehaviorType;
  config?: Record<string, number>;
}

/** Per-obstacle shape, behavior, and spawn weighting for a level */
export interface ObstacleDefinition {
  type: ObstacleType;
  width: number;
  height: number;
  behaviors: BehaviorConfig[];
  isHarmful: boolean;
  spawnWeight: number;
  spawnY?: number | { min: number; max: number };
}

/** Visual theme parameters for a level */
export interface ThemeConfig {
  groundY: number;
  skyGradient: [string, string];
  particleColors: {
    dust: string;
    impact: string;
    coinCollect: string;
  };
  speedLineThreshold: number;
  screenShakeDecay: number;
}

/** Boss projectile tuning */
export interface BossProjectileConfig {
  baseSpeed: number;
  speedRange: number;
  spawnRateByHealth: { high: number; mid: number; low: number };
}

/** Boss movement tuning */
export interface BossMovementConfig {
  swayAmountNormal: number;
  swayAmountLow: number;
  swayFrequency: number;
  bobFrequency: number;
  bobAmplitude: number;
}

/** Full boss configuration for a level */
export interface BossConfig {
  health: number;
  damagePerHit: number;
  width: number;
  height: number;
  spawnYOffset: number;
  movement: BossMovementConfig;
  projectile: BossProjectileConfig;
  componentId?: string;
}

/** Definition for a single background entity type */
export interface BackgroundEntityDefinition {
  type: BackgroundEntityType;
  width: number;
  height: number;
  speedMultiplier: number;
  depth: 'far' | 'mid' | 'near';
}

/** Background entity pool and spawn timing for a level */
export interface BackgroundConfig {
  entities: BackgroundEntityDefinition[];
  spawnInterval: { normal: number; boss: number };
}

/** Top-level level configuration — composes all per-level data */
export interface LevelConfig {
  id: LevelId;
  name: string;
  description: string;
  obstacles: ObstacleDefinition[];
  patterns: PatternStep[][];
  theme: ThemeConfig;
  boss: BossConfig;
  background: BackgroundConfig;
  tuningOverrides?: Partial<TuningProfile>;
  harmfulTypes?: EntityType[];
}
