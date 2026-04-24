import { describe, expect, it } from 'vitest';
import {
  BOSS_AMMO_REFILL_INTERVAL_MS,
  BOSS_MIN_REFILL_AMMO,
  getBossStartingShellAmmo,
  getRequiredBossShellHits,
  shouldRefillBossShellAmmo,
} from './bossAmmo';

describe('boss ammo economy', () => {
  it('calculates shells required to defeat the boss', () => {
    expect(getRequiredBossShellHits(20, 4)).toBe(5);
    expect(getRequiredBossShellHits(21, 4)).toBe(6);
  });

  it('tops up starting boss ammo without deleting earned ammo', () => {
    expect(getBossStartingShellAmmo(0, 20, 4)).toBe(6);
    expect(getBossStartingShellAmmo(9, 20, 4)).toBe(9);
  });

  it('refills only after the intro and only below the ammo floor', () => {
    const bossAttackStartTime = 1_000;
    expect(shouldRefillBossShellAmmo({
      ammo: 0,
      bossAttackStartTime,
      isDefeating: false,
      lastRefillAt: 0,
      now: 900,
    })).toBe(false);
    expect(shouldRefillBossShellAmmo({
      ammo: BOSS_MIN_REFILL_AMMO,
      bossAttackStartTime,
      isDefeating: false,
      lastRefillAt: 0,
      now: 1_200,
    })).toBe(false);
    expect(shouldRefillBossShellAmmo({
      ammo: 0,
      bossAttackStartTime,
      isDefeating: false,
      lastRefillAt: 1_200,
      now: 1_200 + BOSS_AMMO_REFILL_INTERVAL_MS,
    })).toBe(true);
  });
});
