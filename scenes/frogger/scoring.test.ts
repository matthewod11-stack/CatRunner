import { describe, it, expect } from 'vitest';
import {
  scoreAfterHigherRow,
  scoreAfterCrossing,
  ROW_ADVANCE_POINTS,
  CROSSING_BONUS_POINTS,
} from './scoring';

describe('scoring', () => {
  it('adds row points once when new highest row is higher', () => {
    const r = scoreAfterHigherRow(0, 3, 0);
    expect(r.highestRow).toBe(3);
    expect(r.score).toBe(ROW_ADVANCE_POINTS);
  });
  it('skips when row not higher', () => {
    const r = scoreAfterHigherRow(5, 3, 100);
    expect(r).toEqual({ score: 100, highestRow: 5 });
  });
  it('crossing bonus', () => {
    expect(scoreAfterCrossing(50)).toBe(50 + CROSSING_BONUS_POINTS);
  });
});
