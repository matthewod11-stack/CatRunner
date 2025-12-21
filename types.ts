
export enum GameStatus {
  START = 'START',
  LEVEL_SELECTION = 'LEVEL_SELECTION',
  PLAYING = 'PLAYING',
  BOSS_INTRO = 'BOSS_INTRO',
  BOSS_FIGHT = 'BOSS_FIGHT',
  GAMEOVER = 'GAMEOVER',
  CUSTOMIZE = 'CUSTOMIZE',
  PAUSED = 'PAUSED'
}

export type LevelId = 'BEACH' | 'DUNGEON' | 'FOOTBALL' | 'CITY';

export interface LevelDef {
  id: LevelId;
  name: string;
  unlocked: boolean;
  theme: string;
  requirement: string;
}

export type ObstacleType = 
  | 'CRAB' | 'BEACHBALL' | 'SEAGULL' | 'SANDCASTLE' | 'SAND_PROJECTILE' | 'TIDEPOOL' 
  | 'FOOTBALL_PLAYER' | 'FLYING_FOOTBALL' | 'REFEREE' | 'WATER_COOLER';

export type PowerUpType = 'SPEED' | 'MAGNET';
export type EntityType = ObstacleType | 'COIN' | PowerUpType | 'BOSS';

export interface WorldEntity {
  id: number;
  type: EntityType;
  x: number;
  y?: number;
  vy?: number;
  isSwooping?: boolean;
  width: number;
  height: number;
  speed: number;
  isPassed: boolean;
  isCollected?: boolean;
  health?: number;
  maxHealth?: number;
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

export type BackgroundEntityType = 'BOAT' | 'SURFER' | 'AIRPLANE' | 'STADIUM_LIGHT' | 'GOAL_POST';
export interface BackgroundEntity {
  id: number;
  type: BackgroundEntityType;
  x: number;
  y: number;
  speed: number;
  width: number;
  height: number;
  bannerText?: string;
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
  yards?: number;
}

export interface HighScoreEntry {
  name: string;
  score: number;
  date: number;
}

export interface Outfit {
  id: string;
  name: string;
  url: string;
}
