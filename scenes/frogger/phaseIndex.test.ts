import { describe, it, expect } from 'vitest';
import { activePhaseIndex } from './phaseIndex';

describe('activePhaseIndex', () => {
  it('first crossing uses phase 0', () => {
    expect(activePhaseIndex(0, 3)).toBe(0);
  });
  it('second crossing uses phase 1', () => {
    expect(activePhaseIndex(1, 3)).toBe(1);
  });
  it('caps at last phase', () => {
    expect(activePhaseIndex(99, 3)).toBe(2);
  });
  it('handles single phase', () => {
    expect(activePhaseIndex(5, 1)).toBe(0);
  });
});
