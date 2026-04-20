import Phaser from 'phaser';
import type { BreakoutPowerupKind } from '../../types';
import { DEPTH, type SceneManager } from './types';

export interface BreakoutPowerupManagerDeps {
  onCollect: (kind: BreakoutPowerupKind) => void;
}

/**
 * Falling power-up pickups; overlap registered from the scene (paddle).
 */
export class BreakoutPowerupManager implements SceneManager {
  private group!: Phaser.Physics.Arcade.Group;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly deps: BreakoutPowerupManagerDeps
  ) {}

  create(): void {
    if (!this.scene.textures.exists('breakout_powerup')) {
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(0x88ffcc, 1);
      g.fillCircle(8, 8, 8);
      g.lineStyle(2, 0xffffff, 0.9);
      g.strokeCircle(8, 8, 6);
      g.generateTexture('breakout_powerup', 16, 16);
      g.destroy();
    }

    this.group = this.scene.physics.add.group({
      allowGravity: false,
      immovable: false,
    });
  }

  getGroup(): Phaser.Physics.Arcade.Group {
    return this.group;
  }

  spawn(x: number, y: number, kind: BreakoutPowerupKind): void {
    const spr = this.scene.physics.add.sprite(x, y, 'breakout_powerup');
    spr.setDepth(DEPTH.POWERUP);
    spr.setData('puKind', kind);
    this.group.add(spr);
    (spr.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    spr.setVelocity(0, 140);
  }

  collectSprite(spr: Phaser.GameObjects.GameObject): void {
    const sprite = spr as Phaser.Physics.Arcade.Sprite;
    const kind = sprite.getData('puKind') as BreakoutPowerupKind | undefined;
    sprite.destroy();
    if (kind) this.deps.onCollect(kind);
  }

  update(_time: number, _delta: number): void {
    const { height } = this.scene.scale;
    for (const c of this.group.getChildren()) {
      const s = c as Phaser.Physics.Arcade.Sprite;
      if (s.active && s.y > height + 32) s.destroy();
    }
  }

  destroy(): void {
    this.group.clear(true, true);
  }
}
