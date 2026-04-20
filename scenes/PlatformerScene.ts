import Phaser from 'phaser';
import { SceneBridge } from './shared/SceneBridge';
import type { PlatformerSceneInitData } from './shared/bridgeProtocol';
import type { PlatformerLevelConfig, GameScore, GameStatus } from '../types';
import { loadCatSprite, CAT_TEXTURE_KEY } from './shared/SpriteLoader';
import { EffectsManager } from './shared/EffectsManager';
import { PhaserAudio } from './shared/PhaserAudio';
import { BuildingGenerator } from './platformer/BuildingGenerator';
import { CityBackground } from './platformer/CityBackground';
import { EnemyManager } from './platformer/EnemyManager';
import { HazardManager } from './platformer/HazardManager';
import { PowerupManager } from './platformer/PowerupManager';
import { PigeonKingBoss } from './platformer/PigeonKingBoss';
import { DEPTH } from './platformer/types';

// ─── Constants ──────────────────────────────────────────────────────

const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 48;
const BOUNCE_MULTIPLIER = 1.8;

// ─── Scene ──────────────────────────────────────────────────────────

export default class PlatformerScene extends SceneBridge {
  private config!: PlatformerLevelConfig;

  // Player
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private jumpCount = 0;
  private facingRight = true;
  private isOnGround = false;
  private maxJumps = 2;

  // Game state
  private lives = 3;
  private gameScore: GameScore = {
    current: 0, high: 0, coins: 0,
    multiplier: 1, streak: 0, lives: 3,
  };
  private distanceTraveled = 0;
  private startX = 200;
  private isGameOver = false;
  private hasWon = false;
  private inBossArena = false;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private jumpHeld = false;

  // Managers
  private audio!: PhaserAudio;
  private effects!: EffectsManager;
  private buildingGen!: BuildingGenerator;
  private background!: CityBackground;
  private enemies!: EnemyManager;
  private hazards!: HazardManager;
  private powerups!: PowerupManager;
  private boss!: PigeonKingBoss;

  // HUD
  private distanceText!: Phaser.GameObjects.Text;

  // ─── Lifecycle ──────────────────────────────────────────────────

  init(data: PlatformerSceneInitData): void {
    super.init(data);
    this.config = data.levelConfig;
    this.lives = data.initialLives ?? this.config.startLives;
  }

  preload(): void {
    loadCatSprite(this, this.catSpriteUrl);
    EffectsManager.createParticleTexture(this);
  }

