import Phaser from 'phaser';
import { SceneBridge } from './shared/SceneBridge';
import type { BreakoutSceneInitData } from './shared/bridgeProtocol';
import type { BreakoutLevelConfig, BreakoutPowerupKind, GameScore, GameStatus } from '../types';
import { loadCatSprite } from './shared/SpriteLoader';
import { EffectsManager } from './shared/EffectsManager';
import { PhaserAudio } from './shared/PhaserAudio';
import { YarnBackgroundManager } from './breakout/YarnBackgroundManager';
import { BrickFieldManager, type BrickHitOutcome } from './breakout/BrickFieldManager';
import { BallPaddleManager } from './breakout/BallPaddleManager';
import { BreakoutPowerupManager } from './breakout/BreakoutPowerupManager';
import { BreakoutHazardManager } from './breakout/BreakoutHazardManager';
import { initialAliveCells, orthogonalNeighborKeys } from './breakout/brickDamage';
import { DEPTH } from './breakout/types';

export default class BreakoutScene extends SceneBridge {
  private config!: BreakoutLevelConfig;

  private backgrounds!: YarnBackgroundManager;
  private bricks!: BrickFieldManager;
  private ballPaddle!: BallPaddleManager;
  private powerups!: BreakoutPowerupManager;
  private hazards!: BreakoutHazardManager;

  private effects!: EffectsManager;
  private audio!: PhaserAudio;

  private aliveCells!: Set<string>;

  private lives = 3;
  private gameScore: GameScore = {
    current: 0,
    high: 0,
    coins: 0,
    multiplier: 1,
    streak: 0,
    lives: 3,
  };
  private isGameOver = false;
  private hasWon = false;
  private levelCompleteEmitted = false;

  private launchText: Phaser.GameObjects.Text | null = null;
  private lastFluffNudgeMs = 0;

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
    this.effects = new EffectsManager(this);
    this.audio = new PhaserAudio(this);

    this.backgrounds = new YarnBackgroundManager(this, this.config);
    this.backgrounds.create();

    this.bricks = new BrickFieldManager(this, this.config);
    this.bricks.create();
    this.aliveCells = initialAliveCells(this.config.bricks);

    this.ballPaddle = new BallPaddleManager(
      this,
      this.config,
      (ball, kind) => this.handleBallLost(ball, kind),
      () => this.clearLaunchHint()
    );
    this.ballPaddle.create();

    this.powerups = new BreakoutPowerupManager(this, this.config, {
      onCollect: (kind) => this.applyPowerup(kind),
    });
    this.powerups.create();

    this.hazards = new BreakoutHazardManager(this, this.config);
    this.hazards.create();

    for (const ball of this.ballPaddle.getAllBalls()) {
      this.physics.add.collider(ball, this.ballPaddle.getPaddle(), () => {
        this.ballPaddle.onBallHitPaddle(ball);
        this.audio.playSfx('paddle_hit');
      });

      this.physics.add.collider(ball, this.bricks.getGroup(), (_b, brick) => {
        this.onBallHitBrick(brick as Phaser.Physics.Arcade.Sprite);
      });
    }

    this.physics.add.overlap(
      this.ballPaddle.getPaddle(),
      this.powerups.getGroup(),
      (_pad, pu) => {
        this.audio.playSfx('powerup');
        this.powerups.collectSprite(pu as Phaser.Physics.Arcade.Sprite);
      }
    );

    const fluff = this.hazards.getFluff();
    if (fluff) {
      for (const ball of this.ballPaddle.getAllBalls()) {
        this.physics.add.overlap(ball, fluff, () => this.nudgeBallFromFluff(ball));
      }
    }

    this.input.keyboard!.on('keydown-P', this.togglePause, this);
    this.input.keyboard!.on('keydown-ESC', this.togglePause, this);

    this.showLaunchHint();

