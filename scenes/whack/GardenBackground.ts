import Phaser from 'phaser';
import type { WhackLevelConfig } from '../../types';
import type { SceneManager } from './types';
import { DEPTH } from './types';

const WAVE_TINTS = [0x000000, 0x0a1008, 0x100818, 0x080c12];

export class GardenBackground implements SceneManager {
  private grass!: Phaser.GameObjects.Graphics;
  private tintOverlay!: Phaser.GameObjects.Graphics;
  private waveLabel!: Phaser.GameObjects.Text;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: WhackLevelConfig,
  ) {}

  create(): void {
    const { width, height } = this.scene.scale;
    const hex = this.config.bgColor.replace('#', '');
    const bg = parseInt(hex, 16);

    this.grass = this.scene.add.graphics().setDepth(DEPTH.BG);
    this.grass.fillStyle(bg);
    this.grass.fillRect(0, 0, width, height);
    this.grass.lineStyle(1, 0x2e5a20, 0.3);
    for (let y = 0; y < height; y += 12) {
      for (let x = 0; x < width; x += 20) {
        this.grass.lineBetween(
          x + Math.random() * 10,
          y,
          x + 5 + Math.random() * 10,
          y - 8,
        );
      }
    }

    // Simple sky strip
    this.grass.fillStyle(0x87ceeb, 0.35);
    this.grass.fillRect(0, 0, width, 56);

    // Flower dots (decorative)
    this.grass.fillStyle(0xff99cc, 0.5);
    for (let i = 0; i < 12; i++) {
      const fx = (i * 97) % (width - 40) + 20;
      const fy = 80 + (i * 53) % (height - 200);
      this.grass.fillCircle(fx, fy, 3);
    }

    this.tintOverlay = this.scene.add.graphics().setDepth(DEPTH.BG + 1);
    this.waveLabel = this.scene.add
      .text(this.scene.scale.width / 2, 72, '', {
        fontSize: '14px',
        fontFamily: 'system-ui, sans-serif',
        color: '#ffeeaa',
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.HUD)
      .setAlpha(0);
  }

  update(_time: number, _delta: number): void {}

  destroy(): void {
    this.grass.destroy();
    this.tintOverlay.destroy();
    this.waveLabel.destroy();
  }

  /** Subtle overlay tint for current wave. */
  setWaveTint(waveIndex: number): void {
    const tint = WAVE_TINTS[Math.min(waveIndex, WAVE_TINTS.length - 1)] ?? 0;
    const { width, height } = this.scene.scale;
    this.tintOverlay.clear();
    this.tintOverlay.fillStyle(tint, 0.12);
    this.tintOverlay.fillRect(0, 0, width, height);
  }

  /** HUD toast when entering waves 2+ (index >= 1). */
  flashWaveBanner(waveIndex: number): void {
    const names = ['Warm-up', 'Rush', 'Chaos'];
    const label = names[waveIndex] ?? `Wave ${waveIndex + 1}`;
    this.waveLabel.setText(`— ${label} —`).setAlpha(1);
    this.scene.tweens.add({
      targets: this.waveLabel,
      alpha: 0,
      duration: 1200,
      delay: 400,
    });
  }
}
