import type { LevelId } from '../types';

/* ── storage keys ───────────────────────────────────────────── */

export const COMPLETED_LEVELS_STORAGE_KEY = 'beach-cat-completed-levels-v1';

/** @deprecated Will be removed after full migration to `COMPLETED_LEVELS_STORAGE_KEY`. */
export const DEFEATED_BOSSES_STORAGE_KEY = 'beach-cat-defeated-bosses-v1';

/* ── new types & functions (V3) ─────────────────────────────── */

export type CompletedLevelsState = Partial<Record<LevelId, boolean>>;

/**
 * Load completed-levels state.
 * Migrates from the legacy `defeatedBosses` key on first call if needed.
 */
export function loadCompletedLevels(): CompletedLevelsState {
  try {
    const raw = localStorage.getItem(COMPLETED_LEVELS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === 'object') return parsed as CompletedLevelsState;
      return {};
    }

    // Migration: try legacy key
    const legacy = localStorage.getItem(DEFEATED_BOSSES_STORAGE_KEY);
    if (!legacy) return {};
    const legacyParsed = JSON.parse(legacy) as unknown;
    if (!legacyParsed || typeof legacyParsed !== 'object') return {};

    const migrated = legacyParsed as CompletedLevelsState;
    // Persist under new key, then remove old key
    localStorage.setItem(COMPLETED_LEVELS_STORAGE_KEY, JSON.stringify(migrated));
    localStorage.removeItem(DEFEATED_BOSSES_STORAGE_KEY);
    return migrated;
  } catch {
    return {};
  }
}

export function saveCompletedLevels(state: CompletedLevelsState): void {
  try {
    localStorage.setItem(COMPLETED_LEVELS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / private mode */
  }
}

/* ── legacy aliases (deprecated — remove after full migration) ── */

/** @deprecated Use `CompletedLevelsState` */
export type DefeatedBossesState = CompletedLevelsState;

/** @deprecated Use `loadCompletedLevels` */
export function loadDefeatedBosses(): DefeatedBossesState {
  return loadCompletedLevels();
}

/** @deprecated Use `saveCompletedLevels` */
export function saveDefeatedBosses(state: DefeatedBossesState): void {
  saveCompletedLevels(state);
}
