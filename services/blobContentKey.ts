/**
 * Stable fingerprint for PNG blob deduplication (closet / equip path).
 * Uses SHA-256 when Web Crypto is available; short fallback otherwise.
 */
export async function blobContentKey(blob: Blob): Promise<string> {
  try {
    const buf = await blob.arrayBuffer();
    if (globalThis.crypto?.subtle) {
      const hash = await crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    /* fall through */
  }
  try {
    const buf = await blob.arrayBuffer();
    const u8 = new Uint8Array(buf);
    let h = 5381;
    const n = Math.min(u8.length, 65536);
    for (let i = 0; i < n; i++) {
      h = (h * 33) ^ u8[i]!;
    }
    return `djb2:${u8.length}:${(h >>> 0).toString(16)}`;
  } catch {
    return `len:${blob.size}`;
  }
}
