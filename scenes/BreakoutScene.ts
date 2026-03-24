import Phaser from 'phaser';
import { SceneBridge } from './shared/SceneBridge';
import type { BreakoutSceneInitData } from './shared/bridgeProtocol';
import type { BreakoutLevelConfig, BreakoutBrick, GameScore, GameStatus } from '../types';
import { loadCatSprite, CAT_TEXTURE_KEY } from './shared/SpriteLoader';
import { EffectsManager } from './shared/EffectsManager';

// ─── Constants ──────────────────────────────────────────────────────

const DEPTH = {
  BG: 0,
  BRICKS: 10,
  BALL: 15,
  PADDLE: 20,
  EFFECTS: 30,
  HUD: 50,
};

// ─── Scene ──────────────────────────────────────────────────────────

export default class BreakoutScene extends SceneBridge {
  private config!: BreakoutLevelConfig;

  // Paddle
  private paddle!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

  // Ball
  private ball!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private ballSpeed = 350;
  private ballLaunched = false;

  // Bricks
  private brickGroup!: Phaser.Physics.Arcade.StaticGroup;
  private brickDataMap: Map<Phaser.GameObjects.GameObject, { health: number; points: number; color: number }> = new Map();
  private totalBricks = 0;

  // Deferred destruction (same pattern as ShooterScene)
  private pendingDestroys: Set<Phaser.GameObjects.GameObject> = new Set();

  // Game state
  private lives = 3;
  private gameScore: GameScore = {
    current: 0, high: 0, coins: 0,
    multiplier: 1, streak: 0, lives: 3,
  };
  private isGameOver = false;
  private hasWon = false;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  // Effects
  private effects!: EffectsManager;

  // HUD
  private launchText!: Phaser.GameObjects.Text;

  // ─── Lifecycle ──────────────────────────────────────────────────

  init(data: BreakoutSceneInitData): void {
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
    this.ballSpeed = this.config.ballConfig.speed;

    // Create textures
    this.createTextures();

    // Paddle
    const pConf = this.config.paddleConfig;
    const hasCat = this.textures.exists(CAT_TEXTURE_KEY);
    this.paddle = this.physics.add.sprite(width / 2, height - pConf.y, hasCat ? CAT_TEXTURE_KEY : 'paddle')
      .setDisplaySize(pConf.width, pConf.height)
      .setDepth(DEPTH.PADDLE)
      .setImmovable(true)
      .setCollideWorldBounds(true);
    this.paddle.body.setAllowGravity(false);

    // Ball
    const bConf = this.config.ballConfig;
    this.ball = this.physics.add.sprite(width / 2, height - pConf.y - 20, 'ball')
      .setDisplaySize(bConf.radius * 2, bConf.radius * 2)
      .setDepth(DEPTH.BALL)
      .setCollideWorldBounds(true)
      .setBounce(1, 1);
    this.ball.body.setAllowGravity(false);
    this.ball.body.setMaxVelocity(bConf.maxSpeed, bConf.maxSpeed);

    // Enable world bounds collision event for bottom detection
    this.ball.body.onWorldBounds = true;
    this.physics.world.on('worldbounds', (_body: Phaser.Physics.Arcade.Body, _up: boolean, down: boolean) => {
      if (down) this.onBallLost();
    });

    // Bricks
    this.brickGroup = this.physics.add.staticGroup();
    this.buildBricks();

    // Collisions
    this.physics.add.collider(this.ball, this.paddle, () => this.onBallHitPaddle());
    this.physics.add.collider(this.ball, this.brickGroup, (_ball, brick) => {
      this.onBallHitBrick(brick as Phaser.Physics.Arcade.Sprite);
    });

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.input.keyboard!.on('keydown-P', this.togglePause, this);
    this.input.keyboard!.on('keydown-ESC', this.togglePause, this);

    // Effects
    this.effects = new EffectsManager(this);

    // Launch instruction
    this.launchText = this.add.text(width / 2, height / 2 + 80, 'Press SPACE to launch!', {
      fontSize: '18px', fontFamily: 'system-ui, sans-serif', color: '#ffffff88',
    }).setOrigin(0.5).setDepth(DEPTH.HUD);

    // Init
    this.gameScore.lives = this.lives;
    this.emitScoreUpdate({ ...this.gameScore });
    this.emitStatusChange('PLAYING' as GameStatus);
  }

