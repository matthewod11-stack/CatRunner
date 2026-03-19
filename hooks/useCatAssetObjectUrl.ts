import { useState, useEffect } from 'react';
import { catAssetDbHolder, getCatSprite } from '../services/catAssetStore';

/**
 * Resolves a sprite `assetId` to an object URL for `<img src>` / matting.
 * Revokes the URL on change or unmount.
 */
export function useCatAssetObjectUrl(assetId: string | null, storageReady: boolean): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!assetId || !storageReady || !catAssetDbHolder.db) {
      setUrl(null);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    (async () => {
      try {
        const blob = await getCatSprite(catAssetDbHolder.db!, assetId);
        if (cancelled || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setUrl(objectUrl);
      } catch {
        if (!cancelled) setUrl(null);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [assetId, storageReady]);

  return url;
}
