import type { SceneManager } from './types';

/** Reserved for decoys / environmental hazards — no-op in v1. */
export class WhackHazardManager implements SceneManager {
  create(): void {}

  update(_time: number, _delta: number): void {}

  destroy(): void {}
}
