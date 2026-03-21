import { SceneBridge } from './shared/SceneBridge';
import { GameStatus } from '../types';
import type { SceneInitData } from './shared/bridgeProtocol';

/**
 * Minimal test scene that proves the Phaser↔React bridge works end-to-end.
 * Renders a blue rectangle with text and emits a score update every second.
 *
 * Access via ?phaser_test=1 query param on the dev server.
 */
export default class TestScene extends SceneBridge {
  private scoreCounter = 0;
  private timerEvent: Phaser.Time.TimerEvent | null = null;

  init(data: SceneInitData): void {
    super.init(data);
  }

  create(): void {
    const { width, height } = this.scale;

    // Blue rectangle background
    this.add.rectangle(width / 2, height / 2, width * 0.8, height * 0.6, 0x3b82f6, 0.9)
      .setStrokeStyle(4, 0xffffff);

    // Title text
    this.add.text(width / 2, height / 2 - 40, 'Phaser Bridge Test', {
      fontSize: '28px',
      fontFamily: 'system-ui, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Level info
    this.add.text(width / 2, height / 2, `Level: ${this.levelId}`, {
      fontSize: '16px',
      fontFamily: 'system-ui, sans-serif',
      color: '#93c5fd',
    }).setOrigin(0.5);

    // Score counter text
    const scoreText = this.add.text(width / 2, height / 2 + 40, 'Score: 0', {
      fontSize: '20px',
      fontFamily: 'system-ui, sans-serif',
      color: '#fbbf24',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Emit status change
    this.emitStatusChange(GameStatus.PLAYING);

    // Increment score every second
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.scoreCounter += 10;
        scoreText.setText(`Score: ${this.scoreCounter}`);
        this.emitScoreUpdate({
          current: this.scoreCounter,
          high: this.scoreCounter,
          coins: Math.floor(this.scoreCounter / 10),
          multiplier: 1,
          streak: 0,
          lives: 9,
        });
      },
    });
  }
}
