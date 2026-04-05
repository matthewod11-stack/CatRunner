import Phaser from 'phaser';
import type { SceneManager } from './types';
import { DEPTH } from './types';

/** Simple sky / dusk gradient behind the playfield. */
export class FroggerBackground implements SceneManager {
  private rects: Phaser.GameObjects.Rectangle[] = [];

  constructor(private readonly scene: Phaser.Scene) {}

  create(): void {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const bands = [
      { y: 0, hh: h * 0.45, color: 0x1a2540 },
      { y: h * 0.45, hh: h * 0.35, color: 0x2a3548 },
      { y: h * 0.8, hh: h * 0.2, color: 0x1e2e24 },
    ];
    for (const b of bands) {
      const r = this.scene.add
        .rectangle(w / 2, b.y + b.hh / 2, w, b.hh, b.color)
        .setDepth(DEPTH.BG);
      this.rects.push(r);
    }
  }

  update(): void {}

  destroy(): void {
    for (const r of this.rects) r.destroy();
    this.rects = [];
  }
}
