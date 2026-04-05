import Phaser from 'phaser';
import type { SnakeLevelConfig } from '../../types';
import type { SceneManager } from './types';
import { DEPTH, gridKey } from './types';

type Direction = 'up' | 'down' | 'left' | 'right';

export class SnakeSimManager implements SceneManager {
  private snakeBody: { col: number; row: number }[] = [];
  private direction: Direction = 'right';
  private nextDirection: Direction = 'right';
  private snakeGraphics: Phaser.GameObjects.Graphics | null = null;

  private readonly onKeyUp = () => this.setNextDirection('up');
  private readonly onKeyDown = () => this.setNextDirection('down');
  private readonly onKeyLeft = () => this.setNextDirection('left');
  private readonly onKeyRight = () => this.setNextDirection('right');

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: SnakeLevelConfig,
  ) {}

  create(): void {
    const { gridCols, gridRows, startLength } = this.config;

    if (this.snakeGraphics) {
      this.snakeGraphics.destroy();
    }
    this.snakeGraphics = this.scene.add.graphics().setDepth(DEPTH.SNAKE);

    const startCol = Math.floor(gridCols / 2);
    const startRow = Math.floor(gridRows / 2);
    this.snakeBody = [];
    for (let i = 0; i < startLength; i++) {
      this.snakeBody.push({ col: startCol - i, row: startRow });
    }
    this.direction = 'right';
    this.nextDirection = 'right';

    const kb = this.scene.input.keyboard;
    if (kb) {
      kb.on('keydown-UP', this.onKeyUp);
      kb.on('keydown-DOWN', this.onKeyDown);
      kb.on('keydown-LEFT', this.onKeyLeft);
      kb.on('keydown-RIGHT', this.onKeyRight);
    }
  }

  update(_time: number, _delta: number): void {}

  destroy(): void {
    const kb = this.scene.input.keyboard;
    if (kb) {
      kb.off('keydown-UP', this.onKeyUp);
      kb.off('keydown-DOWN', this.onKeyDown);
      kb.off('keydown-LEFT', this.onKeyLeft);
      kb.off('keydown-RIGHT', this.onKeyRight);
    }
    if (this.snakeGraphics) {
      this.snakeGraphics.destroy();
      this.snakeGraphics = null;
    }
    this.snakeBody = [];
  }

  getBody(): { col: number; row: number }[] {
    return this.snakeBody;
  }

  getDirection(): Direction {
    return this.direction;
  }

  resetToCenter(): void {
    const { gridCols, gridRows, startLength } = this.config;
    const startCol = Math.floor(gridCols / 2);
    const startRow = Math.floor(gridRows / 2);
    this.snakeBody = [];
    for (let i = 0; i < startLength; i++) {
      this.snakeBody.push({ col: startCol - i, row: startRow });
    }
    this.direction = 'right';
    this.nextDirection = 'right';
  }

  /**
   * One grid step: apply queued direction, wall/self check, grow on food when enabled.
   */
  stepMove(
    walls: Set<string>,
    food: { col: number; row: number } | null,
    eatEnabled: boolean,
  ): { hitWallOrSelf: boolean; ate: boolean } {
    this.direction = this.nextDirection;

    const head = this.snakeBody[0];
    let newCol = head.col;
    let newRow = head.row;

    switch (this.direction) {
      case 'up':
        newRow--;
        break;
      case 'down':
        newRow++;
        break;
      case 'left':
        newCol--;
        break;
      case 'right':
        newCol++;
        break;
    }

    if (walls.has(gridKey(newCol, newRow))) {
      return { hitWallOrSelf: true, ate: false };
    }

    for (const seg of this.snakeBody) {
      if (seg.col === newCol && seg.row === newRow) {
        return { hitWallOrSelf: true, ate: false };
      }
    }

    this.snakeBody.unshift({ col: newCol, row: newRow });

    const ate =
      Boolean(food && eatEnabled && newCol === food.col && newRow === food.row);
    if (!ate) {
      this.snakeBody.pop();
    }

    return { hitWallOrSelf: false, ate };
  }

  drawSnake(): void {
    if (!this.snakeGraphics) return;

    const cs = this.config.cellSize;
    this.snakeGraphics.clear();

    for (let i = 0; i < this.snakeBody.length; i++) {
      const seg = this.snakeBody[i];
      const isHead = i === 0;

      const t = i / Math.max(1, this.snakeBody.length - 1);
      const r = Math.floor(Phaser.Math.Linear(255, 100, t));
      const g = Math.floor(Phaser.Math.Linear(140, 80, t));
      const b = 50;
      this.snakeGraphics.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
      this.snakeGraphics.fillRoundedRect(
        seg.col * cs + 2,
        seg.row * cs + 2,
        cs - 4,
        cs - 4,
        isHead ? 8 : 4,
      );

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

  private setNextDirection(next: Direction): void {
    if (next === 'up' && this.direction === 'down') return;
    if (next === 'down' && this.direction === 'up') return;
    if (next === 'left' && this.direction === 'right') return;
    if (next === 'right' && this.direction === 'left') return;
    this.nextDirection = next;
  }
}
