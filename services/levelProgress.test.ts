import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  DEFEATED_BOSSES_STORAGE_KEY,
  loadDefeatedBosses,
  saveDefeatedBosses,
} from './levelProgress';
import { isLevelUnlocked, LEVEL_ORDER } from '../levels/catalog';

describe('loadDefeatedBosses / saveDefeatedBosses', () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    globalThis.localStorage = {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
      key: () => null,
      length: 0,
    } as Storage;
  });

  afterEach(() => {
    delete (globalThis as { localStorage?: Storage }).localStorage;
  });

  it('returns empty object when missing or invalid', () => {
    expect(loadDefeatedBosses()).toEqual({});
    localStorage.setItem(DEFEATED_BOSSES_STORAGE_KEY, 'not-json');
    expect(loadDefeatedBosses()).toEqual({});
    localStorage.setItem(DEFEATED_BOSSES_STORAGE_KEY, '1');
    expect(loadDefeatedBosses()).toEqual({});
  });

  it('round-trips defeated flags', () => {
    const state = { BEACH: true as const };
    saveDefeatedBosses(state);
    expect(loadDefeatedBosses()).toEqual(state);
    expect(localStorage.getItem(DEFEATED_BOSSES_STORAGE_KEY)).toContain('BEACH');
  });
});

describe('unlock persistence integration', () => {
  it('after recording beach boss defeat, first campaign level stays unlocked', () => {
    const defeated = { BEACH: true };
    const first = LEVEL_ORDER[0];
    expect(isLevelUnlocked(defeated, first)).toBe(true);
  });
});
