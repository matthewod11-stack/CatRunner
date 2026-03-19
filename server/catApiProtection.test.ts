import { describe, it, expect } from 'vitest';
import {
  getCatApiClientId,
  isCatApiRateLimited,
  catApiJsonByteLength,
} from './catApiProtection';

describe('getCatApiClientId', () => {
  it('uses first x-forwarded-for hop', () => {
    expect(
      getCatApiClientId({
        'x-forwarded-for': '203.0.113.1, 10.0.0.1',
      })
    ).toBe('203.0.113.1');
  });

  it('falls back to unknown', () => {
    expect(getCatApiClientId({})).toBe('unknown');
  });
});

describe('isCatApiRateLimited', () => {
  it('blocks after the per-window budget for a stable client id', () => {
    const id = `rate-test-${Date.now()}-${Math.random()}`;
    const kind = 'wisdom' as const;
    let firstBlockAt = -1;
    for (let i = 0; i < 45; i++) {
      if (isCatApiRateLimited(id, kind)) {
        firstBlockAt = i;
        break;
      }
    }
    expect(firstBlockAt).toBe(40);
  });
});

describe('catApiJsonByteLength', () => {
  it('measures utf-8 byte size', () => {
    expect(catApiJsonByteLength({ a: 'x' })).toBeGreaterThan(0);
  });
});
