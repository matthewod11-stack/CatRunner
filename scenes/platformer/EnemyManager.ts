import Phaser from 'phaser';
import type { PlatformerLevelConfig } from '../../types';
import { getZoneIndex, isBeforeOpeningRouteHandoff } from './generation';
import type { BuildingData, PlatformerEnemyType, SceneManager } from './types';
import { DEPTH } from './types';
import { EffectsManager } from '../shared/EffectsManager';
import { ROOFTOPS_ENEMY_TEXTURES, ROOFTOPS_ENEMY_VARIANTS } from './rooftopsAssets';

const MAX_ACTIVE_ENEMIES = 4;
const STOMP_POINTS = 25;

const ENEMY_SIZES: Record<PlatformerEnemyType, { w: number; h: number }> = {
  PIGEON: { w: 24, h: 20 },
  RAT: { w: 20, h: 14 },
  RACCOON: { w: 30, h: 26 },
};

const ENEMY_COLORS: Record<PlatformerEnemyType, number> = {
  PIGEON: 0x8888aa,
  RAT: 0x666655,
  RACCOON: 0x554433,
};

interface ActiveEnemy {
  sprite: Phaser.Physics.Arcade.Sprite;
  type: PlatformerEnemyType;
  patrolMinX: number;
  patrolMaxX: number;
  rooftopY: number;
  speed: number;
  state: 'patrol' | 'dash' | 'idle' | 'charge' | 'windup';
  windupTimer: number;
  triggered: boolean;
}

export class EnemyManager implements SceneManager {
  private scene: Phaser.Scene;
  private config: PlatformerLevelConfig;
  private effects: EffectsManager;

  private group!: Phaser.Physics.Arcade.Group;
  private enemies: ActiveEnemy[] = [];
  private spawnedBuildingIndices = new Set<number>();
  private seededOpeningRoute = false;

  private getBuildingsFn: () => readonly BuildingData[];

  constructor(
    scene: Phaser.Scene,
    config: PlatformerLevelConfig,
    effects: EffectsManager,
    getBuildings: () => readonly BuildingData[],
  ) {
    this.scene = scene;
    this.config = config;
    this.effects = effects;
    this.getBuildingsFn = getBuildings;
  }

  create(): void {
    this.group = this.scene.physics.add.group({ allowGravity: false });
    this.seedOpeningRouteEnemies();
  }

  update(_time: number, _delta: number): void {
    this.trySpawnEnemies();
    this.updateEnemyBehaviors();
    this.cleanupOffscreen();
  }

  destroy(): void {
    this.group.destroy(true);
    this.enemies = [];
    this.spawnedBuildingIndices.clear();
  }

  /** Get the enemy group — used by scene for player overlap */
  getGroup(): Phaser.Physics.Arcade.Group {
    return this.group;
  }

  /**
   * Check if a player-enemy overlap is a stomp (player falling onto enemy).
   * Returns points awarded, or 0 if it's not a stomp (= player takes damage).
   */
  handleOverlap(
    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    enemySprite: Phaser.Physics.Arcade.Sprite,
    multiplier: number,
  ): { stomped: boolean; points: number } {
    const playerBottom = player.body.y + player.body.height;
    const enemyTop = enemySprite.body!.y;
    const playerFalling = player.body.velocity.y > 0;

    if (playerFalling && playerBottom - enemyTop < 15) {
      // Stomp!
      const enemy = this.enemies.find(e => e.sprite === enemySprite);
      if (enemy) {
        this.killEnemy(enemy);
        const points = STOMP_POINTS * multiplier;
        this.effects.floatingScore(enemySprite.x, enemySprite.y, `+${points}`);
        this.effects.spawnParticles(
          enemySprite.x, enemySprite.y,
          ENEMY_COLORS[enemy.type], 8, 150,
        );
        return { stomped: true, points };
      }
    }
    return { stomped: false, points: 0 };
  }

  // ── Spawning ──────────────────────────────────────────────────

