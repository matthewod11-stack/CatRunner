import type { SceneManager } from './types';

const SLOW_MO_INTERVAL_MULT = 1.35;

/** Timed slow-mo (longer spawn gaps) and double score. */
export class WhackPowerupManager implements SceneManager {
  private slowMoUntilMs = 0;
  private doubleScoreUntilMs = 0;

  create(): void {
    this.slowMoUntilMs = 0;
    this.doubleScoreUntilMs = 0;
  }

  update(_time: number, _delta: number): void {}

  destroy(): void {}

  applyEffect(kind: 'slow_mo' | 'double_score', nowMs: number, durationSec: number): void {
    const until = nowMs + durationSec * 1000;
    if (kind === 'slow_mo') {
      this.slowMoUntilMs = Math.max(this.slowMoUntilMs, until);
    } else {
      this.doubleScoreUntilMs = Math.max(this.doubleScoreUntilMs, until);
    }
  }

  getSpawnIntervalMultiplier(nowMs: number): number {
    return nowMs < this.slowMoUntilMs ? SLOW_MO_INTERVAL_MULT : 1;
  }

  getScoreMultiplier(nowMs: number): number {
    return nowMs < this.doubleScoreUntilMs ? 2 : 1;
  }
}
