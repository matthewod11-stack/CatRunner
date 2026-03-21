import type { GameScore, HighScoreEntry, LevelId } from '../types';
import type { CompletedLevelsState, DefeatedBossesState } from './levelProgress';

export const HALL_OF_FAME_STORAGE_KEY = 'beach-cat-scores-v2';

export const HALL_OF_FAME_MAX_ENTRIES = 5;

/** Sorted by score descending, capped at `maxEntries` (Hall of Fame). */
export function mergeHallOfFameAfterRun(
  prev: HighScoreEntry[],
  newEntry: HighScoreEntry,
  maxEntries: number = HALL_OF_FAME_MAX_ENTRIES
): HighScoreEntry[] {
  return [...prev, newEntry].sort((a, b) => b.score - a.score).slice(0, maxEntries);
}

export function nextCompletedLevelsAfterWin(
  prev: CompletedLevelsState,
  levelBeat: LevelId
): CompletedLevelsState {
  return { ...prev, [levelBeat]: true };
}

/** @deprecated Use `nextCompletedLevelsAfterWin` */
export function nextDefeatedBossesAfterVictory(
  prev: DefeatedBossesState,
  levelBeat: LevelId
): DefeatedBossesState {
  return nextCompletedLevelsAfterWin(prev, levelBeat);
}

/**
 * Engine hands off `gameScore`; App refills lives on win.
 * `reactHighWaterMark` is the score slice already in React (may be ahead of the engine snapshot).
 */
export function nextGameScoreAfterVictory(
  gameScore: GameScore,
  finalScore: number,
  maxLives: number,
  reactHighWaterMark: number
): GameScore {
  return {
    ...gameScore,
    high: Math.max(gameScore.high, finalScore, reactHighWaterMark),
    lives: maxLives,
  };
}