    this.gameScore.lives = this.lives;
    this.emitScoreUpdate({ ...this.gameScore });
    this.emitStatusChange('PLAYING' as GameStatus);
  }

  update(_time: number, delta: number): void {
    if (this.isGameOver || this.levelCompleteEmitted) return;

    this.bricks.flushDestroys();
    if (!this.hasWon) {
      this.ballPaddle.update(_time, delta);
      this.powerups.update(_time, delta);
      this.hazards.update(_time, delta);
    }

    this.checkVictory();
  }

  private showLaunchHint(): void {
    const { width, height } = this.scale;
    this.launchText = this.add
      .text(width / 2, height / 2 + 80, 'Press SPACE to launch!', {
        fontSize: '18px',
        fontFamily: 'system-ui, sans-serif',
        color: '#ffffff88',
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.HUD);
  }

  private clearLaunchHint(): void {
    this.launchText?.destroy();
    this.launchText = null;
  }

  private onBallHitBrick(brick: Phaser.Physics.Arcade.Sprite): void {
    const outcome = this.bricks.handleBallHitBrick(brick);
    if (outcome.kind === 'noop') return;

    if (outcome.kind === 'damaged') {
      this.audio.playSfx('brick_hit');
      this.applyDamagedTint(outcome);
      return;
    }

    this.audio.playSfx('brick_break');
    this.commitElimination(outcome, true);
  }

  private commitElimination(
    o: Extract<BrickHitOutcome, { kind: 'eliminated' }>,
    allowExplosive: boolean
  ): void {
    this.aliveCells.delete(`${o.col},${o.row}`);

    this.gameScore.current += o.points;
    this.gameScore.streak++;
    if (this.gameScore.streak % 5 === 0) {
      this.gameScore.multiplier = Math.min(this.gameScore.multiplier + 1, 5);
    }

    this.effects.spawnParticles(o.cx, o.cy, o.color, 6, 120);
    this.effects.floatingScore(o.cx, o.cy, `+${o.points}`);

    this.emitScoreUpdate({ ...this.gameScore });
    this.ballPaddle.bumpSpeedAfterBrick();

    const def = this.config.bricks.find((b) => b.col === o.col && b.row === o.row);
    if (def?.kind === 'POWERUP_CARRIER' && def.powerupDrop) {
      this.powerups.spawn(o.cx, o.cy, def.powerupDrop);
    }

    if (allowExplosive && o.brickKind === 'EXPLOSIVE') {
      for (const [nc, nr] of orthogonalNeighborKeys(o.col, o.row, this.aliveCells)) {
        const spr = this.bricks.getSpriteAtCell(nc, nr);
        if (!spr) continue;
        const subs = this.bricks.applyDirectDamage(spr, 1);
        for (const sub of subs) {
          if (sub.kind === 'eliminated') {
            this.audio.playSfx('brick_break');
            this.commitElimination(sub, false);
          } else if (sub.kind === 'damaged') {
            this.audio.playSfx('brick_hit');
            this.applyDamagedTint(sub);
          }
        }
      }
    }
  }

  private applyDamagedTint(
    sub: Extract<BrickHitOutcome, { kind: 'damaged' }>
  ): void {
    const steps = sub.initialHealth - sub.currentHealth;
    const tint = 0xffffff - 0x222222 * Math.min(steps, 5);
    sub.sprite.setTint(tint);
  }

  private applyPowerup(kind: BreakoutPowerupKind): void {
    const pc = this.config.powerups;
    switch (kind) {
      case 'WIDE_PADDLE':
        this.ballPaddle.applyWidePaddle(
          pc?.widePaddleDurationMs ?? 12000,
          pc?.widePaddleScale ?? 1.4
        );
        break;
      case 'SLOW_BALL':
        this.ballPaddle.applySlowBall(pc?.slowBallDurationMs ?? 6000);
        break;
      case 'STICKY_PADDLE':
        this.ballPaddle.setStickyNextHit();
        break;
      case 'MULTI_BALL':
        if (this.ballPaddle.spawnExtraBall()) {
          const balls = this.ballPaddle.getAllBalls();
          this.wireNewBallColliders(balls[balls.length - 1]);
        }
        break;
      default:
        break;
    }
  }

  /** Extra balls spawned mid-run need colliders (paddle, bricks, fluff). */
  private wireNewBallColliders(ball: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | undefined): void {
    if (!ball || !ball.body) return;
    this.physics.add.collider(ball, this.ballPaddle.getPaddle(), () => {
      this.ballPaddle.onBallHitPaddle(ball);
      this.audio.playSfx('paddle_hit');
    });
    this.physics.add.collider(ball, this.bricks.getGroup(), (_b, brick) => {
      this.onBallHitBrick(brick as Phaser.Physics.Arcade.Sprite);
    });
    const fluff = this.hazards.getFluff();
    if (fluff) {
      this.physics.add.overlap(ball, fluff, () => this.nudgeBallFromFluff(ball));
    }
  }

  private nudgeBallFromFluff(ball: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody): void {
    const rad = this.config.hazards?.fluffNudgeRad ?? 0.12;
    const now = this.time.now;
    if (now - this.lastFluffNudgeMs < 280) return;
    this.lastFluffNudgeMs = now;

    const vx = ball.body.velocity.x;
    const vy = ball.body.velocity.y;
    ball.body.setVelocity(
      vx * Math.cos(rad) - vy * Math.sin(rad),
      vx * Math.sin(rad) + vy * Math.cos(rad)
    );
  }

  private handleBallLost(ball: Phaser.GameObjects.GameObject, kind: 'primary' | 'extra'): void {
    if (kind === 'extra') {
      this.ballPaddle.removeExtraBall(ball);
      return;
    }

    if (!this.ballPaddle.isLaunched()) return;

    this.audio.playSfx('ball_lost');
    this.ballPaddle.setLaunched(false);
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

    this.ballPaddle.clearExtraBalls();
    this.ballPaddle.attachBallToPaddle();
    this.ballPaddle.resetBallSpeedToBase();
    this.clearLaunchHint();
    this.showLaunchHint();
  }

  private checkVictory(): void {
    if (this.hasWon || this.bricks.getActiveCount() !== 0) return;

    this.hasWon = true;
    this.ballPaddle.clearExtraBalls();
    for (const b of this.ballPaddle.getAllBalls()) {
      b.body.setVelocity(0, 0);
    }
    this.ballPaddle.setLaunched(false);

    const ms = this.config.finale?.enableUnravelCelebration
      ? (this.config.finale.unravelDurationMs ?? 1500)
      : 0;

    const finish = () => {
      if (this.levelCompleteEmitted) return;
      this.levelCompleteEmitted = true;
      this.effects.spawnParticles(this.scale.width / 2, this.scale.height / 2, 0xffcc44, 30, 300);
      this.emitLevelComplete({
        levelId: this.levelId,
        finalScore: this.gameScore.current,
        gameScore: { ...this.gameScore },
        victoryType: 'clear',
      });
    };

    if (ms > 0) {
      this.time.delayedCall(ms, finish);
    } else {
      finish();
    }
  }

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
