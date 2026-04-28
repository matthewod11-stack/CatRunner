import Phaser from 'phaser';
import type { PlatformerLevelConfig } from '../../types';
import { getZoneIndex, resolveZoneParams } from './generation';
import type { BuildingData, FireEscapeData, SceneManager } from './types';
import { DEPTH } from './types';
import {
  ROOFTOPS_BACKGROUND_TEXTURES,
  ROOFTOPS_COLLECTIBLE_TEXTURES,
  ROOFTOPS_ENTITY_TEXTURES,
} from './rooftopsAssets';

const ROOFTOP_HEIGHT = 8;
const PLATFORM_BUFFER = 600;
const CLEANUP_BUFFER = 400;
const FIRE_ESCAPE_WIDTH = 28;
const FIRE_ESCAPE_HEIGHT = 6;

export class BuildingGenerator implements SceneManager {
  private scene: Phaser.Scene;
  private config: PlatformerLevelConfig;

  /** Static group for rooftop collision surfaces */
  private rooftops!: Phaser.Physics.Arcade.StaticGroup;
  /** Static group for fire escape / scaffolding platforms */
  private secondaryPlatforms!: Phaser.Physics.Arcade.StaticGroup;
  /** Graphics layer for building facades */
  private facadeGraphics!: Phaser.GameObjects.Graphics;

  /** All generated buildings, for lookup by other managers */
  private buildings: BuildingData[] = [];
  private fireEscapes: FireEscapeData[] = [];

  /** Coin collectibles on rooftops */
  private coins!: Phaser.Physics.Arcade.StaticGroup;

  private generatedUpToX = 0;
  private lastRooftopY = 0;
  private startX = 200;

  constructor(scene: Phaser.Scene, config: PlatformerLevelConfig) {
    this.scene = scene;
    this.config = config;
  }

  create(): void {
    this.rooftops = this.scene.physics.add.staticGroup();
    this.secondaryPlatforms = this.scene.physics.add.staticGroup();
    this.coins = this.scene.physics.add.staticGroup();
    this.facadeGraphics = this.scene.add.graphics().setDepth(DEPTH.BUILDINGS);

    this.lastRooftopY = this.config.generation.startY;

    if (this.config.openingRoute) {
      this.createOpeningRoute();
    } else {
      // Starting building — wide and safe
      this.createBuilding(100, 300, this.config.generation.startY, 0);
      this.generatedUpToX = 400;
    }
  }

  update(_time: number, _delta: number): void {
    const cam = this.scene.cameras.main;
    const targetX = cam.scrollX + this.scene.scale.width + PLATFORM_BUFFER;
    this.generateUpTo(targetX);
    this.cleanupBehind(cam.scrollX - CLEANUP_BUFFER);
    this.drawFacades();
  }

  destroy(): void {
    this.rooftops.destroy(true);
    this.secondaryPlatforms.destroy(true);
    this.coins.destroy(true);
    this.facadeGraphics.destroy();
    this.buildings = [];
    this.fireEscapes = [];
  }

  /** Get the rooftop collision group — used by scene for player collider */
  getRooftops(): Phaser.Physics.Arcade.StaticGroup {
    return this.rooftops;
  }

  /** Get secondary platform collision group */
  getSecondaryPlatforms(): Phaser.Physics.Arcade.StaticGroup {
    return this.secondaryPlatforms;
  }

  /** Get building data array — used by enemy/hazard managers for placement */
  getBuildings(): readonly BuildingData[] {
    return this.buildings;
  }

  getFireEscapes(): readonly FireEscapeData[] {
    return this.fireEscapes;
  }

  getCoinGroup(): Phaser.Physics.Arcade.StaticGroup {
    return this.coins;
  }

  /** Find the building the player is standing on (or nearest behind) */
  findNearestBuildingBehind(playerX: number): BuildingData | null {
    let best: BuildingData | null = null;
    for (const b of this.buildings) {
      if (b.x <= playerX + 50) best = b;
    }
    return best;
  }

  // ── Generation ────────────────────────────────────────────────

  private generateUpTo(targetX: number): void {
    while (this.generatedUpToX < targetX) {
      const distance = this.generatedUpToX - this.startX;
      const zoneIdx = getZoneIndex(this.config.zones, distance);
      const zone = this.config.zones[zoneIdx];
      const params = resolveZoneParams(this.config.generation, zone);

      // Gap (alley width)
      const [gapMin, gapMax] = params.gapRange;
      const scaledGapMin = gapMin + distance * params.gapScaling;
      const scaledGapMax = gapMax + distance * params.gapScaling;
      const gap = Phaser.Math.Between(scaledGapMin, Math.max(scaledGapMin, scaledGapMax));

      // Building width
      const [wMin, wMax] = params.platformWidthRange;
      const width = Phaser.Math.Between(wMin, wMax);

      // Height step
      const [hMin, hMax] = params.heightStepRange;
      const heightStep = Phaser.Math.Between(hMin, hMax);
      let newY = this.lastRooftopY - heightStep;
      newY = Phaser.Math.Clamp(newY, 100, params.deathY - 150);

      const newX = this.generatedUpToX + gap;
      this.createBuilding(newX, width, newY, zoneIdx);

      // Maybe spawn coins on rooftop
      if (Math.random() < zone.coinDensity) {
        this.createCoin(newX + width / 2, newY - 40);
      }

      // Maybe add fire escape
      if (Math.random() < zone.fireEscapeChance) {
        this.createFireEscape(newX, width, newY, this.buildings.length - 1);
      }

      this.generatedUpToX = newX + width;
      this.lastRooftopY = newY;
    }
  }

