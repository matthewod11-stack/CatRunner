import { describe, it, expect } from 'vitest';
import { STREET_LEVEL_CONFIG } from './street';

describe('STREET_LEVEL_CONFIG', () => {
  it('phase 0 (teach) has no bike lanes', () => {
    expect(STREET_LEVEL_CONFIG.phases[0].lanes.some((l) => l.kind === 'bike')).toBe(
      false
    );
  });
  it('later phases include bike lanes', () => {
    expect(STREET_LEVEL_CONFIG.phases[1].lanes.some((l) => l.kind === 'bike')).toBe(
      true
    );
    expect(STREET_LEVEL_CONFIG.phases[2].lanes.filter((l) => l.kind === 'bike').length).toBe(
      2
    );
  });
});
