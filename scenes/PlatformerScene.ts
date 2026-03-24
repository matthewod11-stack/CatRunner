import Phaser from 'phaser';
import { SceneBridge } from './shared/SceneBridge';
import type { PlatformerSceneInitData } from './shared/bridgeProtocol';
import type { PlatformerLevelConfig, GameScore, GameStatus, PlatformGenerationConfig } from '../types';
import { loadCatSprite, CAT_TEXTURE_KEY } from './shared/SpriteLoader';
import { EffectsManager } from './shared/EffectsManager';

// ─── Constants ──────────────────────────────────────────────────────

const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 48;
const COIN_SIZE = 20;
const COIN_SPAWN_CHANCE = 0.6; // chance to spawn a coin above each platform
const PLATFORM_HEIGHT = 16;
const PLATFORM_BUFFER = 600; // generate this far ahead of camera
const CLEANUP_BUFFER = 400;  // remove platforms this far behind camera

// Depth layers
const DEPTH = {
  BG_FAR: 0,
  BG_MID: 1,
  PLATFORMS: 10,
  COINS: 15,
  PLAYER: 20,
  EFFECTS: 30,
  HUD: 50,
};

// ─── Scene ──────────────────────────────────────────────────────────

export default class PlatformerScene extends SceneBridge {
  // Config
  private config!: PlatformerLevelConfig;
  private gen!: PlatformGenerationConfig;

  // Player
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private jumpCount = 0;
  private facingRight = true;
  private isOnGround = false;

  // Platforms
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private generatedUpToX = 0;
  private lastPlatformY = 0;
  private platformBodies: { body: Phaser.Physics.Arcade.StaticBody; rightEdge: number }[] = [];

  // Coins
  private coins!: Phaser.Physics.Arcade.StaticGroup;

  // Game state
  private lives = 3;
  private gameScore: GameScore = {
    current: 0, high: 0, coins: 0,
    multiplier: 1, streak: 0, lives: 3,
  };
  private distanceTraveled = 0;
  private startX = 0;
  private isGameOver = false;
  private hasWon = false;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;

  // Managers
  private effects!: EffectsManager;

  // Background
  private bgGraphics!: Phaser.GameObjects.Graphics;
  private buildings: { x: number; y: number; w: number; h: number; color: string }[] = [];
  private buildingsGeneratedUpToX = 0;

  // HUD (in-scene distance marker)
  private distanceText!: Phaser.GameObjects.Text;
  private penthouseMarker: Phaser.GameObjects.Container | null = null;

  // ─── Lifecycle ──────────────────────────────────────────────────

  init(data: PlatformerSceneInitData): void {
    super.init(data);
    this.config = data.levelConfig;
    this.gen = this.config.generation;
    this.lives = data.initialLives ?? this.config.startLives;
  }

  preload(): void {
    loadCatSprite(this, this.catSpriteUrl);
    EffectsManager.createParticleTexture(this);
  }

  create(): void {
    const { width, height } = this.scale;

    // Sky gradient background (fixed to camera)
    this.bgGraphics = this.add.graphics().setScrollFactor(0).setDepth(DEPTH.BG_FAR);
    this.drawSkyGradient(width, height);

    // Physics world bounds — very wide, tall enough for death zone
    this.physics.world.setBounds(0, 0, this.config.victoryDistance + 2000, this.gen.deathY + 200);

    // Platform group
    this.platforms = this.physics.add.staticGroup();

    // Coin group
    this.coins = this.physics.add.staticGroup();

    // Create player
    const hasCatTexture = this.textures.exists(CAT_TEXTURE_KEY);
    if (hasCatTexture) {
      this.player = this.physics.add.sprite(200, this.gen.startY - 60, CAT_TEXTURE_KEY);
      this.player.setDisplaySize(PLAYER_WIDTH, PLAYER_HEIGHT);
    } else {
      // Fallback: colored rectangle
      const g = this.make.graphics({}, false);
      g.fillStyle(0xff8844);
      g.fillRoundedRect(0, 0, PLAYER_WIDTH, PLAYER_HEIGHT, 6);
      g.generateTexture('cat-fallback', PLAYER_WIDTH, PLAYER_HEIGHT);
      g.destroy();
      this.player = this.physics.add.sprite(200, this.gen.startY - 60, 'cat-fallback');
    }

    this.player.setDepth(DEPTH.PLAYER);
    this.player.setCollideWorldBounds(false); // we handle death via Y check
    this.player.body.setSize(PLAYER_WIDTH - 8, PLAYER_HEIGHT - 4); // slightly smaller hitbox
    this.player.body.setGravityY(this.config.playerConfig.gravity);

    this.startX = this.player.x;

    // Camera
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, this.config.victoryDistance + 2000, this.gen.deathY + 200);