  private trySpawnEnemies(): void {
    if (this.enemies.length >= MAX_ACTIVE_ENEMIES) return;

    const buildings = this.getBuildingsFn();
    const cam = this.scene.cameras.main;
    const viewRight = cam.scrollX + this.scene.scale.width;

    for (let i = 0; i < buildings.length; i++) {
      if (this.spawnedBuildingIndices.has(i)) continue;
      const b = buildings[i];

      // Only spawn on buildings that are approaching the screen
      if (b.x > viewRight + 200 || b.x + b.width < cam.scrollX) continue;
      if (isBeforeOpeningRouteHandoff(this.config, b.x)) continue;
      if (b.width < 80) continue; // too narrow for enemies

      const distance = b.x;
      const zoneIdx = getZoneIndex(this.config.zones, distance);
      const zone = this.config.zones[zoneIdx];

      // Roll for each enemy type in this zone
      for (const enemyCfg of zone.enemies) {
        const chancePerBuilding = enemyCfg.density / 5; // density is per 1000px, ~5 buildings per 1000px
        if (Math.random() < chancePerBuilding && this.enemies.length < MAX_ACTIVE_ENEMIES) {
          this.spawnEnemy(enemyCfg.type as PlatformerEnemyType, b, i);
          this.spawnedBuildingIndices.add(i);
          break; // max 1 enemy per building
        }
      }
    }
  }

  private spawnEnemy(type: PlatformerEnemyType, building: BuildingData, _buildingIndex: number): void {
    const size = ENEMY_SIZES[type];

    // Create texture if needed
    const fallbackKey = `enemy-${type}`;
    const texKey = this.scene.textures.exists(ROOFTOPS_ENEMY_TEXTURES[type])
      ? ROOFTOPS_ENEMY_TEXTURES[type]
      : fallbackKey;
    if (texKey === fallbackKey && !this.scene.textures.exists(texKey)) {
      const color = ENEMY_COLORS[type];
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(color);
      g.fillRoundedRect(0, 0, size.w, size.h, 4);
      // Eyes
      g.fillStyle(0xffffff);
      g.fillCircle(size.w * 0.3, size.h * 0.35, 3);
      g.fillCircle(size.w * 0.7, size.h * 0.35, 3);
      g.fillStyle(0x000000);
      g.fillCircle(size.w * 0.3, size.h * 0.35, 1.5);
      g.fillCircle(size.w * 0.7, size.h * 0.35, 1.5);
      g.generateTexture(texKey, size.w, size.h);
      g.destroy();
    }

    const x = building.x + Phaser.Math.Between(20, building.width - 20);
    const y = building.rooftopY - size.h;

    const sprite = this.group.create(x, y, texKey) as Phaser.Physics.Arcade.Sprite;
    sprite.setDepth(DEPTH.ENEMIES);
    if (texKey !== fallbackKey) sprite.setDisplaySize(size.w, size.h);
    sprite.body!.setSize(size.w - 4, size.h - 2);

    const speed = type === 'PIGEON' ? 60 : type === 'RAT' ? 200 : 0;

    const enemy: ActiveEnemy = {
      sprite,
      type,
      patrolMinX: building.x + 10,
      patrolMaxX: building.x + building.width - 10,
      rooftopY: building.rooftopY,
      speed,
      state: type === 'PIGEON' ? 'patrol' : type === 'RAT' ? 'dash' : 'idle',
      windupTimer: 0,
      triggered: false,
    };

    // Pigeon starts moving right
    if (type === 'PIGEON') {
      (sprite.body as Phaser.Physics.Arcade.Body).setVelocityX(speed);
    }
    // Rat dashes from left edge to right
    if (type === 'RAT') {
      sprite.setPosition(building.x + 10, y);
      (sprite.body as Phaser.Physics.Arcade.Body).setVelocityX(speed);
    }

    this.enemies.push(enemy);
  }

  private seedOpeningRouteEnemies(): void {
    if (this.seededOpeningRoute || !this.config.openingRoute) return;
    this.seededOpeningRoute = true;

    for (const entry of this.config.openingRoute.enemies ?? []) {
      const platform = this.config.openingRoute.platforms[entry.platformIndex];
      if (!platform) continue;
      this.spawnExplicitEnemy(entry.type as PlatformerEnemyType, {
        x: entry.x,
        rooftopY: platform.rooftopY,
        patrolMinX: platform.x + (entry.patrolPadding ?? 10),
        patrolMaxX: platform.x + platform.width - (entry.patrolPadding ?? 10),
      });
    }
  }

