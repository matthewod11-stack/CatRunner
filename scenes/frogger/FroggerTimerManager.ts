import Phaser from 'phaser';
import type { SceneManager } from './types';

/** Countdown timer; fires onExpire when time hits zero. */
export class FroggerTimerManager implements SceneManager {
  private timeRemaining = 0;
  private event: Phaser.Time.TimerEvent | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onExpire: () => void
  ) {}

  create(): void {}

  start(limitSeconds: number): void {
    this.stop();
    this.timeRemaining = limitSeconds;
    if (limitSeconds <= 0) return;
    this.event = this.scene.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeRemaining -= 1;
        if (this.timeRemaining <= 0) {
          this.stop();
          this.onExpire();
        }
      },
      loop: true,
    });
  }

  stop(): void {
    if (this.event) {
      this.event.remove(false);
      this.event = null;
    }
  }

  getTimeRemaining(): number {
    return this.timeRemaining;
  }

  update(): void {}

  destroy(): void {
    this.stop();
  }
}
