import Phaser from 'phaser';
import type { PlatformerLevelConfig } from '../../types';
import { getZoneIndex } from './generation';
import type { BuildingData, PlatformerHazardType, SceneManager } from './types';
import { DEPTH } from './types';

const AC_UNIT_SIZE = { w: 30, h: 25 };
const SATELLITE_SIZE = { w: 28, h: 20 };
const NEON_SIZE = { w: 10, h: 30 };
const CLOTHESLINE_SPEED = 100;
const NEON_CYCLE_MS = 1500;

interface ActiveHazard {
  type: PlatformerHazardType;
  sprite: Phaser.GameObjects.GameObject;
  body?: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody;
  buildingIndex: number;
  /** Neon sign on/off state */
  isOn?: boolean;
  /** Neon cycle timer */
  cycleTimer?: number;
  /** Clothesline: destination X */
  destinationX?: number;
  /** Clothesline: is player riding? */
  isRiding?: boolean;
  /** Steam AC: direction of push */
  steamDirection?: number;
  /** Steam timer */
  steamTimer?: number;
}

export class HazardManager implements SceneManager {
  private scene: Phaser.Scene;
  private config: PlatformerLevelConfig;
  private getBuildingsFn: () => readonly BuildingData[];

  /** Static hazards the player collides with (AC units) */
  private staticGroup!: Phaser.Physics.Arcade.StaticGroup;
  /** Bounce surfaces (satellite dishes) */
  private bounceGroup!: Phaser.Physics.Arcade.StaticGroup;
  /** Damage hazards (neon signs when ON) */
  private damageGroup!: Phaser.Physics.Arcade.StaticGroup;
  /** Clothesline platforms */
  private clotheslineGroup!: Phaser.Physics.Arcade.StaticGroup;

  private hazards: ActiveHazard[] = [];
  private placedBuildingIndices = new Set<number>();

