import { describe, expect, it } from 'vitest';
import { getHallOfFameEntryContext } from './hallOfFame';

describe('getHallOfFameEntryContext', () => {
  it('returns level and genre context for modern entries', () => {
    expect(getHallOfFameEntryContext({ levelId: 'ROOFTOPS' })).toEqual({
      levelName: 'City Heights',
      genreName: 'Platformer',
      isLegacy: false,
    });
  });

  it('falls back cleanly for legacy entries without level context', () => {
    expect(getHallOfFameEntryContext({})).toEqual({
      levelName: 'Legacy run',
      genreName: null,
      isLegacy: true,
    });
  });
});
