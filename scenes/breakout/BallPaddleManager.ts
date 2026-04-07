import Phaser from 'phaser';
import type { BreakoutLevelConfig } from '../../types';
import { CAT_TEXTURE_KEY } from '../shared/SpriteLoader';
import { DEPTH, type SceneManager } from './types';

type BallLostKind = 'primary' | 'extra';

/**
 * Paddle movement, primary + extra balls, launch, reflection, power-up modifiers.
 */
export class BallPaddleManager implements SceneManager {
  private paddle!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private ball!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private readonly extraBalls: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody[] = [];

  private ballSpeed = 350;
  private ballLaunched = false;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  private wideUntil = 0;
  private slowUntil = 0;
  private stickyNextHit = false;

  private readonly onWorldBounds: (
    body: Phaser.Physics.Arcade.Body,
    up: boolean,
    down: boolean
  ) => void;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: BreakoutLevelConfig,
    private readonly onBallLostBottom: (ball: Phaser.GameObjects.GameObject, kind: BallLostKind) => void,
    private readonly onLaunch?: () => void
  ) {
    this.onWorldBounds = (body, _up, down) => {
      if (!down) return;
      const go = body.gameObject;
      if (go === this.ball && this.ballLaunched) {
        this.onBallLostBottom(go, 'primary');
        return;
      }
      const xi = this.extraBalls.indexOf(go as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody);
      if (xi >= 0) {
        this.onBallLostBottom(go, 'extra');
      }
    };
  }

  create(): void {
    const { width, height } = this.scene.scale;
    this.ensureTextures();

    this.ballSpeed = this.config.ballConfig.speed;

    const pConf = this.config.paddleConfig;
    const hasCat = this.scene.textures.exists(CAT_TEXTURE_KEY);
    this.paddle = this.scene.physics.add
      .sprite(width / 2, height - pConf.y, hasCat ? CAT_TEXTURE_KEY : 'paddle')
      .setDisplaySize(pConf.width, pConf.height)
      .setDepth(DEPTH.PADDLE)
      .setImmovable(true)
      .setCollideWorldBounds(true);
    this.paddle.body.setAllowGravity(false);

    const bConf = this.config.ballConfig;
    this.ball = this.scene.physics.add
      .sprite(width / 2, height - pConf.y - 20, 'ball')
      .setDisplaySize(bConf.radius * 2, bConf.radius * 2)
      .setDepth(DEPTH.BALL)
      .setCollideWorldBounds(true)
      .setBounce(1, 1);
    this.ball.body.setAllowGravity(false);
    this.applyBallMaxVelocity();

    this.ball.body.onWorldBounds = true;
    for (const b of this.extraBalls) b.body.onWorldBounds = true;

    this.scene.physics.world.on('worldbounds', this.onWorldBounds);

    this.cursors = this.scene.input.keyboard!.createCursorKeys();
  }

  getPaddle(): Phaser.Types.Physics.Arcade.SpriteWithDynamicBody {
    return this.paddle;
  }

  getBall(): Phaser.Types.Physics.Arcade.SpriteWithDynamicBody {
    return this.ball;
  }

  /** Primary first, then extras — for brick / paddle colliders. */
  getAllBalls(): Phaser.Types.Physics.Arcade.SpriteWithDynamicBody[] {
    return [this.ball, ...this.extraBalls];
  }

  isLaunched(): boolean {
    return this.ballLaunched;
  }

  setLaunched(value: boolean): void {
    this.ballLaunched = value;
  }

  getBallSpeed(): number {
    return this.ballSpeed;
  }

  setBallSpeed(speed: number): void {
    this.ballSpeed = Math.min(this.config.ballConfig.maxSpeed, speed);
  }

  bumpSpeedAfterBrick(): void {
    this.ballSpeed = Math.min(
      this.config.ballConfig.maxSpeed,
      this.ballSpeed + this.config.ballConfig.speedIncrement
    );
  }

  resetBallSpeedToBase(): void {
    this.ballSpeed = this.config.ballConfig.speed;
  }

  attachBallToPaddle(): void {
    this.ball.body.setVelocity(0, 0);
    this.ball.setPosition(this.paddle.x, this.paddle.y - 20);
  }

  removeExtraBall(ball: Phaser.GameObjects.GameObject): void {
    const spr = ball as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    const i = this.extraBalls.indexOf(spr);
    if (i < 0) return;
    this.extraBalls.splice(i, 1);
    spr.destroy();
  }

  clearExtraBalls(): void {
    for (const b of this.extraBalls) b.destroy();
    this.extraBalls.length = 0;
  }

  spawnExtraBall(): boolean {
    const maxBalls = this.config.powerups?.maxBalls ?? 3;
    const total = 1 + this.extraBalls.length;
    if (total >= maxBalls) return false;

    const bConf = this.config.ballConfig;
    const spr = this.scene.physics.add.sprite(this.paddle.x, this.paddle.y - 20, 'ball');
    spr.setDisplaySize(bConf.radius * 2, bConf.radius * 2);
    spr.setDepth(DEPTH.BALL);
    spr.setCollideWorldBounds(true);
    spr.setBounce(1, 1);
    spr.body.setAllowGravity(false);
    this.applyBallMaxVelocityForBody(spr.body as Phaser.Physics.Arcade.Body);
    spr.body.onWorldBounds = true;

    const angle = Phaser.Math.FloatBetween(-0.3, 0.3);
    spr.body.setVelocity(Math.sin(angle) * this.ballSpeed, -this.ballSpeed);

    this.extraBalls.push(spr as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody);
    return true;
  }

  applyWidePaddle(durationMs: number, scale: number): void {
    const pConf = this.config.paddleConfig;
    this.wideUntil = this.scene.time.now + durationMs;
    this.paddle.setDisplaySize(pConf.width * scale, pConf.height);
  }

  applySlowBall(durationMs: number): void {
    this.slowUntil = this.scene.time.now + durationMs;
    this.applyBallMaxVelocity();
  }

  setStickyNextHit(): void {
    this.stickyNextHit = true;
  }

  tryLaunch(): boolean {
    if (this.ballLaunched) return false;
    if (!Phaser.Input.Keyboard.JustDown(this.cursors.space!)) return false;

    this.ballLaunched = true;
    const angle = Phaser.Math.FloatBetween(-0.3, 0.3);
    this.ball.body.setVelocity(Math.sin(angle) * this.ballSpeed, -this.ballSpeed);
    this.onLaunch?.();
    return true;
  }

  handlePaddleMove(): void {
    const speed = this.config.paddleConfig.speed;
    if (this.cursors.left.isDown) {
      this.paddle.body.setVelocityX(-speed);
    } else if (this.cursors.right.isDown) {
      this.paddle.body.setVelocityX(speed);
    } else {
      this.paddle.body.setVelocityX(0);
    }
  }

  updatePreLaunchBall(): void {
    if (!this.ballLaunched) {
      this.ball.x = this.paddle.x;
      this.ball.y = this.paddle.y - 20;
    }
  }

  onBallHitPaddle(ball: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody): void {
    if (this.stickyNextHit && ball === this.ball) {
      this.stickyNextHit = false;
      this.ballLaunched = false;
      this.attachBallToPaddle();
      return;
    }

    const halfW = this.paddle.displayWidth / 2;
    const diff = ball.x - this.paddle.x;
    const normalized = halfW > 0 ? diff / halfW : 0;
    const angle = normalized * 1.2;

    const speed = Math.sqrt(ball.body.velocity.x ** 2 + ball.body.velocity.y ** 2);
    ball.body.setVelocity(Math.sin(angle) * speed, -Math.abs(Math.cos(angle) * speed));
  }

  update(_time: number, _delta: number): void {
    const now = this.scene.time.now;
    const pConf = this.config.paddleConfig;

    if (this.wideUntil !== 0 && now >= this.wideUntil) {
      this.wideUntil = 0;
      this.paddle.setDisplaySize(pConf.width, pConf.height);
    }

    if (this.slowUntil !== 0 && now >= this.slowUntil) {
      this.slowUntil = 0;
    }
    this.applyBallMaxVelocity();

    this.handlePaddleMove();
    this.tryLaunch();
    this.updatePreLaunchBall();
  }

  destroy(): void {
    this.scene.physics.world.off('worldbounds', this.onWorldBounds);
    this.clearExtraBalls();
    this.paddle.destroy();
    this.ball.destroy();
  }

  private applyBallMaxVelocity(): void {
    this.applyBallMaxVelocityForBody(this.ball.body as Phaser.Physics.Arcade.Body);
    for (const b of this.extraBalls) {
      this.applyBallMaxVelocityForBody(b.body as Phaser.Physics.Arcade.Body);
    }
  }

  private applyBallMaxVelocityForBody(body: Phaser.Physics.Arcade.Body): void {
    const max = this.config.ballConfig.maxSpeed;
    const slowActive = this.slowUntil !== 0 && this.scene.time.now < this.slowUntil;
    const factor = slowActive ? (this.config.powerups?.slowMaxSpeedFactor ?? 0.55) : 1;
    const v = max * factor;
    body.setMaxVelocity(v, v);
  }

  private ensureTextures(): void {
    if (!this.scene.textures.exists('paddle')) {
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(0xff8844);
      g.fillRoundedRect(
        0,
        0,
        this.config.paddleConfig.width,
        this.config.paddleConfig.height,
        4
      );
      g.generateTexture('paddle', this.config.paddleConfig.width, this.config.paddleConfig.height);
      g.destroy();
    }

    if (!this.scene.textures.exists('ball')) {
      const r = this.config.ballConfig.radius;
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(0xffcc44);
      g.fillCircle(r, r, r);
      g.lineStyle(1, 0xff9900, 0.5);
      g.arc(r, r, r * 0.6, 0, Math.PI * 1.5);
      g.strokePath();
      g.generateTexture('ball', r * 2, r * 2);
      g.destroy();
    }
  }
}
