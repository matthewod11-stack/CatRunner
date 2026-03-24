import type { LevelConfig, AnyLevelConfig, LevelId } from '../types';
import { BEACH_LEVEL_CONFIG } from './beach';
import { ROOFTOPS_LEVEL_CONFIG } from './rooftops';
import { KITCHEN_LEVEL_CONFIG } from './kitchen';
import { SPACE_LEVEL_CONFIG } from './space';

export { BEACH_LEVEL_CONFIG } from './beach';
export { ROOFTOPS_LEVEL_CONFIG } from './rooftops';
export { KITCHEN_LEVEL_CONFIG } from './kitchen';
export { SPACE_LEVEL_CONFIG } from './space';
export { BeachObstacleIcon, isBeachObstacleType } from './beach/obstacles';
export { BackgroundEntityRenderer, BACKGROUND_ENTITY_VIEW_BY_LEVEL } from './levelBackgroundViews';

export const LEVEL_REGISTRY: Partial<Record<LevelId, AnyLevelConfig>> = {
  BEACH: BEACH_LEVEL_CONFIG,
  ROOFTOPS: ROOFTOPS_LEVEL_CONFIG,
  KITCHEN: KITCHEN_LEVEL_CONFIG,
  SPACE: SPACE_LEVEL_CONFIG,
};

/** Get a runner-specific level config. Throws for non-runner levels. */
export function getLevelConfig(id: LevelId): LevelConfig {
  const config = LEVEL_REGISTRY[id];
  if (!config) throw new Error(`Level "${id}" is not yet implemented`);
  if (config.genre !== 'runner') throw new Error(`Level "${id}" is not a runner level — use getAnyLevelConfig()`);
  return config;
}

/** Get any level config regardless of genre. */
export function getAnyLevelConfig(id: LevelId): AnyLevelConfig {
  const config = LEVEL_REGISTRY[id];
  if (!config) throw new Error(`Level "${id}" is not yet implemented`);
  return config;
}

export {
  CAMPAIGN_LEVEL_META,
  LEVEL_ORDER,
  isLevelUnlocked,
  getNextLevelId,
  getPreviousLevelId,
  getBossEntryCoinThreshold,
  mergeLevelTuning,
} from './catalog';
