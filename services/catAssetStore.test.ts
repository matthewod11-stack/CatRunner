import { describe, it, expect } from 'vitest';
import { dataUrlToPngBlob } from './catAssetStore';

describe('dataUrlToPngBlob', () => {
  it('returns a PNG blob for valid data URL', () => {
    const png1x1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const url = `data:image/png;base64,${png1x1}`;
    const blob = dataUrlToPngBlob(url);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob?.type).toBe('image/png');
  });

  it('returns null for non-png or invalid input', () => {
    expect(dataUrlToPngBlob('data:image/jpeg;base64,abcd')).toBeNull();
    expect(dataUrlToPngBlob('not a data url')).toBeNull();
    expect(dataUrlToPngBlob('')).toBeNull();
  });
});
