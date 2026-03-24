import Phaser from 'phaser';
import { SceneBridge } from './shared/SceneBridge';
import type { ClimberSceneInitData } from './shared/bridgeProtocol';
import type { ClimberLevelConfig, GameScore, GameStatus } from '../types';
import { loadCatSprite, CAT_TEXTURE_KEY } from './shared/SpriteLoader';
import { EffectsManager } from './shared/EffectsManager';

const DEPTH = { BG: 0, PLATFORMS: 10, PLAYER: 20, EFFECTS: 30, HUD: 50 };
const PLAYER_W = 40;
const PLAYER_H = 48;
const PLAT_H = 12;

interface Platform {
  sprite: Phaser.GameObjects.Rectangle;
  type: 'solid' | 'spring' | 'breakable';
  worldY: number;
  broken: boolean;
}

export default class ClimberScene extends SceneBridge {
  private config!: ClimberLevelConfig;
  private lives = 3;
  private gameScore: GameScore = { current: 0, high: 0, coins: 0, multiplier: 1, streak: 0, lives: 3 };
  private isGameOver = false;
  private hasWon = false;

  // Player
  private player!: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;
  private playerVy = 0;
  private playerWorldY = 0;

  // Platforms
  private platforms: Platform[] = [];
  private generatedUpToY = 0; // world Y (negative = higher)
  private highestY = 0;

  // Camera
  private cameraWorldY = 0;
  private scrollSpeed: number = 30;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  private effects!: EffectsManager;
  private heightText!: Phaser.GameObjects.Text;

  // Background stars (since it's a cat tree going to the sky)
  private bgGraphics!: Phaser.GameObjects.Graphics;

  init(data: ClimberSceneInitData): void {
    super.init(data);
    this.config = data.levelConfig;
    this.lives = data.initialLives ?? this.config.startLives;
  }

  preload(): void {
    loadCatSprite(this, this.catSpriteUrl);
    EffectsManager.createParticleTexture(this);
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(this.config.bgColor);
    this.scrollSpeed = this.config.scrollSpeed;

    // Background
    this.bgGraphics = this.add.graphics().setDepth(DEPTH.BG);

    // Player
    const hasCat = this.textures.exists(CAT_TEXTURE_KEY);
    if (hasCat) {
      this.player = this.add.sprite(width / 2, height - 100, CAT_TEXTURE_KEY)
        .setDisplaySize(PLAYER_W, PLAYER_H).setDepth(DEPTH.PLAYER);
    } else {
      this.player = this.add.rectangle(width / 2, height - 100, PLAYER_W, PLAYER_H, 0xff8844)
        .setDepth(DEPTH.PLAYER);
    }

    this.playerWorldY = 0;
    this.playerVy = -this.config.bounceForce; // initial upward bounce
    this.cameraWorldY = 0;
    this.highestY = 0;

    // Generate initial platforms
    this.generateStartPlatform();
    this.generatePlatformsUpTo(-height * 2);

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.input.keyboard!.on('keydown-P', this.togglePause, this);
    this.input.keyboard!.on('keydown-ESC', this.togglePause, this);

    // Effects
    this.effects = new EffectsManager(this);

    // HUD
    this.heightText = this.add.text(16, 16, '', {
      fontSize: '18px', fontFamily: '"Courier New", monospace', color: '#aaaaff',
    }).setDepth(DEPTH.HUD);

    this.gameScore.lives = this.lives;
    this.emitScoreUpdate({ ...this.gameScore });
    this.emitStatusChange('PLAYING' as GameStatus);
  }

