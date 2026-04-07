import Phaser from 'phaser';
import type { BreakoutBrick, BreakoutBrickKind, BreakoutLevelConfig } from '../../types';
import { getBricksForWave } from './breakoutWaves';
import { placeBricks } from './brickLayout';
import { DEPTH, type SceneManager } from './types';

export interface BrickRuntimeData {
  col: number;
  row: number;
  health: number;
  points: number;
  color: number;
  initialHealth: number;
  brickKind: BreakoutBrickKind;
}

export type BrickHitOutcome =
  | {
      kind: 'eliminated';
      cx: number;
      cy: number;
      color: number;
      points: number;
      col: number;
      row: number;
      brickKind: BreakoutBrickKind;
    }
  | { kind: 'damaged'; sprite: Phaser.Physics.Arcade.Sprite; initialHealth: number; currentHealth: number }
  | { kind: 'noop' };

/**
 * Static brick grid, deferred destroy, and hit resolution.
 */
export class BrickFieldManager implements SceneManager {
  private brickGroup!: Phaser.Physics.Arcade.StaticGroup;
  private readonly brickDataMap = new Map<Phaser.GameObjects.GameObject, BrickRuntimeData>();
  private readonly cellToSprite = new Map<string, Phaser.Physics.Arcade.Sprite>();
  private readonly pendingDestroys = new Set<Phaser.GameObjects.GameObject>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: BreakoutLevelConfig
  ) {}

  create(): void {
    this.brickGroup = this.scene.physics.add.staticGroup();
    this.cellToSprite.clear();
    this.populateFromBrickList(getBricksForWave(this.config, 0));
  }

  /**
   * Replace the brick field with a new layout. Flushes deferred destroys and rebuilds the static group.
   */
  rebuildFromBrickList(bricks: BreakoutBrick[]): void {
    this.flushDestroys();
    this.brickGroup.clear(true, true);
    this.brickDataMap.clear();
    this.cellToSprite.clear();
    this.populateFromBrickList(bricks);
  }

  rebuildForWave(waveIndex: number): void {
    this.rebuildFromBrickList(getBricksForWave(this.config, waveIndex));
  }

  private populateFromBrickList(bricks: BreakoutBrick[]): void {
    const { width } = this.scene.scale;
    const { brickWidth, brickHeight } = this.config;
    const placed = placeBricks(width, this.config, bricks);

    for (const p of placed) {
      const brickDef = p.def;
      const key = `brick-${brickDef.color.toString(16)}`;
      if (!this.scene.textures.exists(key)) {
        const g = this.scene.make.graphics({}, false);
        g.fillStyle(brickDef.color);
        g.fillRoundedRect(0, 0, brickWidth - 2, brickHeight - 2, 3);
        g.fillStyle(0xffffff, 0.15);
        g.fillRect(2, 2, brickWidth - 6, brickHeight * 0.3);
        g.generateTexture(key, brickWidth - 2, brickHeight - 2);
        g.destroy();
      }

      const brick = this.brickGroup.create(p.centerX, p.centerY, key) as Phaser.Physics.Arcade.Sprite;
      brick.setDepth(DEPTH.BRICKS);
      brick.refreshBody();

      const cellKey = cellKeyOf(brickDef.col, brickDef.row);
      this.cellToSprite.set(cellKey, brick);

      this.brickDataMap.set(brick, {
        col: brickDef.col,
        row: brickDef.row,
        health: brickDef.health,
        points: brickDef.points,
        color: brickDef.color,
        initialHealth: brickDef.health,
        brickKind: brickDef.kind ?? 'NORMAL',
      });
    }
  }

  getSpriteAtCell(col: number, row: number): Phaser.Physics.Arcade.Sprite | undefined {
    return this.cellToSprite.get(cellKeyOf(col, row));
  }

  removeCellMapping(col: number, row: number): void {
    this.cellToSprite.delete(cellKeyOf(col, row));
  }

  getGroup(): Phaser.Physics.Arcade.StaticGroup {
    return this.brickGroup;
  }

  getActiveCount(): number {
    return this.brickGroup.countActive(true);
  }

  getRuntimeData(sprite: Phaser.GameObjects.GameObject): BrickRuntimeData | undefined {
    return this.brickDataMap.get(sprite);
  }

  handleBallHitBrick(brick: Phaser.Physics.Arcade.Sprite): BrickHitOutcome {
    const data = this.brickDataMap.get(brick);
    if (!data) return { kind: 'noop' };

    data.health -= 1;

    if (data.health <= 0) {
      const cx = brick.x;
      const cy = brick.y;
      const { points, color, col, row, brickKind } = data;
      this.brickDataMap.delete(brick);
      this.cellToSprite.delete(cellKeyOf(col, row));
      this.deferDestroy(brick);
      return { kind: 'eliminated', cx, cy, color, points, col, row, brickKind };
    }

    return {
      kind: 'damaged',
      sprite: brick,
      initialHealth: data.initialHealth,
      currentHealth: data.health,
    };
  }

  /**
   * Direct damage (e.g. explosive splash). Does not recurse.
   */
  applyDirectDamage(brick: Phaser.Physics.Arcade.Sprite, amount: number): BrickHitOutcome[] {
    const results: BrickHitOutcome[] = [];
    const data = this.brickDataMap.get(brick);
    if (!data || amount <= 0) return results;

    data.health -= amount;
    if (data.health <= 0) {
      const cx = brick.x;
      const cy = brick.y;
      const { points, color, col, row, brickKind } = data;
      this.brickDataMap.delete(brick);
      this.cellToSprite.delete(cellKeyOf(col, row));
      this.deferDestroy(brick);
      results.push({ kind: 'eliminated', cx, cy, color, points, col, row, brickKind });
    } else {
      results.push({
        kind: 'damaged',
        sprite: brick,
        initialHealth: data.initialHealth,
        currentHealth: data.health,
      });
    }
    return results;
  }

  flushDestroys(): void {
    for (const obj of this.pendingDestroys) obj.destroy();
    this.pendingDestroys.clear();
  }

  update(_time: number, _delta: number): void {}

  destroy(): void {
    this.flushDestroys();
    this.brickGroup.clear(true, true);
    this.brickDataMap.clear();
    this.cellToSprite.clear();
  }

  private deferDestroy(obj: Phaser.GameObjects.GameObject): void {
    if (this.pendingDestroys.has(obj)) return;
    this.pendingDestroys.add(obj);
    (obj as Phaser.Physics.Arcade.Sprite).setActive(false).setVisible(false);
    const body = (obj as Phaser.Physics.Arcade.Sprite).body as Phaser.Physics.Arcade.Body;
    if (body) body.enable = false;
  }
}

function cellKeyOf(col: number, row: number): string {
  return `${col},${row}`;
}