  private spawnExplicitEnemy(
    type: PlatformerEnemyType,
    placement: { x: number; rooftopY: number; patrolMinX: number; patrolMaxX: number },
  ): void {
    const size = ENEMY_SIZES[type];
    const fallbackKey = `enemy-${type}`;
    const texKey = this.scene.textures.exists(ROOFTOPS_ENEMY_TEXTURES[type])
      ? ROOFTOPS_ENEMY_TEXTURES[type]
      : fallbackKey;

    if (texKey === fallbackKey && !this.scene.textures.exists(texKey)) {
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(ENEMY_COLORS[type]);
      g.fillRoundedRect(0, 0, size.w, size.h, 4);
      g.generateTexture(texKey, size.w, size.h);
      g.destroy();
    }

    const y = placement.rooftopY - size.h;
    const sprite = this.group.create(placement.x, y, texKey) as Phaser.Physics.Arcade.Sprite;
    sprite.setDepth(DEPTH.ENEMIES);
    if (texKey !== fallbackKey) sprite.setDisplaySize(size.w, size.h);
    sprite.body!.setSize(size.w - 4, size.h - 2);

    const speed = type === 'PIGEON' ? 60 : 0;
    const enemy: ActiveEnemy = {
      sprite,
      type,
      patrolMinX: placement.patrolMinX,
      patrolMaxX: placement.patrolMaxX,
      rooftopY: placement.rooftopY,
      speed,
      state: type === 'PIGEON' ? 'patrol' : 'idle',
      windupTimer: 0,
      triggered: false,
    };

    if (type === 'PIGEON') {
      (sprite.body as Phaser.Physics.Arcade.Body).setVelocityX(speed);
    }

    this.enemies.push(enemy);
  }

  // ── Behaviors ─────────────────────────────────────────────────

  private updateEnemyBehaviors(): void {
    const playerX = this.scene.cameras.main.scrollX + this.scene.scale.width / 2;

    for (const e of this.enemies) {
      switch (e.type) {
        case 'PIGEON':
          this.updatePigeon(e);
          break;
        case 'RAT':
          this.updateRat(e);
          break;
        case 'RACCOON':
          this.updateRaccoon(e, playerX);
          break;
      }
    }
  }

  private updatePigeon(e: ActiveEnemy): void {
    // Patrol: bounce between building edges
    const body = e.sprite.body as Phaser.Physics.Arcade.Body;
    if (e.sprite.x <= e.patrolMinX) {
      body.setVelocityX(e.speed);
      e.sprite.setFlipX(false);
    } else if (e.sprite.x >= e.patrolMaxX) {
      body.setVelocityX(-e.speed);
      e.sprite.setFlipX(true);
    }
  }

  private updateRat(e: ActiveEnemy): void {
    // Dash across and destroy when off the building
    if (e.sprite.x >= e.patrolMaxX || e.sprite.x <= e.patrolMinX - 20) {
      this.killEnemy(e);
    }
  }

  private updateRaccoon(e: ActiveEnemy, playerX: number): void {
    const dist = Math.abs(e.sprite.x - playerX);

    if (e.state === 'idle' && dist < 150 && !e.triggered) {
      // Player is close — start wind-up
      e.state = 'windup';
      e.windupTimer = 400; // 400ms wind-up
      e.triggered = true;

      // Visual: shake slightly
      this.scene.tweens.add({
        targets: e.sprite,
        x: e.sprite.x + 3,
        duration: 50,
        yoyo: true,
        repeat: 4,
      });
    }

    if (e.state === 'windup') {
      e.windupTimer -= this.scene.game.loop.delta;
      if (e.windupTimer <= 0) {
        // Charge!
        e.state = 'charge';
        const dir = playerX > e.sprite.x ? 1 : -1;
        const body = e.sprite.body as Phaser.Physics.Arcade.Body;
        body.setVelocityX(180 * dir);
        e.sprite.setFlipX(dir < 0);
      }
    }

    if (e.state === 'charge') {
      const chargeTexture = ROOFTOPS_ENEMY_VARIANTS.RACCOON.charge;
      if (this.scene.textures.exists(chargeTexture) && e.sprite.texture.key !== chargeTexture) {
        e.sprite.setTexture(chargeTexture);
        e.sprite.setDisplaySize(ENEMY_SIZES.RACCOON.w, ENEMY_SIZES.RACCOON.h);
      }
      const body = e.sprite.body as Phaser.Physics.Arcade.Body;
      // Turn around at building edges
      if (e.sprite.x <= e.patrolMinX) {
        body.setVelocityX(180);
        e.sprite.setFlipX(false);
      } else if (e.sprite.x >= e.patrolMaxX) {
        body.setVelocityX(-180);
        e.sprite.setFlipX(true);
      }
    }
  }

  // ── Cleanup ───────────────────────────────────────────────────

  private killEnemy(enemy: ActiveEnemy): void {
    enemy.sprite.destroy();
    this.enemies = this.enemies.filter(e => e !== enemy);
  }

  private cleanupOffscreen(): void {
    const camLeft = this.scene.cameras.main.scrollX - 200;
    for (const e of [...this.enemies]) {
      if (e.sprite.x + 50 < camLeft) {
        this.killEnemy(e);
      }
    }
  }
}
