import { describe, it, expect } from 'vitest';
import { resolvePhase, shouldEnterFinale } from './phaseState';

describe('shouldEnterFinale', () => {
  it('false before threshold', () => {
    expect(shouldEnterFinale(1000, 75_000, false)).toBe(false);
  });
  it('true at threshold', () => {
    expect(shouldEnterFinale(75_000, 75_000, false)).toBe(true);
  });
  it('false if already started', () => {
    expect(shouldEnterFinale(80_000, 75_000, true)).toBe(false);
  });
});

describe('resolvePhase', () => {
  it('normal while under normalPhaseMs and finale not started', () => {
    expect(
      resolvePhase(
        { elapsedMs: 10_000, normalPhaseMs: 75_000, finaleDurationMs: 20_000, finaleStarted: false },
        0
      )
    ).toBe('normal');
  });
  it('finale when finale started and under finale duration', () => {
    expect(
      resolvePhase(
        { elapsedMs: 80_000, normalPhaseMs: 75_000, finaleDurationMs: 20_000, finaleStarted: true },
        5_000
      )
    ).toBe('finale');
  });
  it('won when finale elapsed exceeds duration', () => {
    expect(
      resolvePhase(
        { elapsedMs: 80_000, normalPhaseMs: 75_000, finaleDurationMs: 20_000, finaleStarted: true },
        20_000
      )
    ).toBe('won');
  });
});
