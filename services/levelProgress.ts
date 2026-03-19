import type { LevelId } from '../types';

export const DEFEATED_BOSSES_STORAGE_KEY = 'beach-cat-defeated-bosses-v1';

export type DefeatedBossesState = Partial<Record<LevelId, boolean>>;

export function loadDefeatedBosses(): DefeatedBossesState {
  try {
    const raw = localStorage.getItem(DEFEATED_BOSSES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as DefeatedBossesState;
  } catch {
    return {};
  }
}

export function saveDefeatedBosses(state: DefeatedBossesState): void {
  try {
    localStorage.setItem(DEFEATED_BOSSES_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / private mode */
  }
}
