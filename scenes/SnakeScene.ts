import Phaser from 'phaser';
import { SceneBridge } from './shared/SceneBridge';
import type { SnakeSceneInitData } from './shared/bridgeProtocol';
import type { SnakeLevelConfig, GameScore, GameStatus } from '../types';
import { EffectsManager } from './shared/EffectsManager';

const DEPTH = { BG: 0, WALLS: 5, FOOD: 8, SNAKE: 10, EFFECTS: 30, HUD: 50 };

type Direction = 'up' | 'down' | 'left' | 'right';

export default class SnakeScene extends SceneBridge {
  private config!: SnakeLevelConfig;
  private lives = 3;
  private gameScore: GameScore = { current: 0, high: 0, coins: 0, multiplier: 1, streak: 0, lives: 3 };
  private isGameOver = false;
  private hasWon = false;

  // Snake state
  private snakeBody: { col: number; row: number }[] = [];
  private direction: Direction = 'right';
  private nextDirection: Direction = 'right';
  private moveTimer = 0;
  private moveInterval = 180;

  // Grid
  private walls: Set<string> = new Set();
  private food: { col: number; row: number } | null = null;
  private foodSprite: Phaser.GameObjects.Arc | null = null;

  // Rendering
  private snakeGraphics!: Phaser.GameObjects.Graphics;
  private wallGraphics!: Phaser.GameObjects.Graphics;

  /** Wall-clock run timer (temporary single-phase win until Task 8). */
  private surviveStartTime = 0;
  private timeText!: Phaser.GameObjects.Text;
  private lengthText!: Phaser.GameObjects.Text;

  private effects!: EffectsManager;

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

    const cs = this.config.cellSize;
    const { gridCols, gridRows } = this.config;

