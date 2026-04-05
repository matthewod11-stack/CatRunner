import { describe, it, expect } from 'vitest';
import { moveIntervalAfterElapsed, shouldAddExtraWallNow } from './escalation';

describe('moveIntervalAfterElapsed', () => {
  it('at 0ms returns base interval', () => {
    expect(moveIntervalAfterElapsed(180, 70, 0, 10_000, 4)).toBe(180);
  });

  it('after 10s with step 4 every 10s reduces interval by 4', () => {
    expect(moveIntervalAfterElapsed(180, 70, 10_000, 10_000, 4)).toBe(176);
  });

  it('clamps at min', () => {
    expect(moveIntervalAfterElapsed(180, 70, 1_000_000, 10_000, 4)).toBe(70);
  });

  it('returns base when speedStepEveryMs is non-positive', () => {
    expect(moveIntervalAfterElapsed(180, 70, 50_000, 0, 4)).toBe(180);
  });
});

describe('shouldAddExtraWallNow', () => {
  it('is false when no threshold crossed', () => {
    expect(shouldAddExtraWallNow(24_000, 20_000, [25_000, 50_000])).toBe(false);
  });

  it('is true exactly when crossing a threshold', () => {
    expect(shouldAddExtraWallNow(25_000, 24_999, [25_000, 50_000])).toBe(true);
  });

  it('is false when already past threshold in prev window', () => {
    expect(shouldAddExtraWallNow(26_000, 25_000, [25_000, 50_000])).toBe(false);
  });
});
