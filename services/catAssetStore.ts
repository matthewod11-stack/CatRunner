/** IndexedDB store for custom cat PNG blobs (Phase 2). Browser-only. */

/**
 * Async contract:
 * - `putCatSprite` → `true` if the write transaction completed.
 * - `getCatSprite` → resolves `undefined` if missing or on recoverable IDB errors (never throws).
 * - `deleteCatSprite` → resolves when the delete transaction completes; ignores missing keys.
 */

/** Set by App after `openCatAssetDb` / migration so hooks can resolve `assetId` → blob URL. */
export const catAssetDbHolder: { db: IDBDatabase | null } = { db: null };

const DB_NAME = 'beach-kitty-assets';
const DB_VERSION = 1;
const STORE_SPRITES = 'sprites';

export const CAT_CHARACTER_STATE_KEY = 'beach-cat-cat-state-v1';
export const LEGACY_CAT_LOOK_KEY = 'beach-cat-look';
export const LEGACY_CAT_OUTFITS_KEY = 'beach-cat-outfits';

export function dataUrlToPngBlob(dataUrl: string): Blob | null {
  const m = /^data:image\/png;base64,(.+)$/i.exec(dataUrl.trim());
  if (!m) return null;
  try {
    const binary = atob(m[1]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: 'image/png' });
  } catch {
    return null;
  }
}

export function openCatAssetDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onerror = () => resolve(null);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_SPRITES)) {
        db.createObjectStore(STORE_SPRITES);
      }
    };

    req.onsuccess = () => resolve(req.result);
  });
}

export async function putCatSprite(db: IDBDatabase, assetId: string, blob: Blob): Promise<boolean> {
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_SPRITES, 'readwrite');
    const store = tx.objectStore(STORE_SPRITES);
    const r = store.put(blob, assetId);
    r.onerror = () => resolve(false);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => resolve(false);
  });
}

export async function getCatSprite(db: IDBDatabase, assetId: string): Promise<Blob | undefined> {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_SPRITES, 'readonly');
      const store = tx.objectStore(STORE_SPRITES);
      const r = store.get(assetId);
      r.onerror = () => {
        if (import.meta.env?.DEV) console.warn('[catAssets] getCatSprite error', r.error);
        resolve(undefined);
      };
      tx.onerror = () => {
        if (import.meta.env?.DEV) console.warn('[catAssets] getCatSprite tx error', tx.error);
        resolve(undefined);
      };
      r.onsuccess = () => resolve(r.result as Blob | undefined);
    } catch (e) {
      if (import.meta.env?.DEV) console.warn('[catAssets] getCatSprite', e);
      resolve(undefined);
    }
  });
}

export async function deleteCatSprite(db: IDBDatabase, assetId: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_SPRITES, 'readwrite');
      const store = tx.objectStore(STORE_SPRITES);
      const r = store.delete(assetId);
      r.onerror = () => resolve();
      tx.onerror = () => resolve();
      tx.oncomplete = () => resolve();
    } catch {
      resolve();
    }
  });
}
