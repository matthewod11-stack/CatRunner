import Phaser from 'phaser';
import type { SnakeLevelConfig } from '../../types';
import type { SceneManager } from './types';
import { DEPTH, gridKey } from './types';

export class WallManager implements SceneManager {
  private readonly walls = new Set<string>();
  private graphics: Phaser.GameObjects.Graphics | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: SnakeLevelConfig,
  ) {}

  create(): void {
    const { gridCols, gridRows, wallCount } = this.config;

    this.walls.clear();
    for (let c = 0; c < gridCols; c++) {
      this.walls.add(gridKey(c, 0));
      this.walls.add(gridKey(c, gridRows - 1));
    }
    for (let r = 0; r < gridRows; r++) {
      this.walls.add(gridKey(0, r));
      this.walls.add(gridKey(gridCols - 1, r));
    }

    for (let i = 0; i < wallCount; i++) {
      const c = Phaser.Math.Between(3, gridCols - 4);
      const r = Phaser.Math.Between(3, gridRows - 4);
      this.walls.add(gridKey(c, r));
    }

    if (this.graphics) {
      this.graphics.destroy();
    }
    this.graphics = this.scene.add.graphics().setDepth(DEPTH.WALLS);
    this.redraw();
  }

  update(_time: number, _delta: number): void {}

  destroy(): void {
    this.walls.clear();
    if (this.graphics) {
      this.graphics.destroy();
      this.graphics = null;
    }
  }

  getWalls(): Set<string> {
    return this.walls;
  }

  tryAddInteriorWall(exclude: Set<string>): boolean {
    const { gridCols, gridRows } = this.config;
    for (let attempt = 0; attempt < 200; attempt++) {
      const c = Phaser.Math.Between(1, gridCols - 2);
      const r = Phaser.Math.Between(1, gridRows - 2);
      const key = gridKey(c, r);
      if (this.walls.has(key) || exclude.has(key)) continue;
      this.walls.add(key);
      this.redraw();
      return true;
    }
    return false;
  }

  redraw(): void {
    if (!this.graphics) return;
    const cs = this.config.cellSize;
    this.graphics.clear();
    this.graphics.fillStyle(0x5a3a2a);
    for (const key of this.walls) {
      const [c, r] = key.split(',').map(Number);
      this.graphics.fillRoundedRect(c * cs + 1, r * cs + 1, cs - 2, cs - 2, 4);
    }
  }
}
