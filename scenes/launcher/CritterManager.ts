import Phaser from 'phaser';
import type { StructureBuilder } from './StructureBuilder';
import { DEPTH, type SceneManager } from './types';

const ANT_POINTS = 15;
const MOUSE_BONUS = 50;
const MOUSE_STEAL = 25;

type CritterCb = {
  addScore: (n: number, x: number, y: number, label?: string) => void;
  playSfx: (k: string) => void;
};

export class CritterManager implements SceneManager {
  private scene: Phaser.Scene;
  private critterGroup!: Phaser.Physics.Arcade.Group;
  private ants: Phaser.Physics.Arcade.Sprite[] = [];
  private mouse: Phaser.Physics.Arcade.Sprite | null = null;
  private mouseAlive = false;
  private cb!: CritterCb;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  initCallbacks(cb: CritterCb): void {
    this.cb = cb;
  }

  create(): void {
    this.critterGroup = this.scene.physics.add.group();
  }

  update(_time: number, _delta: number): void {}

  destroy(): void {
    this.clear();
    this.critterGroup?.destroy(true);
  }

  clear(): void {
    this.ants.forEach((a) => a.destroy());
    this.ants = [];
    if (this.mouse) {
      this.mouse.destroy();
      this.mouse = null;
    }
    this.mouseAlive = false;
  }

  /** Spawn ants (round ≥3) and mouse (round ≥5), not on boss */
  spawnForRound(round: number, isBoss: boolean, builder: StructureBuilder): void {
    this.clear();
    if (isBoss) return;

    const blocks = builder.listBlocks();
    if (blocks.length === 0) return;

    const top = blocks.reduce((a, b) => (a.sprite.y < b.sprite.y ? a : b));

    if (!this.scene.textures.exists('__ant')) {
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(0x3d2914);
      g.fillEllipse(5, 4, 10, 8);
      g.generateTexture('__ant', 10, 8);
      g.destroy();
    }
    if (!this.scene.textures.exists('__mouse')) {
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(0x9ca3af);
      g.fillRoundedRect(0, 0, 22, 14, 4);
      g.fillStyle(0xfca5a5);
      g.fillCircle(18, 6, 3);
      g.generateTexture('__mouse', 22, 14);
      g.destroy();
    }

    if (round >= 3) {
      const w = top.sprite.width;
      const left = top.sprite.x - w / 2 + 8;
      const y = top.sprite.y - top.sprite.height / 2 - 4;
      const count = Phaser.Math.Between(3, 5);
      for (let i = 0; i < count; i++) {
        const ax = left + (i / Math.max(1, count - 1)) * (w - 16);
        const ant = this.scene.physics.add.sprite(ax, y, '__ant');
        ant.setDepth(DEPTH.CRITTERS);
        ant.setCircle(4);
        ant.body.setAllowGravity(false);
        ant.body.setImmovable(true);
        this.critterGroup.add(ant);
        this.ants.push(ant);
      }
    }

    if (round >= 5) {
      const m = this.scene.physics.add.sprite(top.sprite.x, top.sprite.y - top.sprite.height / 2 - 14, '__mouse');
      m.setDepth(DEPTH.CRITTERS);
      m.body.setSize(20, 12);
      m.body.setAllowGravity(false);
      m.body.setImmovable(true);
      this.critterGroup.add(m);
      this.mouse = m;
      this.mouseAlive = true;
    }
  }

  getGroup(): Phaser.Physics.Arcade.Group {
    return this.critterGroup;
  }

  onProjectileHitCritters(proj: Phaser.GameObjects.GameObject): void {
    const p = proj as Phaser.Physics.Arcade.Sprite;
    this.ants = this.ants.filter((ant) => {
      if (!ant.active) return false;
      if (Phaser.Math.Distance.Between(p.x, p.y, ant.x, ant.y) < 22) {
        this.cb.addScore(ANT_POINTS, ant.x, ant.y, `+${ANT_POINTS}`);
        this.cb.playSfx('coin');
        ant.destroy();
        return false;
      }
      return true;
    });

    if (this.mouse && this.mouseAlive && this.mouse.active) {
      if (Phaser.Math.Distance.Between(p.x, p.y, this.mouse.x, this.mouse.y) < 28) {
        this.cb.addScore(MOUSE_BONUS, this.mouse.x, this.mouse.y, `+${MOUSE_BONUS}`);
        this.cb.playSfx('coin');
        this.mouse.destroy();
        this.mouse = null;
        this.mouseAlive = false;
      }
    }
  }

  /** If structure not cleared and mouse still present */
  applyMouseStealIfNeeded(structureCleared: boolean, counterY: number): void {
    if (structureCleared) return;
    if (!this.mouseAlive) return;
    this.cb.addScore(-MOUSE_STEAL, this.scene.scale.width / 2, counterY - 50, 'STOLEN!');
    this.cb.playSfx('meow');
  }
}
