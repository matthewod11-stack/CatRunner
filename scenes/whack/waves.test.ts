import { describe, it, expect } from 'vitest';
import {
  waveIndexAtElapsed,
  isWavePhaseComplete,
  elapsedInCurrentWave,
  currentWaveDuration,
} from './waves';

describe('waveIndexAtElapsed', () => {
  const waves = [{ durationSec: 10 }, { durationSec: 10 }, { durationSec: 5 }];
  it('wave 0 at start', () => expect(waveIndexAtElapsed(0, waves)).toBe(0));
  it('still 0 before first ends', () => expect(waveIndexAtElapsed(9.9, waves)).toBe(0));
  it('wave 1 after first', () => expect(waveIndexAtElapsed(10, waves)).toBe(1));
  it('clamps to last wave after total', () => expect(waveIndexAtElapsed(999, waves)).toBe(2));
});

describe('isWavePhaseComplete', () => {
  it('false mid-phase', () =>
    expect(isWavePhaseComplete(20, [{ durationSec: 15 }, { durationSec: 15 }])).toBe(false));
  it('true at end', () =>
    expect(isWavePhaseComplete(30, [{ durationSec: 15 }, { durationSec: 15 }])).toBe(true));
});

describe('elapsedInCurrentWave', () => {
  const waves = [{ durationSec: 10 }, { durationSec: 10 }];
  it('start of wave 0', () => expect(elapsedInCurrentWave(0, waves)).toBe(0));
  it('mid wave 1', () => expect(elapsedInCurrentWave(14, waves)).toBe(4));
});

describe('currentWaveDuration', () => {
  it('returns active wave length', () =>
    expect(currentWaveDuration(5, [{ durationSec: 10 }, { durationSec: 8 }])).toBe(10));
});