  update(_time: number, delta: number): void {
    if (this.isGameOver || this.hasWon) return;

    const dt = delta / 1000;
    const { width, height } = this.scale;

    // Gravity
    this.playerVy += 900 * dt; // gravity
    this.playerWorldY += this.playerVy * dt;

    // Auto-scroll camera upward
    this.scrollSpeed = Math.min(
      this.config.maxScrollSpeed,
      this.config.scrollSpeed + Math.abs(this.highestY) * this.config.scrollAcceleration
    );
    this.cameraWorldY -= this.scrollSpeed * dt;

    // Camera follows player if they're higher
    if (this.playerWorldY < this.cameraWorldY + height * 0.4) {
      this.cameraWorldY = this.playerWorldY - height * 0.4;
    }

    // Horizontal movement
    const speed = this.config.moveSpeed;
    if (this.cursors.left.isDown) {
      this.player.x -= speed * dt;
    } else if (this.cursors.right.isDown) {
      this.player.x += speed * dt;
    }

    // Wrap around screen edges
    if (this.player.x < -PLAYER_W / 2) this.player.x = width + PLAYER_W / 2;
    if (this.player.x > width + PLAYER_W / 2) this.player.x = -PLAYER_W / 2;

    // Update player screen position
    this.player.y = this.worldToScreen(this.playerWorldY);

    // Check platform collisions (only when falling)
    if (this.playerVy > 0) {
      this.checkPlatformCollisions();
    }

    // Generate more platforms above
    this.generatePlatformsUpTo(this.cameraWorldY - height);

    // Update platform screen positions + cleanup
    this.updatePlatforms();

    // Track highest point
    if (this.playerWorldY < this.highestY) {
      const gain = this.highestY - this.playerWorldY;
      this.gameScore.current += Math.floor(gain * 0.1);
      this.highestY = this.playerWorldY;
      this.emitScoreUpdate({ ...this.gameScore });
    }

    // Death: fell below camera
    if (this.player.y > height + 50) {
      this.handleDeath();
    }

    // Victory
    if (Math.abs(this.highestY) >= this.config.victoryHeight) {
      this.hasWon = true;
      this.effects.spawnParticles(width / 2, height / 2, 0xffcc44, 30, 300);
      this.emitLevelComplete({
        levelId: 'CAT_TREE',
        finalScore: this.gameScore.current,
        gameScore: { ...this.gameScore },
        victoryType: 'goal',
      });
    }

    // Background gradient (changes with height)
    this.drawBackground(width, height);

    // HUD
    const pct = Math.min(100, (Math.abs(this.highestY) / this.config.victoryHeight) * 100);
    this.heightText.setText(`${Math.floor(pct)}% to the top`);
  }

  // ─── Coordinate conversion ────────────────────────────────────

  private worldToScreen(worldY: number): number {
    return worldY - this.cameraWorldY;
  }

  // ─── Platforms ────────────────────────────────────────────────

  private generateStartPlatform(): void {
    this.createPlatform(this.scale.width / 2, 0, 200, 'solid');
    this.generatedUpToY = 0;
  }

  private generatePlatformsUpTo(targetWorldY: number): void {
    const { widthRange, gapYRange, springChance, breakableChance } = this.config.platformConfig;

    while (this.generatedUpToY > targetWorldY) {
      const gap = Phaser.Math.Between(gapYRange[0], gapYRange[1]);
      const w = Phaser.Math.Between(widthRange[0], widthRange[1]);
      const x = Phaser.Math.Between(w / 2 + 20, this.scale.width - w / 2 - 20);

      this.generatedUpToY -= gap;

      let type: Platform['type'] = 'solid';
      const roll = Math.random();
      if (roll < breakableChance) type = 'breakable';
      else if (roll < breakableChance + springChance) type = 'spring';

      this.createPlatform(x, this.generatedUpToY, w, type);
    }
  }

  private createPlatform(x: number, worldY: number, w: number, type: Platform['type']): void {
    const color = type === 'spring' ? 0x44cc44 : type === 'breakable' ? 0xcc8844 : 0x886644;
    const screenY = this.worldToScreen(worldY);
    const sprite = this.add.rectangle(x, screenY, w, PLAT_H, color).setDepth(DEPTH.PLATFORMS);

    // Visual marker for spring platforms
    if (type === 'spring') {
      sprite.setStrokeStyle(2, 0x22aa22);
    } else if (type === 'breakable') {
      sprite.setStrokeStyle(1, 0xaa6622, 0.5);
    }

    this.platforms.push({ sprite, type, worldY, broken: false });
  }