  update(): void {
    if (this.isGameOver || this.hasWon) return;

    this.handleInput();
    this.flushDestroys();

    // Pre-launch: ball follows paddle
    if (!this.ballLaunched) {
      this.ball.x = this.paddle.x;
      this.ball.y = this.paddle.y - 20;
    }

    this.checkVictory();
  }

  // ─── Textures ─────────────────────────────────────────────────

  private createTextures(): void {
    if (!this.textures.exists('paddle')) {
      const g = this.make.graphics({}, false);
      g.fillStyle(0xff8844);
      g.fillRoundedRect(0, 0, this.config.paddleConfig.width, this.config.paddleConfig.height, 4);
      g.generateTexture('paddle', this.config.paddleConfig.width, this.config.paddleConfig.height);
      g.destroy();
    }

    if (!this.textures.exists('ball')) {
      const r = this.config.ballConfig.radius;
      const g = this.make.graphics({}, false);
      g.fillStyle(0xffcc44);
      g.fillCircle(r, r, r);
      // Yarn lines
      g.lineStyle(1, 0xff9900, 0.5);
      g.arc(r, r, r * 0.6, 0, Math.PI * 1.5);
      g.strokePath();
      g.generateTexture('ball', r * 2, r * 2);
      g.destroy();
    }
  }

  // ─── Bricks ───────────────────────────────────────────────────

  private buildBricks(): void {
    const { width } = this.scale;
    const { brickWidth, brickHeight, gridCols } = this.config;
    const gridWidth = gridCols * brickWidth;
    const offsetX = (width - gridWidth) / 2;
    const offsetY = 60;

    this.totalBricks = this.config.bricks.length;

    for (const brickDef of this.config.bricks) {
      const bx = offsetX + brickDef.col * brickWidth + brickWidth / 2;
      const by = offsetY + brickDef.row * brickHeight + brickHeight / 2;

      const key = `brick-${brickDef.color.toString(16)}`;
      if (!this.textures.exists(key)) {
        const g = this.make.graphics({}, false);
        g.fillStyle(brickDef.color);
        g.fillRoundedRect(0, 0, brickWidth - 2, brickHeight - 2, 3);
        // Shine
        g.fillStyle(0xffffff, 0.15);
        g.fillRect(2, 2, brickWidth - 6, brickHeight * 0.3);
        g.generateTexture(key, brickWidth - 2, brickHeight - 2);
        g.destroy();
      }

      const brick = this.brickGroup.create(bx, by, key) as Phaser.Physics.Arcade.Sprite;
      brick.setDepth(DEPTH.BRICKS);
      brick.refreshBody();

      this.brickDataMap.set(brick, {
        health: brickDef.health,
        points: brickDef.points,
        color: brickDef.color,
      });
    }
  }

  // ─── Input ────────────────────────────────────────────────────

  private handleInput(): void {
    const speed = this.config.paddleConfig.speed;

    if (this.cursors.left.isDown) {
      this.paddle.body.setVelocityX(-speed);
    } else if (this.cursors.right.isDown) {
      this.paddle.body.setVelocityX(speed);
    } else {
      this.paddle.body.setVelocityX(0);
    }

    // Launch ball
    if (!this.ballLaunched && Phaser.Input.Keyboard.JustDown(this.cursors.space!)) {
      this.ballLaunched = true;
      // Launch at an angle
      const angle = Phaser.Math.FloatBetween(-0.3, 0.3);
      this.ball.body.setVelocity(
        Math.sin(angle) * this.ballSpeed,
        -this.ballSpeed
      );
      this.launchText.destroy();
    }
  }

  // ─── Collisions ───────────────────────────────────────────────

