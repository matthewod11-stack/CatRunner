import Phaser from 'phaser';
import { SceneBridge } from './shared/SceneBridge';
import type { FroggerSceneInitData } from './shared/bridgeProtocol';
import { PhaserAudio } from './shared/PhaserAudio';
import type { FroggerLane, FroggerLevelConfig, GameScore, GameStatus } from '../types';
import { loadCatSprite } from './shared/SpriteLoader';
import { EffectsManager } from './shared/EffectsManager';
import { activePhaseIndex } from './frogger/phaseIndex';
import { hazardOverlap } from './frogger/collisionRules';
import {
  scoreAfterHigherRow,
  scoreAfterCrossing,
} from './frogger/scoring';
import { afterReachingGoal } from './frogger/crossingStateMachine';
import { FroggerBackground } from './frogger/FroggerBackground';
import { FroggerLaneView } from './frogger/FroggerLaneView';
import { FroggerTrafficManager } from './frogger/FroggerTrafficManager';
import { FroggerTimerManager } from './frogger/FroggerTimerManager';
import { FroggerPlayerController } from './frogger/FroggerPlayerController';
import { DEPTH } from './frogger/types';

export default class FroggerScene extends SceneBridge {
  private declare config: FroggerLevelConfig;

  private audio!: PhaserAudio;
  private effects!: EffectsManager;
  private bg!: FroggerBackground;
  private laneView!: FroggerLaneView;
  private traffic!: FroggerTrafficManager;
  private timer!: FroggerTimerManager;
  private player!: FroggerPlayerController;

  private crossingsCompleted = 0;
  private highestRow = 0;
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
  private lowTimeWarned = false;

  private timerText!: Phaser.GameObjects.Text;
  private crossingText!: Phaser.GameObjects.Text;

  init(data: FroggerSceneInitData): void {
    super.init(data);
    this.config = data.levelConfig;
    this.lives = data.initialLives ?? this.config.startLives;
  }

