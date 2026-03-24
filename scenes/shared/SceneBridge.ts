import Phaser from 'phaser';
import type { GameScore, GameStatus, LevelCompletePayload } from '../../types';
import { BRIDGE_EVENTS } from './bridgeProtocol';
import type { SceneInitData, HudUpdatePayload } from './bridgeProtocol';

// Re-export protocol types so consumers can import everything from SceneBridge
export { BRIDGE_EVENTS } from './bridgeProtocol';
export type { SceneInitData, RunnerSceneInitData, PlatformerSceneInitData, LauncherSceneInitData, ShooterSceneInitData } from './bridgeProtocol';

export abstract class SceneBridge extends Phaser.Scene {
  protected levelId!: string;
  protected catSpriteUrl: string | null = null;

  init(data: SceneInitData): void {
    this.levelId = data.levelId;
    this.catSpriteUrl = data.catSpriteUrl;
  }

  protected emitScoreUpdate(score: GameScore): void {
    this.events.emit(BRIDGE_EVENTS.SCORE_UPDATE, score);
  }

  protected emitLivesChanged(lives: number): void {
    this.events.emit(BRIDGE_EVENTS.LIVES_CHANGED, lives);
  }

  protected emitLevelComplete(payload: LevelCompletePayload): void {
    this.events.emit(BRIDGE_EVENTS.LEVEL_COMPLETE, payload);
  }

  protected emitGameOver(finalScore: number): void {
    this.events.emit(BRIDGE_EVENTS.GAME_OVER, finalScore);
  }

  protected emitStatusChange(status: GameStatus): void {
    this.events.emit(BRIDGE_EVENTS.STATUS_CHANGE, status);
  }

  protected emitHudUpdate(data: HudUpdatePayload): void {
    this.events.emit(BRIDGE_EVENTS.HUD_UPDATE, data);
  }

  applyRuntimePatch(_patch: Record<string, unknown>): void {
    // No-op base — genre scenes override for mid-run tuning updates
  }
}
