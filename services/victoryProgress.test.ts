import { describe, expect, it } from 'vitest';
import { getVictoryProgressCopy } from './victoryProgress';

describe('getVictoryProgressCopy', () => {
  it('uses genre-safe config lookup when a non-runner unlocks the next level', () => {
    expect(
      getVictoryProgressCopy('ROOFTOPS', { ROOFTOPS: true })
    ).toEqual({
      currentLevelName: 'City Heights',
      nextUnlockedLevelName: 'Countertop Chaos',
    });
  });

  it('uses genre-safe config lookup when replaying the final non-runner level', () => {
    expect(
      getVictoryProgressCopy('CAT_TREE', { GARDEN_SNAKE: true, CAT_TREE: true })
    ).toEqual({
      currentLevelName: 'The Cat Tree',
      nextUnlockedLevelName: null,
    });
  });
});
