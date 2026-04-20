import type { LevelId } from '../types';
import { getAnyLevelConfig } from '../levels';
import { getNextLevelId, isLevelUnlocked } from '../levels/catalog';
import type { CompletedLevelsState } from './levelProgress';

export interface VictoryProgressCopy {
  currentLevelName: string;
  nextUnlockedLevelName: string | null;
}

export function getVictoryProgressCopy(
  levelId: LevelId,
  completedLevels: CompletedLevelsState,
): VictoryProgressCopy {
  const currentLevelName = getAnyLevelConfig(levelId).name;
  const nextLevelId = getNextLevelId(levelId);

  if (!nextLevelId || !isLevelUnlocked(completedLevels, nextLevelId)) {
    return {
      currentLevelName,
      nextUnlockedLevelName: null,
    };
  }

  return {
    currentLevelName,
    nextUnlockedLevelName: getAnyLevelConfig(nextLevelId).name,
  };
}
