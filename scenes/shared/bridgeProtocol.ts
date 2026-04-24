/**
 * Bridge event protocol — pure constants and interfaces.
 * Separated from SceneBridge.ts so Node-only tests (Vitest) can import
 * without pulling in Phaser's browser globals.
 */
import type { GameScore, GameStatus, LevelId, LevelConfig, PlatformerLevelConfig, LauncherLevelConfig, ShooterLevelConfig, BreakoutLevelConfig, FroggerLevelConfig, WhackLevelConfig, SnakeLevelConfig, ClimberLevelConfig, LevelCompletePayload } from '../../types';
import type { TuningProfile } from '../../systems/tuning/defaultTuning';
import type { TelemetryEvent } from '../../systems/telemetry/runTelemetry';

export const BRIDGE_EVENTS = {
  SCORE_UPDATE: 'scoreUpdate',
  LIVES_CHANGED: 'livesChanged',
  LEVEL_COMPLETE: 'levelComplete',
  GAME_OVER: 'gameOver',
  STATUS_CHANGE: 'statusChange',
  HUD_UPDATE: 'hudUpdate',
} as const;

export interface HudUpdatePayload {
  isPaused?: boolean;
  shellAmmo?: number;
}

export type LevelCompleteDetails = Omit<LevelCompletePayload, 'levelId'>;

export interface BridgeCallbacks {
  onScoreUpdate?: (score: GameScore) => void;
  onLivesChanged?: (lives: number) => void;
  onLevelComplete?: (payload: LevelCompletePayload) => void;
  onGameOver?: (finalScore: number) => void;
  onStatusChange?: (status: GameStatus) => void;
  onHudUpdate?: (data: HudUpdatePayload) => void;
}

export function withSceneLevelId(
  levelId: LevelId,
  payload: LevelCompleteDetails,
): LevelCompletePayload {
  return {
    levelId,
    ...payload,
  };
}

export interface SceneInitData {
  levelId: LevelId;
  catSpriteUrl: string | null;
  bridgeCallbacks?: BridgeCallbacks;
}

export interface RunnerSceneInitData extends SceneInitData {
  levelConfig: LevelConfig;
  initialLives: number;
  startAtBoss: boolean;
  tuning: TuningProfile;
  onTelemetryReady?: (getTelemetry: () => TelemetryEvent[]) => void;
}

export interface PlatformerSceneInitData extends SceneInitData {
  levelConfig: PlatformerLevelConfig;
  initialLives: number;
}

export interface LauncherSceneInitData extends SceneInitData {
  levelConfig: LauncherLevelConfig;
  initialLives: number;
}

export interface ShooterSceneInitData extends SceneInitData {
  levelConfig: ShooterLevelConfig;
  initialLives: number;
}

export interface BreakoutSceneInitData extends SceneInitData {
  levelConfig: BreakoutLevelConfig;
  initialLives: number;
}

export interface FroggerSceneInitData extends SceneInitData {
  levelConfig: FroggerLevelConfig;
  initialLives: number;
}

export interface WhackSceneInitData extends SceneInitData {
  levelConfig: WhackLevelConfig;
  initialLives: number;
}

export interface SnakeSceneInitData extends SceneInitData {
  levelConfig: SnakeLevelConfig;
  initialLives: number;
}

export interface ClimberSceneInitData extends SceneInitData {
  levelConfig: ClimberLevelConfig;
  initialLives: number;
}
