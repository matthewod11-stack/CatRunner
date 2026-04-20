import Phaser from 'phaser';
import type { PlatformerLevelConfig } from '../../types';
import type { BuildingData, FireEscapeData, PlatformerPowerupType, SceneManager } from './types';
import { DEPTH } from './types';
import { EffectsManager } from '../shared/EffectsManager';

const POWERUP_SIZE = 22;

const POWERUP_COLORS: Record<PlatformerPowerupType, number> = {
  TRIPLE_JUMP: 0x44ddff,
  GLIDE: 0xaa88ff,
  SHIELD: 0x44ff88,
};

export interface ActivePowerupState {
  type: PlatformerPowerupType | null;
  remainingMs: number;
}

export class PowerupManager implements SceneManager {
  private scene: Phaser.Scene;
  private config: PlatformerLevelConfig;
  private effects: EffectsManager;
  private getBuildingsFn: () => readonly BuildingData[];
  private getFireEscapesFn: () => readonly FireEscapeData[];

  private group!: Phaser.Physics.Arcade.StaticGroup;
  private spawnedZones = new Set<number>();
  private spawnedFireEscapes = new Set<number>();

  /** Currently active powerup */
  private activePowerup: PlatformerPowerupType | null = null;
  private powerupTimer = 0;

  /** Shield is single-use, tracked separately */
  private shieldActive = false;

  constructor(
    scene: Phaser.Scene,
    config: PlatformerLevelConfig,
    effects: EffectsManager,
    getBuildings: () => readonly BuildingData[],
    getFireEscapes: () => readonly FireEscapeData[],
  ) {
    this.scene = scene;
    this.config = config;
    this.effects = effects;
    this.getBuildingsFn = getBuildings;
    this.getFireEscapesFn = getFireEscapes;
  }

  create(): void {
    this.group = this.scene.physics.add.staticGroup();
    this.createTextures();
  }

  update(_time: number, delta: number): void {
    this.trySpawnPowerups();

    // Tick down timed powerups
    if (this.activePowerup && this.activePowerup !== 'SHIELD') {
      this.powerupTimer -= delta;
      if (this.powerupTimer <= 0) {
        this.activePowerup = null;
        this.powerupTimer = 0;
      }
    }
  }

  destroy(): void {
    this.group.destroy(true);
    this.activePowerup = null;
    this.powerupTimer = 0;
    this.shieldActive = false;
  }

  getGroup(): Phaser.Physics.Arcade.StaticGroup { return this.group; }

  getState(): ActivePowerupState {
    return {
      type: this.shieldActive ? 'SHIELD' : this.activePowerup,
      remainingMs: this.shieldActive ? Infinity : this.powerupTimer,
    };
  }

  /** Is triple jump currently active? */
  hasTripleJump(): boolean {
    return this.activePowerup === 'TRIPLE_JUMP';
  }

  /** Is glide currently active? */
  hasGlide(): boolean {
    return this.activePowerup === 'GLIDE';
  }

  /** Is shield active? */
  hasShield(): boolean {
    return this.shieldActive;
  }

  /** Consume the shield (on damage). Returns true if shield was active. */
  consumeShield(): boolean {
    if (this.shieldActive) {
      this.shieldActive = false;
      return true;
    }
    return false;
  }

  /** Called when player overlaps a powerup pickup */
  collectPowerup(sprite: Phaser.Physics.Arcade.Sprite): void {
    const type = sprite.getData('powerupType') as PlatformerPowerupType;
    const x = sprite.x;
    const y = sprite.y;
    sprite.destroy();

    this.effects.floatingScore(x, y, type.replace('_', ' '), '#44ffaa');
    this.effects.spawnParticles(x, y, POWERUP_COLORS[type], 10, 180);

    if (type === 'SHIELD') {
      this.shieldActive = true;
    } else {
      // Replace any existing timed powerup
      this.activePowerup = type;
      this.powerupTimer = type === 'TRIPLE_JUMP'
        ? this.config.powerups.tripleJumpDuration
        : this.config.powerups.glideDuration;
    }
  }

  // ── Textures ──────────────────────────────────────────────────

  private createTextures(): void {
    for (const type of ['TRIPLE_JUMP', 'GLIDE', 'SHIELD'] as PlatformerPowerupType[]) {
      const key = `powerup-${type}`;
      if (this.scene.textures.exists(key)) continue;

      const g = this.scene.make.graphics({}, false);
      const color = POWERUP_COLORS[type];
      // Glowing circle
      g.fillStyle(color, 0.3);
      g.fillCircle(POWERUP_SIZE / 2, POWERUP_SIZE / 2, POWERUP_SIZE / 2);
      g.fillStyle(color);
      g.fillCircle(POWERUP_SIZE / 2, POWERUP_SIZE / 2, POWERUP_SIZE / 2 - 4);
      g.generateTexture(key, POWERUP_SIZE, POWERUP_SIZE);
      g.destroy();
    }
  }

  // ── Spawning ──────────────────────────────────────────────────

  private trySpawnPowerups(): void {
    const buildings = this.getBuildingsFn();
    const cam = this.scene.cameras.main;
    const viewRight = cam.scrollX + this.scene.scale.width;

    // Zone-based spawns (1 per zone, near midpoint)
    for (const zone of this.config.zones) {
      const zoneIdx = this.config.zones.indexOf(zone);
      if (this.spawnedZones.has(zoneIdx)) continue;

      const midDistance = (zone.startDistance + zone.endDistance) / 2;

      // Find a building near the zone midpoint
      for (const b of buildings) {
        if (b.x < midDistance - 300 || b.x > midDistance + 300) continue;
        if (b.x > viewRight + 400) continue;
        if (b.width < 60) continue;

        this.spawnPowerup(b);
        this.spawnedZones.add(zoneIdx);
        break;
      }
    }

    // Fire escape bonus spawns
    const fireEscapes = this.getFireEscapesFn();
    for (let i = 0; i < fireEscapes.length; i++) {
      if (this.spawnedFireEscapes.has(i)) continue;
      const fe = fireEscapes[i];
      if (fe.x > viewRight + 400) continue;

      if (Math.random() < this.config.powerups.fireEscapeBonusChance) {
        this.spawnPowerupAt(fe.x + fe.width / 2, fe.y - POWERUP_SIZE);
        this.spawnedFireEscapes.add(i);
      } else {
        this.spawnedFireEscapes.add(i); // mark as checked even if not spawned
      }
    }
  }

  private spawnPowerup(building: BuildingData): void {
    const x = building.x + building.width / 2;
    const y = building.rooftopY - POWERUP_SIZE - 10;
    this.spawnPowerupAt(x, y);
  }

  private spawnPowerupAt(x: number, y: number): void {
    const types: PlatformerPowerupType[] = ['TRIPLE_JUMP', 'GLIDE', 'SHIELD'];
    const type = types[Math.floor(Math.random() * types.length)];

    const sprite = this.group.create(x, y, `powerup-${type}`) as Phaser.Physics.Arcade.Sprite;
    sprite.setDepth(DEPTH.POWERUPS);
    sprite.setData('powerupType', type);
    sprite.refreshBody();

    // Gentle bob animation
    this.scene.tweens.add({
      targets: sprite,
      y: y - 6,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
