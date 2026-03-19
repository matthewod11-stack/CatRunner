import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  readCatCharacterState,
  writeCatCharacterState,
} from './migrateCatStorage';
import { CAT_CHARACTER_STATE_KEY } from './catAssetStore';

describe('readCatCharacterState', () => {
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

  it('returns null when missing or invalid', () => {
    expect(readCatCharacterState()).toBeNull();
    localStorage.setItem(CAT_CHARACTER_STATE_KEY, '{}');
    expect(readCatCharacterState()).toBeNull();
  });

  it('round-trips valid v1 state', () => {
    const state = {
      schema: 1 as const,
      equippedAssetId: 'asset-1',
      looks: [
        {
          id: 'row-1',
          name: 'Test',
          assetId: 'asset-1',
          createdAt: 1,
        },
      ],
    };
    writeCatCharacterState(state);
    expect(readCatCharacterState()).toEqual(state);
  });

  it('normalizes equipped to null when wrong type', () => {
    localStorage.setItem(
      CAT_CHARACTER_STATE_KEY,
      JSON.stringify({ schema: 1, equippedAssetId: 99, looks: [] })
    );
    expect(readCatCharacterState()).toEqual({ schema: 1, equippedAssetId: null, looks: [] });
  });
});
