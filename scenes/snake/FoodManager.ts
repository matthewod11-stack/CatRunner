import Phaser from 'phaser';
import type { SnakeLevelConfig } from '../../types';
import type { SceneManager } from './types';
import { DEPTH, gridKey } from './types';

export class FoodManager implements SceneManager {
  private food: { col: number; row: number } | null = null;
  private foodSprite: Phaser.GameObjects.Arc | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: SnakeLevelConfig,
  ) {}

  create(): void {}

  update(_time: number, _delta: number): void {}

  destroy(): void {
    this.clear();
  }

  spawn(exclude: Set<string>): void {
    if (this.foodSprite) {
      this.scene.tweens.killTweensOf(this.foodSprite);
      this.foodSprite.destroy();
      this.foodSprite = null;
      this.food = null;
    }

    const { gridCols, gridRows, cellSize: cs } = this.config;
    let col = 0;
    let row = 0;
    let placed = false;
    for (let attempt = 0; attempt < 200; attempt++) {
      col = Phaser.Math.Between(1, gridCols - 2);
      row = Phaser.Math.Between(1, gridRows - 2);
      const key = gridKey(col, row);
      if (!exclude.has(key)) {
        placed = true;
        break;
      }
    }
    if (!placed) {
      this.food = null;
      return;
    }

    this.food = { col, row };
    this.foodSprite = this.scene.add
      .circle(col * cs + cs / 2, row * cs + cs / 2, cs * 0.35, 0x44ff44)
      .setDepth(DEPTH.FOOD);

    this.scene.tweens.add({
      targets: this.foodSprite,
      scale: 1.2,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  clear(): void {
    if (this.foodSprite) {
      this.scene.tweens.killTweensOf(this.foodSprite);
      this.foodSprite.destroy();
      this.foodSprite = null;
    }
    this.food = null;
  }

  getFood(): { col: number; row: number } | null {
    return this.food;
  }
}