    // Background grid
    const bg = this.add.graphics().setDepth(DEPTH.BG);
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const shade = (r + c) % 2 === 0 ? 0x1e3a1e : 0x1a321a;
        bg.fillStyle(shade);
        bg.fillRect(c * cs, r * cs, cs, cs);
      }
    }

    // Border walls
    for (let c = 0; c < gridCols; c++) {
      this.walls.add(`${c},0`);
      this.walls.add(`${c},${gridRows - 1}`);
    }
    for (let r = 0; r < gridRows; r++) {
      this.walls.add(`0,${r}`);
      this.walls.add(`${gridCols - 1},${r}`);
    }

    // Random interior walls
    for (let i = 0; i < this.config.wallCount; i++) {
      const c = Phaser.Math.Between(3, gridCols - 4);
      const r = Phaser.Math.Between(3, gridRows - 4);
      this.walls.add(`${c},${r}`);
    }

    // Draw walls
    this.wallGraphics = this.add.graphics().setDepth(DEPTH.WALLS);
    this.wallGraphics.fillStyle(0x5a3a2a);
    for (const key of this.walls) {
      const [c, r] = key.split(',').map(Number);
      this.wallGraphics.fillRoundedRect(c * cs + 1, r * cs + 1, cs - 2, cs - 2, 4);
    }

    // Initialize snake in the center
    const startCol = Math.floor(gridCols / 2);
    const startRow = Math.floor(gridRows / 2);
    this.snakeBody = [];
    for (let i = 0; i < this.config.startLength; i++) {
      this.snakeBody.push({ col: startCol - i, row: startRow });
    }

    this.snakeGraphics = this.add.graphics().setDepth(DEPTH.SNAKE);

    // Spawn first food
    this.spawnFood();

    // Effects
    this.effects = new EffectsManager(this);

    // Input
    this.input.keyboard!.on('keydown-UP', () => { if (this.direction !== 'down') this.nextDirection = 'up'; });
    this.input.keyboard!.on('keydown-DOWN', () => { if (this.direction !== 'up') this.nextDirection = 'down'; });
    this.input.keyboard!.on('keydown-LEFT', () => { if (this.direction !== 'right') this.nextDirection = 'left'; });
    this.input.keyboard!.on('keydown-RIGHT', () => { if (this.direction !== 'left') this.nextDirection = 'right'; });
    this.input.keyboard!.on('keydown-P', this.togglePause, this);
    this.input.keyboard!.on('keydown-ESC', this.togglePause, this);

    // HUD
    this.timeText = this.add.text(16, 16, '', {
      fontSize: '16px', fontFamily: '"Courier New", monospace', color: '#88cc88',
    }).setDepth(DEPTH.HUD);
    this.lengthText = this.add.text(this.scale.width - 16, 16, '', {
      fontSize: '16px', fontFamily: '"Courier New", monospace', color: '#ffcc44',
    }).setOrigin(1, 0).setDepth(DEPTH.HUD);

    // Init
    this.surviveStartTime = this.time.now;
    this.gameScore.lives = this.lives;
    this.emitScoreUpdate({ ...this.gameScore });
    this.emitStatusChange('PLAYING' as GameStatus);
  }

  update(_time: number, delta: number): void {
    if (this.isGameOver || this.hasWon) return;

    this.moveTimer += delta;
    if (this.moveTimer >= this.moveInterval) {
      this.moveTimer -= this.moveInterval;
      this.moveSnake();
    }

    this.drawSnake();
    this.checkSurviveVictory();
    this.updateHud();
  }

  private moveSnake(): void {
    this.direction = this.nextDirection;

    const head = this.snakeBody[0];
    let newCol = head.col;
    let newRow = head.row;

    switch (this.direction) {
      case 'up': newRow--; break;
      case 'down': newRow++; break;
      case 'left': newCol--; break;
      case 'right': newCol++; break;
    }

    // Check wall collision
    if (this.walls.has(`${newCol},${newRow}`)) {
      this.handleDeath();
      return;
    }

    // Check self collision
    for (const seg of this.snakeBody) {
      if (seg.col === newCol && seg.row === newRow) {
        this.handleDeath();
        return;
      }
    }

    // Move head
    this.snakeBody.unshift({ col: newCol, row: newRow });

    // Check food
    if (this.food && newCol === this.food.col && newRow === this.food.row) {
      this.eatFood();
    } else {
      this.snakeBody.pop(); // remove tail (no growth)
    }
  }

  private eatFood(): void {
    if (!this.food) return;

    const cs = this.config.cellSize;
    this.gameScore.current += 10;
    this.gameScore.streak++;
    if (this.gameScore.streak % 5 === 0) {
      this.gameScore.multiplier = Math.min(this.gameScore.multiplier + 1, 5);
    }

    this.effects.spawnParticles(
      this.food.col * cs + cs / 2, this.food.row * cs + cs / 2, 0x44ff44, 8, 120
    );
    this.effects.floatingScore(
      this.food.col * cs + cs / 2, this.food.row * cs + cs / 2, '+10'
    );

    if (this.foodSprite) this.foodSprite.destroy();
    this.emitScoreUpdate({ ...this.gameScore });

    // Speed up slightly
    this.moveInterval = Math.max(this.config.minMoveInterval, this.moveInterval - 3);

    this.spawnFood();
  }

  private spawnFood(): void {
    const { gridCols, gridRows, cellSize: cs } = this.config;
    const occupied = new Set([
      ...this.walls,
      ...this.snakeBody.map(s => `${s.col},${s.row}`),
    ]);

    let col: number, row: number;
    let attempts = 0;
    do {
      col = Phaser.Math.Between(1, gridCols - 2);
      row = Phaser.Math.Between(1, gridRows - 2);
      attempts++;
    } while (occupied.has(`${col},${row}`) && attempts < 200);

    this.food = { col, row };
    this.foodSprite = this.add.circle(col * cs + cs / 2, row * cs + cs / 2, cs * 0.35, 0x44ff44)
      .setDepth(DEPTH.FOOD);

    // Pulse animation
    this.tweens.add({
      targets: this.foodSprite, scale: 1.2,
      duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  private drawSnake(): void {
    const cs = this.config.cellSize;
    this.snakeGraphics.clear();

    for (let i = 0; i < this.snakeBody.length; i++) {
      const seg = this.snakeBody[i];
      const isHead = i === 0;

      // Gradient from bright head to dimmer tail
      const t = i / Math.max(1, this.snakeBody.length - 1);
      const r = Math.floor(Phaser.Math.Linear(255, 100, t));
      const g = Math.floor(Phaser.Math.Linear(140, 80, t));
      const b = 50;
      this.snakeGraphics.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
      this.snakeGraphics.fillRoundedRect(seg.col * cs + 2, seg.row * cs + 2, cs - 4, cs - 4, isHead ? 8 : 4);

      // Head eyes
      if (isHead) {
        this.snakeGraphics.fillStyle(0xffffff);
        const cx = seg.col * cs + cs / 2;
        const cy = seg.row * cs + cs / 2;
        const eyeOff = this.direction === 'left' ? -6 : this.direction === 'right' ? 6 : 0;
        const eyeOffY = this.direction === 'up' ? -6 : this.direction === 'down' ? 6 : 0;
        this.snakeGraphics.fillCircle(cx + eyeOff - 4, cy + eyeOffY - 2, 3);
        this.snakeGraphics.fillCircle(cx + eyeOff + 4, cy + eyeOffY - 2, 3);
      }
    }
  }

  private handleDeath(): void {
    this.lives--;
    this.gameScore.lives = this.lives;
    this.gameScore.streak = 0;
    this.gameScore.multiplier = 1;

    const head = this.snakeBody[0];
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

    // Reset snake
    const startCol = Math.floor(this.config.gridCols / 2);
    const startRow = Math.floor(this.config.gridRows / 2);
    this.snakeBody = [];
    for (let i = 0; i < this.config.startLength; i++) {
      this.snakeBody.push({ col: startCol - i, row: startRow });
    }
    this.direction = 'right';
    this.nextDirection = 'right';
    this.moveInterval = this.config.baseMoveInterval;
  }

  private checkSurviveVictory(): void {
    const elapsed = this.time.now - this.surviveStartTime;
    const winAfterMs = this.config.normalPhaseMs + this.config.finaleDurationMs;
    if (elapsed >= winAfterMs) {
      this.hasWon = true;
      this.effects.spawnParticles(this.scale.width / 2, this.scale.height / 2, 0x44ff44, 25, 300);
      this.emitLevelComplete({
        levelId: 'GARDEN_SNAKE',
        finalScore: this.gameScore.current,
        gameScore: { ...this.gameScore },
        victoryType: 'goal',
      });
    }
  }

  private updateHud(): void {
    const elapsed = Math.floor((this.time.now - this.surviveStartTime) / 1000);
    const totalSec = Math.floor((this.config.normalPhaseMs + this.config.finaleDurationMs) / 1000);
    const remaining = Math.max(0, totalSec - elapsed);
    this.timeText.setText(`Survive: ${remaining}s`);
    this.lengthText.setText(`Length: ${this.snakeBody.length}`);
  }

  private togglePause(): void {
    if (this.isGameOver || this.hasWon) return;
    const paused = !this.scene.isPaused();
    if (paused) this.scene.pause(); else this.scene.resume();
    this.emitHudUpdate({ isPaused: paused });
  }

  applyRuntimePatch(patch: Record<string, unknown>): void {
    if (typeof patch.isPaused === 'boolean') {
      if (patch.isPaused && !this.scene.isPaused()) this.scene.pause();
      else if (!patch.isPaused && this.scene.isPaused()) this.scene.resume();
    }
  }
}
