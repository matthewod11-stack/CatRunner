
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
