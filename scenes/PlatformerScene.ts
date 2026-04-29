import Phaser from 'phaser';
import { SceneBridge } from './shared/SceneBridge';
import type { PlatformerSceneInitData } from './shared/bridgeProtocol';
import type { PlatformerLevelConfig, GameScore, GameStatus } from '../types';
import { EffectsManager } from './shared/EffectsManager';
import { PhaserAudio } from './shared/PhaserAudio';
import { BuildingGenerator } from './platformer/BuildingGenerator';
import { CityBackground } from './platformer/CityBackground';
import { EnemyManager } from './platformer/EnemyManager';
import { HazardManager } from './platformer/HazardManager';
import { PowerupManager } from './platformer/PowerupManager';
import { PigeonKingBoss } from './platformer/PigeonKingBoss';
import { DEPTH } from './platformer/types';
import {
  ROOFTOPS_HERO_ANIMATIONS,
  ROOFTOPS_HERO_ANIMATION_KEYS,
  ROOFTOPS_HERO_SHEET,
  resolveRooftopsHeroAnimation,
  type RooftopsHeroAnimationId,
} from './platformer/heroSheet';
import { ROOFTOPS_IMAGE_LOADS, ROOFTOPS_PIXELATED_TEXTURE_KEYS } from './platformer/rooftopsAssets';

// ─── Constants ──────────────────────────────────────────────────────

const PLAYER_WIDTH = 52;
const PLAYER_HEIGHT = 62;
const BOUNCE_MULTIPLIER = 1.8;
const DAMAGE_INVULNERABILITY_MS = 900;
const BOSS_PROJECTILE_SIZE = 28;
const BOSS_PROJECTILE_SPEED = 680;
const BOSS_THROW_COOLDOWN_MS = 420;
const BOSS_STOMP_TOP_TOLERANCE = 42;

type PlatformerInteractionType =
  | 'stomp'
  | 'side-hit'
  | 'neon-hit'
  | 'shield-absorb'
  | 'bounce'
  | 'coin'
  | 'powerup'
  | 'fall'
  | 'boss-stomp'
  | 'boss-projectile'
  | 'boss-hit'
  | 'feather-hit'
  | 'mini-pigeon-hit';

interface PlatformerInteractionSnapshot {
  type: PlatformerInteractionType;
  x: number;
  y: number;
  atMs: number;
  targetKey: string | null;
  detail?: string;
}

type PlatformerInteractionSource = {
  x?: number;
  y?: number;
  texture?: { key: string };
};

// ─── Scene ──────────────────────────────────────────────────────────

export default class PlatformerScene extends SceneBridge {
  private config!: PlatformerLevelConfig;

  // Player
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private jumpCount = 0;
  private facingRight = true;
  private isOnGround = false;
  private maxJumps = 2;
  private currentPlayerAnimationKey: string | null = null;
  private playerAnimationOverride: { id: RooftopsHeroAnimationId; until: number } | null = null;
  private renderTextHook: (() => string) | null = null;
  private advanceTimeHook: ((ms: number) => string) | null = null;
  private enterBossForQaHook: (() => string) | null = null;
  private dropOnBossForQaHook: (() => string) | null = null;

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
  private lastInteraction: PlatformerInteractionSnapshot | null = null;
  private recentInteractions: PlatformerInteractionSnapshot[] = [];
  private invulnerableUntilMs = 0;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private attackKey!: Phaser.Input.Keyboard.Key;
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
  private bossProjectiles!: Phaser.Physics.Arcade.Group;
  private bossThrowCooldownUntilMs = 0;

  // HUD
  private distanceText!: Phaser.GameObjects.Text;

  // ─── Lifecycle ──────────────────────────────────────────────────

  init(data: PlatformerSceneInitData): void {
    super.init(data);
    this.config = data.levelConfig;
    this.lives = data.initialLives ?? this.config.startLives;
  }

