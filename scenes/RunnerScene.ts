import Phaser from 'phaser';
import { SceneBridge } from './shared/SceneBridge';
import type { RunnerSceneInitData, HudUpdatePayload } from './shared/bridgeProtocol';
import { GameStatus } from '../types';
import type {
  ActivePowerUp,
  BackgroundEntity,
  BackgroundEntityType,
  Bullet,
  LevelConfig,
  GameScore,
  WorldEntity,
  EntityType,
  ObstacleType,
  PatternStep,
  ObstacleDefinition,
} from '../types';
import type { TuningProfile } from '../systems/tuning/defaultTuning';
import {
  obstacleHasBehavior,
  pickSeagullSpawnVariant,
  resolveObstacleSpawnY,
  resolveDropProjectileSpec,
  resolveSwoopConfig,
} from '../systems/levelBehaviorHelpers';
import { computeSwoopY, checkPoopDrop } from '../systems/behaviors';
import type { DropProjectileSpawnSpec, SwoopYParams } from '../systems/behaviors';
import {
  computeBossWorldPose,
  computeBossProjectileSpawnRate,
  createBossProjectileObstacle,
} from '../systems/bossSystem';
import { spawnBackgroundEntities } from '../systems/backgroundSpawn';
import { getBossEntryCoinThreshold } from '../levels/catalog';
import {
  handleBounceCollision,
  handleSlowCollision,
  handleHarmfulCollision,
  type CollisionResult,
} from '../systems/collisionHandlers';
import { EffectsManager } from './shared/EffectsManager';
import { PhaserAudio } from './shared/PhaserAudio';
import {
  BEACH_BACKGROUND_TEXTURES,
  BEACH_BOSS_TEXTURES,
  BEACH_IMAGE_LOADS,
  BEACH_OBSTACLE_TEXTURES,
  BEACH_OBSTACLE_VARIANTS,
  BEACH_SHELL_PROJECTILE_TEXTURE,
} from './runner/beachAssets';
import {
  getBossStartingShellAmmo,
  shouldRefillBossShellAmmo,
} from './runner/bossAmmo';
import {
  BEACH_HERO_ANIMATIONS,
  BEACH_HERO_ANIMATION_KEYS,
  BEACH_HERO_RENDER_SCALE,
  BEACH_HERO_SHEET,
  getBeachHeroCollisionBox,
  getBeachHeroDisplaySize,
  getBeachHeroSpritePosition,
  resolveBeachHeroAnimation,
  type BeachHeroAnimationId,
} from './runner/heroSheet';

/**
 * Phaser scene for the endless-runner genre (BEACH level and future runner levels).
 * Ports the retired DOM-runner gameplay into Phaser's renderer.
 *
 * Phase 1 builds this incrementally — each task adds one system.
 *
 * Tasks 1.2 + 1.11: Player physics (custom per-frame, NOT Arcade) and input.
 * Task 1.3: Obstacle spawning and scrolling (weighted pool, patterns, life-assist).
 */
export default class RunnerScene extends SceneBridge {
  // Runner-specific init data
  protected levelConfig!: LevelConfig;
  protected tuning!: TuningProfile;
  protected initialLives!: number;
  protected startAtBoss!: boolean;

  // ── Player state (matches DOM engine coordinate system: y=0 ground, +y = up) ──
  private playerY = 0;
  private playerVy = 0;
  private jumpCount = 0;
  private isDucking = false;
  private isKeyboardDucking = false;
  private invincibleUntil = 0;

  // ── Game state ──
  private speed = 0;
  private isPaused = false;
  private gameOver = false;
  private gameScore: GameScore = {
    current: 0,
    high: 0,
    coins: 0,
    multiplier: 1,
    streak: 0,
    lives: 3,
  };

  // ── Scoring / collectible state (Task 1.4) ──
  private score = 0;         // Internal score (incremented per frame + on collect)
  private distance = 0;      // Distance traveled
  private activePowerUp: ActivePowerUp | null = null;
  private slowdownUntil = 0; // Timestamp: speed halved until this time
  private speedMultiplier = 1.0; // Composite speed multiplier (slowdown / SPEED power-up)

  // ── Magnet attraction types (Task 1.4) ──
  private magnetAttractTypes!: Set<EntityType>;

  // ── Effects & audio (Tasks 1.4/1.5) ──
  private effects!: EffectsManager;
  private audio!: PhaserAudio;

  // ── Player visual ──
  private playerSprite!: Phaser.GameObjects.Sprite;
  private playerAnimationOverride: { id: BeachHeroAnimationId; until: number } | null = null;
  private currentPlayerAnimationKey = '';

  // ── Cached layout values ──
  private playerX = 100; // playerAnchorLeftPx from theme, default 100
  private groundYScreen = 0; // Phaser screen-space Y of ground line
  private canvasHeight = 0;
  private canvasWidth = 0;
  private themeGroundY = 0; // DOM engine groundY (distance from bottom)

  // ── Player dimensions ──
  private static readonly ENTITY_SCALE = BEACH_HERO_RENDER_SCALE;
  private static readonly SHELL_BULLET_DISPLAY_SIZE = 40;
  private static readonly SHELL_BULLET_TRAIL_LENGTH = 66;
  private static readonly SHELL_BULLET_Y_OFFSET = 72;

  // ── Input cleanup ──
  private keyboardCleanup: (() => void) | null = null;

  // ── Environment layer refs (for resize) ──
  private envSky!: Phaser.GameObjects.Image;
  private envSun!: Phaser.GameObjects.Image;
  private envOcean!: Phaser.GameObjects.TileSprite;
  private envFoam!: Phaser.GameObjects.TileSprite;
  private envSand!: Phaser.GameObjects.TileSprite;

  // ── Obstacle spawning state (Task 1.3) ──
  private obstacles: WorldEntity[] = [];
  private obstacleGraphics: Map<number, Phaser.GameObjects.Image> = new Map();
  private weightedObstaclePool: ObstacleType[] = [];
  private harmfulTypes: EntityType[] = [];
  private patternQueue: PatternStep[] = [];
  private nextSpawnTime = 0;
  private patternEndTime = 0;
  private consecutiveHarmful = 0;
  private coinCounter = 0;
  private safeSpawnUntil = 0;
  private lastHarmfulSpawnTime = 0;

  // ── Seagull behavior state (Task 1.6) ──
  private seagullSwoopConfig!: SwoopYParams;
  private dropProjectileSpec: DropProjectileSpawnSpec | null = null;

  // ── Boss fight state (Task 1.7) ──
  private status: GameStatus = GameStatus.PLAYING;
  private boss: WorldEntity | null = null;
  private bossSprite: Phaser.GameObjects.Image | null = null;
  private bossHealthBarBg: Phaser.GameObjects.Graphics | null = null;
  private bossHealth = 0;
  private bossMaxHealth = 0;
  private bossFightStartTime = 0;
  private bossDefeating = false;
  private bossEntryCoins = 50;
  private startAtBossPending = false;
  private bossProjectileObstacleType: ObstacleType = 'SAND_PROJECTILE';

  // Player bullets (shell projectiles at boss)
  private bullets: Bullet[] = [];
  private bulletGraphics: Map<number, Phaser.GameObjects.Graphics> = new Map();
  private bulletSprites = new Map<number, Phaser.GameObjects.Image>();
  private lastShotTime = 0;

  // Shell ammo system
  private shellAmmo = 0;
  private lastBossShellSpawn = 0;
  private bossAttackStartTime = 0;

  // Boss defeat animation
  private defeatPoops: Array<{
    id: number; x: number; y: number; targetX: number; targetY: number;
    vy: number; size: number; landed: boolean; rotation: number;
  }> = [];
  private defeatPoopGraphics: Map<number, Phaser.GameObjects.Graphics> = new Map();
  private defeatAnimationStart = 0;
  private defeatPoopsSpawned = 0;

  // ── Background parallax state (Task 1.9) ──
  private backgroundEntities: BackgroundEntity[] = [];
  private bgSprites = new Map<number, Phaser.GameObjects.Image>();
  private lastBackgroundSpawnTime = 0;

  // ── Pacing / phase tracking (Task 9) ──
  private runStartTime = 0;

  /** Texture key map for obstacle/collectible sprites */
  private static readonly OBSTACLE_TEXTURE_MAP = BEACH_OBSTACLE_TEXTURES;

  init(data: RunnerSceneInitData): void {
    super.init(data);
    this.levelConfig = data.levelConfig;
    this.tuning = data.tuning;
    this.initialLives = data.initialLives;
    this.startAtBoss = data.startAtBoss;

    if (data.onTelemetryReady) {
      // Provide empty getter for now — BalancePanel export path won't crash
      // TODO: implement full RunnerScene telemetry
      data.onTelemetryReady(() => []);
    }
  }