  /** Graphics for clothesline ropes */
  private ropeGraphics!: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    config: PlatformerLevelConfig,
    getBuildings: () => readonly BuildingData[],
  ) {
    this.scene = scene;
    this.config = config;
    this.getBuildingsFn = getBuildings;
  }

  create(): void {
    this.staticGroup = this.scene.physics.add.staticGroup();
    this.bounceGroup = this.scene.physics.add.staticGroup();
    this.damageGroup = this.scene.physics.add.staticGroup();
    this.clotheslineGroup = this.scene.physics.add.staticGroup();
    this.ropeGraphics = this.scene.add.graphics().setDepth(DEPTH.HAZARDS);

    this.createTextures();
  }

  update(_time: number, delta: number): void {
    this.tryPlaceHazards();
    this.updateNeonSigns(delta);
    this.updateSteam(delta);
    this.drawClotheslines();
    this.cleanupOffscreen();
  }

  destroy(): void {
    this.staticGroup.destroy(true);
    this.bounceGroup.destroy(true);
    this.damageGroup.destroy(true);
    this.clotheslineGroup.destroy(true);
    this.ropeGraphics.destroy();
    this.hazards = [];
    this.placedBuildingIndices.clear();
  }

  getStaticGroup(): Phaser.Physics.Arcade.StaticGroup { return this.staticGroup; }
  getBounceGroup(): Phaser.Physics.Arcade.StaticGroup { return this.bounceGroup; }
  getDamageGroup(): Phaser.Physics.Arcade.StaticGroup { return this.damageGroup; }
  getClotheslineGroup(): Phaser.Physics.Arcade.StaticGroup { return this.clotheslineGroup; }

  /** Check if a satellite dish was hit — returns bounce force multiplier */
  isBounce(sprite: Phaser.Physics.Arcade.Sprite): boolean {
    return this.bounceGroup.contains(sprite);
  }

  /** Check if a neon sign is currently ON (dangerous) */
  isNeonDangerous(sprite: Phaser.GameObjects.GameObject): boolean {
    const hazard = this.hazards.find(h => h.sprite === sprite && h.type === 'NEON_SIGN');
    return hazard?.isOn ?? false;
  }

  /** Get steam push direction for an AC unit (0 = no steam) */
  getSteamPush(sprite: Phaser.GameObjects.GameObject): number {
    const hazard = this.hazards.find(h => h.sprite === sprite && h.type === 'AC_UNIT');
    return hazard?.steamDirection ?? 0;
  }

  // ── Textures ──────────────────────────────────────────────────

  private createTextures(): void {
    // AC Unit
    if (!this.scene.textures.exists('ac-unit')) {
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(0x444455);
      g.fillRoundedRect(0, 0, AC_UNIT_SIZE.w, AC_UNIT_SIZE.h, 3);
      g.fillStyle(0x333344);
      g.fillRect(3, 3, AC_UNIT_SIZE.w - 6, 4); // vent slats
      g.fillRect(3, 10, AC_UNIT_SIZE.w - 6, 4);
      g.fillRect(3, 17, AC_UNIT_SIZE.w - 6, 4);
      g.generateTexture('ac-unit', AC_UNIT_SIZE.w, AC_UNIT_SIZE.h);
      g.destroy();
    }

    // Satellite Dish
    if (!this.scene.textures.exists('satellite-dish')) {
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(0x888899);
      g.fillEllipse(SATELLITE_SIZE.w / 2, SATELLITE_SIZE.h / 2, SATELLITE_SIZE.w, SATELLITE_SIZE.h);
      g.fillStyle(0xaaaabb);
      g.fillEllipse(SATELLITE_SIZE.w / 2, SATELLITE_SIZE.h / 2 - 2, SATELLITE_SIZE.w - 8, SATELLITE_SIZE.h - 6);
      g.generateTexture('satellite-dish', SATELLITE_SIZE.w, SATELLITE_SIZE.h);
      g.destroy();
    }

    // Neon Sign (ON)
    if (!this.scene.textures.exists('neon-on')) {
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(0xff0066);
      g.fillRect(0, 0, NEON_SIZE.w, NEON_SIZE.h);
      g.generateTexture('neon-on', NEON_SIZE.w, NEON_SIZE.h);
      g.destroy();
    }

    // Neon Sign (OFF)
    if (!this.scene.textures.exists('neon-off')) {
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(0x331122);
      g.fillRect(0, 0, NEON_SIZE.w, NEON_SIZE.h);
      g.generateTexture('neon-off', NEON_SIZE.w, NEON_SIZE.h);
      g.destroy();
    }

    // Clothesline platform (small invisible surface)
    if (!this.scene.textures.exists('clothesline-plat')) {
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(0xffffff, 0);
      g.fillRect(0, 0, 20, 4);
      g.generateTexture('clothesline-plat', 20, 4);
      g.destroy();
    }
  }

  // ── Placement ─────────────────────────────────────────────────

  private tryPlaceHazards(): void {
    const buildings = this.getBuildingsFn();
    const cam = this.scene.cameras.main;
    const viewRight = cam.scrollX + this.scene.scale.width;

    for (let i = 0; i < buildings.length; i++) {
      if (this.placedBuildingIndices.has(i)) continue;
      const b = buildings[i];
      if (b.x > viewRight + 300 || b.x + b.width < cam.scrollX) continue;

      const distance = b.x;
      const zoneIdx = getZoneIndex(this.config.zones, distance);
      const zone = this.config.zones[zoneIdx];

      for (const hazardCfg of zone.hazards) {
        const chancePerBuilding = hazardCfg.frequency / 5;
        if (Math.random() < chancePerBuilding) {
          this.placeHazard(hazardCfg.type as PlatformerHazardType, b, i, buildings);
          this.placedBuildingIndices.add(i);
          break; // max 1 hazard per building
        }
      }
    }
  }

  private placeHazard(
    type: PlatformerHazardType,
    building: BuildingData,
    buildingIndex: number,
    allBuildings: readonly BuildingData[],
  ): void {
    switch (type) {
      case 'AC_UNIT':
        this.placeACUnit(building, buildingIndex);
        break;
      case 'SATELLITE_DISH':
        this.placeSatelliteDish(building, buildingIndex);
        break;
      case 'NEON_SIGN':
        this.placeNeonSign(building, buildingIndex);
        break;
      case 'CLOTHESLINE':
        this.placeClothesline(building, buildingIndex, allBuildings);
        break;
    }
  }

  private placeACUnit(building: BuildingData, buildingIndex: number): void {
    const x = building.x + Phaser.Math.Between(20, building.width - AC_UNIT_SIZE.w - 20);
    const y = building.rooftopY - AC_UNIT_SIZE.h;

    const sprite = this.staticGroup.create(
      x + AC_UNIT_SIZE.w / 2, y + AC_UNIT_SIZE.h / 2, 'ac-unit',
    ) as Phaser.Physics.Arcade.Sprite;
    sprite.setDepth(DEPTH.HAZARDS);
    sprite.refreshBody();

    // 40% chance of steam variant
    const steamDir = Math.random() < 0.4 ? (Math.random() < 0.5 ? -1 : 1) : 0;

    this.hazards.push({
      type: 'AC_UNIT', sprite, buildingIndex,
      steamDirection: steamDir, steamTimer: 0,
    });
  }

  private placeSatelliteDish(building: BuildingData, buildingIndex: number): void {
    const x = building.x + Phaser.Math.Between(15, building.width - SATELLITE_SIZE.w - 15);
    const y = building.rooftopY - SATELLITE_SIZE.h;

    const sprite = this.bounceGroup.create(
      x + SATELLITE_SIZE.w / 2, y + SATELLITE_SIZE.h / 2, 'satellite-dish',
    ) as Phaser.Physics.Arcade.Sprite;
    sprite.setDepth(DEPTH.HAZARDS);
    sprite.refreshBody();

    this.hazards.push({ type: 'SATELLITE_DISH', sprite, buildingIndex });
  }

  private placeNeonSign(building: BuildingData, buildingIndex: number): void {
    // Place near building edge
    const atLeft = Math.random() < 0.5;
    const x = atLeft ? building.x - NEON_SIZE.w / 2 : building.x + building.width - NEON_SIZE.w / 2;
    const y = building.rooftopY - NEON_SIZE.h + 5;

    const sprite = this.damageGroup.create(
      x + NEON_SIZE.w / 2, y + NEON_SIZE.h / 2, 'neon-on',
    ) as Phaser.Physics.Arcade.Sprite;
    sprite.setDepth(DEPTH.HAZARDS);
    sprite.refreshBody();

    this.hazards.push({
      type: 'NEON_SIGN', sprite, buildingIndex,
      isOn: true, cycleTimer: Math.random() * NEON_CYCLE_MS, // offset so they don't all sync
    });
  }

  private placeClothesline(
    building: BuildingData,
    buildingIndex: number,
    allBuildings: readonly BuildingData[],
  ): void {
    // Need a next building to span to
    const nextIdx = buildingIndex + 1;
    if (nextIdx >= allBuildings.length) return;

    // Clothesline data is stored for rope drawing; actual ride is handled by scene
    // Place a small invisible platform at the start point
    const startX = building.x + building.width;
    const ropeY = Math.max(building.rooftopY, allBuildings[nextIdx].rooftopY) - 10;

    const sprite = this.clotheslineGroup.create(
      startX + 10, ropeY, 'clothesline-plat',
    ) as Phaser.Physics.Arcade.Sprite;
    sprite.setDepth(DEPTH.HAZARDS);
    sprite.refreshBody();

    this.hazards.push({
      type: 'CLOTHESLINE', sprite, buildingIndex,
      destinationX: allBuildings[nextIdx].x,
    });
  }

  // ── Updates ───────────────────────────────────────────────────

  private updateNeonSigns(delta: number): void {
    for (const h of this.hazards) {
      if (h.type !== 'NEON_SIGN') continue;

      h.cycleTimer! += delta;
      if (h.cycleTimer! >= NEON_CYCLE_MS) {
        h.cycleTimer! -= NEON_CYCLE_MS;
        h.isOn = !h.isOn;

        const sprite = h.sprite as Phaser.Physics.Arcade.Sprite;
        sprite.setTexture(h.isOn ? 'neon-on' : 'neon-off');
        sprite.setAlpha(h.isOn ? 1 : 0.3);
      }
    }
  }

  private updateSteam(delta: number): void {
    for (const h of this.hazards) {
      if (h.type !== 'AC_UNIT' || !h.steamDirection) continue;
      // Steam puff visual is handled by the scene checking getSteamPush()
      // Timer is used for 2s cycle: 0.5s on, 1.5s off
      h.steamTimer! += delta;
      if (h.steamTimer! > 2000) h.steamTimer! -= 2000;
    }
  }

  /** Returns true if steam is currently active (first 500ms of 2s cycle) */
  isSteamActive(hazard: ActiveHazard): boolean {
    return (hazard.steamTimer ?? 0) < 500;
  }

  private drawClotheslines(): void {
    this.ropeGraphics.clear();
    const cam = this.scene.cameras.main;
    const viewLeft = cam.scrollX - 100;
    const viewRight = cam.scrollX + this.scene.scale.width + 100;

    for (const h of this.hazards) {
      if (h.type !== 'CLOTHESLINE') continue;
      const sprite = h.sprite as Phaser.Physics.Arcade.Sprite;
      if (sprite.x < viewLeft || sprite.x > viewRight) continue;

      const startX = sprite.x;
      const endX = h.destinationX!;
      const y = sprite.y;

      // Rope line with slight sag
      this.ropeGraphics.lineStyle(2, 0xaaaaaa);
      this.ropeGraphics.beginPath();
      this.ropeGraphics.moveTo(startX, y);
      const midX = (startX + endX) / 2;
      this.ropeGraphics.lineTo(midX, y + 8); // sag
      this.ropeGraphics.lineTo(endX, y);
      this.ropeGraphics.strokePath();

      // Clothes hanging (decorative)
      const clothColors = [0xcc6666, 0x6666cc, 0x66cc66, 0xcccc66];
      for (let cx = startX + 20; cx < endX - 20; cx += 30) {
        const color = clothColors[Math.floor(cx) % clothColors.length];
        this.ropeGraphics.fillStyle(color, 0.6);
        this.ropeGraphics.fillRect(cx, y + 2, 8, 12);
      }
    }
  }

  private cleanupOffscreen(): void {
    const camLeft = this.scene.cameras.main.scrollX - 300;
    this.hazards = this.hazards.filter(h => {
      const sprite = h.sprite as Phaser.Physics.Arcade.Sprite;
      if (sprite.x + 50 < camLeft) {
        sprite.destroy();
        return false;
      }
      return true;
    });
  }
}