  private onBallHitPaddle(): void {
    // Angle based on where ball hit paddle
    const diff = this.ball.x - this.paddle.x;
    const normalized = diff / (this.config.paddleConfig.width / 2);
    const angle = normalized * 1.2; // max ~70 degrees

    const speed = Math.sqrt(this.ball.body.velocity.x ** 2 + this.ball.body.velocity.y ** 2);
    this.ball.body.setVelocity(
      Math.sin(angle) * speed,
      -Math.abs(Math.cos(angle) * speed) // always go up
    );
  }

  private onBallHitBrick(brick: Phaser.Physics.Arcade.Sprite): void {
    const data = this.brickDataMap.get(brick);
    if (!data) return;

    data.health--;

    if (data.health <= 0) {
      const cx = brick.x;
      const cy = brick.y;

      this.gameScore.current += data.points;
      this.gameScore.streak++;
      if (this.gameScore.streak % 5 === 0) {
        this.gameScore.multiplier = Math.min(this.gameScore.multiplier + 1, 5);
      }

      this.effects.spawnParticles(cx, cy, data.color, 6, 120);
      this.effects.floatingScore(cx, cy, `+${data.points}`);

      this.brickDataMap.delete(brick);
      this.deferDestroy(brick);
      this.emitScoreUpdate({ ...this.gameScore });

      // Speed up slightly
      this.ballSpeed = Math.min(this.config.ballConfig.maxSpeed, this.ballSpeed + this.config.ballConfig.speedIncrement);
    } else {
      // Tint darker to show damage
      brick.setTint(0xffffff - 0x333333 * (this.config.bricks[0].health - data.health));
    }
  }

  private onBallLost(): void {
    this.ballLaunched = false;
    this.lives--;
    this.gameScore.lives = this.lives;
    this.gameScore.streak = 0;
    this.gameScore.multiplier = 1;

    this.effects.flash(0xff0000, 200);
    this.emitLivesChanged(this.lives);
    this.emitScoreUpdate({ ...this.gameScore });

    if (this.lives <= 0) {
      this.isGameOver = true;
      this.emitGameOver(this.gameScore.current);
      return;
    }

    // Reset ball to paddle
    this.ball.body.setVelocity(0, 0);
    this.ball.setPosition(this.paddle.x, this.paddle.y - 20);
    this.ballSpeed = this.config.ballConfig.speed;

    // Show launch hint
    this.launchText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 80, 'Press SPACE to launch!', {
      fontSize: '18px', fontFamily: 'system-ui, sans-serif', color: '#ffffff88',
    }).setOrigin(0.5).setDepth(DEPTH.HUD);
  }

  // ─── Victory ──────────────────────────────────────────────────

  private checkVictory(): void {
    if (this.brickGroup.countActive() === 0 && !this.hasWon) {
      this.hasWon = true;
      this.effects.spawnParticles(this.scale.width / 2, this.scale.height / 2, 0xffcc44, 30, 300);
      this.emitLevelComplete({
        levelId: 'YARN',
        finalScore: this.gameScore.current,
        gameScore: { ...this.gameScore },
        victoryType: 'clear',
      });
    }
  }

  // ─── Deferred Destroy ─────────────────────────────────────────

  private deferDestroy(obj: Phaser.GameObjects.GameObject): void {
    if (this.pendingDestroys.has(obj)) return;
    this.pendingDestroys.add(obj);
    (obj as Phaser.Physics.Arcade.Sprite).setActive(false).setVisible(false);
    const body = (obj as Phaser.Physics.Arcade.Sprite).body;
    if (body) body.enable = false;
  }

  private flushDestroys(): void {
    for (const obj of this.pendingDestroys) obj.destroy();
    this.pendingDestroys.clear();
  }

  // ─── Pause ────────────────────────────────────────────────────

  private togglePause(): void {
    if (this.isGameOver || this.hasWon) return;
    const paused = !this.scene.isPaused();
    if (paused) this.scene.pause();
    else this.scene.resume();
    this.emitHudUpdate({ isPaused: paused });
  }

  applyRuntimePatch(patch: Record<string, unknown>): void {
    if (typeof patch.isPaused === 'boolean') {
      if (patch.isPaused && !this.scene.isPaused()) this.scene.pause();
      else if (!patch.isPaused && this.scene.isPaused()) this.scene.resume();
    }
  }
}
