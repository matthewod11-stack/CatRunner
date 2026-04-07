import Phaser from 'phaser';
import type { BreakoutLevelConfig } from '../../types';
import { DEPTH, type SceneManager } from './types';

/**
 * Camera fill + optional floor band / vignette from `config.background`.
 */
export class YarnBackgroundManager implements SceneManager {
  private graphics: Phaser.GameObjects.Graphics[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: BreakoutLevelConfig
  ) {}

  create(): void {
    const { width, height } = this.scene.scale;
    this.scene.cameras.main.setBackgroundColor(this.config.bgColor);

    const bg = this.config.background;
    const floorH = bg?.floorBandHeightPx ?? 0;
    const floorColor = bg?.floorBandColor;
    if (floorH > 0 && floorColor) {
      const g = this.scene.add.graphics();
      g.fillStyle(Phaser.Display.Color.HexStringToColor(floorColor).color, 1);
      g.fillRect(0, height - floorH, width, floorH);
      g.setDepth(DEPTH.BG);
      this.graphics.push(g);
    }

  }

  update(_time: number, _delta: number): void {}

  destroy(): void {
    for (const g of this.graphics) g.destroy();
    this.graphics = [];
  }
}
