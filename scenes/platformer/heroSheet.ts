import platformerHeroSheetUrl from '../../assets/sprites/rooftops/hero/platformer-hero-sheet.png?url';
import { GameStatus } from '../../types';

export const ROOFTOPS_HERO_SHEET = {
  key: 'hero-rooftops-platformer',
  path: platformerHeroSheetUrl,
  frameWidth: 64,
  frameHeight: 64,
  frameMax: 32,
  columns: 8,
  origin: { x: 0.5, y: 1 },
  feetBaselineY: 58,
  bottomPadding: 6,
  renderSize: {
    width: 72,
    height: 72,
  },
  collisionBoxes: {
    normal: { x: 12, y: 10, width: 40, height: 48 },
    airborne: { x: 12, y: 10, width: 40, height: 48 },
    stomp: { x: 10, y: 18, width: 44, height: 40 },
    glide: { x: 8, y: 8, width: 48, height: 50 },
  },
} as const;

export const ROOFTOPS_HERO_ANIMATION_KEYS = {
  idle: 'hero-rooftops-idle',
  run: 'hero-rooftops-run',
  jumpRise: 'hero-rooftops-jump-rise',
  fall: 'hero-rooftops-fall',
  landStomp: 'hero-rooftops-land-stomp',
  glide: 'hero-rooftops-glide',
  hurt: 'hero-rooftops-hurt',
  victory: 'hero-rooftops-victory',
  defeat: 'hero-rooftops-defeat',
  powerUp: 'hero-rooftops-power-up',
} as const;

export type RooftopsHeroAnimationId = keyof typeof ROOFTOPS_HERO_ANIMATION_KEYS;

export interface RooftopsHeroAnimationSpec {
  id: RooftopsHeroAnimationId;
  key: (typeof ROOFTOPS_HERO_ANIMATION_KEYS)[RooftopsHeroAnimationId];
  frames: readonly number[];
  frameRate: number;
  repeat: number;
}

export const ROOFTOPS_HERO_ANIMATIONS: readonly RooftopsHeroAnimationSpec[] = [
  { id: 'idle', key: ROOFTOPS_HERO_ANIMATION_KEYS.idle, frames: [0, 1], frameRate: 4, repeat: -1 },
  { id: 'run', key: ROOFTOPS_HERO_ANIMATION_KEYS.run, frames: [2, 3, 4, 5, 6, 7], frameRate: 12, repeat: -1 },
  { id: 'jumpRise', key: ROOFTOPS_HERO_ANIMATION_KEYS.jumpRise, frames: [8, 9], frameRate: 9, repeat: -1 },
  { id: 'fall', key: ROOFTOPS_HERO_ANIMATION_KEYS.fall, frames: [10, 11], frameRate: 8, repeat: -1 },
  { id: 'landStomp', key: ROOFTOPS_HERO_ANIMATION_KEYS.landStomp, frames: [12, 13, 14], frameRate: 12, repeat: 0 },
  { id: 'glide', key: ROOFTOPS_HERO_ANIMATION_KEYS.glide, frames: [15, 16, 17], frameRate: 10, repeat: -1 },
  { id: 'hurt', key: ROOFTOPS_HERO_ANIMATION_KEYS.hurt, frames: [18, 19, 20], frameRate: 12, repeat: 0 },
  { id: 'victory', key: ROOFTOPS_HERO_ANIMATION_KEYS.victory, frames: [21, 22, 23, 24], frameRate: 7, repeat: -1 },
  { id: 'defeat', key: ROOFTOPS_HERO_ANIMATION_KEYS.defeat, frames: [25, 26, 27], frameRate: 6, repeat: 0 },
  { id: 'powerUp', key: ROOFTOPS_HERO_ANIMATION_KEYS.powerUp, frames: [28, 29, 30, 31], frameRate: 8, repeat: 0 },
];

export interface RooftopsHeroRuntimeState {
  status: GameStatus;
  isAirborne: boolean;
  verticalVelocity: number;
  isMoving: boolean;
  isGliding: boolean;
  isHurt: boolean;
  isStompingOrLanding: boolean;
  isPoweringUp: boolean;
}

export function resolveRooftopsHeroAnimation(state: RooftopsHeroRuntimeState): RooftopsHeroAnimationId {
  if (state.status === GameStatus.GAMEOVER) return 'defeat';
  if (state.status === GameStatus.VICTORY) return 'victory';
  if (state.isHurt) return 'hurt';
  if (state.isStompingOrLanding) return 'landStomp';
  if (state.isPoweringUp) return 'powerUp';
  if (state.isGliding) return 'glide';
  if (state.isAirborne) return state.verticalVelocity < 0 ? 'jumpRise' : 'fall';
  return state.isMoving ? 'run' : 'idle';
}

export type RooftopsHeroCollisionState = 'normal' | 'airborne' | 'stomp' | 'glide';

export function getRooftopsHeroCollisionBox(state: RooftopsHeroCollisionState = 'normal') {
  return ROOFTOPS_HERO_SHEET.collisionBoxes[state];
}
