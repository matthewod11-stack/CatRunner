import { describe, it, expect } from 'vitest';
import {
  createStickyState,
  activateSticky,
  isStickyActive,
  deactivateSticky,
} from './stickyPaws';

describe('stickyPaws', () => {
  it('activates and expires', () => {
    const s = createStickyState();
    activateSticky(s, 1000, 500);
    expect(isStickyActive(s, 1001)).toBe(true);
    expect(isStickyActive(s, 1500)).toBe(false);
  });
  it('refresh extends duration when later end time', () => {
    const s = createStickyState();
    activateSticky(s, 0, 1000);
    activateSticky(s, 500, 1000);
    expect(isStickyActive(s, 1400)).toBe(true);
    expect(isStickyActive(s, 1600)).toBe(false);
  });
  it('deactivate clears', () => {
    const s = createStickyState();
    activateSticky(s, 0, 5000);
    deactivateSticky(s);
    expect(isStickyActive(s, 100)).toBe(false);
  });
});
