import Phaser from 'phaser';
import type { LauncherLevelConfig } from '../../types';
import { DEPTH, type SceneManager } from './types';

const SPILL_DAMP = 0.94;
const SPILL_GRAVITY_MULT = 1.12;
const FAN_INTERVAL_MS = 8000;
const FAN_DURATION_MS = 500;
const FAN_IMPULSE_X = -120;

export class HazardManager implements SceneManager {
  private scene: Phaser.Scene;
  private config: LauncherLevelConfig;
  private spillGeom: Phaser.Geom.Rectangle | null = null;
  private spillGraphics: Phaser.GameObjects.Graphics | null = null;
  private getProjectile: () => Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | null;
  private isBossRound: () => boolean;
  private fanNextAt = 0;
  private fanUntil = 0;

  constructor(
    scene: Phaser.Scene,
    config: LauncherLevelConfig,
    getProjectile: () => Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | null,
    isBossRound: () => boolean
  ) {
    this.scene = scene;
    this.config = config;
    this.getProjectile = getProjectile;
    this.isBossRound = isBossRound;
  }

  create(): void {
    const hz = this.config.hazards;
    if (!hz?.spill) return;

    const s = hz.spill;
    this.spillGeom = new Phaser.Geom.Rectangle(s.x, s.y, s.width, s.height);

    const g = this.scene.add.graphics().setDepth(DEPTH.SPILL);
    g.fillStyle(0x88ccff, 0.35);
    g.fillEllipse(s.x + s.width / 2, s.y + s.height / 2, s.width, s.height);
    g.lineStyle(2, 0x6699cc, 0.5);
    g.strokeEllipse(s.x + s.width / 2, s.y + s.height / 2, s.width, s.height);
    this.spillGraphics = g;

    this.fanNextAt = this.scene.time.now + FAN_INTERVAL_MS;
  }

  update(_time: number, delta: number): void {
    const proj = this.getProjectile();
    const body = proj?.body as Phaser.Physics.Arcade.Body | undefined;
    if (proj && body) {
      if (this.spillGeom && Phaser.Geom.Rectangle.Contains(this.spillGeom, proj.x, proj.y)) {
        body.velocity.x *= SPILL_DAMP;
        body.velocity.y *= SPILL_DAMP;
        proj.setGravityY(this.config.projectileConfig.gravity * SPILL_GRAVITY_MULT);
      } else {
        proj.setGravityY(this.config.projectileConfig.gravity);
      }
    }

    const hz = this.config.hazards;
    if (!hz?.bossFanEnabled || !this.isBossRound()) return;
    if (!proj || !body) return;

    const now = this.scene.time.now;
    if (now >= this.fanNextAt) {
      this.fanNextAt = now + FAN_INTERVAL_MS;
      this.fanUntil = now + FAN_DURATION_MS;
    }
    if (now < this.fanUntil) {
      const dt = delta / 1000;
      body.velocity.x += FAN_IMPULSE_X * dt;
    }
  }

  destroy(): void {
    this.spillGraphics?.destroy();
    this.spillGraphics = null;
    this.spillGeom = null;
  }
}
