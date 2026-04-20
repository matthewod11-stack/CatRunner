import { describe, it, expect } from 'vitest';
import * as runOutcome from './runOutcome';
import {
  HALL_OF_FAME_MAX_ENTRIES,
  mergeHallOfFameAfterRun,
  nextCompletedLevelsAfterWin,
  nextGameScoreAfterVictory,
} from './runOutcome';
import type { HighScoreEntry, GameScore } from '../types';

const entry = (score: number, name: string, extra?: Partial<HighScoreEntry>): HighScoreEntry => ({
  name,
  score,
  date: 0,
  ...extra,
});

describe('mergeHallOfFameAfterRun', () => {
  it('sorts by score descending and keeps top N', () => {
    const prev = [entry(100, 'a'), entry(50, 'b')];
    const next = mergeHallOfFameAfterRun(prev, entry(75, 'c'), HALL_OF_FAME_MAX_ENTRIES);
    expect(next.map((e) => e.score)).toEqual([100, 75, 50]);
  });

  it('drops lowest when over cap', () => {
    const prev = Array.from({ length: HALL_OF_FAME_MAX_ENTRIES }, (_, i) =>
      entry(100 - i, `p${i}`)
    );
    const next = mergeHallOfFameAfterRun(prev, entry(200, 'winner'), HALL_OF_FAME_MAX_ENTRIES);
    expect(next).toHaveLength(HALL_OF_FAME_MAX_ENTRIES);
    expect(next[0].score).toBe(200);
    expect(next.some((e) => e.score === 96)).toBe(false);
  });

  it('preserves isVictory on the new row', () => {
    const next = mergeHallOfFameAfterRun([], entry(10, 'x', { isVictory: true }));
    expect(next[0].isVictory).toBe(true);
  });
});

describe('nextCompletedLevelsAfterWin', () => {
  it('sets the beaten level without dropping prior flags', () => {
    expect(nextCompletedLevelsAfterWin({}, 'BEACH')).toEqual({ BEACH: true });
    expect(nextCompletedLevelsAfterWin({ BEACH: true }, 'BEACH')).toEqual({ BEACH: true });
  });
});

describe('runOutcome public surface', () => {
  it('does not expose deprecated defeated-bosses helpers', () => {
    expect('nextDefeatedBossesAfterVictory' in runOutcome).toBe(false);
  });
});

describe('nextGameScoreAfterVictory', () => {
  const base: GameScore = {
    current: 0,
    high: 10,
    coins: 5,
    multiplier: 2,
    streak: 3,
    lives: 0,
  };

  it('refills lives and takes high water mark from engine, final score, and React state', () => {
    const out = nextGameScoreAfterVictory(base, 40, 9, 500);
    expect(out.lives).toBe(9);
    expect(out.high).toBe(500);
    expect(out.coins).toBe(5);
    expect(out.multiplier).toBe(2);
  });

  it('uses engine snapshot when React high is lower', () => {
    const out = nextGameScoreAfterVictory({ ...base, high: 80 }, 60, 9, 30);
    expect(out.high).toBe(80);
  });
});