  private createBuilding(x: number, width: number, rooftopY: number, zoneIndex: number): void {
    // Rooftop collision surface
    const key = `roof-${width}`;
    const hasPixelRoof = this.scene.textures.exists(ROOFTOPS_BACKGROUND_TEXTURES.rooftopCap);
    const textureKey = hasPixelRoof ? ROOFTOPS_BACKGROUND_TEXTURES.rooftopCap : key;
    if (!hasPixelRoof && !this.scene.textures.exists(key)) {
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(Phaser.Display.Color.HexStringToColor(this.config.theme.platformColor).color);
      g.fillRect(0, 0, width, ROOFTOP_HEIGHT);
      g.fillStyle(Phaser.Display.Color.HexStringToColor(this.config.theme.platformEdgeColor).color);
      g.fillRect(0, 0, width, 3);
      g.generateTexture(key, width, ROOFTOP_HEIGHT);
      g.destroy();
    }

    const roof = this.rooftops.create(
      x + width / 2,
      rooftopY + ROOFTOP_HEIGHT / 2,
      textureKey,
    ) as Phaser.Physics.Arcade.Sprite;
    roof.setDepth(DEPTH.PLATFORMS);
    if (hasPixelRoof) roof.setDisplaySize(width, 12);
    roof.refreshBody();

    const height = this.config.generation.deathY - rooftopY + 200;
    this.buildings.push({ x, width, height, rooftopY, zoneIndex });
  }

  private createFireEscape(
    buildingX: number,
    buildingWidth: number,
    rooftopY: number,
    buildingIndex: number,
  ): void {
    const side = Math.random() < 0.5 ? 'left' : 'right';
    const feX = side === 'left'
      ? buildingX - FIRE_ESCAPE_WIDTH
      : buildingX + buildingWidth;
    const feY = rooftopY + Phaser.Math.Between(30, 80);

    const key = 'fire-escape';
    const hasPixelFireEscape = this.scene.textures.exists(ROOFTOPS_ENTITY_TEXTURES.fireEscape);
    const textureKey = hasPixelFireEscape ? ROOFTOPS_ENTITY_TEXTURES.fireEscape : key;
    if (!hasPixelFireEscape && !this.scene.textures.exists(key)) {
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(0x5a4a3a);
      g.fillRect(0, 0, FIRE_ESCAPE_WIDTH, FIRE_ESCAPE_HEIGHT);
      g.fillStyle(0x7a6a5a);
      g.fillRect(0, 0, FIRE_ESCAPE_WIDTH, 2);
      g.generateTexture(key, FIRE_ESCAPE_WIDTH, FIRE_ESCAPE_HEIGHT);
      g.destroy();
    }

    const plat = this.secondaryPlatforms.create(
      feX + FIRE_ESCAPE_WIDTH / 2,
      feY + FIRE_ESCAPE_HEIGHT / 2,
      textureKey,
    ) as Phaser.Physics.Arcade.Sprite;
    plat.setDepth(DEPTH.PLATFORMS);
    if (hasPixelFireEscape) plat.setDisplaySize(FIRE_ESCAPE_WIDTH * 1.8, FIRE_ESCAPE_HEIGHT * 3);
    plat.refreshBody();

    this.fireEscapes.push({ x: feX, y: feY, width: FIRE_ESCAPE_WIDTH, buildingIndex, side });
  }

