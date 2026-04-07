import Phaser from 'phaser';
import type { LauncherBlock, LauncherBlockKind, LauncherLevelConfig, LauncherStructure } from '../../types';
import { DEPTH, type SceneManager } from './types';

const MATERIAL_COLORS: Record<string, number> = {
  glass: 0x88ccff,
  wood: 0xc4842d,
  metal: 0x888899,
};

const MATERIAL_EDGE_COLORS: Record<string, number> = {
  glass: 0x66aadd,
  wood: 0x9a6820,
  metal: 0x666677,
};

export interface LauncherBlockRuntime {
  id: string;
  health: number;
  maxHealth: number;
  points: number;
  material: string;
  kind: LauncherBlockKind;
}

function normalizeKind(k?: LauncherBlockKind): LauncherBlockKind {
  return k ?? 'normal';
}

function textureKeyForBlock(def: LauncherBlock): string {
  const kind = normalizeKind(def.kind);
  return `launcher-blk-${def.material}-${def.width}x${def.height}-${kind}`;
}

export class StructureBuilder implements SceneManager {
  private scene: Phaser.Scene;
  private config: LauncherLevelConfig;
  private blockGroup!: Phaser.Physics.Arcade.StaticGroup;
  private blockData = new Map<Phaser.Physics.Arcade.Sprite, LauncherBlockRuntime>();
  private idToSprite = new Map<string, Phaser.Physics.Arcade.Sprite>();

  constructor(scene: Phaser.Scene, config: LauncherLevelConfig) {
    this.scene = scene;
    this.config = config;
  }

  create(): void {
    this.blockGroup = this.scene.physics.add.staticGroup();
  }

  update(_time: number, _delta: number): void {}

  destroy(): void {
    this.clear();
    this.blockGroup?.destroy(true);
  }

  getBlockGroup(): Phaser.Physics.Arcade.StaticGroup {
    return this.blockGroup;
  }

  getBlockData(): Map<Phaser.Physics.Arcade.Sprite, LauncherBlockRuntime> {
    return this.blockData;
  }

  getSpriteById(id: string): Phaser.Physics.Arcade.Sprite | undefined {
    return this.idToSprite.get(id);
  }

  getRuntimeById(id: string): LauncherBlockRuntime | undefined {
    const s = this.idToSprite.get(id);
    return s ? this.blockData.get(s) : undefined;
  }

  /** Active block bounds for explosion / ward neighbor checks */
  getActiveBlockBounds(): { id: string; cx: number; cy: number; width: number; height: number }[] {
    const out: { id: string; cx: number; cy: number; width: number; height: number }[] = [];
    this.blockData.forEach((data, sprite) => {
      if (!sprite.active) return;
      out.push({
        id: data.id,
        cx: sprite.x,
        cy: sprite.y,
        width: sprite.width,
        height: sprite.height,
      });
    });
    return out;
  }

  listBlocks(): { sprite: Phaser.Physics.Arcade.Sprite; runtime: LauncherBlockRuntime }[] {
    const out: { sprite: Phaser.Physics.Arcade.Sprite; runtime: LauncherBlockRuntime }[] = [];
    this.blockData.forEach((runtime, sprite) => {
      if (sprite.active) out.push({ sprite, runtime });
    });
    return out;
  }

  clear(): void {
    this.blockGroup.clear(true, true);
    this.blockData.clear();
    this.idToSprite.clear();
  }

  removeBlock(sprite: Phaser.Physics.Arcade.Sprite, id: string): void {
    this.blockData.delete(sprite);
    this.idToSprite.delete(id);
  }

  buildFromStructure(structure: LauncherStructure, screenWidth: number, counterY: number): void {
    this.clear();
    const baseX = screenWidth - structure.offsetX;
    const baseY = counterY;

    let idx = 0;
    for (const blockDef of structure.blocks) {
      const id = `b-${idx++}`;
      const key = textureKeyForBlock(blockDef);
      this.ensureTexture(key, blockDef);

      const bx = baseX + blockDef.x;
      const by = baseY + blockDef.y - blockDef.height;

      const block = this.blockGroup.create(
        bx + blockDef.width / 2,
        by + blockDef.height / 2,
        key
      ) as Phaser.Physics.Arcade.Sprite;
      block.setDepth(DEPTH.BLOCKS);
      block.refreshBody();

      const kind = normalizeKind(blockDef.kind);
      const runtime: LauncherBlockRuntime = {
        id,
        health: blockDef.health,
        maxHealth: blockDef.health,
        points: blockDef.points,
        material: blockDef.material,
        kind,
      };
      this.applyKindTint(block, kind);
      this.blockData.set(block, runtime);
      this.idToSprite.set(id, block);
    }
  }

  private applyKindTint(sprite: Phaser.Physics.Arcade.Sprite, kind: LauncherBlockKind): void {
    switch (kind) {
      case 'explosive':
        sprite.setTint(0xffaa66);
        break;
      case 'ice':
        sprite.setTint(0xccffff);
        break;
      case 'power_crate':
        sprite.setTint(0xddaaff);
        break;
      case 'cheese_ward':
        sprite.setTint(0xffee88);
        break;
      case 'mixer_core':
        sprite.setTint(0xddddff);
        break;
      default:
        break;
    }
  }

  private ensureTexture(key: string, blockDef: LauncherBlock): void {
    if (this.scene.textures.exists(key)) return;

    const g = this.scene.make.graphics({}, false);
    const { width, height, material } = blockDef;
    g.fillStyle(MATERIAL_COLORS[material] ?? 0x888888);
    g.fillRect(0, 0, width, height);
    g.lineStyle(2, MATERIAL_EDGE_COLORS[material] ?? 0x666666);
    g.strokeRect(1, 1, width - 2, height - 2);

    if (material === 'wood') {
      g.lineStyle(1, 0x7a5218, 0.3);
      g.lineBetween(5, height * 0.3, width - 5, height * 0.35);
      g.lineBetween(3, height * 0.7, width - 8, height * 0.65);
    }
    if (material === 'glass') {
      g.fillStyle(0xffffff, 0.3);
      g.fillRect(3, 3, width * 0.3, height * 0.2);
    }

    const kind = normalizeKind(blockDef.kind);
    if (kind === 'explosive') {
      g.fillStyle(0xff4400, 0.35);
      g.fillTriangle(width * 0.5, 4, width - 4, height - 4, 4, height - 4);
    }
    if (kind === 'power_crate') {
      g.lineStyle(2, 0x6633aa);
      g.strokeRect(width * 0.25, height * 0.25, width * 0.5, height * 0.5);
      g.lineStyle(3, 0x6633aa);
      g.lineBetween(width * 0.3, height * 0.5, width * 0.7, height * 0.5);
      g.lineBetween(width * 0.5, height * 0.3, width * 0.5, height * 0.7);
    }
    if (kind === 'mixer_core') {
      g.lineStyle(2, 0x333366);
      g.strokeCircle(width / 2, height / 2, Math.min(width, height) * 0.35);
    }

    g.generateTexture(key, width, height);
    g.destroy();
  }
}
