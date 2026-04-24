import Phaser from 'phaser';
import type { GameScore, GameStatus, LevelId } from '../../types';
import { BRIDGE_EVENTS } from './bridgeProtocol';
import { withSceneLevelId } from './bridgeProtocol';
import type { BridgeCallbacks, SceneInitData, HudUpdatePayload, LevelCompleteDetails } from './bridgeProtocol';

// Re-export protocol types so consumers can import everything from SceneBridge
export { BRIDGE_EVENTS } from './bridgeProtocol';
export type { SceneInitData, RunnerSceneInitData, PlatformerSceneInitData, LauncherSceneInitData, ShooterSceneInitData, BreakoutSceneInitData, FroggerSceneInitData, WhackSceneInitData, SnakeSceneInitData, ClimberSceneInitData } from './bridgeProtocol';

export abstract class SceneBridge extends Phaser.Scene {
  protected levelId!: LevelId;
  protected catSpriteUrl: string | null = null;
  private bridgeCallbacks?: BridgeCallbacks;

  init(data: SceneInitData): void {
    this.levelId = data.levelId;
    this.catSpriteUrl = data.catSpriteUrl;
    this.bridgeCallbacks = data.bridgeCallbacks;
  }

  protected emitScoreUpdate(score: GameScore): void {
    this.bridgeCallbacks?.onScoreUpdate?.(score);
    this.events.emit(BRIDGE_EVENTS.SCORE_UPDATE, score);
  }

  protected emitLivesChanged(lives: number): void {
    this.bridgeCallbacks?.onLivesChanged?.(lives);
    this.events.emit(BRIDGE_EVENTS.LIVES_CHANGED, lives);
  }

  protected emitLevelComplete(payload: LevelCompleteDetails): void {
    const levelPayload = withSceneLevelId(this.levelId, payload);
    this.bridgeCallbacks?.onLevelComplete?.(levelPayload);
    this.events.emit(BRIDGE_EVENTS.LEVEL_COMPLETE, levelPayload);
  }

  protected emitGameOver(finalScore: number): void {
    this.bridgeCallbacks?.onGameOver?.(finalScore);
    this.events.emit(BRIDGE_EVENTS.GAME_OVER, finalScore);
  }

  protected emitStatusChange(status: GameStatus): void {
    this.bridgeCallbacks?.onStatusChange?.(status);
    this.events.emit(BRIDGE_EVENTS.STATUS_CHANGE, status);
  }

  protected emitHudUpdate(data: HudUpdatePayload): void {
    this.bridgeCallbacks?.onHudUpdate?.(data);
    this.events.emit(BRIDGE_EVENTS.HUD_UPDATE, data);
  }

  applyRuntimePatch(_patch: Record<string, unknown>): void {
    // No-op base — genre scenes override for mid-run tuning updates
  }
}
