import Phaser from 'phaser';
import { SceneBridge } from './shared/SceneBridge';
import type { WhackSceneInitData } from './shared/bridgeProtocol';
import type { WhackLevelConfig, GameScore, GameStatus } from '../types';
import { EffectsManager } from './shared/EffectsManager';
import { PhaserAudio } from './shared/PhaserAudio';
import { GardenBackground } from './whack/GardenBackground';
import { GopherBossManager } from './whack/GopherBossManager';
import { HoleGridManager } from './whack/HoleGridManager';
import { MoleSpawnManager } from './whack/MoleSpawnManager';
import { WhackHazardManager } from './whack/WhackHazardManager';
import { WhackPowerupManager } from './whack/WhackPowerupManager';
import { isWavePhaseComplete, waveIndexAtElapsed } from './whack/waves';
import { DEPTH } from './whack/types';

type RunPhase = 'wave' | 'boss' | 'gameover' | 'victory';

export default class WhackScene extends SceneBridge {
  private config!: WhackLevelConfig;
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
  private phase: RunPhase = 'wave';

  private wavePhaseStartMs = 0;
  private bossPhaseStartMs = 0;
  private waveSettled = false;
  private lastWaveIdx = -1;

  private garden!: GardenBackground;
  private holes!: HoleGridManager;
  private powerups!: WhackPowerupManager;
  private hazards!: WhackHazardManager;
  private effects!: EffectsManager;
  private audio!: PhaserAudio;
  private moles!: MoleSpawnManager;
  private boss!: GopherBossManager;

  private timerText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;

  init(data: WhackSceneInitData): void {
    super.init(data);
    this.config = data.levelConfig;
    this.gameScore.lives = data.initialLives ?? this.config.startLives;
  }

  preload(): void {
    EffectsManager.createParticleTexture(this);
  }

  create(): void {
    const { width, height } = this.scale;
    const bgHex = this.config.bgColor.replace('#', '');
    this.cameras.main.setBackgroundColor(parseInt(bgHex, 16));
    this.wavePhaseStartMs = this.time.now;
    this.phase = 'wave';
    this.waveSettled = false;
    this.lastWaveIdx = -1;
    this.isGameOver = false;
    this.hasWon = false;
    this.gameScore = {
      current: 0,
      high: 0,
      coins: 0,
      multiplier: 1,
      streak: 0,
      lives: this.gameScore.lives,
    };

    this.garden = new GardenBackground(this, this.config);
    this.holes = new HoleGridManager(this, this.config);
    this.powerups = new WhackPowerupManager();
    this.hazards = new WhackHazardManager();
    this.effects = new EffectsManager(this);
    this.audio = new PhaserAudio(this);

    this.garden.create();
    this.holes.create();
    this.powerups.create();
    this.hazards.create();

    const getHoles = () => this.holes.getPositions();
    const getElapsed = () => (this.time.now - this.wavePhaseStartMs) / 1000;

    this.moles = new MoleSpawnManager(
      this,
      this.config,
      getElapsed,
      getHoles,
      this.powerups,
      this.effects,
      fn => {
        this.gameScore = fn(this.gameScore);
        this.emitScoreUpdate({ ...this.gameScore });
      },
    );
    this.moles.create();

    this.boss = new GopherBossManager(
      this,
      this.config,
      getHoles,
      this.audio,
      this.effects,
      () => this.onBossDefeated(),
    );
    this.boss.create();

    this.timerText = this.add
      .text(16, 16, '', {
        fontSize: '20px',
        fontFamily: '"Courier New", monospace',
        color: '#ffffff',
      })
      .setDepth(DEPTH.HUD);
    this.comboText = this.add
      .text(width / 2, height - 30, '', {
        fontSize: '16px',
        fontFamily: 'system-ui, sans-serif',
        color: '#ffcc44',
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.HUD);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.onTap(pointer));

    this.input.keyboard!.on('keydown-P', this.togglePause, this);
    this.input.keyboard!.on('keydown-ESC', this.togglePause, this);

    this.emitScoreUpdate({ ...this.gameScore });
    this.emitStatusChange('PLAYING' as GameStatus);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
  }

