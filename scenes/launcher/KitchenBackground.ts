import Phaser from 'phaser';
import type { LauncherLevelConfig } from '../../types';
import { DEPTH, type SceneManager } from './types';

export class KitchenBackground implements SceneManager {
  private scene: Phaser.Scene;
  private config: LauncherLevelConfig;
  private layers: Phaser.GameObjects.Graphics[] = [];

  constructor(scene: Phaser.Scene, config: LauncherLevelConfig) {
    this.scene = scene;
    this.config = config;
  }

  create(): void {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const cy = this.config.counterY;

    const g = this.scene.add.graphics().setDepth(DEPTH.BG);
    this.layers.push(g);
    const [top, bottom] = this.config.theme.bgGradient;
    const topColor = Phaser.Display.Color.HexStringToColor(top);
    const botColor = Phaser.Display.Color.HexStringToColor(bottom);

    for (let y = 0; y < cy; y++) {
      const t = y / cy;
      const r = Phaser.Math.Linear(topColor.red, botColor.red, t);
      const gr = Phaser.Math.Linear(topColor.green, botColor.green, t);
      const b = Phaser.Math.Linear(topColor.blue, botColor.blue, t);
      g.fillStyle(Phaser.Display.Color.GetColor(r, gr, b));
      g.fillRect(0, y, w, 1);
    }

    const wallG = this.scene.add.graphics().setDepth(DEPTH.WALL);
    this.layers.push(wallG);
    wallG.lineStyle(1, 0xd4c4a0, 0.15);
    const tileSize = 40;
    for (let x = 0; x < w; x += tileSize) {
      wallG.lineBetween(x, 0, x, cy);
    }
    for (let y = 0; y < cy; y += tileSize) {
      wallG.lineBetween(0, y, w, y);
    }

    const cab = this.scene.add.graphics().setDepth(DEPTH.CABINET);
    this.layers.push(cab);
    const cabColor = Phaser.Display.Color.HexStringToColor('#e8dcc8').color;
    cab.fillStyle(cabColor);
    cab.fillRoundedRect(w * 0.55, 24, w * 0.4, 72, 6);
    cab.lineStyle(2, 0xc4b49a);
    cab.strokeRoundedRect(w * 0.55, 24, w * 0.4, 72, 6);
    for (let i = 0; i < 3; i++) {
      const hx = w * 0.58 + i * (w * 0.11);
      cab.lineStyle(2, 0x8b7355);
      cab.strokeCircle(hx + 18, 60, 4);
    }

    const win = this.scene.add.graphics().setDepth(DEPTH.CABINET);
    this.layers.push(win);
    win.fillStyle(0xd4e8ff, 0.5);
    win.fillRoundedRect(32, 40, 120, 80, 8);
    win.lineStyle(2, 0xa8c8e8, 0.6);
    win.strokeRoundedRect(32, 40, 120, 80, 8);
    win.lineStyle(2, 0x88a8c8, 0.4);
    win.lineBetween(92, 40, 92, 120);
    win.lineBetween(32, 80, 152, 80);

    const counterG = this.scene.add.graphics().setDepth(DEPTH.COUNTER);
    this.layers.push(counterG);
    const cColor = Phaser.Display.Color.HexStringToColor(this.config.theme.counterColor).color;
    counterG.fillStyle(cColor);
    counterG.fillRect(0, cy, w, h - cy);
    counterG.fillStyle(cColor + 0x222222);
    counterG.fillRect(0, cy, w, 4);
  }

  update(_time: number, _delta: number): void {}

  destroy(): void {
    this.layers.forEach((l) => l.destroy());
    this.layers = [];
  }
}
