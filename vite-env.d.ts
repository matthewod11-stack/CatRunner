/// <reference types="vite/client" />

import type { GameScore, GameStatus, HighScoreEntry, LevelId } from './types';
import type { CompletedLevelsState } from './services/levelProgress';

interface BeachKittySmokeVictoryOptions {
  levelId?: LevelId;
  finalScore?: number;
  awardedStars?: 1 | 2 | 3;
}

interface BeachKittySmokeTestApi {
  startBossPractice: () => void;
  forceVictory: (options?: BeachKittySmokeVictoryOptions) => void;
  forceGameOver: (finalScore?: number) => Promise<void>;
  getSnapshot: () => {
    status: GameStatus;
    selectedLevel: LevelId;
    completedLevels: CompletedLevelsState;
    highScores: HighScoreEntry[];
    score: GameScore;
    shellAmmo?: number;
  };
}

declare global {
  interface Window {
    __BEACH_KITTY_TEST_API__?: BeachKittySmokeTestApi;
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => string;
    enter_platformer_boss_for_qa?: () => string;
    drop_on_platformer_boss_for_qa?: () => string;
  }
}
