import Phaser from 'phaser';
import type { FroggerLane } from '../../types';
import { DEPTH } from './types';

/** Lane strip graphics + goal label. */
export class FroggerLaneView {
  private graphics: Phaser.GameObjects.Graphics | null = null;
  private goalText: Phaser.GameObjects.Text | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly cellSize: number
  ) {}

  build(lanes: FroggerLane[], width: number): void {
    this.clear();
    const g = this.scene.add.graphics().setDepth(DEPTH.LANES);
    this.graphics = g;

    for (const lane of lanes) {
      let fill: number;
      let alpha = 1;
      switch (lane.kind) {
        case 'safe':
          fill = 0x44aa44;
          alpha = 0.45;
          break;
        case 'road':
          fill = 0x333333;
          break;
        case 'medianSlow':
          fill = 0x3d5c3d;
          alpha = 0.85;
          break;
        case 'bike':
          fill = 0x3a3a44;
          alpha = 0.9;
          break;
      }
      g.fillStyle(fill, alpha);
      g.fillRect(0, lane.y, width, this.cellSize);

      if (lane.kind === 'road') {
        g.fillStyle(0xffff00, 0.35);
        for (let x = 0; x < width; x += 40) {
          g.fillRect(x, lane.y + this.cellSize / 2 - 1, 20, 2);
        }
      }
      if (lane.kind === 'bike') {
        g.lineStyle(2, 0xffffff, 0.25);
        g.strokeRect(2, lane.y + 2, width - 4, this.cellSize - 4);
      }
    }

    const goalLane = lanes[lanes.length - 1];
    if (goalLane) {
      this.goalText = this.scene.add
        .text(width / 2, goalLane.y + this.cellSize / 2, 'FISH MARKET', {
          fontSize: '14px',
          fontFamily: 'system-ui, sans-serif',
          fontStyle: 'bold',
          color: '#ffffff',
          backgroundColor: '#ff884488',
          padding: { x: 8, y: 4 },
        })
        .setOrigin(0.5)
        .setDepth(DEPTH.LANES + 1);
    }
  }

  clear(): void {
    this.graphics?.destroy();
    this.graphics = null;
    this.goalText?.destroy();
    this.goalText = null;
  }

  destroy(): void {
    this.clear();
  }
}
