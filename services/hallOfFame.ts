import type { HighScoreEntry } from '../types';
import { getAnyLevelConfig } from '../levels';

export interface HallOfFameEntryContext {
  levelName: string;
  genreName: string | null;
  isLegacy: boolean;
}

const GENRE_LABELS = {
  runner: 'Runner',
  platformer: 'Platformer',
  launcher: 'Launcher',
  shooter: 'Shooter',
  breakout: 'Breakout',
  frogger: 'Frogger',
  whack: 'Whack',
  snake: 'Snake',
  climber: 'Climber',
} as const;

export function getHallOfFameEntryContext(
  entry: Pick<HighScoreEntry, 'levelId'>,
): HallOfFameEntryContext {
  if (!entry.levelId) {
    return {
      levelName: 'Legacy run',
      genreName: null,
      isLegacy: true,
    };
  }

  try {
    const level = getAnyLevelConfig(entry.levelId);
    return {
      levelName: level.name,
      genreName: GENRE_LABELS[level.genre],
      isLegacy: false,
    };
  } catch {
    return {
      levelName: 'Legacy run',
      genreName: null,
      isLegacy: true,
    };
  }
}
