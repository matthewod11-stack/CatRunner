import Phaser from 'phaser';
import { SceneBridge } from './shared/SceneBridge';
import type { RunnerSceneInitData } from './shared/bridgeProtocol';
import { GameStatus } from '../types';
import type { LevelConfig, GameScore } from '../types';
import type { TuningProfile } from '../systems/tuning/defaultTuning';

/**
 * Phaser scene for the endless-runner genre (BEACH level and future runner levels).
 * Ports the gameplay from components/GameEngine.tsx into Phaser's renderer.
 *
 * Phase 1 builds this incrementally — each task adds one system.
 *
 * Tasks 1.2 + 1.11: Player physics (custom per-frame, NOT Arcade) and input.
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
  private isJumping = false;
  private isDucking = false;
  private isHurt = false;
  private invincibleUntil = 0;

  // ── Game state ──
  private speed = 0;
  private isPaused = false;
  private gameScore: GameScore = {
    current: 0,
    high: 0,
    coins: 0,
    multiplier: 1,
    streak: 0,
    lives: 3,
  };

  // ── Player visual ──
  private playerGraphics!: Phaser.GameObjects.Graphics;

  // ── Cached layout values ──
  private playerX = 100; // playerAnchorLeftPx from theme, default 100
  private groundYScreen = 0; // Phaser screen-space Y of ground line
  private canvasHeight = 0;
  private canvasWidth = 0;
  private themeGroundY = 0; // DOM engine groundY (distance from bottom)

  // ── Player dimensions ──
  private static readonly PLAYER_W = 160;
  private static readonly PLAYER_H_NORMAL = 200;
  private static readonly PLAYER_H_DUCK = 90;

  // ── Input keys ──
  private keySpace!: Phaser.Input.Keyboard.Key;
  private keyUp!: Phaser.Input.Keyboard.Key;
  private keyDown!: Phaser.Input.Keyboard.Key;
  private keyP!: Phaser.Input.Keyboard.Key;
  private keyEsc!: Phaser.Input.Keyboard.Key;

  // ── Ground + sky visuals ──
  private groundRect!: Phaser.GameObjects.Rectangle;
  private skyRect!: Phaser.GameObjects.Rectangle;

  init(data: RunnerSceneInitData): void {
    super.init(data);
    this.levelConfig = data.levelConfig;
    this.tuning = data.tuning;
    this.initialLives = data.initialLives;
    this.startAtBoss = data.startAtBoss;

    if (data.onTelemetryReady) {
      // Telemetry wiring — filled in when telemetry is ported
    }
  }

  preload(): void {
    // Cat sprite, obstacle textures, audio — filled in by later tasks
  }

  create(): void {
    const { width, height } = this.scale;
    this.canvasWidth = width;
    this.canvasHeight = height;

    // Cache layout
    this.playerX = this.levelConfig.theme.playerAnchorLeftPx ?? 100;
    this.themeGroundY = this.levelConfig.theme.groundY;
    this.groundYScreen = height - this.themeGroundY;

    // ── Sky background ──
    const [skyTop, skyBottom] = this.levelConfig.theme.skyGradient;
    // Phaser Graphics gradient fill for sky
    const skyGfx = this.add.graphics();
    const topColor = Phaser.Display.Color.HexStringToColor(skyTop).color;
    const bottomColor = Phaser.Display.Color.HexStringToColor(skyBottom).color;
    skyGfx.fillGradientStyle(topColor, topColor, bottomColor, bottomColor, 1);
    skyGfx.fillRect(0, 0, width, this.groundYScreen);
    // Keep a reference rectangle behind the gradient (used for depth ordering)
    this.skyRect = this.add.rectangle(width / 2, this.groundYScreen / 2, width, this.groundYScreen);
    this.skyRect.setVisible(false); // gradient handles the visual

    // ── Ground ──
    const groundHeight = this.themeGroundY;
    this.groundRect = this.add.rectangle(
      width / 2,
      this.groundYScreen + groundHeight / 2,
      width,
      groundHeight,
      0xf5deb3, // Beach sand color
    );

    // ── Player visual (colored rectangle placeholder) ──
    this.playerGraphics = this.add.graphics();
    this.drawPlayer();

    // ── Input: keyboard ──
    const kb = this.input.keyboard!;
    this.keySpace = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyUp = kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.keyDown = kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.keyP = kb.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.keyEsc = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // Prevent space from scrolling the page
    this.keySpace.on('down', (event: KeyboardEvent) => {
      event.preventDefault();
    });

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
    this.playerY = 0;
    this.playerVy = 0;
    this.jumpCount = 0;
    this.isJumping = false;
    this.isDucking = false;
    this.isHurt = false;
    this.invincibleUntil = 0;
    this.isPaused = false;

    // Notify React overlay that we're playing
    this.emitStatusChange(GameStatus.PLAYING);
    this.emitScoreUpdate(this.gameScore);
  }

  update(_time: number, delta: number): void {
    // ── Pause toggle (edge-triggered) ──
    if (Phaser.Input.Keyboard.JustDown(this.keyP) || Phaser.Input.Keyboard.JustDown(this.keyEsc)) {
      this.togglePause();
    }

    if (this.isPaused) return;

    // ── Input: jump (edge-triggered) ──
    if (Phaser.Input.Keyboard.JustDown(this.keySpace) || Phaser.Input.Keyboard.JustDown(this.keyUp)) {
      this.performJump();
    }

    // ── Input: duck (level-triggered) ──
    if (this.keyDown.isDown) {
      this.performDuck(true);
    } else if (!this.keyDown.isDown && this.isDucking) {
      this.performDuck(false);
    }

    // ── Physics: delta-time normalized to 60fps ──
    const frames = delta / 16.667;

    this.playerVy -= this.tuning.gravity * frames;
    this.playerY += this.playerVy * frames;

    if (this.playerY <= 0) {
      this.playerY = 0;
      this.playerVy = 0;
      this.isJumping = false;
      this.jumpCount = 0;
    }

    // ── Game speed ramp ──
    this.speed += this.tuning.speedIncrement * frames;

    // ── Redraw player at new position ──
    this.drawPlayer();

    // ── HUD bridge: emit current score (scoring filled in Task 1.4) ──
    this.emitScoreUpdate(this.gameScore);
  }

  // ─── Player actions ─────────────────────────────────────────────────

  private performJump(): void {
    if (this.jumpCount < 2) {
      this.playerVy = this.tuning.jumpForce;
      this.jumpCount += 1;
      this.isJumping = true;
      this.isDucking = false;
    }
  }

  private performDuck(ducking: boolean): void {
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

  // ─── Rendering ──────────────────────────────────────────────────────

  private drawPlayer(): void {
    this.playerGraphics.clear();

    const h = this.isDucking ? RunnerScene.PLAYER_H_DUCK : RunnerScene.PLAYER_H_NORMAL;
    const w = RunnerScene.PLAYER_W;

    // Convert DOM engine coords (y=0 ground, +y up) to Phaser coords (y=0 top, +y down)
    const screenY = this.groundYScreen - this.playerY - h;

    // Cat body color (orange tabby placeholder)
    this.playerGraphics.fillStyle(0xff8c00, 1);
    this.playerGraphics.fillRoundedRect(this.playerX, screenY, w, h, 12);

    // Simple face details when not ducking
    if (!this.isDucking) {
      // Eyes
      this.playerGraphics.fillStyle(0xffffff, 1);
      this.playerGraphics.fillCircle(this.playerX + w * 0.35, screenY + h * 0.3, 12);
      this.playerGraphics.fillCircle(this.playerX + w * 0.65, screenY + h * 0.3, 12);
      // Pupils
      this.playerGraphics.fillStyle(0x1a1a1a, 1);
      this.playerGraphics.fillCircle(this.playerX + w * 0.38, screenY + h * 0.3, 5);
      this.playerGraphics.fillCircle(this.playerX + w * 0.68, screenY + h * 0.3, 5);
      // Nose
      this.playerGraphics.fillStyle(0xff69b4, 1);
      this.playerGraphics.fillTriangle(
        this.playerX + w * 0.5, screenY + h * 0.42,
        this.playerX + w * 0.45, screenY + h * 0.38,
        this.playerX + w * 0.55, screenY + h * 0.38,
      );
      // Ears (triangles on top)
      this.playerGraphics.fillStyle(0xff8c00, 1);
      this.playerGraphics.fillTriangle(
        this.playerX + 15, screenY,
        this.playerX + 35, screenY - 25,
        this.playerX + 55, screenY,
      );
      this.playerGraphics.fillTriangle(
        this.playerX + w - 15, screenY,
        this.playerX + w - 35, screenY - 25,
        this.playerX + w - 55, screenY,
      );
    }
  }

  // ─── Runtime patching (dev balance panel) ───────────────────────────

  override applyRuntimePatch(patch: Record<string, unknown>): void {
    if (patch.tuning) {
      this.tuning = patch.tuning as TuningProfile;
    }
  }
}
