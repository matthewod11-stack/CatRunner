import type { TuningProfile } from './systems/tuning/defaultTuning';

export enum GameStatus {
  LEVEL_SELECTION = 'LEVEL_SELECTION',
  PLAYING = 'PLAYING',
  BOSS_FIGHT = 'BOSS_FIGHT',
  GAMEOVER = 'GAMEOVER',
  CUSTOMIZE = 'CUSTOMIZE',
  VICTORY = 'VICTORY',
}

export type LevelId = 'BEACH';

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
  /** Runtime variant: `dive` uses swoop physics; `poop` uses dropProjectile (see level obstacle behaviors) */
  seagullType?: 'dive' | 'poop';
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

export type Obstacle = WorldEntity;

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

/** Authoritative snapshot from GameEngine when the boss is defeated (avoids stale App React score). */
export interface VictoryFinalizePayload {
  levelId: LevelId;
  /** Display / Hall of Fame score (e.g. Math.floor(internalScore / 10)). */
  finalScore: number;
  /** Engine ref snapshot; App merges `high` with persisted best and resets lives on victory. */
  gameScore: GameScore;
  wasBossFight: boolean;
}

export interface HighScoreEntry {
  name: string;
  score: number;
  date: number;
  /** Legacy: full data URL stored in localStorage (older Hall of Fame rows). */
  catUrl?: string;
  /** IndexedDB sprite key when using beach-cat-cat-state-v1 (new rows). */
  catAssetId?: string;
  isVictory?: boolean; // True if player defeated the boss
}

/** Wardrobe row when using IndexedDB blobs (Phase 2). */
export interface SavedCatLook {
  id: string;
  name: string;
  assetId: string;
  createdAt: number;
  /** SHA-256 (or fallback) of PNG bytes for deduplication */
  contentKey?: string;
  /** Sprite was server-matted when saved — skip redundant client matting in thumbnails */
  mattedOnServer?: boolean;
}

/** Legacy wardrobe / fallback when IndexedDB is unavailable. */
export interface Outfit {
  id: string;
  name: string;
  url: string;
}

/** Persisted JSON in localStorage key `beach-cat-cat-state-v1`. */
export interface CatCharacterStateV1 {
  schema: 1;
  equippedAssetId: string | null;
  looks: SavedCatLook[];
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
  | 'static'         // no special movement (crab, palm tree)
  | 'stomp'          // stomp-from-above (e.g. crab) — distinct from beachball bounce tuning
  | 'arcProjectile'; // parabolic / aimed projectile physics (e.g. boss sand shot)

/** Registered lazy boss UI ids (see systems/bossComponents.tsx) */
export type BossComponentId = 'sandMonster';

export interface BehaviorConfig {
  type: BehaviorType;
  config?: Record<string, number>;
  /** When `type` is `dropProjectile`, obstacle type to spawn (e.g. SAND_PROJECTILE) */
  projectileType?: ObstacleType;
}

/** Stomp-from-above / bounce outcome when `bounce` | `stomp` | `arcProjectile` applies. */
export interface StompCollisionConfig {
  /** Omit with `BEACHBALL` to use `tuning.bounceForce`; otherwise defaults to 8 */
  bounceForce?: number;
  jumpCount: number;
  markAs: 'collected' | 'passed';
  particleColor: string;
  sounds: string[];
  points?: number;
}

/** Side-hit slowdown when `slowOnContact` applies. */
export interface SlowCollisionConfig {
  durationMs: number;
  particleColor: string;
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
  stompCollision?: StompCollisionConfig;
  slowCollision?: SlowCollisionConfig;
}

/** How the playfield sky reacts to coin progress (see App `getSkyStyle` / sun). */
export type SkyProgressMode = 'coinsToBoss' | 'static';

/** Visual theme parameters for a level */
export interface ThemeConfig {
  groundY: number;
  skyGradient: [string, string];
  /** Omit or `coinsToBoss`: interpolate sky/sun toward boss entry using star count. `static`: fixed gradient only. */
  skyProgressMode?: SkyProgressMode;
  particleColors: {
    dust: string;
    impact: string;
    coinCollect: string;
  };
  speedLineThreshold: number;
  screenShakeDecay: number;
  /** Ground kick particles on jump/duck (e.g. beach sand). Omit/false to disable */
  groundKickParticles?: boolean;
  /** Left edge of player container in px (default 100). Hitbox uses +24 from this. */
  playerAnchorLeftPx?: number;
  /** `left` when SUPER_SIZE power-up (default anchor − 60). */
  playerAnchorLeftPxSuperSized?: number;
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
  /** Lazy-loaded boss component; defaults to sandMonster when omitted */
  componentId?: BossComponentId;
  /** Level obstacle type for boss shots (must define `arcProjectile`); default SAND_PROJECTILE */
  projectileObstacleType?: ObstacleType;
}

/** Definition for a single background entity type */
export interface BackgroundEntityDefinition {
  type: BackgroundEntityType;
  width: number;
  height: number;
  speedMultiplier: number;
  depth: 'far' | 'mid' | 'near';
  /** Random Y = innerHeight * (min + rand * (max − min)). */
  spawnYRange?: { min: number; max: number };
  /** Default `right` (off-screen east). `left` for westbound spawns (e.g. jetski). */
  spawnEdge?: 'left' | 'right';
  /** Default banner text for planes when spawned without override. */
  defaultBannerText?: string;
}

/** Background entity pool and spawn timing for a level */
export interface BackgroundConfig {
  entities: BackgroundEntityDefinition[];
  spawnInterval: { normal: number; boss: number };
  /** Boss-fight chaos picks (must exist in `entities`). Default: sinking boat + burning plane. */
  chaosSpawnTypes?: BackgroundEntityType[];
  /** Equiprobable pool for one mid/far deco spawn each normal tick. Default: boat, surfer, plane, jetski. */
  midLayerSpawnTypes?: BackgroundEntityType[];
  /** Probability [0, 1] to attempt a cloud spawn each normal tick. Default 0.3; set 0 to disable. */
  cloudSpawnChance?: number;
  /** Key in `entities` for cloud spawns (size jitter). Default CLOUD. */
  cloudEntityType?: BackgroundEntityType;
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
  /** Coins (stars) to trigger boss; defaults to merged tuning `bossThreshold`. */
  bossEntryCoinThreshold?: number;
  harmfulTypes?: EntityType[];
  /** Entity types pulled toward the player while MAGNET is active; default ['COIN'] */
  magnetAttractTypes?: EntityType[];
}
