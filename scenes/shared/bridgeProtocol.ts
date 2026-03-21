/**
 * Bridge event protocol — pure constants and interfaces.
 * Separated from SceneBridge.ts so Node-only tests (Vitest) can import
 * without pulling in Phaser's browser globals.
 */
import type { LevelId, LevelConfig } from '../../types';
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

export interface SceneInitData {
  levelId: LevelId;
  catSpriteUrl: string | null;
}

export interface RunnerSceneInitData extends SceneInitData {
  levelConfig: LevelConfig;
  initialLives: number;
  startAtBoss: boolean;
  tuning: TuningProfile;
  onTelemetryReady?: (getTelemetry: () => TelemetryEvent[]) => void;
}
