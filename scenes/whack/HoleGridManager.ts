import Phaser from 'phaser';
import type { WhackLevelConfig } from '../../types';
import type { SceneManager } from './types';
import { DEPTH } from './types';

export class HoleGridManager implements SceneManager {
  private readonly graphics: Phaser.GameObjects.Graphics[] = [];
  private positions: { x: number; y: number }[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: WhackLevelConfig,
  ) {}

  create(): void {
    const { width, height } = this.scene.scale;
    const { gridCols, gridRows } = this.config;
    const padX = 120;
    const padY = 100;
    const gapX = gridCols > 1 ? (width - padX * 2) / (gridCols - 1) : 0;
    const gapY = gridRows > 1 ? (height - padY * 2) / (gridRows - 1) : 0;

    this.positions = [];
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const x = padX + col * gapX;
        const y = padY + row * gapY;
        this.positions.push({ x, y });

        const hole = this.scene.add.graphics().setDepth(DEPTH.HOLES);
        hole.fillStyle(0x1a3a10);
        hole.fillEllipse(x, y, 80, 50);
        hole.fillStyle(0x0a2a08);
        hole.fillEllipse(x, y, 70, 40);
        this.graphics.push(hole);
      }
    }
  }

  update(_time: number, _delta: number): void {}

  destroy(): void {
    this.graphics.forEach(g => g.destroy());
    this.graphics.length = 0;
    this.positions = [];
  }

  getPositions(): { x: number; y: number }[] {
    return this.positions;
  }

  getHoleCount(): number {
    return this.positions.length;
  }
}
