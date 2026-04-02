import type { CatCharacterStateV1, SavedCatLook } from '../types';
import {
  CAT_CHARACTER_STATE_KEY,
  LEGACY_CAT_LOOK_KEY,
  LEGACY_CAT_OUTFITS_KEY,
  catAssetDbHolder,
  dataUrlToPngBlob,
  getCatSprite,
  openCatAssetDb,
  putCatSprite,
} from './catAssetStore';
import { blobContentKey } from './blobContentKey';

function isSavedCatLook(x: unknown): x is SavedCatLook {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.assetId === 'string' &&
    typeof o.createdAt === 'number'
  );
}

export function readCatCharacterState(): CatCharacterStateV1 | null {
  try {
    const raw = localStorage.getItem(CAT_CHARACTER_STATE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as unknown;
    if (!o || typeof o !== 'object') return null;
    const rec = o as Record<string, unknown>;
    if (rec.schema !== 1 || !Array.isArray(rec.looks)) return null;
    const equipped =
      rec.equippedAssetId === null || typeof rec.equippedAssetId === 'string'
        ? (rec.equippedAssetId as string | null)
        : null;
    const looks = rec.looks.filter(isSavedCatLook);
    return { schema: 1, equippedAssetId: equipped, looks };
  } catch {
    return null;
  }
}

export function writeCatCharacterState(state: CatCharacterStateV1): void {
  localStorage.setItem(CAT_CHARACTER_STATE_KEY, JSON.stringify(state));
}

type LegacyOutfitRow = { id?: string; name?: string; url?: string };

/** Serialize first-time legacy → v1 migration so concurrent tabs do not double-write blobs/state. */
const CAT_MIGRATION_LOCK_NAME = 'beach-kitty-cat-migration-v1';

/**
 * Opens IndexedDB, migrates legacy localStorage blobs once, writes `beach-cat-cat-state-v1`.
 * Legacy keys are removed only after successful v1 persistence and successful blob writes for
 * the data being cleared. Returns null db if IndexedDB is unavailable (caller keeps legacy keys / Outfit flow).
 */
async function migrateCatStorageBody(): Promise<IDBDatabase | null> {
  const db = await openCatAssetDb();
  catAssetDbHolder.db = db;

  if (!db) {
    console.warn('[catAssets] IndexedDB unavailable — using legacy localStorage for custom cats.');
    return null;
  }

  if (readCatCharacterState()) {
    return db;
  }

  await Promise.resolve();
  if (readCatCharacterState()) {
    return db;
  }

  let equippedAssetId: string | null = null;
  const looks: SavedCatLook[] = [];

  const legacyLook = localStorage.getItem(LEGACY_CAT_LOOK_KEY);
  let legacyLookClearSafe = !legacyLook;
  if (legacyLook && legacyLook.startsWith('data:')) {
    const blob = dataUrlToPngBlob(legacyLook);
    if (!blob) {
      legacyLookClearSafe = false;
    } else {
      const id = crypto.randomUUID();
      const ok = await putCatSprite(db, id, blob);
      if (ok) {
        equippedAssetId = id;
        legacyLookClearSafe = true;
      } else {
        legacyLookClearSafe = false;
      }
    }
  }

  const legacyOutfitsRaw = localStorage.getItem(LEGACY_CAT_OUTFITS_KEY);
  let legacyOutfitsClearSafe = !legacyOutfitsRaw;

  if (legacyOutfitsRaw) {
    legacyOutfitsClearSafe = false;
    try {
      const arr = JSON.parse(legacyOutfitsRaw) as LegacyOutfitRow[];
      if (!Array.isArray(arr)) {
        legacyOutfitsClearSafe = false;
      } else if (arr.length === 0) {
        legacyOutfitsClearSafe = true;
      } else {
        let needBlobPut = 0;
        let okBlobPut = 0;
        for (const row of arr) {
          if (typeof row?.url !== 'string' || !row.url.startsWith('data:')) continue;
          const blob = dataUrlToPngBlob(row.url);
          if (!blob) {
            needBlobPut++;
            continue;
          }
          needBlobPut++;
          const assetId = crypto.randomUUID();
          const ok = await putCatSprite(db, assetId, blob);
          if (!ok) continue;
          okBlobPut++;
          looks.push({
            id: typeof row.id === 'string' ? row.id : crypto.randomUUID(),
            name: typeof row.name === 'string' ? row.name : 'Look',
            assetId,
            createdAt: Date.now(),
          });
        }
        legacyOutfitsClearSafe = needBlobPut === okBlobPut;
      }
    } catch {
      legacyOutfitsClearSafe = false;
    }
  }

  if (readCatCharacterState()) {
    return db;
  }

  try {
    writeCatCharacterState({ schema: 1, equippedAssetId, looks });
  } catch (e) {
    console.warn('[catAssets] Failed to write character state after migration', e);
    return db;
  }

  if (legacyLookClearSafe && legacyLook && legacyLook.startsWith('data:')) {
    localStorage.removeItem(LEGACY_CAT_LOOK_KEY);
  }
  if (legacyOutfitsClearSafe && legacyOutfitsRaw) {
    localStorage.removeItem(LEGACY_CAT_OUTFITS_KEY);
  }

  return db;
}

export async function migrateCatStorageIfNeeded(): Promise<IDBDatabase | null> {
  if (typeof navigator !== 'undefined' && navigator.locks?.request) {
    return navigator.locks.request(CAT_MIGRATION_LOCK_NAME, () => migrateCatStorageBody());
  }
  return migrateCatStorageBody();
}

/**
 * Backfill `contentKey` for pre-Phase 4 SavedCatLook rows that lack it.
 * Reads each blob from IndexedDB, computes the hash, and writes the updated state.
 * Idempotent — safe to call multiple times. Only touches localStorage metadata, never blobs.
 */
export async function backfillContentKeys(db: IDBDatabase): Promise<void> {
  const state = readCatCharacterState();
  if (!state || state.looks.length === 0) return;

  const needsBackfill = state.looks.filter((l) => !l.contentKey);
  if (needsBackfill.length === 0) return;

  let changed = false;
  for (const look of needsBackfill) {
    try {
      const blob = await getCatSprite(db, look.assetId);
      if (!blob) continue;
      look.contentKey = await blobContentKey(blob);
      changed = true;
    } catch {
      /* skip this look — next call will retry */
    }
  }

  if (changed) {
    try {
      writeCatCharacterState(state);
    } catch {
      /* non-critical — will retry next session */
    }
  }
}
