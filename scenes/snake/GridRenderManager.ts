import Phaser from 'phaser';
import type { SnakeLevelConfig } from '../../types';
import type { SceneManager } from './types';
import { DEPTH } from './types';

export class GridRenderManager implements SceneManager {
  private bg: Phaser.GameObjects.Graphics | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: SnakeLevelConfig,
  ) {}

  create(): void {
    const cs = this.config.cellSize;
    const { gridCols, gridRows } = this.config;

    if (this.bg) {
      this.bg.destroy();
    }
    this.bg = this.scene.add.graphics().setDepth(DEPTH.BG);
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const shade = (r + c) % 2 === 0 ? 0x1e3a1e : 0x1a321a;
        this.bg.fillStyle(shade);
        this.bg.fillRect(c * cs, r * cs, cs, cs);
      }
    }
  }

  update(_time: number, _delta: number): void {}

  destroy(): void {
    if (this.bg) {
      this.bg.destroy();
      this.bg = null;
    }
  }
}
