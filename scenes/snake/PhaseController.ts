import type { SnakeLevelConfig } from '../../types';
import type { SceneManager } from './types';
import { shouldEnterFinale } from './phaseState';

export class PhaseController implements SceneManager {
  private runStartTime = 0;
  private finaleStarted = false;
  private finaleStartTime: number | null = null;

  constructor(
    private readonly config: SnakeLevelConfig,
    private readonly getNow: () => number,
    private readonly onEnterFinale: () => void,
  ) {}

  create(): void {
    this.runStartTime = this.getNow();
    this.finaleStarted = false;
    this.finaleStartTime = null;
  }

  update(_time: number, _delta: number): void {
    this.tick();
  }

  destroy(): void {}

  tick(): void {
    const elapsed = this.getNow() - this.runStartTime;
    if (
      shouldEnterFinale(elapsed, this.config.normalPhaseMs, this.finaleStarted)
    ) {
      this.finaleStarted = true;
      this.finaleStartTime = this.getNow();
      this.onEnterFinale();
    }
  }

  isFinale(): boolean {
    return this.finaleStarted;
  }

  hasWon(): boolean {
    if (!this.finaleStarted || this.finaleStartTime === null) return false;
    return this.getNow() - this.finaleStartTime >= this.config.finaleDurationMs;
  }

  getNormalRemainingSec(): number {
    if (this.finaleStarted) return 0;
    const elapsed = this.getNow() - this.runStartTime;
    return Math.max(
      0,
      Math.ceil((this.config.normalPhaseMs - elapsed) / 1000),
    );
  }

  getFinaleRemainingSec(): number {
    if (!this.finaleStarted || this.finaleStartTime === null) return 0;
    const finaleElapsed = this.getNow() - this.finaleStartTime;
    return Math.max(
      0,
      Math.ceil((this.config.finaleDurationMs - finaleElapsed) / 1000),
    );
  }
}