  create(): void {
    // Physics world — very wide, tall enough for death zone
    this.physics.world.setBounds(
      0, 0,
      this.config.victoryDistance + 2000,
      this.config.generation.deathY + 200,
    );

    // Effects manager (shared by several managers)
    this.effects = new EffectsManager(this);

    // Audio — procedural SFX + music
    this.audio = new PhaserAudio(this);

    // ── Instantiate managers ────────────────────────────────────

    this.background = new CityBackground(this, this.config);
    this.background.create();

    this.buildingGen = new BuildingGenerator(this, this.config);
    this.buildingGen.create();

    this.enemies = new EnemyManager(
      this, this.config, this.effects,
      () => this.buildingGen.getBuildings(),
    );
    this.enemies.create();

    this.hazards = new HazardManager(
      this, this.config,
      () => this.buildingGen.getBuildings(),
    );
    this.hazards.create();

    this.powerups = new PowerupManager(
      this, this.config, this.effects,
      () => this.buildingGen.getBuildings(),
      () => this.buildingGen.getFireEscapes(),
    );
    this.powerups.create();

    this.boss = new PigeonKingBoss(this, this.config, this.effects);
    this.boss.create(); // deferred — arena set up on boss entry

    // ── Player ──────────────────────────────────────────────────

    this.createPlayer();

    // ── Colliders (player vs solid surfaces) ────────────────────

    this.physics.add.collider(
      this.player, this.buildingGen.getRooftops(), () => this.onLand(),
    );
    this.physics.add.collider(
      this.player, this.buildingGen.getSecondaryPlatforms(), () => this.onLand(),
    );
    this.physics.add.collider(this.player, this.hazards.getStaticGroup());
    this.physics.add.collider(
      this.player, this.hazards.getClotheslineGroup(), () => this.onLand(),
    );

    // ── Overlaps (player vs interactive objects) ────────────────

    this.physics.add.overlap(
      this.player, this.enemies.getGroup(),
      (_p, enemy) => this.handleEnemyOverlap(enemy as Phaser.Physics.Arcade.Sprite),
    );
    this.physics.add.overlap(
      this.player, this.hazards.getBounceGroup(),
      (_p, dish) => this.handleBounce(dish as Phaser.Physics.Arcade.Sprite),
    );
    this.physics.add.overlap(
      this.player, this.hazards.getDamageGroup(),
      (_p, hazard) => this.handleNeonDamage(hazard as Phaser.GameObjects.GameObject),
    );
    this.physics.add.overlap(
      this.player, this.powerups.getGroup(),
      (_p, powerup) => {
        this.audio.playSfx('powerup');
        this.powerups.collectPowerup(powerup as Phaser.Physics.Arcade.Sprite);
      },
    );
    this.physics.add.overlap(
      this.player, this.buildingGen.getCoinGroup(),
      (_p, coin) => this.collectCoin(coin as Phaser.Physics.Arcade.Sprite),
    );

    // ── Camera ──────────────────────────────────────────────────

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(
      0, 0,
      this.config.victoryDistance + 2000,
      this.config.generation.deathY + 200,
    );

    // ── Input ───────────────────────────────────────────────────

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // ── HUD ─────────────────────────────────────────────────────

    this.distanceText = this.add.text(16, 16, '', {
      fontSize: '18px',
      fontFamily: '"Courier New", monospace',
      color: '#aaaacc',
    }).setScrollFactor(0).setDepth(DEPTH.HUD);

    // ── Initial state ───────────────────────────────────────────

    this.gameScore.lives = this.lives;
    this.emitScoreUpdate({ ...this.gameScore });
    this.emitStatusChange('PLAYING' as GameStatus);

    // ── Pause keybindings ───────────────────────────────────────

    this.input.keyboard!.on('keydown-P', this.togglePause, this);
    this.input.keyboard!.on('keydown-ESC', this.togglePause, this);
  }

  update(time: number, delta: number): void {
    if (this.isGameOver || this.hasWon) return;
    if (this.scene.isPaused()) return;

    this.handleInput();
    this.updateDistance();

    // Update all managers
    this.background.update(time, delta);
    this.buildingGen.update(time, delta);
    this.enemies.update(time, delta);
    this.hazards.update(time, delta);
    this.powerups.update(time, delta);

    // Boss phase
    if (this.inBossArena) {
      this.boss.update(time, delta);
      if (this.boss.isDefeated() && !this.hasWon) {
        this.handleVictory();
      }
    }

    this.checkFallDeath();
    this.checkBossEntry();
    this.updateHud();
  }

  // ─── Player Creation ──────────────────────────────────────────

  private createPlayer(): void {
    const hasCatTexture = this.textures.exists(CAT_TEXTURE_KEY);
    if (hasCatTexture) {
      this.player = this.physics.add.sprite(
        this.startX, this.config.generation.startY - 60, CAT_TEXTURE_KEY,
      );
      // Scale the cat sprite to fit PLAYER_WIDTH x PLAYER_HEIGHT
      const tex = this.textures.get(CAT_TEXTURE_KEY).getSourceImage();
      const scaleX = PLAYER_WIDTH / tex.width;
      const scaleY = PLAYER_HEIGHT / tex.height;
      this.player.setScale(scaleX, scaleY);
    } else {
      // Fallback: colored rectangle
      const g = this.make.graphics({}, false);
      g.fillStyle(0xff8844);
      g.fillRoundedRect(0, 0, PLAYER_WIDTH, PLAYER_HEIGHT, 6);
      g.generateTexture('cat-fallback', PLAYER_WIDTH, PLAYER_HEIGHT);
      g.destroy();
      this.player = this.physics.add.sprite(
        this.startX, this.config.generation.startY - 60, 'cat-fallback',
      );
    }

    this.player.setDepth(DEPTH.PLAYER);
    this.player.setCollideWorldBounds(false); // we handle death via Y check
    this.player.body.setSize(PLAYER_WIDTH - 8, PLAYER_HEIGHT - 4);
    this.player.body.setGravityY(this.config.playerConfig.gravity);
  }

  // ─── Input ────────────────────────────────────────────────────

