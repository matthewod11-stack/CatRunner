import Phaser from 'phaser';
import type { PlatformerLevelConfig } from '../../types';
import { getZoneIndex } from './generation';
import type { SceneManager } from './types';
import { DEPTH } from './types';
import { ROOFTOPS_BACKGROUND_TEXTURES } from './rooftopsAssets';

const FAR_SKYLINE_HEIGHT = 360;
const MID_SKYLINE_HEIGHT = 440;

interface SkylineBuilding {
  x: number;
  width: number;
  height: number;
}

export class CityBackground implements SceneManager {
  private scene: Phaser.Scene;
  private config: PlatformerLevelConfig;

  private skyGraphics!: Phaser.GameObjects.Graphics;
  private farGraphics!: Phaser.GameObjects.Graphics;
  private midGraphics!: Phaser.GameObjects.Graphics;
  private skyImage: Phaser.GameObjects.Image | null = null;
  private farTile: Phaser.GameObjects.TileSprite | null = null;
  private midTile: Phaser.GameObjects.TileSprite | null = null;

  private farBuildings: SkylineBuilding[] = [];
  private midBuildings: SkylineBuilding[] = [];
  private farGeneratedUpToX = 0;
  private midGeneratedUpToX = 0;

  constructor(scene: Phaser.Scene, config: PlatformerLevelConfig) {
    this.scene = scene;
    this.config = config;
  }

  create(): void {
    const { width, height } = this.scene.scale;

    if (this.hasPixelBackgroundAssets()) {
      this.skyImage = this.scene.add.image(width / 2, height / 2, ROOFTOPS_BACKGROUND_TEXTURES.sky)
        .setScrollFactor(0)
        .setDisplaySize(width, height)
        .setDepth(DEPTH.BG_FAR);
      this.farTile = this.scene.add.tileSprite(
        width / 2,
        height - FAR_SKYLINE_HEIGHT / 2,
        width,
        FAR_SKYLINE_HEIGHT,
        ROOFTOPS_BACKGROUND_TEXTURES.farSkyline,
      )
        .setScrollFactor(0)
        .setDepth(DEPTH.BG_FAR + 0.1);
      this.midTile = this.scene.add.tileSprite(
        width / 2,
        height - MID_SKYLINE_HEIGHT / 2,
        width,
        MID_SKYLINE_HEIGHT,
        ROOFTOPS_BACKGROUND_TEXTURES.midSkyline,
      )
        .setScrollFactor(0)
        .setDepth(DEPTH.BG_MID);
      return;
    }

    // Sky gradient (fixed to camera)
    this.skyGraphics = this.scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(DEPTH.BG_FAR);
    this.drawSkyGradient(width, height, this.config.theme.skyGradient);

    // Far skyline (slow parallax)
    this.farGraphics = this.scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(DEPTH.BG_FAR + 0.1);

    // Mid skyline (medium parallax)
    this.midGraphics = this.scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(DEPTH.BG_MID);

    // Generate initial background
    const initWidth = width + 800;
    this.generateFarUpTo(initWidth);
    this.generateMidUpTo(initWidth);
  }

  update(_time: number, _delta: number): void {
    if (this.farTile && this.midTile) {
      const cam = this.scene.cameras.main;
      this.farTile.tilePositionX = cam.scrollX * 0.1;
      this.midTile.tilePositionX = cam.scrollX * 0.3;
      return;
    }

    const cam = this.scene.cameras.main;
    const screenW = this.scene.scale.width;

    // Generate more background buildings as camera moves
    this.generateFarUpTo(cam.scrollX * 0.1 + screenW + 400);
    this.generateMidUpTo(cam.scrollX * 0.3 + screenW + 400);

    // Update sky gradient based on zone (shifts warmer in zone 3)
    const distance = cam.scrollX;
    const zoneIdx = getZoneIndex(this.config.zones, distance);
    if (zoneIdx >= 2 && this.config.theme.skyGradientZone3) {
      this.drawSkyGradient(screenW, this.scene.scale.height, this.config.theme.skyGradientZone3);
    }

    this.drawFarSkyline(cam.scrollX);
    this.drawMidSkyline(cam.scrollX);
  }