  private updatePlatforms(): void {
    const screenH = this.scale.height;

    for (let i = this.platforms.length - 1; i >= 0; i--) {
      const p = this.platforms[i];
      p.sprite.y = this.worldToScreen(p.worldY);

      // Cleanup below camera
      if (p.sprite.y > screenH + 50) {
        p.sprite.destroy();
        this.platforms.splice(i, 1);
      }
    }
  }

  private checkPlatformCollisions(): void {
    const playerBottom = this.playerWorldY + PLAYER_H / 2;
    const playerX = this.player.x;

    for (const p of this.platforms) {
      if (p.broken) continue;

      const platTop = p.worldY - PLAT_H / 2;
      const platBottom = p.worldY + PLAT_H / 2;
      const halfW = (p.sprite as Phaser.GameObjects.Rectangle).width / 2;

      // Check if player feet are within platform vertically and horizontally
      if (playerBottom >= platTop && playerBottom <= platBottom + 10 &&
          Math.abs(playerX - p.sprite.x) < halfW + PLAYER_W * 0.3) {

        if (p.type === 'breakable') {
          p.broken = true;
          this.tweens.add({
            targets: p.sprite, alpha: 0, y: p.sprite.y + 30,
            duration: 300, onComplete: () => p.sprite.destroy(),
          });
          // Still bounce
        }

        // Bounce!
        const force = p.type === 'spring' ? this.config.bounceForce * 1.5 : this.config.bounceForce;
        this.playerVy = -force;
        this.playerWorldY = platTop - PLAYER_H / 2;

        if (p.type === 'spring') {
          this.effects.spawnParticles(playerX, this.worldToScreen(p.worldY), 0x44cc44, 6, 100);
        }

        break;
      }
    }
  }

  // ─── Background ───────────────────────────────────────────────

  private drawBackground(w: number, h: number): void {
    this.bgGraphics.clear();

    // Sky gradient shifts from dark to lighter as you climb
    const progress = Math.min(1, Math.abs(this.highestY) / this.config.victoryHeight);
    const topR = Phaser.Math.Linear(26, 100, progress);
    const topG = Phaser.Math.Linear(26, 120, progress);
    const topB = Phaser.Math.Linear(46, 200, progress);

    this.bgGraphics.fillStyle(Phaser.Display.Color.GetColor(topR, topG, topB));
    this.bgGraphics.fillRect(0, 0, w, h);

    // Stars (more visible as you climb higher)
    if (progress > 0.3) {
      this.bgGraphics.fillStyle(0xffffff, (progress - 0.3) * 0.5);
      for (let i = 0; i < 30; i++) {
        // Deterministic positions based on index
        const sx = ((i * 137 + 50) % w);
        const sy = ((i * 97 + 30) % h);
        this.bgGraphics.fillCircle(sx, sy, 1 + (i % 3) * 0.5);
      }
    }
  }

  // ─── Death ────────────────────────────────────────────────────

  private handleDeath(): void {
    this.lives--;
    this.gameScore.lives = this.lives;
    this.gameScore.streak = 0;
    this.gameScore.multiplier = 1;

    this.effects.flash(0xff0000, 200);
    this.effects.shake(0.015, 150);

    this.emitLivesChanged(this.lives);
    this.emitScoreUpdate({ ...this.gameScore });

    if (this.lives <= 0) {
      this.isGameOver = true;
      this.emitGameOver(this.gameScore.current);
      return;
    }

    // Respawn — reset to a nearby platform
    this.playerWorldY = this.cameraWorldY + this.scale.height * 0.5;
    this.playerVy = -this.config.bounceForce;
    this.player.x = this.scale.width / 2;
  }

  // ─── Pause ────────────────────────────────────────────────────

  private togglePause(): void {
    if (this.isGameOver || this.hasWon) return;
    const paused = !this.scene.isPaused();
    if (paused) this.scene.pause(); else this.scene.resume();
    this.emitHudUpdate({ isPaused: paused });
  }

  applyRuntimePatch(patch: Record<string, unknown>): void {
    if (typeof patch.isPaused === 'boolean') {
      if (patch.isPaused && !this.scene.isPaused()) this.scene.pause();
      else if (!patch.isPaused && this.scene.isPaused()) this.scene.resume();
    }
  }
}