    // Collisions
    this.physics.add.collider(this.player, this.platforms, () => this.onPlatformLand());
    this.physics.add.overlap(this.player, this.coins, (_player, coinObj) => {
      this.onCoinCollect(coinObj as Phaser.Physics.Arcade.Sprite);
    });

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Generate initial platforms (starting area + buffer)
    this.lastPlatformY = this.gen.startY;
    this.generateStartingPlatform();
    this.generatePlatformsUpTo(this.player.x + PLATFORM_BUFFER);

    // Generate initial background buildings
    this.generateBuildingsUpTo(this.player.x + width + PLATFORM_BUFFER);

    // HUD — distance text (fixed to camera)
    this.distanceText = this.add.text(16, 16, '', {
      fontSize: '18px',
      fontFamily: '"Courier New", monospace',
      color: '#aaaacc',
    }).setScrollFactor(0).setDepth(DEPTH.HUD);

    // Effects manager
    this.effects = new EffectsManager(this);

    // Initial score emit
    this.gameScore.lives = this.lives;
    this.emitScoreUpdate({ ...this.gameScore });
    this.emitStatusChange('PLAYING' as GameStatus);

    // Pause handling
    this.input.keyboard!.on('keydown-P', this.togglePause, this);
    this.input.keyboard!.on('keydown-ESC', this.togglePause, this);
  }

  update(_time: number, _delta: number): void {
    if (this.isGameOver || this.hasWon) return;

    // Check pause state
    if (this.scene.isPaused()) return;

    this.handleInput();
    this.updateDistance();
    this.generatePlatformsUpTo(this.cameras.main.scrollX + this.scale.width + PLATFORM_BUFFER);
    this.generateBuildingsUpTo(this.cameras.main.scrollX + this.scale.width + PLATFORM_BUFFER);
    this.cleanupBehindCamera();
    this.drawBuildings();
    this.checkFallDeath();
    this.checkVictory();
    this.updateHud();
  }

  // ─── Input ────────────────────────────────────────────────────

  private handleInput(): void {
    const speed = this.config.playerConfig.moveSpeed;
    const body = this.player.body;

    // Ground detection
    this.isOnGround = body.blocked.down || body.touching.down;
    if (this.isOnGround) {
      this.jumpCount = 0;
    }

    // Horizontal movement
    if (this.cursors.left.isDown) {
      body.setVelocityX(-speed);
      if (this.facingRight) {
        this.player.setFlipX(true);
        this.facingRight = false;
      }
    } else if (this.cursors.right.isDown) {
      body.setVelocityX(speed);
      if (!this.facingRight) {
        this.player.setFlipX(false);
        this.facingRight = true;
      }
    } else {
      body.setVelocityX(0);
    }

    // Jump (UP arrow or SPACE)
    const jumpJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                            Phaser.Input.Keyboard.JustDown(this.spaceKey);

    if (jumpJustPressed && this.jumpCount < this.config.playerConfig.maxJumps) {
      body.setVelocityY(-this.config.playerConfig.jumpForce);
      this.jumpCount++;

      // Dust on ground jump
      if (this.jumpCount === 1 && this.isOnGround) {
        this.effects.spawnDust(this.player.x, this.player.y + PLAYER_HEIGHT / 2, 1);
      }
    }

    // Simple squash/stretch for jump feel
    if (!this.isOnGround) {
      const vy = body.velocity.y;
      if (vy < -100) {
        this.player.setScale(0.85, 1.15); // stretch up
      } else if (vy > 100) {
        this.player.setScale(1.1, 0.9); // squash down
      }
    } else {
      this.player.setScale(1, 1);
    }
  }

  // ─── Platform Generation ──────────────────────────────────────

  private generateStartingPlatform(): void {
    // Wide safe starting platform
    const startWidth = 300;
    this.createPlatform(100, this.gen.startY, startWidth);
    this.generatedUpToX = 100 + startWidth;
    this.lastPlatformY = this.gen.startY;
  }

  private generatePlatformsUpTo(targetX: number): void {
    while (this.generatedUpToX < targetX) {
      const distance = this.generatedUpToX - this.startX;

      // Gap widens with distance
      const [gapMin, gapMax] = this.gen.gapRange;
      const scaledGapMin = gapMin + distance * this.gen.gapScaling;
      const scaledGapMax = gapMax + distance * this.gen.gapScaling;
      const gap = Phaser.Math.Between(scaledGapMin, Math.max(scaledGapMin, scaledGapMax));

      // Platform width narrows slightly with distance (min 80px)
      const [wMin, wMax] = this.gen.platformWidthRange;
      const shrink = Math.min(distance * 0.005, wMin * 0.4);
      const width = Phaser.Math.Between(Math.max(80, wMin - shrink), Math.max(80, wMax - shrink));

      // Height step — mostly up, sometimes down
      const [hMin, hMax] = this.gen.heightStepRange;
      const heightStep = Phaser.Math.Between(hMin, hMax);
      let newY = this.lastPlatformY - heightStep; // subtract because Phaser Y is down

      // Clamp to reasonable range
      newY = Phaser.Math.Clamp(newY, 100, this.gen.deathY - 150);

      const newX = this.generatedUpToX + gap;
      this.createPlatform(newX, newY, width);

      // Maybe spawn a coin above the platform
      if (Math.random() < COIN_SPAWN_CHANCE) {
        this.createCoin(newX + width / 2, newY - 50);
      }

      this.generatedUpToX = newX + width;
      this.lastPlatformY = newY;
    }
  }

  private createPlatform(x: number, y: number, width: number): void {
    // Draw platform texture
    const key = `plat-${width}`;
    if (!this.textures.exists(key)) {
      const g = this.make.graphics({}, false);
      // Main surface
      g.fillStyle(Phaser.Display.Color.HexStringToColor(this.config.theme.platformColor).color);
      g.fillRect(0, 0, width, PLATFORM_HEIGHT);
      // Top edge highlight
      g.fillStyle(Phaser.Display.Color.HexStringToColor(this.config.theme.platformEdgeColor).color);
      g.fillRect(0, 0, width, 3);
      g.generateTexture(key, width, PLATFORM_HEIGHT);
      g.destroy();
    }

    const plat = this.platforms.create(x + width / 2, y + PLATFORM_HEIGHT / 2, key) as Phaser.Physics.Arcade.Sprite;
    plat.setDepth(DEPTH.PLATFORMS);
    plat.refreshBody();

    this.platformBodies.push({
      body: plat.body as Phaser.Physics.Arcade.StaticBody,
      rightEdge: x + width,
    });
  }

  private createCoin(x: number, y: number): void {
    // Simple coin texture
    if (!this.textures.exists('coin')) {
      const g = this.make.graphics({}, false);
      g.fillStyle(0xffdd44);
      g.fillCircle(COIN_SIZE / 2, COIN_SIZE / 2, COIN_SIZE / 2);
      g.lineStyle(2, 0xffaa00);
      g.strokeCircle(COIN_SIZE / 2, COIN_SIZE / 2, COIN_SIZE / 2 - 1);
      g.generateTexture('coin', COIN_SIZE, COIN_SIZE);
      g.destroy();
    }

    const coin = this.coins.create(x, y, 'coin') as Phaser.Physics.Arcade.Sprite;
    coin.setDepth(DEPTH.COINS);
    coin.refreshBody();
    // Gentle bob animation
    this.tweens.add({
      targets: coin,
      y: y - 8,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // ─── Collisions ───────────────────────────────────────────────

  private onPlatformLand(): void {
    // Landing effect
    if (this.player.body.velocity.y >= 0) {
      this.jumpCount = 0;
    }
  }

  private onCoinCollect(coinObj: Phaser.Physics.Arcade.Sprite): void {
    const coin = coinObj;
    const cx = coin.x;
    const cy = coin.y;

    coin.destroy();

    this.gameScore.coins += 1;
    this.gameScore.streak += 1;
    if (this.gameScore.streak % 5 === 0) {
      this.gameScore.multiplier = Math.min(this.gameScore.multiplier + 1, 5);
    }
    this.gameScore.current += 10 * this.gameScore.multiplier;

    this.effects.floatingScore(cx, cy, `+${10 * this.gameScore.multiplier}`);
    this.effects.spawnParticles(cx, cy, 0xffdd44, 6, 120);
    this.emitScoreUpdate({ ...this.gameScore });
  }

  // ─── Distance & Victory ───────────────────────────────────────

  private updateDistance(): void {
    const newDist = Math.max(0, this.player.x - this.startX);
    if (newDist > this.distanceTraveled) {
      // Score ticks up with distance
      const delta = newDist - this.distanceTraveled;
      this.gameScore.current += Math.floor(delta * 0.1);
      this.distanceTraveled = newDist;
    }
  }

  private checkVictory(): void {
    if (this.distanceTraveled >= this.config.victoryDistance) {
      this.hasWon = true;

      // Place a penthouse marker if not already done
      if (!this.penthouseMarker) {
        const mx = this.startX + this.config.victoryDistance;
        const my = this.lastPlatformY - 100;
        this.penthouseMarker = this.add.container(mx, my).setDepth(DEPTH.EFFECTS);
        const text = this.add.text(0, 0, 'PENTHOUSE!', {
          fontSize: '28px',
          fontFamily: 'system-ui, sans-serif',
          fontStyle: 'bold',
          color: '#ffdd44',
        }).setOrigin(0.5);
        this.penthouseMarker.add(text);
      }

      this.effects.spawnParticles(this.player.x, this.player.y, 0xffdd44, 20, 300);

      this.emitLevelComplete({
        levelId: 'ROOFTOPS',
        finalScore: this.gameScore.current,
        gameScore: { ...this.gameScore },
        victoryType: 'goal',
      });
    }
  }

  // ─── Death ────────────────────────────────────────────────────

  private checkFallDeath(): void {
    if (this.player.y > this.gen.deathY) {
      this.handleDeath();
    }
  }

  private handleDeath(): void {
    this.lives -= 1;
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

    // Respawn on the last known safe platform
    this.respawnPlayer();
  }

  private respawnPlayer(): void {
    // Find the platform closest to (and behind) the player's X
    let bestPlatX = this.startX + 150;
    let bestPlatY = this.gen.startY;

    for (const p of this.platformBodies) {
      const platX = p.body.center.x;
      if (platX <= this.player.x + 100) {
        bestPlatX = platX;
        bestPlatY = p.body.y - PLATFORM_HEIGHT;
      }
    }

    this.player.setPosition(bestPlatX, bestPlatY - PLAYER_HEIGHT);
    this.player.body.setVelocity(0, 0);
    this.jumpCount = 0;

    // Brief invincibility flash
    this.tweens.add({
      targets: this.player,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 5,
      onComplete: () => this.player.setAlpha(1),
    });
  }

  // ─── Background ───────────────────────────────────────────────

  private drawSkyGradient(w: number, h: number): void {
    const [top, bottom] = this.config.theme.skyGradient;
    const topColor = Phaser.Display.Color.HexStringToColor(top);
    const botColor = Phaser.Display.Color.HexStringToColor(bottom);

    // Simple vertical gradient via horizontal lines
    for (let y = 0; y < h; y++) {
      const t = y / h;
      const r = Phaser.Math.Linear(topColor.red, botColor.red, t);
      const g = Phaser.Math.Linear(topColor.green, botColor.green, t);
      const b = Phaser.Math.Linear(topColor.blue, botColor.blue, t);
      this.bgGraphics.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
      this.bgGraphics.fillRect(0, y, w, 1);
    }
  }

  private generateBuildingsUpTo(targetX: number): void {
    const colors = this.config.theme.buildingColors;
    while (this.buildingsGeneratedUpToX < targetX) {
      const w = Phaser.Math.Between(40, 120);
      const h = Phaser.Math.Between(150, 400);
      const x = this.buildingsGeneratedUpToX + Phaser.Math.Between(10, 50);
      const y = this.gen.deathY - h; // buildings rise from death zone
      const color = colors[Phaser.Math.Between(0, colors.length - 1)];
      this.buildings.push({ x, y, w, h, color });
      this.buildingsGeneratedUpToX = x + w;
    }
  }

  private drawBuildings(): void {
    // Only draw buildings visible on screen (parallax at 0.3x scroll)
    const cam = this.cameras.main;
    const scrollX = cam.scrollX * 0.3;
    const screenW = this.scale.width;

    // Reuse a single graphics object for background buildings
    // (we recreate each frame since it's a scrolling parallax layer)
    if (this.children.getByName('bg-buildings')) {
      (this.children.getByName('bg-buildings') as Phaser.GameObjects.Graphics).destroy();
    }

    const g = this.add.graphics().setName('bg-buildings').setScrollFactor(0).setDepth(DEPTH.BG_MID);

    for (const b of this.buildings) {
      const screenX = b.x - scrollX;
      if (screenX + b.w < -100 || screenX > screenW + 100) continue;

      g.fillStyle(Phaser.Display.Color.HexStringToColor(b.color).color, 0.6);
      g.fillRect(screenX, b.y - cam.scrollY * 0.3, b.w, b.h);

      // Window dots
      g.fillStyle(0xffffcc, 0.15);
      for (let wy = b.y + 15; wy < b.y + b.h - 15; wy += 25) {
        for (let wx = b.x + 10; wx < b.x + b.w - 10; wx += 18) {
          if (Math.random() > 0.4) {
            g.fillRect(wx - scrollX, wy - cam.scrollY * 0.3, 6, 8);
          }
        }
      }
    }
  }

  // ─── Cleanup ──────────────────────────────────────────────────

  private cleanupBehindCamera(): void {
    const camLeft = this.cameras.main.scrollX - CLEANUP_BUFFER;

    // Remove platforms far behind
    this.platformBodies = this.platformBodies.filter(p => {
      if (p.rightEdge < camLeft) {
        p.body.gameObject?.destroy();
        return false;
      }
      return true;
    });

    // Remove buildings far behind
    this.buildings = this.buildings.filter(b => (b.x + b.w) > camLeft * 0.3 - 200);
  }

  // ─── HUD ──────────────────────────────────────────────────────

  private updateHud(): void {
    const pct = Math.min(100, (this.distanceTraveled / this.config.victoryDistance) * 100);
    this.distanceText.setText(`${Math.floor(pct)}% to penthouse`);
  }

  // ─── Pause ────────────────────────────────────────────────────

  private togglePause(): void {
    if (this.isGameOver || this.hasWon) return;
    const paused = !this.scene.isPaused();
    if (paused) {
      this.scene.pause();
    } else {
      this.scene.resume();
    }
    this.emitHudUpdate({ isPaused: paused });
  }

  // ─── Runtime Patch ────────────────────────────────────────────

  applyRuntimePatch(patch: Record<string, unknown>): void {
    if (typeof patch.isPaused === 'boolean') {
      if (patch.isPaused && !this.scene.isPaused()) {
        this.scene.pause();
      } else if (!patch.isPaused && this.scene.isPaused()) {
        this.scene.resume();
      }
    }
  }
}