  private handleInput(): void {
    const speed = this.config.playerConfig.moveSpeed;
    const body = this.player.body;

    // Ground detection
    this.isOnGround = body.blocked.down || body.touching.down;
    if (this.isOnGround) this.jumpCount = 0;

    // Dynamic max jumps (powerup)
    this.maxJumps = this.powerups.hasTripleJump()
      ? 3
      : this.config.playerConfig.maxJumps;

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
    const jumpJustPressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.spaceKey);
    this.jumpHeld = this.cursors.up.isDown || this.spaceKey.isDown;

    if (jumpJustPressed && this.jumpCount < this.maxJumps) {
      body.setVelocityY(-this.config.playerConfig.jumpForce);
      this.jumpCount++;
      this.audio.playSfx('jump');
      if (this.jumpCount === 1 && this.isOnGround) {
        this.effects.spawnDust(this.player.x, this.player.y + PLAYER_HEIGHT / 2, 1);
      }
    }

    // Glide (reduce gravity while holding jump + falling + has glide powerup)
    if (this.powerups.hasGlide() && this.jumpHeld && body.velocity.y > 0) {
      body.setGravityY(
        this.config.playerConfig.gravity * this.config.powerups.glideGravityMultiplier,
      );
    } else {
      body.setGravityY(this.config.playerConfig.gravity);
    }

