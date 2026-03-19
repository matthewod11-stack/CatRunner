import { describe, it, expect } from 'vitest';
import { blobContentKey } from './blobContentKey';

describe('blobContentKey', () => {
  it('returns the same key for identical blobs', async () => {
    const b = new Blob([new Uint8Array([1, 2, 3, 4, 5])], { type: 'image/png' });
    const a = await blobContentKey(b);
    const b2 = new Blob([new Uint8Array([1, 2, 3, 4, 5])], { type: 'image/png' });
    const a2 = await blobContentKey(b2);
    expect(a).toBe(a2);
    expect(a.length).toBeGreaterThan(8);
  });

  it('differs for different bytes', async () => {
    const x = await blobContentKey(new Blob([new Uint8Array([1])], { type: 'image/png' }));
    const y = await blobContentKey(new Blob([new Uint8Array([2])], { type: 'image/png' }));
    expect(x).not.toBe(y);
  });
});
