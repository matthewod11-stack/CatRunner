/** Pure wave timeline helpers for Garden Patrol. */

/** Current wave index 0..waves.length-1, or last index after all waves ended. */
export function waveIndexAtElapsed(
  elapsedSec: number,
  waves: { durationSec: number }[],
): number {
  if (waves.length === 0) return 0;
  let t = 0;
  for (let i = 0; i < waves.length; i++) {
    t += waves[i].durationSec;
    if (elapsedSec < t) return i;
  }
  return waves.length - 1;
}

/** True once elapsed covers all wave durations. */
export function isWavePhaseComplete(
  elapsedSec: number,
  waves: { durationSec: number }[],
): boolean {
  if (waves.length === 0) return true;
  const total = waves.reduce((s, w) => s + w.durationSec, 0);
  return elapsedSec >= total;
}

/** Seconds since the start of the current wave. */
export function elapsedInCurrentWave(
  elapsedSec: number,
  waves: { durationSec: number }[],
): number {
  if (waves.length === 0) return 0;
  const idx = waveIndexAtElapsed(elapsedSec, waves);
  let start = 0;
  for (let i = 0; i < idx; i++) {
    start += waves[i].durationSec;
  }
  return Math.max(0, elapsedSec - start);
}

/** Duration in seconds of the wave active at `elapsedSec`. */
export function currentWaveDuration(
  elapsedSec: number,
  waves: { durationSec: number }[],
): number {
  if (waves.length === 0) return 1;
  const idx = waveIndexAtElapsed(elapsedSec, waves);
  return Math.max(0.001, waves[idx].durationSec);
}
