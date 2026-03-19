import { useState, useEffect } from 'react';
import { matCustomCatDataUrl } from '../services/catSpriteMatting';

/** Bump when matting heuristics change so we don’t reuse stale “still pink” cached PNGs. */
const MATTING_CACHE_VERSION = 9;

/** LRU cap for matted data URLs (see also `MAX_PROCESSED_SPRITE_CACHE` in `levels/beach/obstacles.tsx`). */
const MAX_RESOLVED_CACHE_ENTRIES = 48;

const resolvedCache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

function cacheKey(rawUrl: string): string {
  return `${MATTING_CACHE_VERSION}\0${rawUrl}`;
}

function trimResolvedCache(): void {
  while (resolvedCache.size > MAX_RESOLVED_CACHE_ENTRIES) {
    const first = resolvedCache.keys().next().value;
    if (first === undefined) break;
    resolvedCache.delete(first);
  }
}

function cacheResolved(key: string, url: string): void {
  if (resolvedCache.has(key)) resolvedCache.delete(key);
  resolvedCache.set(key, url);
  trimResolvedCache();
}

function getMattedUrl(rawUrl: string): Promise<string> {
  const key = cacheKey(rawUrl);
  const hit = resolvedCache.get(key);
  if (hit) return Promise.resolve(hit);

  let pending = inflight.get(key);
  if (!pending) {
    pending = matCustomCatDataUrl(rawUrl)
      .then((url) => {
        cacheResolved(key, url);
        inflight.delete(key);
        return url;
      })
      .catch((err) => {
        inflight.delete(key);
        throw err;
      });
    inflight.set(key, pending);
  }
  return pending;
}

export type UseMatteCatUrlOptions = {
  /** PNG already processed on server (`meta.mattedOnServer`) — skip client matting. */
  alreadyMatted?: boolean;
};

export function useMatteCatUrl(
  rawUrl: string | null,
  options?: UseMatteCatUrlOptions
): {
  displayUrl: string | null;
  isProcessing: boolean;
} {
  const alreadyMatted = options?.alreadyMatted === true;

  const [displayUrl, setDisplayUrl] = useState<string | null>(() => {
    if (!rawUrl || alreadyMatted) return rawUrl;
    return resolvedCache.get(cacheKey(rawUrl)) ?? null;
  });
  const [isProcessing, setIsProcessing] = useState(() => {
    if (!rawUrl || alreadyMatted) return false;
    return !resolvedCache.has(cacheKey(rawUrl));
  });

  useEffect(() => {
    if (!rawUrl) {
      setDisplayUrl(null);
      setIsProcessing(false);
      return;
    }

    if (alreadyMatted) {
      setDisplayUrl(rawUrl);
      setIsProcessing(false);
      return;
    }

    const key = cacheKey(rawUrl);
    const cached = resolvedCache.get(key);
    if (cached) {
      setDisplayUrl(cached);
      setIsProcessing(false);
      return;
    }

    let cancelled = false;
    setIsProcessing(true);
    getMattedUrl(rawUrl)
      .then((url) => {
        if (!cancelled) {
          setDisplayUrl(url);
          setIsProcessing(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDisplayUrl(rawUrl);
          setIsProcessing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [rawUrl, alreadyMatted]);

  return { displayUrl, isProcessing };
}