  preload(): void {
    // Custom still-image cats stay in identity surfaces until they can satisfy this sheet contract.
    this.load.spritesheet(ROOFTOPS_HERO_SHEET.key, ROOFTOPS_HERO_SHEET.path, {
      frameWidth: ROOFTOPS_HERO_SHEET.frameWidth,
      frameHeight: ROOFTOPS_HERO_SHEET.frameHeight,
      endFrame: ROOFTOPS_HERO_SHEET.frameMax - 1,
    });
    for (const asset of ROOFTOPS_IMAGE_LOADS) {
      this.load.image(asset.key, asset.path);
    }
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
    this.applyPixelTextureFilters();
    this.registerPlayerAnimations();

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
    this.bossProjectiles = this.physics.add.group({ allowGravity: false });
    this.createBossProjectileTexture();

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
        const powerupSprite = powerup as Phaser.Physics.Arcade.Sprite;
        const type = powerupSprite.getData('powerupType') as string | undefined;
        this.recordInteraction('powerup', powerupSprite, type);
        this.audio.playSfx('powerup');
        this.powerups.collectPowerup(powerupSprite);
        this.queuePlayerAnimation('powerUp', 360);
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
    this.attackKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.X);

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
    this.installWebGameTestHooks();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.uninstallWebGameTestHooks());

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
      this.updateBossProjectiles();
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
    const hasHeroSheet = this.textures.exists(ROOFTOPS_HERO_SHEET.key);
    if (hasHeroSheet) {
      this.player = this.physics.add.sprite(
        this.startX, this.config.generation.startY - 60, ROOFTOPS_HERO_SHEET.key, 0,
      );
      this.player
        .setOrigin(ROOFTOPS_HERO_SHEET.origin.x, ROOFTOPS_HERO_SHEET.origin.y)
        .setDisplaySize(ROOFTOPS_HERO_SHEET.renderSize.width, ROOFTOPS_HERO_SHEET.renderSize.height);
      this.playPlayerAnimation('idle');
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

    const attackJustPressed =
      Phaser.Input.Keyboard.JustDown(this.attackKey) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.down);
    if (attackJustPressed) this.throwBossProjectile();

    // Glide (reduce gravity while holding jump + falling + has glide powerup)
    const isGliding = this.powerups.hasGlide() && this.jumpHeld && body.velocity.y > 0;
    if (isGliding) {
      body.setGravityY(
        this.config.playerConfig.gravity * this.config.powerups.glideGravityMultiplier,
      );
    } else {
      body.setGravityY(this.config.playerConfig.gravity);
    }

    this.updatePlayerAnimation(isGliding);
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
      this.recordInteraction('stomp', enemySprite);
      this.player.body.setVelocityY(-this.config.playerConfig.jumpForce * 0.6);
      this.jumpCount = 0;
      this.queuePlayerAnimation('landStomp', 240);
      this.audio.playSfx('hit');
      this.gameScore.current += result.points;
      this.gameScore.streak += 1;
      if (this.gameScore.streak % 5 === 0) {
        this.gameScore.multiplier = Math.min(this.gameScore.multiplier + 1, 5);
      }
      this.emitScoreUpdate({ ...this.gameScore });
    } else {
      this.handleDamage('side-hit', enemySprite);
    }
  }

  private handleBounce(dish: Phaser.Physics.Arcade.Sprite): void {
    this.recordInteraction('bounce', dish);
    this.player.body.setVelocityY(
      -this.config.playerConfig.jumpForce * BOUNCE_MULTIPLIER,
    );
    this.jumpCount = 0;
    this.audio.playSfx('boing');
    this.effects.shake(0.008, 80);
  }

  private handleNeonDamage(hazard: Phaser.GameObjects.GameObject): void {
    if (this.hazards.isNeonDangerous(hazard)) {
      this.handleDamage('neon-hit', hazard as PlatformerInteractionSource);
    }
  }

  private handleDamage(type: PlatformerInteractionType = 'side-hit', source?: PlatformerInteractionSource): void {
    if (this.time.now < this.invulnerableUntilMs) return;

    // Shield absorbs one hit
    if (this.powerups.consumeShield()) {
      this.invulnerableUntilMs = this.time.now + DAMAGE_INVULNERABILITY_MS;
      this.recordInteraction('shield-absorb', source);
      this.queuePlayerAnimation('powerUp', 260);
      this.effects.flash(0x44ff88, 150);
      this.effects.spawnParticles(this.player.x, this.player.y, 0x44ff88, 8, 150);
      return;
    }

    this.recordInteraction(type, source);
    this.invulnerableUntilMs = this.time.now + DAMAGE_INVULNERABILITY_MS;
    this.lives -= 1;
    this.gameScore.lives = this.lives;
    this.gameScore.streak = 0;
    this.gameScore.multiplier = 1;

    this.audio.playSfx('hit');
    this.queuePlayerAnimation('hurt', 320);
    this.effects.flash(0xff0000, 200);
    this.effects.shake(0.015, 150);
    this.emitLivesChanged(this.lives);
    this.emitScoreUpdate({ ...this.gameScore });

    if (this.lives <= 0) {
      this.isGameOver = true;
      this.playPlayerAnimation('defeat', true);
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
    this.recordInteraction('coin', coinSprite);
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
    const routeBossArena = this.config.openingRoute?.bossArena;
    const shouldEnterBoss = routeBossArena
      ? this.player.x >= routeBossArena.triggerX
      : this.distanceTraveled >= this.config.victoryDistance - 1000;

    if (shouldEnterBoss) {
      this.inBossArena = true;
      this.audio.playSfx('boss_alert');
      this.audio.setBossMode(true);
      this.emitStatusChange('BOSS_FIGHT' as GameStatus);

      const arenaX = routeBossArena?.arenaX ?? this.startX + this.config.victoryDistance - 500;
      const arenaY = routeBossArena?.arenaY ?? this.lastKnownRooftopY();
      const arenaWidth = routeBossArena?.width ?? this.config.boss.arenaWidth;
      this.boss.createArena(arenaX, arenaY, arenaWidth);

      // Wire up boss collisions (deferred until arena exists)
      this.physics.add.overlap(this.player, this.boss.getBossSprite(), (_player, bossSprite) => {
        const boss = bossSprite as Phaser.Physics.Arcade.Sprite;
        const bossMode = this.boss.getMode();
        if (this.isBossStomp(boss)) {
          this.applyBossDamage('boss-stomp', boss, bossMode);
          this.separatePlayerAboveBoss(boss);
          this.invulnerableUntilMs = Math.max(this.invulnerableUntilMs, this.time.now + 520);
          this.player.body.setVelocityY(-this.config.playerConfig.jumpForce * 0.7);
          this.jumpCount = 0;
          this.queuePlayerAnimation('landStomp', 260);
          return;
        }
        if (!this.boss.isDefeated()) {
          this.handleDamage('boss-hit', boss);
        }
      });
      this.physics.add.overlap(
        this.player, this.boss.getFeatherGroup(),
        (_p, feather) => {
          const featherSprite = feather as Phaser.Physics.Arcade.Sprite;
          featherSprite.destroy();
          this.handleDamage('feather-hit', featherSprite);
        },
      );
      this.physics.add.overlap(
        this.player, this.boss.getMiniPigeonGroup(),
        (_p, miniPigeon) => this.handleDamage('mini-pigeon-hit', miniPigeon as PlatformerInteractionSource),
      );
    }
  }

  private isBossStomp(bossSprite: Phaser.Physics.Arcade.Sprite): boolean {
    if (this.boss.isDefeated()) return false;
    const playerBody = this.player.body;
    const bossBody = bossSprite.body as Phaser.Physics.Arcade.Body | null;
    const playerBottom = playerBody.y + playerBody.height;
    const bossTop = bossBody ? bossBody.y : bossSprite.y - bossSprite.displayHeight / 2;
    return playerBody.velocity.y > 40 && playerBottom <= bossTop + BOSS_STOMP_TOP_TOLERANCE;
  }

  private separatePlayerAboveBoss(bossSprite: Phaser.Physics.Arcade.Sprite): void {
    const playerBody = this.player.body;
    const bossBody = bossSprite.body as Phaser.Physics.Arcade.Body | null;
    const bossTop = bossBody ? bossBody.y : bossSprite.y - bossSprite.displayHeight / 2;
    const desiredBodyTop = bossTop - playerBody.height - 8;
    this.player.setY(this.player.y + desiredBodyTop - playerBody.y);
  }

  private applyBossDamage(
    type: 'boss-stomp' | 'boss-projectile',
    bossSprite: Phaser.Physics.Arcade.Sprite,
    detail: string,
  ): boolean {
    const damaged = type === 'boss-projectile'
      ? this.boss.handleProjectileHit()
      : this.boss.handleStomp();
    if (!damaged) return false;

    this.recordInteraction(type, bossSprite, detail);
    this.audio.playSfx('boss_hit');
    this.gameScore.current += 100;
    this.gameScore.streak += 1;
    this.emitScoreUpdate({ ...this.gameScore });
    return true;
  }

  private createBossProjectileTexture(): void {
    if (this.textures.exists('rooftops-boss-yarn-shot')) return;
    const g = this.make.graphics({}, false);
    g.fillStyle(0xffd86b);
    g.fillCircle(BOSS_PROJECTILE_SIZE / 2, BOSS_PROJECTILE_SIZE / 2, BOSS_PROJECTILE_SIZE / 2);
    g.fillStyle(0x7b4a2a);
    g.fillCircle(BOSS_PROJECTILE_SIZE / 2 + 3, BOSS_PROJECTILE_SIZE / 2 - 2, 3);
    g.generateTexture('rooftops-boss-yarn-shot', BOSS_PROJECTILE_SIZE, BOSS_PROJECTILE_SIZE);
    g.destroy();
  }

  private throwBossProjectile(): void {
    if (!this.inBossArena || this.boss.isDefeated()) return;
    if (this.time.now < this.bossThrowCooldownUntilMs) return;
    this.bossThrowCooldownUntilMs = this.time.now + BOSS_THROW_COOLDOWN_MS;

    const bossSprite = this.boss.getBossSprite();
    const direction = bossSprite.x >= this.player.x ? 1 : -1;
    const spawnX = this.player.x + direction * 28;
    const spawnY = this.player.y - PLAYER_HEIGHT * 0.55;
    const projectile = this.bossProjectiles.create(
      spawnX,
      spawnY,
      'rooftops-boss-yarn-shot',
    ) as Phaser.Physics.Arcade.Sprite;
    projectile.setDepth(DEPTH.EFFECTS);
    projectile.setDisplaySize(BOSS_PROJECTILE_SIZE, BOSS_PROJECTILE_SIZE);
    const body = projectile.body as Phaser.Physics.Arcade.Body;
    body.setSize(BOSS_PROJECTILE_SIZE, BOSS_PROJECTILE_SIZE);
    body.setAllowGravity(false);
    const angle = Phaser.Math.Angle.Between(spawnX, spawnY, bossSprite.x, bossSprite.y);
    body.setVelocity(Math.cos(angle) * BOSS_PROJECTILE_SPEED, Math.sin(angle) * BOSS_PROJECTILE_SPEED);
    projectile.setData('projectileType', 'yarn-shot');
    this.audio.playSfx('boing');
  }

  private updateBossProjectiles(): void {
    const bossSprite = this.boss.getBossSprite();
    const bossBounds = bossSprite.getBounds();
    const arena = this.boss.getSnapshot().arena;
    const left = arena.left - 220;
    const right = arena.right + 220;
    for (const child of [...this.bossProjectiles.getChildren()]) {
      const projectile = child as Phaser.Physics.Arcade.Sprite;
      if (projectile.active && Phaser.Geom.Rectangle.Overlaps(projectile.getBounds(), bossBounds)) {
        projectile.destroy();
        this.applyBossDamage('boss-projectile', bossSprite, 'thrown');
        continue;
      }
      if (!projectile.active || projectile.x < left || projectile.x > right) {
        projectile.destroy();
      }
    }
  }

  private lastKnownRooftopY(): number {
    const buildings = this.buildingGen.getBuildings();
    if (buildings.length === 0) return this.config.generation.startY;
    return buildings[buildings.length - 1].rooftopY;
  }

  private handleVictory(): void {
    this.hasWon = true;
    this.playPlayerAnimation('victory', true);
    this.audio.playSfx('mult');
    this.effects.spawnParticles(this.player.x, this.player.y, 0xffdd44, 20, 300);
    this.emitLevelComplete({
      finalScore: this.gameScore.current,
      gameScore: { ...this.gameScore },
      victoryType: this.config.victoryCondition.type,
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
    this.recordInteraction('fall');
    this.invulnerableUntilMs = this.time.now + DAMAGE_INVULNERABILITY_MS;
    this.lives -= 1;
    this.gameScore.lives = this.lives;
    this.gameScore.streak = 0;
    this.gameScore.multiplier = 1;

    this.audio.playSfx('meow');
    this.queuePlayerAnimation('hurt', 320);
    this.effects.flash(0xff0000, 200);
    this.effects.shake(0.015, 150);
    this.emitLivesChanged(this.lives);
    this.emitScoreUpdate({ ...this.gameScore });

    if (this.lives <= 0) {
      this.isGameOver = true;
      this.playPlayerAnimation('defeat', true);
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

  private applyPixelTextureFilters(): void {
    for (const key of [ROOFTOPS_HERO_SHEET.key, ...ROOFTOPS_PIXELATED_TEXTURE_KEYS]) {
      if (!this.textures.exists(key)) continue;
      this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
  }

  private registerPlayerAnimations(): void {
    for (const animation of ROOFTOPS_HERO_ANIMATIONS) {
      if (this.anims.exists(animation.key)) continue;
      this.anims.create({
        key: animation.key,
        frames: animation.frames.map(frame => ({ key: ROOFTOPS_HERO_SHEET.key, frame })),
        frameRate: animation.frameRate,
        repeat: animation.repeat,
      });
    }
  }

  private queuePlayerAnimation(id: RooftopsHeroAnimationId, durationMs: number): void {
    this.playerAnimationOverride = { id, until: Date.now() + durationMs };
    this.playPlayerAnimation(id, true);
  }

  private playPlayerAnimation(id: RooftopsHeroAnimationId, restart = false): void {
    const key = ROOFTOPS_HERO_ANIMATION_KEYS[id];
    if (!this.player?.active) return;
    if (!restart && this.currentPlayerAnimationKey === key) return;
    this.player.play(key, !restart);
    this.currentPlayerAnimationKey = key;
  }

  private updatePlayerAnimation(isGliding: boolean): void {
    const now = Date.now();
    if (this.playerAnimationOverride) {
      if (now < this.playerAnimationOverride.until) return;
      this.playerAnimationOverride = null;
    }

    this.playPlayerAnimation(resolveRooftopsHeroAnimation({
      status: this.isGameOver
        ? ('GAMEOVER' as GameStatus)
        : this.hasWon
          ? ('VICTORY' as GameStatus)
          : ('PLAYING' as GameStatus),
      isAirborne: !this.isOnGround,
      verticalVelocity: this.player.body.velocity.y,
      isMoving: Math.abs(this.player.body.velocity.x) > 1,
      isGliding,
      isHurt: false,
      isStompingOrLanding: false,
      isPoweringUp: false,
    }));
  }

  private installWebGameTestHooks(): void {
    if (typeof window === 'undefined') return;

    this.renderTextHook = () => this.renderGameToText();
    this.advanceTimeHook = (ms: number) => {
      const frameMs = 1000 / 60;
      const frames = Math.max(1, Math.round(ms / frameMs));
      const loop = this.game.loop;
      let nextTime = Math.max(window.performance.now(), loop.lastTime || 0);
      for (let i = 0; i < frames; i++) {
        nextTime += frameMs;
        loop.step(nextTime);
      }
      return this.renderGameToText();
    };
    this.enterBossForQaHook = () => {
      const bossArena = this.config.openingRoute?.bossArena;
      if (!bossArena || !this.player?.body) return this.renderGameToText();
      this.player.setPosition(bossArena.arenaX + 70, bossArena.arenaY - PLAYER_HEIGHT - 10);
      this.player.body.setVelocity(0, 0);
      this.jumpCount = 0;
      this.distanceTraveled = Math.max(this.distanceTraveled, bossArena.triggerX - this.startX);
      this.checkBossEntry();
      this.cameras.main.centerOn(bossArena.arenaX + 360, bossArena.arenaY - 110);
      this.updateHud();
      return this.renderGameToText();
    };
    this.dropOnBossForQaHook = () => {
      if (!this.inBossArena || !this.player?.body) return this.renderGameToText();
      const bossSprite = this.boss.getBossSprite();
      const bossBody = bossSprite.body as Phaser.Physics.Arcade.Body | null;
      const bossTop = bossBody ? bossBody.y : bossSprite.y - bossSprite.displayHeight / 2;
      this.player.setPosition(bossSprite.x, bossTop - 8);
      this.player.body.setVelocity(0, 420);
      this.jumpCount = 1;
      this.cameras.main.centerOn(bossSprite.x, bossSprite.y);
      return this.renderGameToText();
    };

    window.render_game_to_text = this.renderTextHook;
    window.advanceTime = this.advanceTimeHook;
    window.enter_platformer_boss_for_qa = this.enterBossForQaHook;
    window.drop_on_platformer_boss_for_qa = this.dropOnBossForQaHook;
  }

  private uninstallWebGameTestHooks(): void {
    if (typeof window === 'undefined') return;
    if (window.render_game_to_text === this.renderTextHook) delete window.render_game_to_text;
    if (window.advanceTime === this.advanceTimeHook) delete window.advanceTime;
    if (window.enter_platformer_boss_for_qa === this.enterBossForQaHook) {
      delete window.enter_platformer_boss_for_qa;
    }
    if (window.drop_on_platformer_boss_for_qa === this.dropOnBossForQaHook) {
      delete window.drop_on_platformer_boss_for_qa;
    }
    this.renderTextHook = null;
    this.advanceTimeHook = null;
    this.enterBossForQaHook = null;
    this.dropOnBossForQaHook = null;
  }

  private renderGameToText(): string {
    if (!this.player?.body) {
      return JSON.stringify({
        mode: this.isGameOver ? 'GAME_OVER' : this.hasWon ? 'VICTORY' : 'UNAVAILABLE',
        paused: false,
        route: {
          openingRouteId: this.config.openingRoute?.id ?? null,
          openingRouteHandoffX: this.config.openingRoute?.handoffX ?? null,
          bossArena: this.config.openingRoute?.bossArena ?? null,
        },
        player: null,
        score: {
          current: this.gameScore.current,
          coins: this.gameScore.coins,
          lives: this.lives,
          multiplier: this.gameScore.multiplier,
        },
        lastInteraction: this.lastInteraction,
        recentInteractions: this.recentInteractions,
      });
    }

    const body = this.player.body;
    const payload = {
      coordinateSystem: 'Phaser world coordinates; origin top-left, x right, y down',
      mode: this.isGameOver ? 'GAME_OVER' : this.hasWon ? 'VICTORY' : this.inBossArena ? 'BOSS' : 'PLAYING',
      paused: this.readPausedForSnapshot(),
      route: {
        openingRouteId: this.config.openingRoute?.id ?? null,
        openingRouteHandoffX: this.config.openingRoute?.handoffX ?? null,
        bossArena: this.config.openingRoute?.bossArena ?? null,
      },
      player: {
        x: Math.round(this.player.x),
        y: Math.round(this.player.y),
        vx: Math.round(body.velocity.x),
        vy: Math.round(body.velocity.y),
        facing: this.facingRight ? 'right' : 'left',
        grounded: this.isOnGround,
        jumpsUsed: this.jumpCount,
        maxJumps: this.maxJumps,
      },
      camera: {
        scrollX: Math.round(this.cameras.main.scrollX),
        scrollY: Math.round(this.cameras.main.scrollY),
      },
      score: {
        current: this.gameScore.current,
        coins: this.gameScore.coins,
        lives: this.lives,
        multiplier: this.gameScore.multiplier,
      },
      lastInteraction: this.lastInteraction,
      recentInteractions: this.recentInteractions,
      powerup: this.powerups.getState(),
      visible: {
        enemies: this.snapshotGroup(this.enemies.getGroup()),
        hazards: [
          ...this.snapshotGroup(this.hazards.getStaticGroup()),
          ...this.snapshotGroup(this.hazards.getBounceGroup()),
          ...this.snapshotGroup(this.hazards.getDamageGroup()),
          ...this.snapshotGroup(this.hazards.getClotheslineGroup()),
        ],
        coins: this.snapshotGroup(this.buildingGen.getCoinGroup()),
        powerups: this.snapshotGroup(this.powerups.getGroup()),
        bossProjectiles: this.snapshotGroup(this.bossProjectiles),
      },
      bossCombat: this.inBossArena
        ? {
            throwReady: this.time.now >= this.bossThrowCooldownUntilMs,
            throwCooldownMs: Math.max(0, Math.round(this.bossThrowCooldownUntilMs - this.time.now)),
          }
        : null,
      boss: this.inBossArena ? this.boss.getSnapshot() : null,
    };
    return JSON.stringify(payload);
  }

  private snapshotGroup(group: Phaser.GameObjects.Group): Array<{ key: string; x: number; y: number }> {
    const cam = this.cameras.main;
    const left = cam.scrollX - 120;
    const right = cam.scrollX + this.scale.width + 120;
    const top = cam.scrollY - 120;
    const bottom = cam.scrollY + this.scale.height + 120;

    return group.getChildren()
      .filter((child): child is Phaser.GameObjects.Sprite => child instanceof Phaser.GameObjects.Sprite)
      .filter(child => child.active && child.x >= left && child.x <= right && child.y >= top && child.y <= bottom)
      .slice(0, 12)
      .map(child => ({
        key: child.texture.key,
        x: Math.round(child.x),
        y: Math.round(child.y),
      }));
  }

  private readPausedForSnapshot(): boolean {
    try {
      return this.scene.isPaused();
    } catch {
      return false;
    }
  }

  private recordInteraction(
    type: PlatformerInteractionType,
    source?: PlatformerInteractionSource | null,
    detail?: string,
  ): void {
    const interaction = {
      type,
      x: Math.round(source?.x ?? this.player.x),
      y: Math.round(source?.y ?? this.player.y),
      atMs: Math.round(this.time.now),
      targetKey: source?.texture?.key ?? null,
      ...(detail ? { detail } : {}),
    };
    this.lastInteraction = interaction;
    this.recentInteractions = [interaction, ...this.recentInteractions].slice(0, 6);
  }
}
