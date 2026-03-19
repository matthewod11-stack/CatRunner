import { describe, it, expect } from 'vitest';
import {
  isLevelUnlocked,
  getNextLevelId,
  LEVEL_ORDER,
  getBossEntryCoinThreshold,
  mergeLevelTuning,
} from './catalog';
import { BEACH_LEVEL_CONFIG } from './beach';
import { DEFAULT_TUNING } from '../systems/tuning/defaultTuning';

describe('isLevelUnlocked', () => {
  it('unlocks the first level in order', () => {
    expect(isLevelUnlocked({}, LEVEL_ORDER[0])).toBe(true);
  });

  it('locks later levels until the previous boss is defeated', () => {
    const beach = LEVEL_ORDER[0];
    expect(isLevelUnlocked({}, beach)).toBe(true);
    if (LEVEL_ORDER.length > 1) {
      expect(isLevelUnlocked({}, LEVEL_ORDER[1])).toBe(false);
      expect(isLevelUnlocked({ [beach]: true }, LEVEL_ORDER[1])).toBe(true);
    }
  });
});

describe('getNextLevelId', () => {
  it('returns null after the last level', () => {
    const last = LEVEL_ORDER[LEVEL_ORDER.length - 1];
    expect(getNextLevelId(last)).toBeNull();
  });
});

describe('mergeLevelTuning', () => {
  it('overrides store fields with level tuningOverrides', () => {
    const level = {
      ...BEACH_LEVEL_CONFIG,
      tuningOverrides: { bossThreshold: 33, gravity: 0.1 },
    };
    const merged = mergeLevelTuning(DEFAULT_TUNING, level);
    expect(merged.bossThreshold).toBe(33);
    expect(merged.gravity).toBe(0.1);
    expect(merged.jumpForce).toBe(DEFAULT_TUNING.jumpForce);
  });

  it('leaves store unchanged when level has no overrides', () => {
    const level = { ...BEACH_LEVEL_CONFIG, tuningOverrides: undefined };
    expect(mergeLevelTuning(DEFAULT_TUNING, level)).toEqual(DEFAULT_TUNING);
  });

  it('matches manual spread used before mergeLevelTuning existed', () => {
    const level = {
      ...BEACH_LEVEL_CONFIG,
      tuningOverrides: { bossThreshold: 77 },
    };
    const merged = mergeLevelTuning(DEFAULT_TUNING, level);
    const manual = { ...DEFAULT_TUNING, ...(level.tuningOverrides ?? {}) };
    expect(merged).toEqual(manual);
    expect(getBossEntryCoinThreshold(level, merged)).toBe(
      getBossEntryCoinThreshold(level, manual)
    );
  });
});

describe('getBossEntryCoinThreshold', () => {
  it('prefers level bossEntryCoinThreshold when set', () => {
    const level = { ...BEACH_LEVEL_CONFIG, bossEntryCoinThreshold: 42 };
    expect(getBossEntryCoinThreshold(level, DEFAULT_TUNING)).toBe(42);
  });

  it('falls back to tuning bossThreshold', () => {
    expect(
      getBossEntryCoinThreshold(BEACH_LEVEL_CONFIG, {
        ...DEFAULT_TUNING,
        bossThreshold: 99,
      })
    ).toBe(99);
  });
});