  preload(): void {
    // Custom still-image cats stay in closet/identity surfaces until they can satisfy the same sheet contract.
    this.load.spritesheet(BEACH_HERO_SHEET.key, BEACH_HERO_SHEET.path, {
      frameWidth: BEACH_HERO_SHEET.frameWidth,
      frameHeight: BEACH_HERO_SHEET.frameHeight,
      endFrame: BEACH_HERO_SHEET.frameMax - 1,
    });

    for (const asset of BEACH_IMAGE_LOADS) {
      this.load.image(asset.key, asset.path);
    }

    // Shared particle texture for EffectsManager
    EffectsManager.createParticleTexture(this);

  }

  create(): void {
    const { width, height } = this.scale;
    this.canvasWidth = width;
    this.canvasHeight = height;

    // Cache layout
    this.playerX = this.levelConfig.theme.playerAnchorLeftPx ?? 100;
    this.themeGroundY = this.levelConfig.theme.groundY;
    this.groundYScreen = height - this.themeGroundY;

    // Layer 0: Sky background (full canvas)
    this.envSky = this.add.image(width / 2, height / 2, 'env-sky')
      .setDisplaySize(width, height)
      .setDepth(0);

    // Layer 1: Sun
    this.envSun = this.add.image(width * 0.35, height * 0.12, 'env-sun')
      .setDisplaySize(80, 80)
      .setDepth(1);
    this.tweens.add({ targets: this.envSun, scaleX: this.envSun.scaleX * 1.05, scaleY: this.envSun.scaleY * 1.05, yoyo: true, repeat: -1, duration: 2000, ease: 'Sine.easeInOut' });

    // Layer 4: Ocean (below sky, above sand)
    const oceanY = this.groundYScreen - 80;
    this.envOcean = this.add.tileSprite(width / 2, oceanY, width, 100, 'env-ocean')
      .setDepth(4);

    // Layer 5: Waterline foam
    this.envFoam = this.add.tileSprite(width / 2, this.groundYScreen - 4, width, 16, 'env-foam')
      .setDepth(5);

    // Layer 6: Sand ground
    this.envSand = this.add.tileSprite(width / 2, this.groundYScreen + this.themeGroundY / 2, width, this.themeGroundY, 'env-sand')
      .setDepth(6);

    // Canvas is fixed-size — no resize handling needed

    // ── Player visual (sprite) ──
    const scale = RunnerScene.ENTITY_SCALE;
    const displaySize = getBeachHeroDisplaySize(scale);
    const initialHeroPosition = getBeachHeroSpritePosition({
      playerX: this.playerX,
      groundYScreen: this.groundYScreen,
      playerY: this.playerY,
      scale,
    });
    this.registerPlayerAnimations();
    this.playerSprite = this.add.sprite(
      initialHeroPosition.x,
      initialHeroPosition.y,
      BEACH_HERO_SHEET.key,
      0,
    )
      .setOrigin(BEACH_HERO_SHEET.origin.x, BEACH_HERO_SHEET.origin.y)
      .setDisplaySize(
        displaySize.width,
        displaySize.height,
      )
      .setDepth(10);
    this.playPlayerAnimation('run');

    this.bindKeyboardControls();

    // ── Input: touch ──
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isPaused) return;
      const midX = this.canvasWidth / 2;
      if (pointer.x < midX) {
        this.performJump();
      } else {
        this.performDuck(true);
      }
    });

    this.input.on('pointerup', () => {
      this.performDuck(false);
    });

    // ── Effects & audio ──
    this.effects = new EffectsManager(this);
    this.audio = new PhaserAudio(this);

    // ── Initialize game state ──
    this.speed = this.tuning.initialSpeed;
    this.gameScore = {
      current: 0,
      high: 0,
      coins: 0,
      multiplier: 1,
      streak: 0,
      lives: this.initialLives,
    };
    this.score = 0;
    this.distance = 0;
    this.activePowerUp = null;
    this.slowdownUntil = 0;
    this.speedMultiplier = 1.0;
    this.gameOver = false;
    this.playerY = 0;
    this.playerVy = 0;
    this.jumpCount = 0;
    this.isDucking = false;
    this.isKeyboardDucking = false;
    this.playerAnimationOverride = null;
    this.currentPlayerAnimationKey = '';
    this.invincibleUntil = 0;
    this.isPaused = false;

    // ── Magnet attract types from level config ──
    this.magnetAttractTypes = new Set<EntityType>(
      this.levelConfig.magnetAttractTypes ?? ['COIN'],
    );

    // ── Seagull behavior config (Task 1.6) ──
    const seagullDef = this.levelConfig.obstacles.find(o => o.type === 'SEAGULL');
    this.seagullSwoopConfig = resolveSwoopConfig(seagullDef);
    this.dropProjectileSpec = resolveDropProjectileSpec(this.levelConfig, 'SEAGULL');

    // ── Boss fight setup (Task 1.7) ──
    this.status = GameStatus.PLAYING;
    this.boss = null;
    this.bossSprite?.destroy();
    this.bossSprite = null;
    this.bossHealthBarBg?.destroy();
    this.bossHealthBarBg = null;
    this.bossHealth = 0;
    this.bossMaxHealth = this.levelConfig.boss.health;
    this.bossFightStartTime = 0;
    this.bossDefeating = false;
    this.bossEntryCoins = getBossEntryCoinThreshold(this.levelConfig, this.tuning);
    this.startAtBossPending = false;
    if (this.startAtBoss) {
      this.gameScore.coins = this.bossEntryCoins;
      this.startAtBossPending = true;
      this.time.delayedCall(150, () => {
        this.startAtBossPending = false;
        if (!this.gameOver && this.status === GameStatus.PLAYING) {
          this.triggerBossFight(Date.now());
        }
      });
    }
    this.bossProjectileObstacleType = this.levelConfig.boss.projectileObstacleType ?? 'SAND_PROJECTILE';
    this.bullets = [];
    this.bulletGraphics.forEach(g => g.destroy());
    this.bulletGraphics.clear();
    this.defeatPoops = [];
    this.defeatPoopGraphics.forEach(g => g.destroy());
    this.defeatPoopGraphics.clear();
    this.defeatAnimationStart = 0;
    this.defeatPoopsSpawned = 0;
    this.lastShotTime = 0;

    // ── Background parallax setup (Task 1.9) ──
    this.backgroundEntities = [];
    this.bgSprites.forEach(g => g.destroy());
    this.bgSprites.clear();
    this.lastBackgroundSpawnTime = 0;

    // ── Initialize obstacle spawning (Task 1.3) ──
    this.obstacles = [];
    this.obstacleGraphics.forEach(g => g.destroy());
    this.obstacleGraphics.clear();
    this.patternQueue = [];
    this.consecutiveHarmful = 0;
    this.coinCounter = 0;
    this.lastHarmfulSpawnTime = 0;
    this.patternEndTime = 0;

    // Build weighted obstacle pool from level config
    this.weightedObstaclePool = [];
    for (const o of this.levelConfig.obstacles) {
      for (let i = 0; i < o.spawnWeight; i++) {
        this.weightedObstaclePool.push(o.type);
      }
    }

    // Cache harmful types from level config
    this.harmfulTypes = (this.levelConfig.harmfulTypes ?? []) as EntityType[];

    // Start spawn grace period so early moments are safe
    const now = Date.now();
    this.safeSpawnUntil = now + this.tuning.startSpawnGraceMs;
    this.nextSpawnTime = now + this.tuning.startSpawnGraceMs;

    // Notify React overlay that we're playing
    this.emitStatusChange(GameStatus.PLAYING);
    this.emitScoreUpdate(this.gameScore);

    // ── Pacing: record run start for phase determination (Task 9) ──
    this.runStartTime = Date.now();
  }

  private bindKeyboardControls(): void {
    this.keyboardCleanup?.();

    const handledKeys = new Set([' ', 'Spacebar', 'ArrowUp', 'ArrowDown', 'p', 'P', 'Escape']);
    const onKeyDown = (event: KeyboardEvent) => {
      if (!handledKeys.has(event.key)) return;
      event.preventDefault();

      if (event.key === 'p' || event.key === 'P' || event.key === 'Escape') {
        if (!event.repeat) this.togglePause();
        return;
      }

      if (this.isPaused || this.gameOver) return;

      if ((event.key === ' ' || event.key === 'Spacebar' || event.key === 'ArrowUp') && !event.repeat) {
        this.performJump();
        return;
      }

      if (event.key === 'ArrowDown') {
        this.isKeyboardDucking = true;
        this.performDuck(true);
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowDown') return;
      event.preventDefault();
      this.isKeyboardDucking = false;
      this.performDuck(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    this.keyboardCleanup = () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      this.keyboardCleanup = null;
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.keyboardCleanup?.());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.keyboardCleanup?.());
  }

  update(_time: number, delta: number): void {
    if (this.gameOver) return;

    if (this.isPaused) return;

    // ── Input: duck (level-triggered) ──
    if (this.isKeyboardDucking) {
      this.performDuck(true);
    } else if (this.isDucking) {
      this.performDuck(false);
    }

    const now = Date.now();

    // ── Physics: delta-time normalized to 60fps ──
    const frames = delta / 16.667;

    this.playerVy -= this.tuning.gravity * frames;
    this.playerY += this.playerVy * frames;

    if (this.playerY <= 0) {
      this.playerY = 0;
      this.playerVy = 0;
      this.jumpCount = 0;
    }

    // ── Power-up expiry ──
    if (this.activePowerUp && now > this.activePowerUp.endTime) {
      this.activePowerUp = null;
    }

    // ── Speed multiplier: slowdown > SPEED power-up > normal ──
    const isSlowed = now < this.slowdownUntil;
    this.speedMultiplier = isSlowed
      ? 0.4
      : (this.activePowerUp?.type === 'SPEED' ? 1.7 : 1.0);

    // ── Per-frame scoring (internal) ──
    this.score += this.gameScore.multiplier * frames;
    this.distance += this.speed * this.speedMultiplier * frames;

    // ── Game speed ramp ──
    this.speed += this.tuning.speedIncrement * frames;
    this.speed = Math.min(this.speed, this.tuning.maxSpeed);

    // ── Boss entry trigger (Task 1.7) ──
    if (this.status === GameStatus.PLAYING && !this.startAtBossPending && this.gameScore.coins >= this.bossEntryCoins) {
      this.triggerBossFight(now);
    }

    // ── Obstacle spawning + scrolling (Task 1.3) ──
    if (this.status === GameStatus.PLAYING) {
      this.updateSpawning(now);
    } else if (this.status === GameStatus.BOSS_FIGHT) {
      this.updateBossProjectileSpawning(now);
    }
    this.updateObstacles(frames);

    // ── MAGNET pull (Task 1.4) ──
    if (this.activePowerUp?.type === 'MAGNET') {
      this.updateMagnetPull();
    }

    // ── Boss fight update (Task 1.7) ──
    if (this.status === GameStatus.BOSS_FIGHT && this.boss) {
      this.updateBossFight(now, _time);
    }

    // ── Boss defeat animation (Task 1.7) ──
    if (this.bossDefeating && this.boss) {
      this.updateBossDefeatAnimation(now, frames);
    }

    this.updateBossShellAmmo(now);

    // ── Bullet update (Task 1.7) ──
    this.updateBullets();

    // ── Background parallax (Task 1.9) ──
    this.updateEnvironmentParallax(frames);
    this.updateBackgroundSpawning(now);
    this.updateBackgroundMovement();

    // ── Collision detection (Task 1.5) ──
    this.updateCollisions(now);

    // ── Dust trail particles when running on ground ──
    if (this.playerY <= 1 && !this.isDucking) {
      const display = getBeachHeroDisplaySize(RunnerScene.ENTITY_SCALE);
      const feetX = this.playerX + display.width * 0.34;
      const feetY = this.groundYScreen;
      this.effects.spawnDust(feetX, feetY, this.speed);
    }

    // ── Update player sprite position ──
    this.updatePlayerSprite();

    // ── Sync GameScore and emit to HUD ──
    this.gameScore.current = Math.floor(this.score / 10);
    this.emitScoreUpdate(this.gameScore);
  }

  // ─── Player actions ─────────────────────────────────────────────────

  private performJump(): void {
    if (this.jumpCount < 2) {
      this.playerVy = this.tuning.jumpForce;
      this.jumpCount += 1;
      this.isDucking = false;
    }
  }

  private performDuck(ducking: boolean): void {
    // During boss fight, duck = shoot poop at boss
    if (this.status === GameStatus.BOSS_FIGHT) {
      if (ducking) this.shootShell();
      return;
    }
    if (ducking) {
      // Can only duck when on or near the ground
      if (this.playerY <= 5) {
        this.isDucking = true;
      }
    } else {
      this.isDucking = false;
    }
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;
    // Emit status so the React overlay can show/hide pause UI
    this.emitStatusChange(GameStatus.PLAYING);
    this.emitHudUpdate({ isPaused: this.isPaused });
  }

  // ─── Obstacle spawning (Task 1.3) ──────────────────────────────────

  /**
   * Resolve an ObstacleDefinition from the level config by type.
   */
  private getObstacleDef(type: ObstacleType): ObstacleDefinition | undefined {
    return this.levelConfig.obstacles.find(o => o.type === type);
  }

  /**
   * Determine current run phase based on elapsed time.
   * early: 0-20s, mid: 20-40s, late: 40s+
   */
  private getCurrentPhase(): 'early' | 'mid' | 'late' {
    const elapsed = (Date.now() - this.runStartTime) / 1000;
    if (elapsed < 20) return 'early';
    if (elapsed < 40) return 'mid';
    return 'late';
  }

  /**
   * Time-based spawn logic carried forward from the retired DOM runner.
   * Called once per frame; spawns entities when the spawn timer fires.
   */
  private updateSpawning(now: number): void {
    if (now <= this.nextSpawnTime) return;

    const lives = this.gameScore.lives;
    const lowLivesMode = lives <= this.tuning.lowLivesThreshold;
    const criticalLivesMode = lives <= this.tuning.criticalLivesThreshold;

    // Check if we're still in mandatory gap after pattern completed
    const inPatternGap = now < this.patternEndTime;

    if (this.patternQueue.length === 0 && !inPatternGap) {
      // ── Roll for new pattern ──
      const lifeAssistScale = criticalLivesMode ? 0.45 : (lowLivesMode ? 0.65 : 1);
      const patternChance = Math.min(0.15 + (this.gameScore.current / 12000), 0.7) * lifeAssistScale;
      const isPlayerRecovering = now < this.invincibleUntil;
      const patterns = this.levelConfig.patterns;
      const currentPhase = this.getCurrentPhase();

      // Filter patterns by current phase
      const available = patterns.filter(p => p.phase === currentPhase || p.phase === 'any');

      if (available.length > 0 && Math.random() < patternChance && !isPlayerRecovering) {
        const pi = Math.floor(Math.random() * available.length);
        this.patternQueue = [...available[pi].steps];    // .steps, not the whole PhasedPattern
        this.consecutiveHarmful = 0;
      } else {
        // ── Check for power-up spawn ──
        const powerupThreshold = criticalLivesMode ? 10 : (lowLivesMode ? 14 : this.tuning.powerupThreshold);
        if (this.coinCounter >= powerupThreshold) {
          const roll = Math.random();
          const powerupType: EntityType = roll < 0.4 ? 'SPEED' : roll < 0.8 ? 'MAGNET' : 'SUPER_SIZE';
          this.spawnEntity(powerupType);
          this.coinCounter = 0;
        } else {
          this.spawnEntity();
        }

        // ── Calculate next spawn interval ──
        const lifeIntervalBonus = criticalLivesMode ? 320 : (lowLivesMode ? 180 : 0);
        const spawnJitter = (Math.random() - 0.5) * this.tuning.spawnJitterMs;
        const computedInterval = this.tuning.spawnBaseMs - Math.min(this.speed * 43, 760) + lifeIntervalBonus + spawnJitter;
        const intervalMs = Math.max(this.tuning.spawnMinMs, computedInterval);
        // speedMultiplier is 1.0 for now (power-ups handled in Task 1.4+)
        this.nextSpawnTime = now + intervalMs;
      }
    }

    // ── Process pattern queue ──
    if (this.patternQueue.length > 0) {
      const step = this.patternQueue.shift()!;
      this.spawnEntity(step.type, step.y);

      if (this.harmfulTypes.includes(step.type)) {
        this.lastHarmfulSpawnTime = now;
      }

      const patternDelayScale = criticalLivesMode ? 1.25 : (lowLivesMode ? 1.15 : 1);
      this.nextSpawnTime = now + (step.delay * patternDelayScale);

      // If pattern just finished, set mandatory gap before next spawn
      if (this.patternQueue.length === 0) {
        this.patternEndTime = now + this.tuning.patternEndGapMs + (lowLivesMode ? 200 : 0);
        this.consecutiveHarmful = 0;
      }
    }
  }

  /**
   * Spawn a single entity using the runner config and weighted spawn pool.
   * Handles type selection (coin chance, harmful streak limits, safe-spawn grace),
   * sizing, and Y positioning.
   */
  private spawnEntity(typeOverride?: EntityType, yOverride?: number): void {
    const pool = this.weightedObstaclePool.length > 0
      ? this.weightedObstaclePool
      : (['CRAB'] as ObstacleType[]);
    const lives = this.gameScore.lives;
    const lowLives = lives <= this.tuning.lowLivesThreshold;
    const criticalLives = lives <= this.tuning.criticalLivesThreshold;

    const coinChance = criticalLives ? 0.9 : (lowLives ? 0.86 : 0.75);
    const shellChanceWhenNoCoin = criticalLives ? 0.65 : (lowLives ? 0.55 : 0.4);
    const harmfulStreakLimit = lowLives ? 1 : 2;

    let isCoin = Math.random() < coinChance;
    let isShell = false;
    if (!isCoin && Math.random() < shellChanceWhenNoCoin) {
      isShell = true;
    }
    if (this.consecutiveHarmful >= harmfulStreakLimit) {
      isCoin = true;
      isShell = false;
    }

    let selectedType: EntityType = typeOverride
      ?? (isShell ? 'SHELL' : (isCoin ? 'COIN' : pool[Math.floor(Math.random() * pool.length)]));

    // Keep opening moments fair: avoid unavoidable hits right after start or damage
    if (Date.now() < this.safeSpawnUntil && this.harmfulTypes.includes(selectedType)) {
      selectedType = 'COIN';
      isCoin = true;
      isShell = false;
    }

    if (this.harmfulTypes.includes(selectedType)) {
      this.consecutiveHarmful++;
    } else {
      this.consecutiveHarmful = 0;
    }

    // Track coins for power-up threshold
    if (selectedType === 'COIN') {
      this.coinCounter++;
    }

    // ── Sizing and Y position ──
    let width = 120;
    let height = 120;
    const groundY = this.themeGroundY;
    let y = yOverride ?? groundY;

    if (
      selectedType === 'COIN' || selectedType === 'SHELL' ||
      selectedType === 'SPEED' || selectedType === 'MAGNET' || selectedType === 'SUPER_SIZE'
    ) {
      width = 60;
      height = 60;
      if (yOverride === undefined) y = groundY + Math.random() * 250;
    } else if (selectedType === 'SEAGULL') {
      // Task 1.6: spawn seagulls with swoop/poop variant
      const sg = this.getObstacleDef('SEAGULL');
      height = sg?.height ?? 90;
      width = sg?.width ?? 110;
      const seagullType = pickSeagullSpawnVariant(sg);
      let isSwooping = false;
      if (yOverride !== undefined) {
        y = yOverride;
      } else if (seagullType === 'dive') {
        isSwooping = obstacleHasBehavior(sg, 'swoop') && Math.random() < 0.6;
        y = resolveObstacleSpawnY(sg?.spawnY, () => (isSwooping ? 400 : 350));
      } else {
        isSwooping = false;
        y = resolveObstacleSpawnY(sg?.spawnY, () => 500 + Math.random() * 100);
      }

      const entity: WorldEntity = {
        id: Date.now() + Math.random(),
        type: selectedType,
        x: this.canvasWidth + 300,
        y,
        isSwooping,
        seagullType,
        lastPoopTime: Date.now(),
        width,
        height,
        speed: this.speed,
        isPassed: false,
      };
      this.obstacles.push(entity);
      this.createObstacleGraphics(entity);
      return; // Early return — seagull entity already pushed
    } else {
      const od = this.getObstacleDef(selectedType as ObstacleType);
      if (od) {
        width = od.width;
        height = od.height;
        if (yOverride === undefined) {
          y = resolveObstacleSpawnY(od.spawnY, () => groundY);
        }
      }
    }

    const entity: WorldEntity = {
      id: Date.now() + Math.random(),
      type: selectedType,
      x: this.canvasWidth + 300,
      y,
      width,
      height,
      speed: this.speed,
      isPassed: false,
    };

    this.obstacles.push(entity);
    this.createObstacleGraphics(entity);
  }

  /**
   * Move all obstacles leftward and remove off-screen ones.
   * Also tracks streak: when a harmful obstacle scrolls past the player
   * without collision, streak increments and multiplier may increase.
   * Behavior preserved from the retired DOM runner.
   */
  private updateObstacles(frames: number): void {
    const now = Date.now();
    const step = this.speed * this.speedMultiplier * frames;
    const removeIds: number[] = [];
    const playerHitbox = getBeachHeroCollisionBox({
      playerX: this.playerX,
      groundY: this.themeGroundY,
      playerY: this.playerY,
      isDucking: this.isDucking,
      isSuperSized: this.activePowerUp?.type === 'SUPER_SIZE',
      scale: RunnerScene.ENTITY_SCALE,
    });

    // ── Seagull poop drops (Task 1.6) — iterate before movement to check timing ──
    const lowLivesMode = this.gameScore.lives <= this.tuning.lowLivesThreshold;
    const harmfulCooldown = this.tuning.harmfulCooldownMs + (lowLivesMode ? 250 : 0);
    const canSpawnPoop = (now - this.lastHarmfulSpawnTime) > harmfulCooldown;
    const newProjectiles: WorldEntity[] = [];

    if (this.status === GameStatus.PLAYING || this.status === GameStatus.BOSS_FIGHT) {
      for (const obs of this.obstacles) {
        const projectile = checkPoopDrop(obs, now, lowLivesMode, canSpawnPoop, this.dropProjectileSpec);
        if (projectile) {
          newProjectiles.push(projectile);
          obs.lastPoopTime = now;
          this.lastHarmfulSpawnTime = now;
        }
      }
    }

    // Add spawned poop projectiles
    for (const proj of newProjectiles) {
      this.obstacles.push(proj);
      this.createObstacleGraphics(proj);
    }

    for (const obs of this.obstacles) {
      obs.x -= step;

      // ── Seagull swoop Y update (Task 1.6) ──
      if (obs.type === 'SEAGULL' && obs.isSwooping && obs.seagullType === 'dive') {
        obs.y = computeSwoopY(obs.x, this.canvasWidth, this.seagullSwoopConfig);
      }

      // ── Falling projectile gravity (poop / SAND_PROJECTILE with vy) ──
      if (obs.vy !== undefined && obs.vy !== 0) {
        obs.vy -= 0.5 * frames; // gravity pulls downward (vy is in DOM coords: +y = up)
        const currentY = obs.y ?? this.themeGroundY;
        obs.y = currentY + obs.vy * frames;
        // Remove if fallen below ground
        if (currentY < -50) {
          removeIds.push(obs.id);
          continue;
        }
      }

      // ── Streak: harmful obstacle scrolled past player without collision ──
      if (
        !obs.isPassed &&
        !obs.isCollected &&
        this.harmfulTypes.includes(obs.type) &&
        obs.type !== 'SANDCASTLE' &&
        obs.x + obs.width * RunnerScene.ENTITY_SCALE < playerHitbox.left
      ) {
        obs.isPassed = true;
        this.gameScore.streak++;
        if (this.gameScore.streak >= this.tuning.streakRequired) {
          this.gameScore.multiplier++;
          this.gameScore.streak = 0;
          this.audio.playSfx('mult');
          // Floating "MULTIPLIER UP!" text at player position
          const playerScreenY = this.groundYScreen - (playerHitbox.top - this.themeGroundY);
          this.effects.floatingScore(
            playerHitbox.left + playerHitbox.width / 2,
            playerScreenY - 30,
            'MULT UP!',
            '#f59e0b',
          );
        }
      }

      // Off-screen cleanup threshold
      if (obs.x < -400) {
        removeIds.push(obs.id);
      }
    }

    // Remove off-screen obstacles and destroy their graphics
    if (removeIds.length > 0) {
      const removeSet = new Set(removeIds);
      this.obstacles = this.obstacles.filter(obs => {
        if (removeSet.has(obs.id)) {
          const gfx = this.obstacleGraphics.get(obs.id);
          if (gfx) {
            gfx.destroy();
            this.obstacleGraphics.delete(obs.id);
          }
          return false;
        }
        return true;
      });
    }

    // Update sprite positions
    for (const obs of this.obstacles) {
      const sprite = this.obstacleGraphics.get(obs.id);
      if (sprite) {
        this.updateObstacleSprite(sprite, obs);
      }
    }
  }

  // ─── MAGNET pull (Task 1.4) ───────────────────────────────────────

  /**
   * When MAGNET power-up is active, pull eligible collectibles toward the player.
   * Behavior preserved from the retired DOM runner.
   */
  private updateMagnetPull(): void {
    const catX = this.playerX + 64; // hitboxCenterX
    const catY = this.playerY + 40;

    for (const obs of this.obstacles) {
      if (obs.isCollected) continue;
      if (!this.magnetAttractTypes.has(obs.type)) continue;

      const obsY = obs.y ?? this.themeGroundY;
      const dx = catX - obs.x;
      const dy = catY - obsY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 450) {
        obs.x += dx * 0.2;
        obs.y = obsY + dy * 0.2;
      }
    }
  }

  // ─── Collision detection (Task 1.5) ─────────────────────────────────

  /**
   * AABB collision detection with forgiveness padding.
   * Matches the legacy runner collision semantics.
   */
  private updateCollisions(now: number): void {
    const scale = RunnerScene.ENTITY_SCALE;
    const isSuperSized = this.activePowerUp?.type === 'SUPER_SIZE';
    const playerHitbox = getBeachHeroCollisionBox({
      playerX: this.playerX,
      groundY: this.themeGroundY,
      playerY: this.playerY,
      isDucking: this.isDucking,
      isSuperSized,
      scale,
    });

    const isCurrentlyHurt = now < this.invincibleUntil;

    for (const obs of this.obstacles) {
      if (obs.isCollected) continue;

      const oY = obs.y ?? this.themeGroundY;
      const hPadding = 10;
      const vPadding = 5;
      const oL = obs.x + hPadding;
      const oR = obs.x + obs.width * scale - hPadding;
      const oB = oY + vPadding;
      const oT = oY + obs.height * scale - vPadding;

      const overlaps =
        playerHitbox.right > oL &&
        playerHitbox.left < oR &&
        playerHitbox.top > oB &&
        playerHitbox.bottom < oT;
      if (!overlaps) continue;

      // ── Screen-space positions for effects (scaled to match visual size) ──
      const obsCenterX = obs.x + (obs.width * scale) / 2;
      const obsScreenY = this.groundYScreen - (oY - this.themeGroundY) - (obs.height * scale);

      // ── SHELL collection ──
      if (obs.type === 'SHELL') {
        this.audio.playSfx('coin');
        // Shells give display score + ammo, but NOT coins (coins gate boss entry)
        this.score += 50 * this.gameScore.multiplier;
        this.shellAmmo += 1;
        obs.isCollected = true;
        this.effects.spawnParticles(obsCenterX, obsScreenY + (obs.height * scale) / 2, 0xfbbf24, 16);
        this.effects.floatingScore(obsCenterX, obsScreenY, `+${5 * this.gameScore.multiplier}`, '#fbbf24');
        // Update HUD with shell count
        this.emitHudUpdate({ shellAmmo: this.shellAmmo } satisfies HudUpdatePayload);
        continue;
      }

      // ── COIN collection ──
      if (obs.type === 'COIN') {
        this.audio.playSfx('coin');
        this.gameScore.coins++;
        this.coinCounter++;
        this.score += 10 * this.gameScore.multiplier;
        obs.isCollected = true;
        // Effects
        this.effects.spawnParticles(obsCenterX, obsScreenY + (obs.height * scale) / 2, 0xfacc15, 12);
        this.effects.floatingScore(obsCenterX, obsScreenY, `+${this.gameScore.multiplier}`, '#facc15');
        continue;
      }

      // ── Power-up acquisition ──
      if (obs.type === 'SPEED' || obs.type === 'MAGNET' || obs.type === 'SUPER_SIZE') {
        this.audio.playSfx('powerup');
        this.activePowerUp = { type: obs.type, endTime: now + 10000 };
        obs.isCollected = true;
        this.effects.spawnParticles(obsCenterX, obsScreenY + (obs.height * scale) / 2, 0x8b5cf6, 14);
        continue;
      }

      // ── Stomp / bounce detection ──
      const isLanding = this.playerVy < 0 && (playerHitbox.bottom >= oT - 30);
      const stompDef = this.getObstacleDef(obs.type as ObstacleType);
      const canStompBounce =
        obs.type === 'SEAGULL'
          ? (obs.seagullType === 'dive' && obstacleHasBehavior(stompDef, 'swoop'))
          : (obstacleHasBehavior(stompDef, 'bounce') ||
             obstacleHasBehavior(stompDef, 'stomp') ||
             obstacleHasBehavior(stompDef, 'arcProjectile'));

      if (isLanding && canStompBounce) {
        const result = handleBounceCollision(obs.type, this.tuning, stompDef);
        this.applyCollisionResult(result, obs, obsScreenY);
        continue;
      }

      // ── Slow-on-contact ──
      if (obstacleHasBehavior(stompDef, 'slowOnContact') && !isCurrentlyHurt) {
        const result = handleSlowCollision(obs.type, stompDef);
        this.applyCollisionResult(result, obs, obsScreenY);
        continue;
      }

      // ── Harmful collision ──
      if (this.harmfulTypes.includes(obs.type) && !isCurrentlyHurt && !isSuperSized) {
        const result = handleHarmfulCollision();
        result.sounds.forEach(s => this.audio.playSfx(s as Parameters<PhaserAudio['playSfx']>[0]));

        this.gameScore.lives--;
        this.invincibleUntil = now + this.tuning.invincibilityDurationMs;
        this.safeSpawnUntil = now + this.tuning.hitSpawnGraceMs;
        this.gameScore.streak = 0;
        this.queuePlayerAnimation('hurt', 360);

        // Damage effects
        this.effects.freezeFrame(80);
        this.effects.shake(0.015, 120);
        this.effects.flash(0xff0000, 150);

        this.audio.playSfx('hit');
        this.emitLivesChanged(this.gameScore.lives);

        // Sync and emit score immediately on damage
        this.gameScore.current = Math.floor(this.score / 10);
        this.emitScoreUpdate(this.gameScore);

        if (this.gameScore.lives <= 0) {
          this.gameOver = true;
          this.status = GameStatus.GAMEOVER;
          this.queuePlayerAnimation('defeat', 900);
          this.emitGameOver(Math.floor(this.score / 10));
          this.emitStatusChange(GameStatus.GAMEOVER);
          return; // Stop processing further collisions
        }
      }
    }
  }

  /**
   * Apply a CollisionResult to game state — shared by stomp/bounce and slow-on-contact.
   * Keeps the legacy runner scoring and particle side effects in one place.
   */
  private applyCollisionResult(result: CollisionResult, obs: WorldEntity, obsScreenY: number): void {
    // Play sounds
    result.sounds.forEach(s => this.audio.playSfx(s as Parameters<PhaserAudio['playSfx']>[0]));

    // Particle burst
    if (result.particleColor) {
      const hexColor = Phaser.Display.Color.HexStringToColor(result.particleColor).color;
      const scale = RunnerScene.ENTITY_SCALE;
      this.effects.spawnParticles(
        obs.x + (obs.width * scale) / 2,
        obsScreenY + (obs.height * scale) / 2,
        hexColor,
        10,
      );
    }

    // Bounce force
    if (result.bounceForce !== undefined) {
      this.playerVy = result.bounceForce;
    }

    // Jump count reset
    if (result.jumpCount !== undefined) {
      this.jumpCount = result.jumpCount;
    }

    // Score points
    if (result.points) {
      const scale = RunnerScene.ENTITY_SCALE;
      this.score += result.points * 10;
      this.effects.floatingScore(
        obs.x + (obs.width * scale) / 2,
        obsScreenY,
        `+${result.points}`,
      );
    }

    // Slowdown
    if (result.slowDuration) {
      this.slowdownUntil = Date.now() + result.slowDuration;
    }

    // Mark obstacle
    if (result.markAs === 'collected') obs.isCollected = true;
    else if (result.markAs === 'passed') obs.isPassed = true;
  }

  // ─── Obstacle rendering ────────────────────────────────────────────

  /**
   * Get the Phaser texture key for an obstacle type.
   */
  private getObstacleTextureKey(type: string): string {
    return RunnerScene.OBSTACLE_TEXTURE_MAP[type] || 'obs-COIN';
  }

  private getObstacleTextureKeyWithVariant(type: string): string {
    const variants = BEACH_OBSTACLE_VARIANTS[type];
    if (variants) {
      return variants[Math.floor(Math.random() * variants.length)];
    }
    return this.getObstacleTextureKey(type);
  }

  /**
   * Create a Phaser Image for an obstacle and store it in the map.
   */
  private createObstacleGraphics(entity: WorldEntity): void {
    const textureKey = this.getObstacleTextureKeyWithVariant(entity.type);
    const scale = RunnerScene.ENTITY_SCALE;
    const entityY = entity.y ?? this.themeGroundY;
    const screenX = entity.x;
    // DOM engine: y=groundY means "at ground level", y>groundY means airborne.
    // Subtract groundY so ground-level entities sit ON the ground line.
    const screenY = this.groundYScreen - (entityY - this.themeGroundY) - (entity.height * scale);

    const sprite = this.add.image(screenX, screenY, textureKey)
      .setDisplaySize(entity.width * scale, entity.height * scale)
      .setOrigin(0, 0)
      .setDepth(5);

    this.obstacleGraphics.set(entity.id, sprite);
  }

  /**
   * Update a sprite's position and size to match an obstacle's current state.
   */
  private updateObstacleSprite(sprite: Phaser.GameObjects.Image, entity: WorldEntity): void {
    const scale = RunnerScene.ENTITY_SCALE;
    const entityY = entity.y ?? this.themeGroundY;

    // Convert DOM engine coords (y=groundY at ground, +y up) to Phaser coords (y=0 top, +y down)
    // Subtract groundY so ground-level entities sit ON the ground line.
    const screenX = entity.x;
    const screenY = this.groundYScreen - (entityY - this.themeGroundY) - (entity.height * scale);

    sprite.setPosition(screenX, screenY);
    sprite.setDisplaySize(entity.width * scale, entity.height * scale);

    // Hide collected obstacles
    if (entity.isCollected) {
      sprite.setVisible(false);
    }
  }

  // ─── Rendering ──────────────────────────────────────────────────────

  private registerPlayerAnimations(): void {
    for (const animation of BEACH_HERO_ANIMATIONS) {
      if (this.anims.exists(animation.key)) continue;
      this.anims.create({
        key: animation.key,
        frames: animation.frames.map(frame => ({ key: BEACH_HERO_SHEET.key, frame })),
        frameRate: animation.frameRate,
        repeat: animation.repeat,
      });
    }
  }

  private queuePlayerAnimation(id: BeachHeroAnimationId, durationMs: number): void {
    this.playerAnimationOverride = { id, until: Date.now() + durationMs };
    this.playPlayerAnimation(id, true);
  }

  private playPlayerAnimation(id: BeachHeroAnimationId, restart = false): void {
    const key = BEACH_HERO_ANIMATION_KEYS[id];
    if (!restart && this.currentPlayerAnimationKey === key) return;
    this.playerSprite.play(key, !restart);
    this.currentPlayerAnimationKey = key;
  }

  private resolvePlayerAnimation(now: number): BeachHeroAnimationId {
    if (this.playerAnimationOverride) {
      if (now < this.playerAnimationOverride.until) {
        return this.playerAnimationOverride.id;
      }
      this.playerAnimationOverride = null;
    }

    return resolveBeachHeroAnimation({
      status: this.status,
      isDucking: this.isDucking,
      isAirborne: this.playerY > 1,
      verticalVelocity: this.playerVy,
      isHurt: false,
      isThrowingShell: false,
      isBossDefeating: this.bossDefeating,
      isMoving: this.speed > 0 && !this.gameOver,
    });
  }

  /**
   * Update player sprite position and size based on current state.
   */
  private updatePlayerSprite(): void {
    const scale = RunnerScene.ENTITY_SCALE;
    const now = Date.now();
    const position = getBeachHeroSpritePosition({
      playerX: this.playerX,
      groundYScreen: this.groundYScreen,
      playerY: this.playerY,
      scale,
    });
    const displaySize = getBeachHeroDisplaySize(scale);

    const animation = this.resolvePlayerAnimation(now);
    this.playPlayerAnimation(animation);

    this.playerSprite.setPosition(position.x, position.y);
    this.playerSprite.setDisplaySize(displaySize.width, displaySize.height);
    this.playerSprite.setAlpha(
      now < this.invincibleUntil && this.status !== GameStatus.GAMEOVER && Math.floor(now / 90) % 2 === 0
        ? 0.58
        : 1,
    );
  }

  // ─── Boss fight (Task 1.7) ──────────────────────────────────────────

  /**
   * Trigger the boss fight. Clears obstacles, spawns the boss entity,
   * switches status to BOSS_FIGHT.
   */
  private triggerBossFight(now: number): void {
    const bossCfg = this.levelConfig.boss;

    // Clear all obstacles and their graphics
    for (const obs of this.obstacles) {
      const gfx = this.obstacleGraphics.get(obs.id);
      if (gfx) { gfx.destroy(); this.obstacleGraphics.delete(obs.id); }
    }
    this.obstacles = [];

    this.status = GameStatus.BOSS_FIGHT;
    this.emitStatusChange(GameStatus.BOSS_FIGHT);

    this.bossHealth = bossCfg.health;
    this.bossMaxHealth = bossCfg.health;
    this.bossFightStartTime = now;
    this.bossDefeating = false;

    this.boss = {
      id: 999,
      type: 'BOSS',
      x: this.canvasWidth - 450,
      y: this.themeGroundY + bossCfg.spawnYOffset,
      width: bossCfg.width,
      height: bossCfg.height,
      speed: 0,
      isPassed: false,
      health: bossCfg.health,
      maxHealth: bossCfg.health,
    };

    // Create boss sprite
    const bossY = this.boss.y ?? this.themeGroundY;
    const bossScreenY = this.groundYScreen - (bossY - this.themeGroundY) - this.boss.height;
    this.bossSprite = this.add.image(this.boss.x, bossScreenY, 'boss')
      .setDisplaySize(bossCfg.width, bossCfg.height)
      .setOrigin(0, 0)
      .setDepth(8);
    this.bossHealthBarBg = this.add.graphics();
    this.bossHealthBarBg.setDepth(9);

    this.shellAmmo = getBossStartingShellAmmo(this.shellAmmo, bossCfg.health, bossCfg.damagePerHit);
    this.lastBossShellSpawn = Date.now();
    this.emitHudUpdate({ shellAmmo: this.shellAmmo } satisfies HudUpdatePayload);

    // 2-second intro delay before boss attacks
    this.bossAttackStartTime = Date.now() + 1200;

    // Discoverability hint
    const hint = this.add.text(this.canvasWidth / 2, this.canvasHeight / 3, 'Press DOWN to throw shells!', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({ targets: hint, alpha: 0, delay: 2500, duration: 500, onComplete: () => hint.destroy() });

    this.audio.playSfx('boss_alert');
    this.effects.shake(0.02, 200);
    this.audio.setBossMode(true);
  }

  /**
   * Spawn boss projectiles during BOSS_FIGHT.
   * Uses computeBossProjectileSpawnRate to decide when to fire.
   */
  private updateBossProjectileSpawning(now: number): void {
    if (!this.boss || this.bossDefeating) return;
    if (Date.now() < this.bossAttackStartTime) return;

    const bossCfg = this.levelConfig.boss;
    const healthPercent = this.bossHealth / bossCfg.health;
    const lowLives = this.gameScore.lives <= this.tuning.lowLivesThreshold;
    const elapsed = now - this.bossFightStartTime;
    const introProgress = Math.min(elapsed / this.tuning.bossIntroEaseMs, 1);

    // Boss projectile spawn interval
    let bossSpawnInterval = 1400 - (introProgress * 300);
    if (lowLives) bossSpawnInterval += 180;

    if (now - this.nextSpawnTime < bossSpawnInterval) return;
    this.nextSpawnTime = now;

    const spawnRate = computeBossProjectileSpawnRate(
      healthPercent, bossCfg, introProgress, lowLives,
    );

    if (Math.random() < spawnRate) {
      const projDef = this.getObstacleDef(this.bossProjectileObstacleType);
      const pw = projDef?.width ?? 100;
      const ph = projDef?.height ?? 100;
      const aimX = this.playerX + 24 + 40; // matches resolvePlayerAnchor.projectileAimX

      const projectile = createBossProjectileObstacle({
        boss: this.boss,
        groundY: this.themeGroundY,
        playerY: this.playerY,
        bossCfg,
        healthPercent,
        introProgress,
        lowLives,
        projWidth: pw,
        projHeight: ph,
        projectileType: this.bossProjectileObstacleType,
        projectileAimX: aimX,
      });

      this.obstacles.push(projectile);
      this.createObstacleGraphics(projectile);
      this.showBossState(BEACH_BOSS_TEXTURES.attack, 180);

      const bossFaceX = this.boss.x + this.boss.width * 0.5;
      const bossFaceY = (this.boss.y ?? 0) + this.boss.height * 0.85;
      const bossFaceScreenY = this.groundYScreen - (bossFaceY - this.themeGroundY);
      this.effects.spawnParticles(bossFaceX, bossFaceScreenY, 0x8b4513, 8);
      this.audio.playSfx('poop_launch');
      this.effects.shake(0.005, 60);
    }
  }

  /**
   * Update boss position (sway + bob) each frame during BOSS_FIGHT.
   */
  private updateBossFight(_now: number, time: number): void {
    if (!this.boss || this.bossDefeating) return;

    const bossCfg = this.levelConfig.boss;
    const pose = computeBossWorldPose({
      time,
      windowInnerWidth: this.canvasWidth,
      groundY: this.themeGroundY,
      bossCfg,
      bossHealth: this.bossHealth,
    });

    this.boss.x = pose.x;
    this.boss.y = pose.y;
    this.boss.health = this.bossHealth;

    // Update boss sprite and health bar
    this.drawBoss();
  }

  /**
   * Update the boss sprite position and health bar.
   */
  private drawBoss(): void {
    if (!this.boss || !this.bossSprite || !this.bossHealthBarBg) return;

    const bossY = this.boss.y ?? this.themeGroundY;
    const screenX = this.boss.x;
    const screenY = this.groundYScreen - (bossY - this.themeGroundY) - this.boss.height;

    // Update boss sprite position
    this.bossSprite.setPosition(screenX, screenY);
    this.bossSprite.setDisplaySize(this.boss.width, this.boss.height);

    // Health bar above boss
    this.bossHealthBarBg.clear();
    const barWidth = this.boss.width;
    const barHeight = 12;
    const barX = screenX;
    const barY = screenY - 20;
    const healthPercent = Math.max(0, this.bossHealth / this.bossMaxHealth);

    // Background (red)
    this.bossHealthBarBg.fillStyle(0xcc0000, 1);
    this.bossHealthBarBg.fillRect(barX, barY, barWidth, barHeight);

    // Foreground (green proportional to health)
    this.bossHealthBarBg.fillStyle(0x00cc00, 1);
    this.bossHealthBarBg.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    // Border
    this.bossHealthBarBg.lineStyle(2, 0x000000, 1);
    this.bossHealthBarBg.strokeRect(barX, barY, barWidth, barHeight);
  }

  /**
   * Player shoots a shell bullet toward the boss (triggered by duck/ArrowDown during BOSS_FIGHT).
   * Consumes one shell ammo per shot.
   */
  private shootShell(): void {
    if (this.shellAmmo <= 0) return;
    const now = Date.now();
    if (now - this.lastShotTime < 150) return;
    this.lastShotTime = now;
    this.shellAmmo -= 1;
    this.queuePlayerAnimation('shellThrow', 260);

    this.audio.playSfx('shoot');

    const scale = RunnerScene.ENTITY_SCALE;
    const display = getBeachHeroDisplaySize(scale);
    const bulletSize = RunnerScene.SHELL_BULLET_DISPLAY_SIZE;

    const bullet: Bullet = {
      id: now + Math.random(),
      x: this.playerX + display.width * 0.62,
      y: this.themeGroundY + this.playerY + RunnerScene.SHELL_BULLET_Y_OFFSET,
      speed: 18,
      size: bulletSize,
    };

    this.bullets.push(bullet);

    // Render at screen coords (bullet.y is in collision coords: groundY + playerY + offset)
    const screenY = this.groundYScreen - (bullet.y - this.themeGroundY);
    const trail = this.add.graphics().setDepth(12);
    this.bulletGraphics.set(bullet.id, trail);
    const img = this.add.image(bullet.x, screenY, BEACH_SHELL_PROJECTILE_TEXTURE)
      .setDisplaySize(bulletSize, bulletSize)
      .setDepth(13);
    this.bulletSprites.set(bullet.id, img);

    // Update HUD
    this.emitHudUpdate({ shellAmmo: this.shellAmmo } satisfies HudUpdatePayload);
  }

  private updateBossShellAmmo(now: number): void {
    if (this.status !== GameStatus.BOSS_FIGHT) return;
    if (!shouldRefillBossShellAmmo({
      ammo: this.shellAmmo,
      bossAttackStartTime: this.bossAttackStartTime,
      isDefeating: this.bossDefeating,
      lastRefillAt: this.lastBossShellSpawn,
      now,
    })) {
      return;
    }

    this.lastBossShellSpawn = now;
    this.shellAmmo += 1;
    this.emitHudUpdate({ shellAmmo: this.shellAmmo } satisfies HudUpdatePayload);
    this.effects.spawnParticles(this.playerX + 70, this.groundYScreen - 70, 0xfff1c9, 10, 220);
    this.audio.playSfx('coin');
  }

  /**
   * Update bullets: move rightward, check boss collision, remove off-screen.
   */
  private updateBullets(): void {
    if (this.bullets.length === 0) return;

    const removeIds: number[] = [];

    for (const b of this.bullets) {
      b.x += b.speed;

      // Check boss collision
      if (this.boss && this.status === GameStatus.BOSS_FIGHT && !this.bossDefeating) {
        const bossY = this.boss.y ?? this.themeGroundY;
        const hit =
          b.x > this.boss.x &&
          b.x < this.boss.x + this.boss.width &&
          b.y > bossY &&
          b.y < bossY + this.boss.height;

        if (hit) {
          removeIds.push(b.id);
          this.bossHealth -= this.levelConfig.boss.damagePerHit;

          // Hit effects
          const hitScreenY = this.groundYScreen - (b.y - this.themeGroundY);
          this.effects.spawnParticles(b.x, hitScreenY, 0xff6600, 25, 300);
          this.effects.shake(0.02, 100);
          this.effects.freezeFrame(40);
          this.audio.playSfx('boss_hit');

          // Check for boss defeat
          if (this.bossHealth <= 0 && !this.bossDefeating) {
            this.audio.playSfx('mult');
            this.effects.shake(0.04, 300);
            this.effects.freezeFrame(200);
            this.gameScore.coins = 0;
            this.gameScore.multiplier += 3;

            this.bossDefeating = true;
            this.queuePlayerAnimation('victory', 1200);
            this.bossSprite
              ?.setTexture(BEACH_BOSS_TEXTURES.defeat)
              .setDepth(6);
            this.bossHealthBarBg?.clear();
            this.defeatAnimationStart = Date.now();
            this.defeatPoopsSpawned = 0;
            this.defeatPoops = [];

            // Clear boss projectiles
            this.obstacles = this.obstacles.filter(o => {
              const def = this.getObstacleDef(o.type as ObstacleType);
              if (obstacleHasBehavior(def, 'arcProjectile')) {
                const gfx = this.obstacleGraphics.get(o.id);
                if (gfx) { gfx.destroy(); this.obstacleGraphics.delete(o.id); }
                return false;
              }
              return true;
            });
          } else {
            this.showBossState(BEACH_BOSS_TEXTURES.hit, 160);
          }
          continue;
        }
      }

      // Off-screen removal
      if (b.x > this.canvasWidth + 100) {
        removeIds.push(b.id);
      }
    }

    // Remove spent/off-screen bullets
    if (removeIds.length > 0) {
      const removeSet = new Set(removeIds);
      this.bullets = this.bullets.filter(b => {
        if (removeSet.has(b.id)) {
          const sprite = this.bulletSprites.get(b.id);
          if (sprite) { sprite.destroy(); this.bulletSprites.delete(b.id); }
          const trail = this.bulletGraphics.get(b.id);
          if (trail) { trail.destroy(); this.bulletGraphics.delete(b.id); }
          return false;
        }
        return true;
      });
    }

    // Update bullet sprite positions
    for (const b of this.bullets) {
      const sprite = this.bulletSprites.get(b.id);
      if (sprite) {
        const screenY = this.groundYScreen - (b.y - this.themeGroundY);
        sprite.setPosition(b.x, screenY);
        sprite.setAngle((b.x * 1.8) % 360);
        const trail = this.bulletGraphics.get(b.id);
        if (trail) {
          trail.clear();
          trail.lineStyle(8, 0xfff1a8, 0.78);
          trail.lineBetween(b.x - RunnerScene.SHELL_BULLET_TRAIL_LENGTH, screenY + 4, b.x - 10, screenY);
          trail.lineStyle(3, 0xffffff, 0.92);
          trail.lineBetween(b.x - RunnerScene.SHELL_BULLET_TRAIL_LENGTH * 0.75, screenY - 2, b.x - 6, screenY - 5);
        }
      }
    }
  }

  /**
   * Boss defeat animation: poop pyramid burial.
   * Preserves the legacy runner boss-finish sequence.
   */
  private updateBossDefeatAnimation(now: number, frames: number): void {
    if (!this.boss) return;

    const animationElapsed = now - this.defeatAnimationStart;
    const POOP_SIZE = 45;
    const TOTAL_POOPS = 60;
    const SPAWN_INTERVAL = 45;
    const SPAWN_DURATION = TOTAL_POOPS * SPAWN_INTERVAL;
    const MAX_ROWS = 11;

    // Spawn poops progressively
    const poopsToSpawn = Math.min(TOTAL_POOPS, Math.floor(animationElapsed / SPAWN_INTERVAL));

    if (this.defeatPoopsSpawned < poopsToSpawn) {
      const bossY = this.boss.y ?? this.themeGroundY;
      const bossCenter = this.boss.x + this.boss.width / 2;
      const bossBottom = bossY;
      const poopIndex = this.defeatPoopsSpawned;

      // Determine which row and position in row
      let row = 0;
      let posInRow = 0;
      let countInPrevRows = 0;
      for (let r = 0; r < MAX_ROWS; r++) {
        const rowSize = r + 1;
        if (poopIndex < countInPrevRows + rowSize) {
          row = r;
          posInRow = poopIndex - countInPrevRows;
          break;
        }
        countInPrevRows += rowSize;
      }

      // Calculate target position (pyramid stacking from bottom)
      const rowSize = row + 1;
      const rowWidth = rowSize * POOP_SIZE * 0.85;
      const startX = bossCenter - rowWidth / 2;
      const targetX = startX + posInRow * POOP_SIZE * 0.85 + POOP_SIZE / 2;
      const targetY = bossBottom + (MAX_ROWS - 1 - row) * POOP_SIZE * 0.6;

      // Spawn from random position above
      const spawnX = bossCenter + (Math.random() - 0.5) * 300;
      const spawnY = bossY + 400 + Math.random() * 200;

      const newPoop = {
        id: now + this.defeatPoopsSpawned,
        x: spawnX,
        y: spawnY,
        targetX,
        targetY,
        vy: 0,
        size: POOP_SIZE + Math.random() * 10,
        landed: false,
        rotation: Math.random() * 360,
      };

      this.defeatPoops.push(newPoop);
      const gfx = this.add.graphics();
      gfx.setDepth(10);
      this.defeatPoopGraphics.set(newPoop.id, gfx);
      this.defeatPoopsSpawned++;

      if (this.defeatPoopsSpawned % 3 === 0) {
        this.audio.playSfx('poop_launch');
      }
    }

    // Update poop positions (animate falling)
    for (const poop of this.defeatPoops) {
      if (poop.landed) continue;

      const gravity = 0.6;
      poop.vy += gravity;
      poop.y -= poop.vy * frames; // moving down = decreasing y in DOM coords
      poop.x += (poop.targetX - poop.x) * 0.05;
      poop.rotation += 4;

      if (poop.y <= poop.targetY) {
        poop.y = poop.targetY;
        poop.x = poop.targetX;
        poop.vy = 0;
        poop.landed = true;
        this.effects.shake(0.005, 40);
      }
    }

    // Redraw defeat poops
    for (const poop of this.defeatPoops) {
      const gfx = this.defeatPoopGraphics.get(poop.id);
      if (gfx) {
        gfx.clear();
        const screenY = this.groundYScreen - (poop.y - this.themeGroundY) - poop.size;
        gfx.fillStyle(0x8b4513, 1);
        gfx.fillCircle(poop.x, screenY + poop.size / 2, poop.size / 2);
      }
    }

    // Check if animation is complete
    const allLanded = this.defeatPoops.length === TOTAL_POOPS &&
      this.defeatPoops.every(p => p.landed);
    const minAnimationTime = SPAWN_DURATION + 8500;

    if (allLanded && animationElapsed > minAnimationTime) {
      // Clean up boss visuals
      this.bossSprite?.destroy();
      this.bossSprite = null;
      this.bossHealthBarBg?.destroy();
      this.bossHealthBarBg = null;
      this.defeatPoopGraphics.forEach(g => g.destroy());
      this.defeatPoopGraphics.clear();
      this.defeatPoops = [];
      this.boss = null;
      this.bossDefeating = false;

      this.audio.setBossMode(false);

      // Emit victory
      const finalScore = Math.floor(this.score / 10);
      const gameScore: GameScore = {
        current: finalScore,
        high: 0,
        coins: this.gameScore.coins,
        multiplier: this.gameScore.multiplier,
        streak: this.gameScore.streak,
        lives: this.gameScore.lives,
      };

      this.emitLevelComplete({
        finalScore,
        gameScore,
        victoryType: 'boss',
      });
      this.status = GameStatus.VICTORY;
      this.emitStatusChange(GameStatus.VICTORY);
      this.gameOver = true; // Stop the update loop
    }
  }

  // ─── Background parallax (Task 1.9) ───────────────────────────────

  private updateEnvironmentParallax(frames: number): void {
    const step = this.speed * this.speedMultiplier * frames;
    this.envSand.tilePositionX += step * 0.85;
    this.envFoam.tilePositionX += step * 0.45;
    this.envOcean.tilePositionX += step * 0.16;
  }

  /**
   * Spawn background entities at timed intervals.
   * Normal interval during PLAYING, boss interval during BOSS_FIGHT.
   */
  private updateBackgroundSpawning(now: number): void {
    const isBossFight = this.status === GameStatus.BOSS_FIGHT;
    const bgCfg = this.levelConfig.background;
    const spawnInterval = isBossFight ? bgCfg.spawnInterval.boss : bgCfg.spawnInterval.normal;

    if (this.status !== GameStatus.PLAYING && !isBossFight) return;
    if (now - this.lastBackgroundSpawnTime < spawnInterval) return;

    this.lastBackgroundSpawnTime = now;

    const getBgEntityDef = (t: BackgroundEntityType) =>
      bgCfg.entities.find(e => e.type === t);

    const spawned = spawnBackgroundEntities({
      isChaosMode: isBossFight,
      gameSpeed: this.speed,
      innerWidth: this.canvasWidth,
      innerHeight: this.canvasHeight,
      getBgEntityDef,
      background: bgCfg,
    });

    for (const ent of spawned) {
      this.backgroundEntities.push(ent);
      this.spawnBgSprite(ent);
    }
  }

  private spawnBgSprite(ent: BackgroundEntity): void {
    let textureKey = RunnerScene.BG_SPRITE_MAP[ent.type] ?? 'env-cloud-1';
    if (ent.type === 'CLOUD' && Math.random() < 0.5) textureKey = 'env-cloud-2';

    const depth = RunnerScene.BG_DEPTH[ent.depth ?? 'mid'] ?? 2;
    const alpha = ent.isChaos ? 0.86 : (RunnerScene.BG_ALPHA[ent.type] ?? 0.58);

    const sprite = this.add.image(ent.x, ent.y, textureKey)
      .setDisplaySize(ent.width, ent.height)
      .setDepth(depth)
      .setAlpha(alpha);

    // Boats bob gently
    if (ent.type === 'BOAT' || ent.type === 'BOAT_SINKING') {
      this.tweens.add({ targets: sprite, y: sprite.y + 3, yoyo: true, repeat: -1, duration: 2000, ease: 'Sine.easeInOut' });
    }

    this.bgSprites.set(ent.id, sprite);
  }

  /**
   * Move background entities and remove off-screen ones.
   */
  private updateBackgroundMovement(): void {
    const removeIds: number[] = [];
    const isActive = this.status === GameStatus.PLAYING || this.status === GameStatus.BOSS_FIGHT;
    const speedMult = isActive ? 1.0 : 0.1;

    for (const bg of this.backgroundEntities) {
      if (bg.spawnEdge === 'left') {
        bg.x += bg.speed * speedMult;
        if (bg.x > this.canvasWidth + 200) removeIds.push(bg.id);
      } else {
        bg.x -= bg.speed * speedMult;
        if (bg.x < -1500) removeIds.push(bg.id);
      }
    }

    // Remove off-screen
    if (removeIds.length > 0) {
      const removeSet = new Set(removeIds);
      this.backgroundEntities = this.backgroundEntities.filter(bg => {
        if (removeSet.has(bg.id)) {
          const sprite = this.bgSprites.get(bg.id);
          if (sprite) { sprite.destroy(); this.bgSprites.delete(bg.id); }
          return false;
        }
        return true;
      });
    }

    // Update sprite positions
    for (const bg of this.backgroundEntities) {
      const sprite = this.bgSprites.get(bg.id);
      if (sprite) {
        sprite.setPosition(bg.x, bg.y);
      }
    }
  }

  /** Depth value for parallax layers */
  private static readonly BG_DEPTH: Record<string, number> = {
    far: 1,
    mid: 2,
    near: 3,
  };

  private static readonly BG_ALPHA: Record<string, number> = {
    AIRPLANE: 0.68,
    AIRPLANE_FIRE: 0.82,
    BOAT: 0.92,
    BOAT_SINKING: 0.95,
    CLOUD: 0.58,
    JETSKI: 0.9,
    SURFER: 0.68,
  };

  private static readonly BG_SPRITE_MAP: Record<string, string> = {
    ...BEACH_BACKGROUND_TEXTURES,
  };

  private showBossState(textureKey: string, durationMs: number): void {
    if (!this.bossSprite) return;
    this.bossSprite.setTexture(textureKey);
    if (textureKey === BEACH_BOSS_TEXTURES.defeat) return;

    this.time.delayedCall(durationMs, () => {
      if (this.bossSprite && !this.bossDefeating) {
        this.bossSprite.setTexture(BEACH_BOSS_TEXTURES.idle);
      }
    });
  }


  // ─── Runtime patching (dev balance panel) ───────────────────────────

  override applyRuntimePatch(patch: Record<string, unknown>): void {
    if (patch.tuning) {
      this.tuning = patch.tuning as TuningProfile;
      // Recompute boss entry threshold when tuning changes
      this.bossEntryCoins = getBossEntryCoinThreshold(this.levelConfig, this.tuning);
    }
    // React transport buttons can toggle pause — sync to scene's internal flag
    if (typeof patch.isPaused === 'boolean' && patch.isPaused !== this.isPaused) {
      this.isPaused = patch.isPaused;
    }
  }
}
