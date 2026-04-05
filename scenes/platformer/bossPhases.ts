import type { PlatformerBossConfig } from '../../types';
import type { BossPhaseId, BossPhaseState } from './types';

export const INITIAL_HP = 3;

export function createBossState(): BossPhaseState {
  return {
    phase: 1,
    hp: INITIAL_HP,
    swoopCount: 0,
    isLanded: false,
    landTimer: 0,
    miniPigeonCount: 0,
  };
}

/** Check if the boss should land based on current swoop count and phase config */
export function shouldLand(state: BossPhaseState, config: PlatformerBossConfig): boolean {
  const phaseConfig = config.phases[state.phase - 1];
  return state.swoopCount >= phaseConfig.swoopsBeforeLand;
}

/** Get the land duration for the current phase (in seconds) */
export function getLandDuration(state: BossPhaseState, config: PlatformerBossConfig): number {
  return config.phases[state.phase - 1].landDuration;
}

/** Get feather count for current phase */
export function getFeathersPerPass(state: BossPhaseState, config: PlatformerBossConfig): number {
  return config.phases[state.phase - 1].feathersPerPass;
}

/** Get swoop speed for current phase */
export function getSwoopSpeed(state: BossPhaseState, config: PlatformerBossConfig): number {
  return config.phases[state.phase - 1].swoopSpeed;
}

/** Get mini pigeon count for current phase */
export function getMiniPigeonCount(state: BossPhaseState, config: PlatformerBossConfig): number {
  return config.phases[state.phase - 1].miniPigeonCount;
}

/** Check if current phase has dive bomb attack */
export function hasDiveBomb(state: BossPhaseState, config: PlatformerBossConfig): boolean {
  return config.phases[state.phase - 1].hasDiveBomb;
}

/** After a stomp: decrement HP, advance phase, reset swoop counter */
export function advanceBossPhase(state: BossPhaseState): BossPhaseState {
  const newHp = state.hp - 1;
  const newPhase = Math.min(state.phase + 1, 3) as BossPhaseId;
  return {
    phase: newHp > 0 ? newPhase : state.phase,
    hp: newHp,
    swoopCount: 0,
    isLanded: false,
    landTimer: 0,
    miniPigeonCount: 0,
  };
}
