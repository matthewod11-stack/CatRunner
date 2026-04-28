import { describe, expect, it } from 'vitest';
import { GameStatus } from '../../types';
import {
  ROOFTOPS_HERO_ANIMATIONS,
  ROOFTOPS_HERO_ANIMATION_KEYS,
  ROOFTOPS_HERO_SHEET,
  getRooftopsHeroCollisionBox,
  resolveRooftopsHeroAnimation,
  type RooftopsHeroRuntimeState,
} from './heroSheet';

function state(overrides: Partial<RooftopsHeroRuntimeState> = {}): RooftopsHeroRuntimeState {
  return {
    status: GameStatus.PLAYING,
    isAirborne: false,
    verticalVelocity: 0,
    isMoving: false,
    isGliding: false,
    isHurt: false,
    isStompingOrLanding: false,
    isPoweringUp: false,
    ...overrides,
  };
}

describe('City Heights platformer hero sheet contract', () => {
  it('uses a fixed true-pixel sheet with bottom-center anchoring', () => {
    expect(ROOFTOPS_HERO_SHEET.path).toContain('platformer-hero-sheet.png');
    expect(ROOFTOPS_HERO_SHEET.frameWidth).toBe(64);
    expect(ROOFTOPS_HERO_SHEET.frameHeight).toBe(64);
    expect(ROOFTOPS_HERO_SHEET.columns).toBe(8);
    expect(ROOFTOPS_HERO_SHEET.frameMax).toBe(32);
    expect(ROOFTOPS_HERO_SHEET.origin).toEqual({ x: 0.5, y: 1 });
    expect(ROOFTOPS_HERO_SHEET.bottomPadding).toBe(
      ROOFTOPS_HERO_SHEET.frameHeight - ROOFTOPS_HERO_SHEET.feetBaselineY,
    );
  });

  it('covers every required platformer animation state with valid frame indexes', () => {
    expect(ROOFTOPS_HERO_ANIMATIONS.map(anim => anim.id)).toEqual([
      'idle',
      'run',
      'jumpRise',
      'fall',
      'landStomp',
      'glide',
      'hurt',
      'victory',
      'defeat',
      'powerUp',
    ]);

    const keys = new Set<string>();
    for (const animation of ROOFTOPS_HERO_ANIMATIONS) {
      expect(keys.has(animation.key)).toBe(false);
      keys.add(animation.key);
      expect(ROOFTOPS_HERO_ANIMATION_KEYS[animation.id]).toBe(animation.key);
      for (const frame of animation.frames) {
        expect(frame).toBeGreaterThanOrEqual(0);
        expect(frame).toBeLessThan(ROOFTOPS_HERO_SHEET.frameMax);
      }
    }
  });

  it('documents collision boxes separately from visual padding', () => {
    expect(getRooftopsHeroCollisionBox('normal')).toEqual({ x: 12, y: 10, width: 40, height: 48 });
    expect(getRooftopsHeroCollisionBox('airborne')).toEqual(getRooftopsHeroCollisionBox('normal'));
    expect(getRooftopsHeroCollisionBox('stomp').height).toBeLessThan(getRooftopsHeroCollisionBox('normal').height);
    expect(getRooftopsHeroCollisionBox('glide').width).toBeGreaterThan(getRooftopsHeroCollisionBox('normal').width);
  });
});

describe('City Heights platformer hero animation resolver', () => {
  it('maps ordinary platformer state to movement animations', () => {
    expect(resolveRooftopsHeroAnimation(state())).toBe('idle');
    expect(resolveRooftopsHeroAnimation(state({ isMoving: true }))).toBe('run');
    expect(resolveRooftopsHeroAnimation(state({ isAirborne: true, verticalVelocity: -50 }))).toBe('jumpRise');
    expect(resolveRooftopsHeroAnimation(state({ isAirborne: true, verticalVelocity: 20 }))).toBe('fall');
    expect(resolveRooftopsHeroAnimation(state({ isGliding: true, isAirborne: true, verticalVelocity: 20 }))).toBe('glide');
  });

  it('prioritizes outcomes and feedback over movement', () => {
    expect(resolveRooftopsHeroAnimation(state({ isPoweringUp: true, isMoving: true }))).toBe('powerUp');
    expect(resolveRooftopsHeroAnimation(state({ isStompingOrLanding: true, isPoweringUp: true }))).toBe('landStomp');
    expect(resolveRooftopsHeroAnimation(state({ isHurt: true, isStompingOrLanding: true }))).toBe('hurt');
    expect(resolveRooftopsHeroAnimation(state({ status: GameStatus.VICTORY, isHurt: true }))).toBe('victory');
    expect(resolveRooftopsHeroAnimation(state({ status: GameStatus.GAMEOVER }))).toBe('defeat');
  });
});
