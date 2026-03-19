import type { LevelConfig, LevelId } from '../types';
import type { TuningProfile } from '../systems/tuning/defaultTuning';

/**
 * Single merge rule for runtime tuning: global dev panel store + level overrides.
 * **`App` and `GameEngine` must both use this** so boss entry, HUD, sky/sun, and physics stay aligned.
 */
export function mergeLevelTuning(
  storeTuning: TuningProfile,
  level: LevelConfig
): TuningProfile {
  return { ...storeTuning, ...(level.tuningOverrides ?? {}) };
}

/** Coins (stars) needed to enter boss; level override or merged tuning `bossThreshold`. */
export function getBossEntryCoinThreshold(
  level: LevelConfig,
  tuning: TuningProfile
): number {
  return level.bossEntryCoinThreshold ?? tuning.bossThreshold;
}

/** Campaign order; when adding levels, extend `LevelId` + registry and append here. */
export const LEVEL_ORDER: LevelId[] = ['BEACH'];

export function isLevelUnlocked(
  defeatedBosses: Partial<Record<LevelId, boolean>>,
  id: LevelId
): boolean {
  const i = LEVEL_ORDER.indexOf(id);
  if (i < 0) return false;
  if (i === 0) return true;
  return !!defeatedBosses[LEVEL_ORDER[i - 1]];
}

export function getNextLevelId(current: LevelId): LevelId | null {
  const i = LEVEL_ORDER.indexOf(current);
  if (i < 0 || i >= LEVEL_ORDER.length - 1) return null;
  return LEVEL_ORDER[i + 1];
}

export function getPreviousLevelId(id: LevelId): LevelId | null {
  const i = LEVEL_ORDER.indexOf(id);
  if (i <= 0) return null;
  return LEVEL_ORDER[i - 1];
}
