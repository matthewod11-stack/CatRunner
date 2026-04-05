import Phaser from 'phaser';
import type { FroggerLevelConfig, FroggerLane } from '../../types';
import { CAT_TEXTURE_KEY } from '../shared/SpriteLoader';
import type { SceneManager } from './types';
import { DEPTH } from './types';

export class FroggerPlayerController implements SceneManager {
  private gridCol = 0;
  private gridRow = 0;
  private isMoving = false;
  private player!: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private togglePauseBound!: () => void;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: FroggerLevelConfig,
    private readonly getLanes: () => FroggerLane[],
    private readonly onHopStart: () => void,
    private readonly onHopLand: () => void,
    private readonly onTogglePause: () => void
  ) {}

  create(): void {
    this.gridCol = this.config.startCol;
    this.gridRow = 0;
    this.isMoving = false;
    const lanes = this.getLanes();
    const cs = this.config.cellSize;
    const px = this.gridCol * cs + cs / 2;
    const py = this.rowCenterY(0, lanes, cs);
    const hasCat = this.scene.textures.exists(CAT_TEXTURE_KEY);
    if (hasCat) {
      this.player = this.scene.add
        .sprite(px, py, CAT_TEXTURE_KEY)
        .setDisplaySize(cs - 8, cs - 8)
        .setDepth(DEPTH.PLAYER);
    } else {
      this.player = this.scene.add
        .rectangle(px, py, cs - 8, cs - 8, 0xff8844)
        .setDepth(DEPTH.PLAYER);
    }
    this.cursors = this.scene.input.keyboard!.createCursorKeys();
    this.togglePauseBound = () => this.onTogglePause();
    this.scene.input.keyboard!.on('keydown-P', this.togglePauseBound, this);
    this.scene.input.keyboard!.on('keydown-ESC', this.togglePauseBound, this);
  }

  /** Re-snap after layout change (same grid indices). */
  snapToGrid(cellSize: number): void {
    const lanes = this.getLanes();
    const x = this.gridCol * cellSize + cellSize / 2;
    const y = this.rowCenterY(this.gridRow, lanes, cellSize);
    this.player.setPosition(x, y);
  }

  private rowCenterY(row: number, lanes: FroggerLane[], cellSize: number): number {
    const lane = lanes[row];
    return lane ? lane.y + cellSize / 2 : 600 + cellSize / 2;
  }

  update(): void {
    if (this.isMoving) return;
    const lanes = this.getLanes();
    if (lanes.length === 0) return;
    const cs = this.config.cellSize;
    const w = this.scene.scale.width;
    const maxCol = Math.max(0, Math.floor(w / cs) - 1);

    let targetRow = this.gridRow;
    let targetCol = this.gridCol;
    let moved = false;

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      targetRow = Math.min(this.gridRow + 1, lanes.length - 1);
      moved = true;
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      targetRow = Math.max(this.gridRow - 1, 0);
      moved = true;
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      targetCol = Math.max(this.gridCol - 1, 0);
      moved = true;
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      targetCol = Math.min(this.gridCol + 1, maxCol);
      moved = true;
    }

    if (!moved || (targetRow === this.gridRow && targetCol === this.gridCol)) return;

    this.isMoving = true;
    this.gridRow = targetRow;
    this.gridCol = targetCol;
    this.onHopStart();

    const targetX = targetCol * cs + cs / 2;
    const targetY = this.rowCenterY(targetRow, lanes, cs);

    this.scene.tweens.add({
      targets: this.player,
      x: targetX,
      y: targetY,
      duration: 120,
      ease: 'Power1',
      onComplete: () => {
        this.isMoving = false;
        this.onHopLand();
      },
    });
  }

  getGridRow(): number {
    return this.gridRow;
  }

  getGridCol(): number {
    return this.gridCol;
  }

  getPlayer(): Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle {
    return this.player;
  }

  isHopInProgress(): boolean {
    return this.isMoving;
  }

  resetToStart(cellSize: number, startCol: number): void {
    this.gridRow = 0;
    this.gridCol = startCol;
    this.isMoving = false;
    this.snapToGrid(cellSize);
  }

  destroy(): void {
    this.scene.input.keyboard?.off('keydown-P', this.togglePauseBound, this);
    this.scene.input.keyboard?.off('keydown-ESC', this.togglePauseBound, this);
    this.player?.destroy();
  }
}