  destroy(): void {
    this.skyImage?.destroy();
    this.farTile?.destroy();
    this.midTile?.destroy();
    this.skyGraphics?.destroy();
    this.farGraphics?.destroy();
    this.midGraphics?.destroy();
  }

  private hasPixelBackgroundAssets(): boolean {
    return this.scene.textures.exists(ROOFTOPS_BACKGROUND_TEXTURES.sky) &&
      this.scene.textures.exists(ROOFTOPS_BACKGROUND_TEXTURES.farSkyline) &&
      this.scene.textures.exists(ROOFTOPS_BACKGROUND_TEXTURES.midSkyline);
  }

  private drawSkyGradient(w: number, h: number, gradient: [string, string]): void {
    this.skyGraphics.clear();
    const top = Phaser.Display.Color.HexStringToColor(gradient[0]);
    const bot = Phaser.Display.Color.HexStringToColor(gradient[1]);

    for (let y = 0; y < h; y++) {
      const t = y / h;
      const r = Phaser.Math.Linear(top.red, bot.red, t);
      const g = Phaser.Math.Linear(top.green, bot.green, t);
      const b = Phaser.Math.Linear(top.blue, bot.blue, t);
      this.skyGraphics.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
      this.skyGraphics.fillRect(0, y, w, 1);
    }
  }

  private generateFarUpTo(targetX: number): void {
    while (this.farGeneratedUpToX < targetX) {
      const w = Phaser.Math.Between(30, 80);
      const h = Phaser.Math.Between(80, 250);
      this.farBuildings.push({ x: this.farGeneratedUpToX, width: w, height: h });
      this.farGeneratedUpToX += w + Phaser.Math.Between(5, 30);
    }
  }

  private generateMidUpTo(targetX: number): void {
    while (this.midGeneratedUpToX < targetX) {
      const w = Phaser.Math.Between(40, 120);
      const h = Phaser.Math.Between(120, 380);
      this.midBuildings.push({ x: this.midGeneratedUpToX, width: w, height: h });
      this.midGeneratedUpToX += w + Phaser.Math.Between(8, 40);
    }
  }

  private drawFarSkyline(cameraScrollX: number): void {
    this.farGraphics.clear();
    const parallax = cameraScrollX * 0.1;
    const screenW = this.scene.scale.width;
    const baseY = this.scene.scale.height;
    const color = Phaser.Display.Color.HexStringToColor(this.config.theme.farSkylineColor).color;

    this.farGraphics.fillStyle(color, 0.4);
    for (const b of this.farBuildings) {
      const sx = b.x - parallax;
      if (sx + b.width < -50 || sx > screenW + 50) continue;
      this.farGraphics.fillRect(sx, baseY - b.height, b.width, b.height);
    }
  }

  private drawMidSkyline(cameraScrollX: number): void {
    this.midGraphics.clear();
    const parallax = cameraScrollX * 0.3;
    const screenW = this.scene.scale.width;
    const baseY = this.scene.scale.height;
    const color = Phaser.Display.Color.HexStringToColor(this.config.theme.midSkylineColor).color;

    this.midGraphics.fillStyle(color, 0.6);
    for (const b of this.midBuildings) {
      const sx = b.x - parallax;
      if (sx + b.width < -100 || sx > screenW + 100) continue;
      this.midGraphics.fillRect(sx, baseY - b.height, b.width, b.height);

      // Window dots on mid buildings
      this.midGraphics.fillStyle(0xffcc44, 0.1);
      for (let wy = baseY - b.height + 15; wy < baseY - 15; wy += 22) {
        for (let wx = b.x + 8; wx < b.x + b.width - 8; wx += 16) {
          if (((wx * 3 + wy * 7) % 10) < 4) continue;
          this.midGraphics.fillRect(wx - parallax, wy, 5, 7);
        }
      }
      this.midGraphics.fillStyle(color, 0.6);
    }
  }
}
