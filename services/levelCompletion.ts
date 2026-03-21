import type { LevelId, LevelResult } from '../types';

function storageKey(levelId: LevelId): string {
  return `beach-cat-level-result-${levelId}-v1`;
}

export function computeStars(
  score: number,
  thresholds: [number, number, number]
): 1 | 2 | 3 {
  if (score >= thresholds[2]) return 3;
  if (score >= thresholds[1]) return 2;
  return 1;
}

export function loadLevelResult(levelId: LevelId): LevelResult | null {
  try {
    const raw = localStorage.getItem(storageKey(levelId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.score === 'number' &&
      typeof parsed.stars === 'number' &&
      parsed.levelId === levelId
    ) {
      return parsed as LevelResult;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveLevelResult(result: LevelResult): void {
  const existing = loadLevelResult(result.levelId);
  const merged: LevelResult = existing
    ? {
        levelId: result.levelId,
        score: Math.max(existing.score, result.score),
        stars: Math.max(existing.stars, result.stars) as 1 | 2 | 3,
      }
    : result;
  try {
    localStorage.setItem(storageKey(merged.levelId), JSON.stringify(merged));
  } catch {
    // localStorage full — silently fail
  }
}
