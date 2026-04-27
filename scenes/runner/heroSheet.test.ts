import { describe, expect, it } from 'vitest';
import { GameStatus } from '../../types';
import {
  BEACH_HERO_RENDER_SCALE,
  BEACH_HERO_ANIMATIONS,
  BEACH_HERO_ANIMATION_KEYS,
  BEACH_HERO_SHEET,
  getBeachHeroCollisionBox,
  getBeachHeroDisplaySize,
  getBeachHeroGroundContactOffset,
  getBeachHeroSpritePosition,
  resolveBeachHeroAnimation,
  type BeachHeroRuntimeState,
} from './heroSheet';

function state(overrides: Partial<BeachHeroRuntimeState> = {}): BeachHeroRuntimeState {
  return {
    status: GameStatus.PLAYING,
    isDucking: false,
    isAirborne: false,
    verticalVelocity: 0,
    isHurt: false,
    isThrowingShell: false,
    isBossDefeating: false,
    isMoving: true,
    ...overrides,
  };
}

describe('Beach hero sheet contract', () => {
  it('uses a fixed-size committed sprite sheet with bottom-center anchoring', () => {
    expect(BEACH_HERO_SHEET.path).toContain('runner-hero-sheet.png');
    expect(BEACH_HERO_SHEET.frameWidth).toBe(256);
    expect(BEACH_HERO_SHEET.frameHeight).toBe(256);
    expect(BEACH_HERO_SHEET.origin).toEqual({ x: 0.5, y: 1 });
    expect(BEACH_HERO_SHEET.feetBaselineY).toBeLessThan(BEACH_HERO_SHEET.frameHeight);
    expect(BEACH_HERO_SHEET.bottomPadding).toBe(
      BEACH_HERO_SHEET.frameHeight - BEACH_HERO_SHEET.feetBaselineY,
    );
  });

  it('covers every required runner animation state with valid frame indexes', () => {
    expect(BEACH_HERO_ANIMATIONS.map(anim => anim.id)).toEqual([
      'idle',
      'run',
      'jumpRise',
      'jumpFall',
      'duck',
      'hurt',
      'shellThrow',
      'victory',
      'defeat',
    ]);

    const keys = new Set<string>();
    for (const animation of BEACH_HERO_ANIMATIONS) {
      expect(keys.has(animation.key)).toBe(false);
      keys.add(animation.key);
      expect(animation.frames.length).toBeGreaterThan(0);
      for (const frame of animation.frames) {
        expect(frame).toBeGreaterThanOrEqual(0);
        expect(frame).toBeLessThan(BEACH_HERO_SHEET.frameMax);
      }
    }
  });

  it('documents collision boxes separately from visual frame padding', () => {
    expect(BEACH_HERO_SHEET.collisionBoxes.normal).toEqual({
      x: 24,
      y: 0,
      width: 160,
      height: 200,
    });
    expect(BEACH_HERO_SHEET.collisionBoxes.duck.height).toBe(90);
    expect(BEACH_HERO_SHEET.collisionBoxes.duck.height).toBeLessThan(
      BEACH_HERO_SHEET.collisionBoxes.normal.height,
    );
  });

  it('scales display and baseline from the sheet contract', () => {
    expect(BEACH_HERO_RENDER_SCALE).toBe(0.6);
    expect(getBeachHeroDisplaySize()).toEqual({ width: 96, height: 120 });
    expect(getBeachHeroGroundContactOffset()).toBe(0);
    expect(getBeachHeroSpritePosition({
      playerX: 100,
      groundYScreen: 620,
      playerY: 0,
    })).toEqual({
      x: 148,
      y: 620,
    });
  });

  it('resolves normal, duck, and super-size collision boxes in DOM runner coordinates', () => {
    const normal = getBeachHeroCollisionBox({
      playerX: 100,
      groundY: 100,
      playerY: 0,
      isDucking: false,
      isSuperSized: false,
    });
    expect(normal.left).toBeCloseTo(114.4);
    expect(normal.right).toBeCloseTo(210.4);
    expect(normal.bottom).toBe(100);
    expect(normal.top).toBe(220);
    expect(normal.width).toBe(96);
    expect(normal.height).toBe(120);

    expect(getBeachHeroCollisionBox({
      playerX: 100,
      groundY: 100,
      playerY: 0,
      isDucking: true,
      isSuperSized: false,
    }).height).toBe(54);

    const superSized = getBeachHeroCollisionBox({
      playerX: 100,
      groundY: 100,
      playerY: 20,
      isDucking: false,
      isSuperSized: true,
    });
    expect(superSized.left).toBeCloseTo(18.4);
    expect(superSized.bottom).toBe(120);
    expect(superSized.width).toBe(288);
    expect(superSized.height).toBe(360);
  });
});

describe('Beach hero animation resolver', () => {
  it('maps ordinary runner state to movement animations', () => {
    expect(resolveBeachHeroAnimation(state({ isMoving: false }))).toBe('idle');
    expect(resolveBeachHeroAnimation(state())).toBe('run');
    expect(resolveBeachHeroAnimation(state({ isDucking: true }))).toBe('duck');
    expect(resolveBeachHeroAnimation(state({ isAirborne: true, verticalVelocity: 12 }))).toBe('jumpRise');
    expect(resolveBeachHeroAnimation(state({ isAirborne: true, verticalVelocity: -1 }))).toBe('jumpFall');
  });

  it('prioritizes outcome and feedback states over movement', () => {
    expect(resolveBeachHeroAnimation(state({ isThrowingShell: true }))).toBe('shellThrow');
    expect(resolveBeachHeroAnimation(state({ isHurt: true, isThrowingShell: true }))).toBe('hurt');
    expect(resolveBeachHeroAnimation(state({ isBossDefeating: true }))).toBe('victory');
    expect(resolveBeachHeroAnimation(state({ status: GameStatus.VICTORY }))).toBe('victory');
    expect(resolveBeachHeroAnimation(state({ status: GameStatus.GAMEOVER }))).toBe('defeat');
  });

  it('keeps exported animation keys aligned to resolver ids', () => {
    for (const animation of BEACH_HERO_ANIMATIONS) {
      expect(BEACH_HERO_ANIMATION_KEYS[animation.id]).toBe(animation.key);
    }
  });
});
