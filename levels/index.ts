import type { LevelConfig, AnyLevelConfig, LevelId } from '../types';
import { BEACH_LEVEL_CONFIG } from './beach';
import { ROOFTOPS_LEVEL_CONFIG } from './rooftops';
import { KITCHEN_LEVEL_CONFIG } from './kitchen';
import { SPACE_LEVEL_CONFIG } from './space';
import { YARN_LEVEL_CONFIG } from './yarn';
import { STREET_LEVEL_CONFIG } from './street';
import { GARDEN_WHACK_LEVEL_CONFIG } from './garden-whack';
import { GARDEN_SNAKE_LEVEL_CONFIG } from './garden-snake';
import { CAT_TREE_LEVEL_CONFIG } from './cattree';

export { BEACH_LEVEL_CONFIG } from './beach';
export { ROOFTOPS_LEVEL_CONFIG } from './rooftops';
export { KITCHEN_LEVEL_CONFIG } from './kitchen';
export { SPACE_LEVEL_CONFIG } from './space';
export { YARN_LEVEL_CONFIG } from './yarn';
export { STREET_LEVEL_CONFIG } from './street';
export { GARDEN_WHACK_LEVEL_CONFIG } from './garden-whack';
export { GARDEN_SNAKE_LEVEL_CONFIG } from './garden-snake';
export { CAT_TREE_LEVEL_CONFIG } from './cattree';
export { BeachObstacleIcon, isBeachObstacleType } from './beach/obstacles';
export { BackgroundEntityRenderer, BACKGROUND_ENTITY_VIEW_BY_LEVEL } from './levelBackgroundViews';

export const LEVEL_REGISTRY: Partial<Record<LevelId, AnyLevelConfig>> = {
  BEACH: BEACH_LEVEL_CONFIG,
  ROOFTOPS: ROOFTOPS_LEVEL_CONFIG,
  KITCHEN: KITCHEN_LEVEL_CONFIG,
  SPACE: SPACE_LEVEL_CONFIG,
  YARN: YARN_LEVEL_CONFIG,
  STREET: STREET_LEVEL_CONFIG,
  GARDEN_WHACK: GARDEN_WHACK_LEVEL_CONFIG,
  GARDEN_SNAKE: GARDEN_SNAKE_LEVEL_CONFIG,
  CAT_TREE: CAT_TREE_LEVEL_CONFIG,
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
  getCampaignLevelMeta,
  isLevelUnlocked,
  getNextLevelId,
  getPreviousLevelId,
  getBossEntryCoinThreshold,
  mergeLevelTuning,
} from './catalog';