  private onShutdown(): void {
    this.moles?.destroy();
    this.boss?.destroy();
    this.hazards?.destroy();
    this.powerups?.destroy();
    this.holes?.destroy();
    this.garden?.destroy();
    this.audio?.destroy();
  }

  private getScoreTarget(): number {
    const vc = this.config.victoryCondition;
    return vc.type === 'score' ? vc.target : 400;
  }

  private onBossDefeated(): void {
    if (this.hasWon || this.isGameOver) return;
    this.hasWon = true;
    this.phase = 'victory';
    this.effects.spawnParticles(this.scale.width / 2, this.scale.height / 2, 0xffcc44, 25, 300);
    this.emitLevelComplete({
      finalScore: this.gameScore.current,
      gameScore: { ...this.gameScore },
      victoryType: 'score',
    });
  }

  update(): void {
    if (this.isGameOver || this.hasWon) return;

    const now = this.time.now;

    if (this.phase === 'wave') {
      this.moles.update(now, 0);
      this.powerups.update(now, 0);
      this.hazards.update(now, 0);

      const elapsed = (now - this.wavePhaseStartMs) / 1000;
      const wIdx = waveIndexAtElapsed(elapsed, this.config.waves);
      if (wIdx !== this.lastWaveIdx) {
        if (wIdx >= 1) {
          this.garden.flashWaveBanner(wIdx);
          this.audio.playSfx('powerup');
        }
        this.lastWaveIdx = wIdx;
      }
      this.garden.setWaveTint(wIdx);

      const waveDone =
        isWavePhaseComplete(elapsed, this.config.waves) ||
        elapsed >= this.config.wavePhaseTimeLimitSec;
      if (waveDone && !this.waveSettled) {
        this.waveSettled = true;
        this.moles.stopSpawning();
        this.moles.clearAllMoles();
        const target = this.getScoreTarget();
        if (this.gameScore.current < target) {
          this.failRun();
        } else {
          this.phase = 'boss';
          this.bossPhaseStartMs = now;
          this.boss.start();
        }
      }

      const remain = Math.max(0, Math.ceil(this.config.wavePhaseTimeLimitSec - elapsed));
      const color = remain <= 10 ? '#ff4444' : '#ffffff';
      this.timerText.setText(`Waves: ${remain}s`).setColor(color);
    } else if (this.phase === 'boss') {
      this.boss.update(now, 0);
      const limitSec = this.config.bossTimeLimitSec;
      if (limitSec > 0) {
        const left = Math.max(0, Math.ceil(limitSec - (now - this.bossPhaseStartMs) / 1000));
        const color = left <= 5 ? '#ff4444' : '#ffee88';
        this.timerText.setText(`Boss: ${left}s`).setColor(color);
        if (left <= 0 && !this.boss.isDefeated()) {
          this.failRun();
        }
      } else {
        this.timerText.setText('Boss!').setColor('#ffee88');
      }
    }

    this.comboText.setText(
      this.gameScore.streak >= 3 ? `Combo x${this.gameScore.multiplier}!` : '',
    );
  }

  private failRun(): void {
    if (this.isGameOver || this.hasWon) return;
    this.isGameOver = true;
    this.phase = 'gameover';
    this.moles.destroy();
    this.boss.destroy();
    this.audio.playSfx('hit');
    this.emitGameOver(this.gameScore.current);
  }

  private onTap(pointer: Phaser.Input.Pointer): void {
    if (this.isGameOver || this.hasWon) return;

    if (this.phase === 'wave') {
      const hit = this.moles.tryTap(pointer);
      if (hit) {
        this.audio.playSfx('coin');
        if (this.gameScore.streak > 0 && this.gameScore.streak % 3 === 0) {
          this.audio.playSfx('mult');
        }
      } else {
        this.gameScore = { ...this.gameScore, streak: 0, multiplier: 1 };
        this.emitScoreUpdate({ ...this.gameScore });
      }
    } else if (this.phase === 'boss') {
      const hit = this.boss.tryTap(pointer);
      if (!hit) {
        this.gameScore = { ...this.gameScore, streak: 0, multiplier: 1 };
        this.emitScoreUpdate({ ...this.gameScore });
      }
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
