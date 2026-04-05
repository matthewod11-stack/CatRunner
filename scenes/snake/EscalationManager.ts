import type { Scene } from 'phaser';
import type { SnakeLevelConfig } from '../../types';
import type { SceneManager } from './types';
import { moveIntervalAfterElapsed, shouldAddExtraWallNow } from './escalation';
import type { WallManager } from './WallManager';

export class EscalationManager implements SceneManager {
  private prevElapsedMs = 0;
  private moveInterval = 0;

  constructor(
    _scene: Scene,
    private readonly config: SnakeLevelConfig,
    private readonly wallManager: WallManager,
    private readonly getOccupiedKeys: () => Set<string>,
  ) {}

  create(): void {
    this.prevElapsedMs = 0;
    this.moveInterval = this.config.baseMoveInterval;
  }

  update(_time: number, _delta: number): void {}

  destroy(): void {
    this.prevElapsedMs = 0;
    this.moveInterval = this.config.baseMoveInterval;
  }

  tick(elapsedSinceRunStartMs: number): void {
    const { config } = this;
    const escElapsed = Math.min(elapsedSinceRunStartMs, config.normalPhaseMs);
    const e = config.escalation;
    this.moveInterval = moveIntervalAfterElapsed(
      config.baseMoveInterval,
      config.minMoveInterval,
      escElapsed,
      e.speedStepEveryMs,
      e.speedStepAmount,
    );

    if (
      elapsedSinceRunStartMs < config.normalPhaseMs &&
      shouldAddExtraWallNow(
        elapsedSinceRunStartMs,
        this.prevElapsedMs,
        e.extraWallAtElapsedMs,
      )
    ) {
      const occupied = this.getOccupiedKeys();
      const exclude = new Set<string>([...this.wallManager.getWalls(), ...occupied]);
      this.wallManager.tryAddInteriorWall(exclude);
    }

    this.prevElapsedMs = elapsedSinceRunStartMs;
  }

  getMoveInterval(): number {
    return this.moveInterval;
  }
}
