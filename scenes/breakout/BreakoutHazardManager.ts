import Phaser from 'phaser';
import type { BreakoutLevelConfig } from '../../types';
import { DEPTH, type SceneManager } from './types';

/**
 * Optional drifting "fluff" cloud; scene registers overlaps to nudge balls.
 */
export class BreakoutHazardManager implements SceneManager {
  private fluff?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private vx = 45;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: BreakoutLevelConfig
  ) {}

  create(): void {
    if (!this.config.hazards?.enableDriftingFluff) return;

    if (!this.scene.textures.exists('breakout_fluff')) {
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(0xffffff, 0.22);
      g.fillCircle(20, 20, 20);
      g.generateTexture('breakout_fluff', 40, 40);
      g.destroy();
    }

    const { width, height } = this.scene.scale;
    this.fluff = this.scene.physics.add.sprite(width * 0.35, height * 0.35, 'breakout_fluff');
    this.fluff.setDepth(DEPTH.HAZARD);
    this.fluff.body.setAllowGravity(false);
    this.fluff.setVelocity(this.vx, 0);
    this.fluff.setAlpha(0.85);
  }

  getFluff(): Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | undefined {
    return this.fluff;
  }

  update(_time: number, delta: number): void {
    if (!this.fluff || !this.fluff.active) return;
    const { width } = this.scene.scale;
    if (this.fluff.x < 40 || this.fluff.x > width - 40) {
      this.vx *= -1;
      this.fluff.setVelocityX(this.vx);
    }
    void delta;
  }

  destroy(): void {
    this.fluff?.destroy();
    this.fluff = undefined;
  }
}