  private createCoin(x: number, y: number): void {
    const COIN_SIZE = 20;
    const textureKey = this.scene.textures.exists(ROOFTOPS_COLLECTIBLE_TEXTURES.coin)
      ? ROOFTOPS_COLLECTIBLE_TEXTURES.coin
      : 'coin';
    if (textureKey === 'coin' && !this.scene.textures.exists('coin')) {
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(0xffdd44);
      g.fillCircle(COIN_SIZE / 2, COIN_SIZE / 2, COIN_SIZE / 2);
      g.lineStyle(2, 0xffaa00);
      g.strokeCircle(COIN_SIZE / 2, COIN_SIZE / 2, COIN_SIZE / 2 - 1);
      g.generateTexture('coin', COIN_SIZE, COIN_SIZE);
      g.destroy();
    }

    const coin = this.coins.create(x, y, textureKey) as Phaser.Physics.Arcade.Sprite;
    coin.setDepth(DEPTH.COINS);
    if (textureKey !== 'coin') coin.setDisplaySize(COIN_SIZE, COIN_SIZE);
    coin.refreshBody();
    this.scene.tweens.add({
      targets: coin,
      y: y - 8,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createOpeningRoute(): void {
    const route = this.config.openingRoute!;
    for (let i = 0; i < route.platforms.length; i++) {
      const platform = route.platforms[i];
      this.createBuilding(platform.x, platform.width, platform.rooftopY, 0);
      this.lastRooftopY = platform.rooftopY;
    }

    for (const coin of route.coins ?? []) {
      this.createCoin(coin.x, coin.y);
    }

    this.generatedUpToX = Math.max(
      route.handoffX,
      ...route.platforms.map(platform => platform.x + platform.width),
    );
  }

  // ── Rendering ─────────────────────────────────────────────────

  private drawFacades(): void {
    this.facadeGraphics.clear();

    const cam = this.scene.cameras.main;
    const viewLeft = cam.scrollX - 100;
    const viewRight = cam.scrollX + this.scene.scale.width + 100;
    const colors = this.config.theme.buildingColors;

    for (let i = 0; i < this.buildings.length; i++) {
      const b = this.buildings[i];
      if (b.x + b.width < viewLeft || b.x > viewRight) continue;

      // Building facade
      const colorHex = colors[i % colors.length];
      const color = Phaser.Display.Color.HexStringToColor(colorHex).color;
      this.facadeGraphics.fillStyle(color);
      this.facadeGraphics.fillRect(b.x, b.rooftopY + ROOFTOP_HEIGHT, b.width, b.height);

      if (this.scene.textures.exists(ROOFTOPS_BACKGROUND_TEXTURES.buildingFacadeTile)) {
        this.drawPixelFacadePattern(b);
      }

      // Windows
      this.facadeGraphics.fillStyle(0xffcc44, 0.15 + Math.random() * 0.2);
      const windowStartY = b.rooftopY + ROOFTOP_HEIGHT + 18;
      for (let wy = windowStartY; wy < b.rooftopY + b.height - 20; wy += 28) {
        for (let wx = b.x + 12; wx < b.x + b.width - 12; wx += 20) {
          // Skip some windows randomly for variety
          if (((wx * 7 + wy * 13) % 10) < 4) continue;
          this.facadeGraphics.fillRect(wx, wy, 8, 10);
        }
      }

      // Decorative props on rooftop (deterministic from building index)
      this.drawRooftopProps(b, i);
    }

    // Fire escape vertical rails
    for (const fe of this.fireEscapes) {
      if (fe.x + fe.width < viewLeft || fe.x > viewRight) continue;
      this.facadeGraphics.fillStyle(0x5a4a3a);
      const railX = fe.side === 'left' ? fe.x : fe.x + fe.width - 2;
      this.facadeGraphics.fillRect(railX, fe.y, 2, 40);
    }
  }

  private drawPixelFacadePattern(b: BuildingData): void {
    this.facadeGraphics.fillStyle(0x1a1a2e, 0.28);
    for (let y = b.rooftopY + ROOFTOP_HEIGHT + 10; y < b.rooftopY + b.height - 16; y += 32) {
      this.facadeGraphics.fillRect(b.x + 4, y, b.width - 8, 2);
    }
  }

  private drawRooftopProps(b: BuildingData, index: number): void {
    // Use building index as seed for deterministic prop placement
    const seed = index * 17;

    if (seed % 4 === 0 && b.width > 100) {
      // Water tank
      this.facadeGraphics.fillStyle(0x333344);
      const tankX = b.x + 10 + (seed % 3) * 15;
      this.facadeGraphics.fillRect(tankX, b.rooftopY - 14, 16, 14);
      this.facadeGraphics.fillRect(tankX - 2, b.rooftopY - 16, 20, 3);
    }

    if (seed % 3 === 0) {
      // Antenna
      this.facadeGraphics.fillStyle(0x555566);
      const antX = b.x + b.width - 18;
      this.facadeGraphics.fillRect(antX, b.rooftopY - 22, 2, 22);
      this.facadeGraphics.fillRect(antX - 4, b.rooftopY - 20, 10, 2);
    }

    if (seed % 5 === 1 && b.width > 80) {
      // Vent
      this.facadeGraphics.fillStyle(0x2a2a3e);
      this.facadeGraphics.fillRect(b.x + b.width / 2 - 8, b.rooftopY - 8, 16, 8);
    }
  }

  // ── Cleanup ───────────────────────────────────────────────────

  private cleanupBehind(cutoffX: number): void {
    // Remove buildings far behind camera
    while (this.buildings.length > 0 && this.buildings[0].x + this.buildings[0].width < cutoffX) {
      this.buildings.shift();
    }

    // Remove fire escapes far behind
    this.fireEscapes = this.fireEscapes.filter(fe => fe.x + fe.width >= cutoffX);

    // Clean up Phaser bodies far behind
    for (const child of this.rooftops.getChildren()) {
      const sprite = child as Phaser.Physics.Arcade.Sprite;
      if (sprite.x + sprite.width / 2 < cutoffX) sprite.destroy();
    }
    for (const child of this.secondaryPlatforms.getChildren()) {
      const sprite = child as Phaser.Physics.Arcade.Sprite;
      if (sprite.x + sprite.width / 2 < cutoffX) sprite.destroy();
    }
  }
}
