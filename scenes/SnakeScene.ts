import Phaser from 'phaser';
import { SceneBridge } from './shared/SceneBridge';
import type { SnakeSceneInitData } from './shared/bridgeProtocol';
import type { GameScore, GameStatus, SnakeLevelConfig } from '../types';
import { EffectsManager } from './shared/EffectsManager';
import { GridRenderManager } from './snake/GridRenderManager';
import { WallManager } from './snake/WallManager';
import { FoodManager } from './snake/FoodManager';
import { EscalationManager } from './snake/EscalationManager';
import { PhaseController } from './snake/PhaseController';
import { PatrolDogManager } from './snake/PatrolDogManager';
import { SnakeSimManager } from './snake/SnakeSimManager';
import { DEPTH, gridKey } from './snake/types';

export default class SnakeScene extends SceneBridge {
  private config!: SnakeLevelConfig;
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

  private moveTimer = 0;
  private moveInterval = 180;

  private grid!: GridRenderManager;
  private wall!: WallManager;
  private food!: FoodManager;
  private escalation!: EscalationManager;
  private phase!: PhaseController;
  private dog!: PatrolDogManager;
  private snakeSim!: SnakeSimManager;

  private effects!: EffectsManager;

  private timeText!: Phaser.GameObjects.Text;
  private lengthText!: Phaser.GameObjects.Text;

  init(data: SnakeSceneInitData): void {
    super.init(data);
    this.config = data.levelConfig;
    this.lives = data.initialLives ?? this.config.startLives;
  }

  preload(): void {
    EffectsManager.createParticleTexture(this);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(this.config.bgColor);
    this.moveInterval = this.config.baseMoveInterval;

    this.grid = new GridRenderManager(this, this.config);
    this.wall = new WallManager(this, this.config);
    this.snakeSim = new SnakeSimManager(this, this.config);
    this.food = new FoodManager(this, this.config);
    this.dog = new PatrolDogManager(this, this.config, this.wall);

    const getOccupiedKeys = () => {
      const s = new Set<string>();
      for (const seg of this.snakeSim.getBody()) {
        s.add(gridKey(seg.col, seg.row));
      }
      const f = this.food.getFood();
      if (f) s.add(gridKey(f.col, f.row));
      return s;
    };

    this.escalation = new EscalationManager(this, this.config, this.wall, getOccupiedKeys);
    this.phase = new PhaseController(this.config, () => this.time.now, () => {
      this.food.clear();
      this.dog.start();
    });

    this.grid.create();
    this.wall.create();
    this.snakeSim.create();
    this.food.create();
    this.dog.create();
    this.escalation.create();
    this.phase.create();

    const exclude = new Set<string>([
      ...this.wall.getWalls(),
      ...this.snakeSim.getBody().map((seg) => gridKey(seg.col, seg.row)),
    ]);
    this.food.spawn(exclude);

    this.effects = new EffectsManager(this);

    this.input.keyboard!.on('keydown-P', this.togglePause, this);
    this.input.keyboard!.on('keydown-ESC', this.togglePause, this);

    this.timeText = this.add
      .text(16, 16, '', {
        fontSize: '16px',
        fontFamily: '"Courier New", monospace',
        color: '#88cc88',
      })
      .setDepth(DEPTH.HUD);
    this.lengthText = this.add
      .text(this.scale.width - 16, 16, '', {
        fontSize: '16px',
        fontFamily: '"Courier New", monospace',
        color: '#ffcc44',
      })
      .setOrigin(1, 0)
      .setDepth(DEPTH.HUD);

    this.gameScore.lives = this.lives;
    this.emitScoreUpdate({ ...this.gameScore });
    this.emitStatusChange('PLAYING' as GameStatus);
  }

  update(_time: number, delta: number): void {
    if (this.isGameOver || this.hasWon) return;

    this.phase.update(_time, delta);
    if (this.phase.hasWon()) {
      if (!this.hasWon) {
        this.hasWon = true;
        this.effects.spawnParticles(this.scale.width / 2, this.scale.height / 2, 0x44ff44, 25, 300);
        this.emitLevelComplete({
          levelId: 'GARDEN_SNAKE',
          finalScore: this.gameScore.current,
          gameScore: { ...this.gameScore },
          victoryType: 'goal',
        });
      }
      return;
    }

    this.escalation.tick(this.phase.getRunElapsedMs());
    this.moveInterval = this.escalation.getMoveInterval();

    this.moveTimer += delta;
    if (this.moveTimer >= this.moveInterval) {
      this.moveTimer -= this.moveInterval;

      const walls = this.wall.getWalls();
      const foodPos = this.food.getFood();
      const eatEnabled = !this.phase.isFinale();
      const result = this.snakeSim.stepMove(walls, foodPos, eatEnabled);

      if (result.hitWallOrSelf) {
        this.handleDeath();
      } else {
        if (this.phase.isFinale() && this.dog.isActive()) {
          this.dog.onSnakeTick();
        }
        const head = this.snakeSim.getBody()[0];
        const dogCell = this.dog.getCell();
        if (dogCell && head.col === dogCell.col && head.row === dogCell.row) {
          this.handleDeath();
        } else if (result.ate) {
          this.eatFood();
        }
      }
    }

    this.snakeSim.drawSnake();
    this.updateHud();
  }

  private eatFood(): void {
    const foodPos = this.food.getFood();
    if (!foodPos) return;

    const cs = this.config.cellSize;
    this.gameScore.current += 10;
    this.gameScore.streak++;
    if (this.gameScore.streak % 5 === 0) {
      this.gameScore.multiplier = Math.min(this.gameScore.multiplier + 1, 5);
    }

    this.effects.spawnParticles(
      foodPos.col * cs + cs / 2,
      foodPos.row * cs + cs / 2,
      0x44ff44,
      8,
      120,
    );
    this.effects.floatingScore(foodPos.col * cs + cs / 2, foodPos.row * cs + cs / 2, '+10');

    this.emitScoreUpdate({ ...this.gameScore });

    const exclude = new Set<string>([
      ...this.wall.getWalls(),
      ...this.snakeSim.getBody().map((seg) => gridKey(seg.col, seg.row)),
    ]);
    this.food.spawn(exclude);
  }

  private handleDeath(): void {
    this.lives--;
    this.gameScore.lives = this.lives;
    this.gameScore.streak = 0;
    this.gameScore.multiplier = 1;

    const head = this.snakeSim.getBody()[0];
    const cs = this.config.cellSize;
    this.effects.flash(0xff0000, 200);
    this.effects.shake(0.015, 150);
    this.effects.spawnParticles(head.col * cs + cs / 2, head.row * cs + cs / 2, 0xff4444, 10, 150);

    this.emitLivesChanged(this.lives);
    this.emitScoreUpdate({ ...this.gameScore });

    if (this.lives <= 0) {
      this.isGameOver = true;
      this.emitGameOver(this.gameScore.current);
      return;
    }

    this.snakeSim.resetToCenter();
  }

  private updateHud(): void {
    if (!this.phase.isFinale()) {
      this.timeText.setText(`Until patrol: ${this.phase.getNormalRemainingSec()}s`);
    } else {
      this.timeText.setText(`Patrol: ${this.phase.getFinaleRemainingSec()}s`);
    }
    this.lengthText.setText(`Length: ${this.snakeSim.getBody().length}`);
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
