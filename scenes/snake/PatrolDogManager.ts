import Phaser from 'phaser';
import type { SnakeLevelConfig } from '../../types';
import type { SceneManager } from './types';
import { DEPTH } from './types';
import {
  pickLongestPatrolSegment,
  patrolCell,
  stepPatrol,
  type PatrolSegment,
  type PatrolState,
} from './patrolPath';
import type { WallManager } from './WallManager';

const DOG_FILL = 0x8b4513;

export class PatrolDogManager implements SceneManager {
  private active = false;
  private segment: PatrolSegment | null = null;
  private patrolState: PatrolState | null = null;
  private graphics: Phaser.GameObjects.Graphics | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: SnakeLevelConfig,
    private readonly wallManager: WallManager,
  ) {}

  create(): void {
    if (this.graphics) {
      this.graphics.destroy();
    }
    this.graphics = this.scene.add.graphics().setDepth(DEPTH.DOG);
  }

  update(_time: number, _delta: number): void {}

  destroy(): void {
    this.stop();
    if (this.graphics) {
      this.graphics.destroy();
      this.graphics = null;
    }
  }

  start(): void {
    if (this.active) return;

    const walls = this.wallManager.getWalls();
    const seg = pickLongestPatrolSegment(
      this.config.gridCols,
      this.config.gridRows,
      walls,
      () => Math.random(),
    );
    if (!seg) return;

    const varying = Phaser.Math.Between(seg.a, seg.b);
    const direction = (Math.random() < 0.5 ? 1 : -1) as 1 | -1;

    this.segment = seg;
    this.patrolState = { varying, direction };
    this.active = true;
    this.redrawDog();
  }

  onSnakeTick(): void {
    if (!this.active || !this.segment || !this.patrolState) return;
    this.patrolState = stepPatrol(this.segment, this.patrolState);
    this.redrawDog();
  }

  getCell(): { col: number; row: number } | null {
    if (!this.active || !this.segment || !this.patrolState) return null;
    return patrolCell(this.segment, this.patrolState);
  }

  isActive(): boolean {
    return this.active;
  }

  stop(): void {
    this.active = false;
    this.segment = null;
    this.patrolState = null;
    this.graphics?.clear();
  }

  private redrawDog(): void {
    if (!this.graphics || !this.segment || !this.patrolState) return;
    const cell = patrolCell(this.segment, this.patrolState);
    const cs = this.config.cellSize;
    this.graphics.clear();
    this.graphics.fillStyle(DOG_FILL);
    this.graphics.fillRoundedRect(
      cell.col * cs + 1,
      cell.row * cs + 1,
      cs - 2,
      cs - 2,
      4,
    );
  }
}