    // Squash/stretch for jump feel
    if (!this.isOnGround) {
      const vy = body.velocity.y;
      if (vy < -100) this.player.setScale(0.85, 1.15);
      else if (vy > 100) this.player.setScale(1.1, 0.9);
    } else {
      this.player.setScale(1, 1);
    }
  }

  // ─── Collision Handlers ───────────────────────────────────────

  private onLand(): void {
    if (this.player.body.velocity.y >= 0) this.jumpCount = 0;
  }

  private handleEnemyOverlap(enemySprite: Phaser.Physics.Arcade.Sprite): void {
    const result = this.enemies.handleOverlap(
      this.player, enemySprite, this.gameScore.multiplier,
    );
    if (result.stomped) {
      // Bounce up after stomp — reward for stomping
      this.player.body.setVelocityY(-this.config.playerConfig.jumpForce * 0.6);
      this.jumpCount = 0;
      this.audio.playSfx('hit');
      this.gameScore.current += result.points;
      this.gameScore.streak += 1;
      if (this.gameScore.streak % 5 === 0) {
        this.gameScore.multiplier = Math.min(this.gameScore.multiplier + 1, 5);
      }
      this.emitScoreUpdate({ ...this.gameScore });
    } else {
      this.handleDamage();
    }
  }

  private handleBounce(_dish: Phaser.Physics.Arcade.Sprite): void {
    this.player.body.setVelocityY(
      -this.config.playerConfig.jumpForce * BOUNCE_MULTIPLIER,
    );
    this.jumpCount = 0;
    this.audio.playSfx('boing');
    this.effects.shake(0.008, 80);
  }

  private handleNeonDamage(hazard: Phaser.GameObjects.GameObject): void {
    if (this.hazards.isNeonDangerous(hazard)) {
      this.handleDamage();
    }
  }

  private handleDamage(): void {
    // Shield absorbs one hit
    if (this.powerups.consumeShield()) {
      this.effects.flash(0x44ff88, 150);
      this.effects.spawnParticles(this.player.x, this.player.y, 0x44ff88, 8, 150);
      return;
    }

    this.lives -= 1;
    this.gameScore.lives = this.lives;
    this.gameScore.streak = 0;
    this.gameScore.multiplier = 1;

    this.audio.playSfx('hit');
    this.effects.flash(0xff0000, 200);
    this.effects.shake(0.015, 150);
    this.emitLivesChanged(this.lives);
    this.emitScoreUpdate({ ...this.gameScore });

    if (this.lives <= 0) {
      this.isGameOver = true;
      this.emitGameOver(this.gameScore.current);
      return;
    }

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

  private collectCoin(coinSprite: Phaser.Physics.Arcade.Sprite): void {
    const cx = coinSprite.x;
    const cy = coinSprite.y;
    coinSprite.destroy();

    this.audio.playSfx('coin');
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
      const delta = newDist - this.distanceTraveled;
      this.gameScore.current += Math.floor(delta * 0.1);
      this.distanceTraveled = newDist;
    }
  }

  private checkBossEntry(): void {
    if (this.inBossArena) return;
    if (this.distanceTraveled >= this.config.victoryDistance - 1000) {
      this.inBossArena = true;
      this.audio.playSfx('boss_alert');
      this.audio.setBossMode(true);

      // Set up boss arena at the end of the level
      const arenaX = this.startX + this.config.victoryDistance - 500;
      const arenaY = this.lastKnownRooftopY();
      this.boss.createArena(arenaX, arenaY);

      // Wire up boss collisions (deferred until arena exists)
      this.physics.add.overlap(this.player, this.boss.getBossSprite(), () => {
        if (this.boss.handleStomp()) {
          this.audio.playSfx('boss_hit');
          this.player.body.setVelocityY(-this.config.playerConfig.jumpForce * 0.7);
          this.jumpCount = 0;
          this.gameScore.current += 100;
          this.emitScoreUpdate({ ...this.gameScore });
        }
      });
      this.physics.add.overlap(
        this.player, this.boss.getFeatherGroup(),
        (_p, feather) => {
          (feather as Phaser.Physics.Arcade.Sprite).destroy();
          this.handleDamage();
        },
      );
      this.physics.add.overlap(
        this.player, this.boss.getMiniPigeonGroup(),
        () => this.handleDamage(),
      );
    }
  }

  private lastKnownRooftopY(): number {
    const buildings = this.buildingGen.getBuildings();
    if (buildings.length === 0) return this.config.generation.startY;
    return buildings[buildings.length - 1].rooftopY;
  }

  private handleVictory(): void {
    this.hasWon = true;
    this.audio.playSfx('mult');
    this.effects.spawnParticles(this.player.x, this.player.y, 0xffdd44, 20, 300);
    this.emitLevelComplete({
      finalScore: this.gameScore.current,
      gameScore: { ...this.gameScore },
      victoryType: 'goal',
    });
  }

  // ─── Death ────────────────────────────────────────────────────

  private checkFallDeath(): void {
    if (this.inBossArena) return; // No fall death in boss arena
    if (this.player.y > this.config.generation.deathY) {
      this.handleFallDeath();
    }
  }

  private handleFallDeath(): void {
    this.lives -= 1;
    this.gameScore.lives = this.lives;
    this.gameScore.streak = 0;
    this.gameScore.multiplier = 1;

    this.audio.playSfx('meow');
    this.effects.flash(0xff0000, 200);
    this.effects.shake(0.015, 150);
    this.emitLivesChanged(this.lives);
    this.emitScoreUpdate({ ...this.gameScore });

    if (this.lives <= 0) {
      this.isGameOver = true;
      this.emitGameOver(this.gameScore.current);
      return;
    }

    this.respawnPlayer();
  }

  private respawnPlayer(): void {
    const building = this.buildingGen.findNearestBuildingBehind(this.player.x);
    const respawnX = building ? building.x + building.width / 2 : this.startX;
    const respawnY = building
      ? building.rooftopY - PLAYER_HEIGHT - 10
      : this.config.generation.startY - 60;

    this.player.setPosition(respawnX, respawnY);
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

  // ─── HUD ──────────────────────────────────────────────────────

  private updateHud(): void {
    if (this.inBossArena) {
      this.distanceText.setText(`BOSS -- HP: ${this.boss.getHP()}/3`);
    } else {
      const pct = Math.min(100, (this.distanceTraveled / this.config.victoryDistance) * 100);
      this.distanceText.setText(`${Math.floor(pct)}% to penthouse`);
    }
  }

  // ─── Pause ────────────────────────────────────────────────────

  private togglePause(): void {
    if (this.isGameOver || this.hasWon) return;
    const paused = !this.scene.isPaused();
    if (paused) this.scene.pause();
    else this.scene.resume();
    this.emitHudUpdate({ isPaused: paused });
  }

  // ─── Runtime Patch ────────────────────────────────────────────

  applyRuntimePatch(patch: Record<string, unknown>): void {
    if (typeof patch.isPaused === 'boolean') {
      if (patch.isPaused && !this.scene.isPaused()) this.scene.pause();
      else if (!patch.isPaused && this.scene.isPaused()) this.scene.resume();
    }
  }
}
