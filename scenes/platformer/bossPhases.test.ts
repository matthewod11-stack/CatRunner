import { describe, it, expect } from 'vitest';
import { createBossState, advanceBossPhase, shouldLand, INITIAL_HP } from './bossPhases';
import type { PlatformerBossConfig } from '../../types';

const BOSS_CONFIG: PlatformerBossConfig = {
  arenaWidth: 1200,
  phases: [
    { swoopSpeed: 200, feathersPerPass: 2, swoopsBeforeLand: 2, landDuration: 3, miniPigeonCount: 0, hasDiveBomb: false },
    { swoopSpeed: 280, feathersPerPass: 3, swoopsBeforeLand: 2, landDuration: 2, miniPigeonCount: 2, hasDiveBomb: false },
    { swoopSpeed: 350, feathersPerPass: 4, swoopsBeforeLand: 3, landDuration: 1.5, miniPigeonCount: 3, hasDiveBomb: true },
  ],
};

describe('createBossState', () => {
  it('initializes at phase 1 with full HP', () => {
    const state = createBossState();
    expect(state.phase).toBe(1);
    expect(state.hp).toBe(INITIAL_HP);
    expect(state.swoopCount).toBe(0);
    expect(state.isLanded).toBe(false);
  });
});

describe('shouldLand', () => {
  it('returns true when swoop count reaches phase threshold', () => {
    const state = createBossState();
    state.swoopCount = 2;
    expect(shouldLand(state, BOSS_CONFIG)).toBe(true);
  });

  it('returns false before enough swoops', () => {
    const state = createBossState();
    state.swoopCount = 1;
    expect(shouldLand(state, BOSS_CONFIG)).toBe(false);
  });
});

describe('advanceBossPhase', () => {
  it('decrements HP and advances phase', () => {
    const state = createBossState();
    const next = advanceBossPhase(state);
    expect(next.hp).toBe(INITIAL_HP - 1);
    expect(next.phase).toBe(2);
    expect(next.swoopCount).toBe(0);
    expect(next.isLanded).toBe(false);
  });

  it('advances to phase 3 on second stomp', () => {
    let state = createBossState();
    state = advanceBossPhase(state);
    state = advanceBossPhase(state);
    expect(state.phase).toBe(3);
    expect(state.hp).toBe(1);
  });

  it('reaches 0 HP on third stomp', () => {
    let state = createBossState();
    state = advanceBossPhase(state);
    state = advanceBossPhase(state);
    state = advanceBossPhase(state);
    expect(state.hp).toBe(0);
  });
});
