import type { LevelConfig, LevelId } from '../types';
import { BEACH_LEVEL_CONFIG } from './beach';

export { BEACH_LEVEL_CONFIG } from './beach';
export { BeachObstacleIcon, isBeachObstacleType } from './beach/obstacles';
export { BackgroundEntityRenderer, BACKGROUND_ENTITY_VIEW_BY_LEVEL } from './levelBackgroundViews';

export const LEVEL_REGISTRY: Partial<Record<LevelId, LevelConfig>> = {
  BEACH: BEACH_LEVEL_CONFIG,
};

export function getLevelConfig(id: LevelId): LevelConfig {
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
