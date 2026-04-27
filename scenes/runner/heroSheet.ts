import beachHeroSheetUrl from '../../assets/sprites/beach/hero/runner-hero-sheet.png?url';
import { GameStatus } from '../../types';

export const BEACH_HERO_SHEET = {
  key: 'hero-beach-runner',
  path: beachHeroSheetUrl,
  frameWidth: 256,
  frameHeight: 256,
  frameMax: 29,
  columns: 8,
  origin: { x: 0.5, y: 1 },
  feetBaselineY: 220,
  bottomPadding: 36,
  renderSize: {
    width: 160,
    height: 200,
  },
  collisionBoxes: {
    normal: { x: 24, y: 0, width: 160, height: 200 },
    duck: { x: 24, y: 0, width: 160, height: 90 },
  },
} as const;

export const BEACH_HERO_ANIMATION_KEYS = {
  idle: 'hero-beach-idle',
  run: 'hero-beach-run',
  jumpRise: 'hero-beach-jump-rise',
  jumpFall: 'hero-beach-jump-fall',
  duck: 'hero-beach-duck',
  hurt: 'hero-beach-hurt',
  shellThrow: 'hero-beach-shell-throw',
  victory: 'hero-beach-victory',
  defeat: 'hero-beach-defeat',
} as const;

export type BeachHeroAnimationId = keyof typeof BEACH_HERO_ANIMATION_KEYS;

export interface BeachHeroAnimationSpec {
  id: BeachHeroAnimationId;
  key: (typeof BEACH_HERO_ANIMATION_KEYS)[BeachHeroAnimationId];
  frames: readonly number[];
  frameRate: number;
  repeat: number;
}

export const BEACH_HERO_ANIMATIONS: readonly BeachHeroAnimationSpec[] = [
  { id: 'idle', key: BEACH_HERO_ANIMATION_KEYS.idle, frames: [0, 1, 2, 1], frameRate: 4, repeat: -1 },
  { id: 'run', key: BEACH_HERO_ANIMATION_KEYS.run, frames: [3, 4, 5, 6, 7, 8], frameRate: 12, repeat: -1 },
  { id: 'jumpRise', key: BEACH_HERO_ANIMATION_KEYS.jumpRise, frames: [9, 10], frameRate: 9, repeat: -1 },
  { id: 'jumpFall', key: BEACH_HERO_ANIMATION_KEYS.jumpFall, frames: [11, 12], frameRate: 8, repeat: -1 },
  { id: 'duck', key: BEACH_HERO_ANIMATION_KEYS.duck, frames: [13, 14, 15], frameRate: 10, repeat: -1 },
  { id: 'hurt', key: BEACH_HERO_ANIMATION_KEYS.hurt, frames: [16, 17, 18], frameRate: 12, repeat: 0 },
  { id: 'shellThrow', key: BEACH_HERO_ANIMATION_KEYS.shellThrow, frames: [19, 20, 21], frameRate: 14, repeat: 0 },
  { id: 'victory', key: BEACH_HERO_ANIMATION_KEYS.victory, frames: [22, 23, 24, 25], frameRate: 7, repeat: -1 },
  { id: 'defeat', key: BEACH_HERO_ANIMATION_KEYS.defeat, frames: [26, 27, 28], frameRate: 6, repeat: 0 },
];

export interface BeachHeroRuntimeState {
  status: GameStatus;
  isDucking: boolean;
  isAirborne: boolean;
  verticalVelocity: number;
  isHurt: boolean;
  isThrowingShell: boolean;
  isBossDefeating: boolean;
  isMoving: boolean;
}

export function resolveBeachHeroAnimation(state: BeachHeroRuntimeState): BeachHeroAnimationId {
  if (state.status === GameStatus.GAMEOVER) return 'defeat';
  if (state.status === GameStatus.VICTORY || state.isBossDefeating) return 'victory';
  if (state.isHurt) return 'hurt';
  if (state.isThrowingShell) return 'shellThrow';
  if (state.isDucking) return 'duck';
  if (state.isAirborne) return state.verticalVelocity > 0 ? 'jumpRise' : 'jumpFall';
  return state.isMoving ? 'run' : 'idle';
}