  preload(): void {
    loadCatSprite(this, this.catSpriteUrl);
    EffectsManager.createParticleTexture(this);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(this.config.bgColor);
    this.crossingsCompleted = 0;
    this.highestRow = 0;
    this.isGameOver = false;
    this.hasWon = false;
    this.lowTimeWarned = false;

    this.audio = new PhaserAudio(this);
    this.effects = new EffectsManager(this);

    this.bg = new FroggerBackground(this);
    this.bg.create();

    this.laneView = new FroggerLaneView(this, this.config.cellSize);
    this.traffic = new FroggerTrafficManager(this);
    this.timer = new FroggerTimerManager(this, () => this.handleDeath());

    const getLanes = () => this.activeLanes();
    this.player = new FroggerPlayerController(
      this,
      this.config,
      getLanes,
      () => {
        this.audio.playSfx('jump');
      },
      () => this.onPlayerLanded(),
      () => this.togglePause()
    );
    this.player.create();

    this.rebuildWorld();

    this.timerText = this.add
      .text(16, 16, '', {
        fontSize: '18px',
        fontFamily: '"Courier New", monospace',
        color: '#ffffff',
      })
      .setScrollFactor(0)
      .setDepth(DEPTH.HUD);

    this.crossingText = this.add
      .text(this.scale.width - 16, 16, '', {
        fontSize: '18px',
        fontFamily: '"Courier New", monospace',
        color: '#ffaa44',
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH.HUD);

    this.gameScore.lives = this.lives;
    this.emitScoreUpdate({ ...this.gameScore });
    this.emitStatusChange('PLAYING' as GameStatus);

    if (this.config.timeLimit > 0) {
      this.timer.start(this.config.timeLimit);
    }

    this.events.once('shutdown', () => this.shutdownManagers());
  }

  private shutdownManagers(): void {
    this.timer.stop();
    this.audio.destroy();
  }

  private activeLanes(): FroggerLane[] {
    const pi = activePhaseIndex(
      this.crossingsCompleted,
      this.config.phases.length
    );
    return this.config.phases[pi].lanes;
  }

  private rebuildWorld(): void {
    const lanes = this.activeLanes();
    const w = this.scale.width;
    this.laneView.build(lanes, w);
    this.traffic.rebuild(lanes, w, this.config.cellSize);
  }

  private onPlayerLanded(): void {
    const row = this.player.getGridRow();
    const { score, highestRow } = scoreAfterHigherRow(
      this.highestRow,
      row,
      this.gameScore.current
    );
    if (score !== this.gameScore.current) {
      this.gameScore.current = score;
      this.highestRow = highestRow;
      this.emitScoreUpdate({ ...this.gameScore });
    }
    this.checkGoalReached();
  }

  update(_time: number, delta: number): void {
    if (this.isGameOver || this.hasWon) return;
    this.player.update();
    this.traffic.update(_time, delta);
    this.checkCollisions();
    this.updateHud();
  }

  private checkCollisions(): void {
    if (this.player.isHopInProgress()) return;
    const lanes = this.activeLanes();
    const row = this.player.getGridRow();
    const lane = lanes[row];
    if (!lane || lane.kind === 'safe') return;

    const p = this.player.getPlayer();
    const halfCell = this.config.cellSize / 2;
    const playerBox = { x: p.x, y: p.y, halfCell };

    for (const e of this.traffic.getEntries()) {
      if (e.laneIndex !== row) continue;
      const halfW = e.lane.objects.width / 2;
      const halfH = e.lane.objects.height / 2;
      if (
        hazardOverlap(
          playerBox,
          { x: e.sprite.x, y: e.sprite.y, halfWidth: halfW, halfHeight: halfH },
          lane.kind
        )
      ) {
        this.handleDeath();
        return;
      }
    }
  }

  private checkGoalReached(): void {
    const lanes = this.activeLanes();
    if (this.player.getGridRow() < lanes.length - 1) return;

    this.gameScore.current = scoreAfterCrossing(this.gameScore.current);
    this.emitScoreUpdate({ ...this.gameScore });

    const outcome = afterReachingGoal({
      crossingsCompleted: this.crossingsCompleted,
      crossingsToWin: this.config.crossingsToWin,
    });

    const px = this.player.getPlayer().x;
    const py = this.player.getPlayer().y;
    this.effects.spawnParticles(px, py, 0xffaa44, 15, 200);
    this.effects.floatingScore(px, py, '+100', '#ffaa44');

    if (outcome.type === 'victory') {
      this.hasWon = true;
      this.timer.stop();
      this.emitLevelComplete({
        finalScore: this.gameScore.current,
        gameScore: { ...this.gameScore },
        victoryType: 'goal',
      });
      return;
    }

    this.crossingsCompleted = outcome.nextCrossings;
    this.rebuildWorld();
    this.player.resetToStart(this.config.cellSize, this.config.startCol);
    this.highestRow = 0;
    this.lowTimeWarned = false;
    if (this.config.timeLimit > 0) {
      this.timer.start(this.config.timeLimit);
    }
  }

  private handleDeath(): void {
    if (this.hasWon || this.isGameOver) return;
    this.lives -= 1;
    this.gameScore.lives = this.lives;
    this.gameScore.streak = 0;
    this.gameScore.multiplier = 1;
    this.audio.playSfx('hit');

    const p = this.player.getPlayer();
    this.effects.flash(0xff0000, 200);
    this.effects.shake(0.015, 150);
    this.effects.spawnParticles(p.x, p.y, 0xff4444, 10, 150);

    this.emitLivesChanged(this.lives);
    this.emitScoreUpdate({ ...this.gameScore });

    if (this.lives <= 0) {
      this.isGameOver = true;
      this.timer.stop();
      this.emitGameOver(this.gameScore.current);
      return;
    }

    this.player.resetToStart(this.config.cellSize, this.config.startCol);
    this.highestRow = 0;
    this.lowTimeWarned = false;
    if (this.config.timeLimit > 0) {
      this.timer.start(this.config.timeLimit);
    }
  }

  private updateHud(): void {
    const t = this.timer.getTimeRemaining();
    const color = t <= 10 ? '#ff4444' : '#ffffff';
    this.timerText.setText(`Time: ${t}s`).setColor(color);
    if (t <= 10 && t > 0 && !this.lowTimeWarned) {
      this.lowTimeWarned = true;
      this.audio.playSfx('meow');
    }
    this.crossingText.setText(
      `${this.crossingsCompleted}/${this.config.crossingsToWin} crossings`
    );
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
