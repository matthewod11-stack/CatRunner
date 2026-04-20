import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as levelProgress from './levelProgress';
import {
  COMPLETED_LEVELS_STORAGE_KEY,
  DEFEATED_BOSSES_STORAGE_KEY,
  loadCompletedLevels,
  saveCompletedLevels,
} from './levelProgress';
import { isLevelUnlocked, LEVEL_ORDER } from '../levels/catalog';

/* ── shared localStorage mock ───────────────────────────────── */

const store: Record<string, string> = {};

function installMockStorage() {
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
}

function teardownMockStorage() {
  delete (globalThis as { localStorage?: Storage }).localStorage;
}

describe('levelProgress public surface', () => {
  it('does not expose deprecated defeated-bosses wrappers', () => {
    expect('loadDefeatedBosses' in levelProgress).toBe(false);
    expect('saveDefeatedBosses' in levelProgress).toBe(false);
  });
});

/* ── new API: loadCompletedLevels / saveCompletedLevels ──────── */

describe('loadCompletedLevels / saveCompletedLevels', () => {
  beforeEach(installMockStorage);
  afterEach(teardownMockStorage);

  it('returns empty object when both keys missing', () => {
    expect(loadCompletedLevels()).toEqual({});
  });

  it('reads from new key when it exists', () => {
    const data = { BEACH: true, ROOFTOPS: true };
    localStorage.setItem(COMPLETED_LEVELS_STORAGE_KEY, JSON.stringify(data));
    expect(loadCompletedLevels()).toEqual(data);
  });

  it('round-trips via save / load', () => {
    const state = { KITCHEN: true };
    saveCompletedLevels(state);
    expect(loadCompletedLevels()).toEqual(state);
  });

  it('returns empty for corrupt new key', () => {
    localStorage.setItem(COMPLETED_LEVELS_STORAGE_KEY, 'not-json');
    expect(loadCompletedLevels()).toEqual({});
  });

  it('returns empty when new key contains a non-object', () => {
    localStorage.setItem(COMPLETED_LEVELS_STORAGE_KEY, '42');
    expect(loadCompletedLevels()).toEqual({});
  });
});

/* ── migration from old key to new key ──────────────────────── */

describe('loadCompletedLevels migration', () => {
  beforeEach(installMockStorage);
  afterEach(teardownMockStorage);

  it('migrates from old key when new key is missing', () => {
    const legacy = { BEACH: true, ROOFTOPS: true };
    localStorage.setItem(DEFEATED_BOSSES_STORAGE_KEY, JSON.stringify(legacy));

    const result = loadCompletedLevels();
    expect(result).toEqual(legacy);
  });

  it('removes old key after migration', () => {
    localStorage.setItem(DEFEATED_BOSSES_STORAGE_KEY, JSON.stringify({ BEACH: true }));

    loadCompletedLevels();
    expect(localStorage.getItem(DEFEATED_BOSSES_STORAGE_KEY)).toBeNull();
  });

  it('writes new key during migration', () => {
    const legacy = { BEACH: true };
    localStorage.setItem(DEFEATED_BOSSES_STORAGE_KEY, JSON.stringify(legacy));

    loadCompletedLevels();
    expect(localStorage.getItem(COMPLETED_LEVELS_STORAGE_KEY)).toBe(JSON.stringify(legacy));
  });

  it('does not re-migrate if new key already exists', () => {
    const oldData = { BEACH: true };
    const newData = { BEACH: true, ROOFTOPS: true };
    localStorage.setItem(DEFEATED_BOSSES_STORAGE_KEY, JSON.stringify(oldData));
    localStorage.setItem(COMPLETED_LEVELS_STORAGE_KEY, JSON.stringify(newData));

    const result = loadCompletedLevels();
    // Should use new key data, ignoring old key
    expect(result).toEqual(newData);
    // Old key should still be present (not touched)
    expect(localStorage.getItem(DEFEATED_BOSSES_STORAGE_KEY)).toBe(JSON.stringify(oldData));
  });

  it('handles corrupt old key gracefully', () => {
    localStorage.setItem(DEFEATED_BOSSES_STORAGE_KEY, '{{{bad-json');
    expect(loadCompletedLevels()).toEqual({});
  });

  it('handles non-object old key gracefully', () => {
    localStorage.setItem(DEFEATED_BOSSES_STORAGE_KEY, '"just-a-string"');
    expect(loadCompletedLevels()).toEqual({});
  });
});

/* ── unlock persistence integration ─────────────────────────── */

describe('unlock persistence integration', () => {
  it('after recording beach boss defeat, first campaign level stays unlocked', () => {
    const completedLevels = { BEACH: true };
    const first = LEVEL_ORDER[0];
    expect(isLevelUnlocked(completedLevels, first)).toBe(true);
  });
});
