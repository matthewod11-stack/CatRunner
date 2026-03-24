import type { CampaignLevelMeta, LevelConfig, LevelId } from '../types';
import type { TuningProfile } from '../systems/tuning/defaultTuning';

/**
 * Single merge rule for runtime tuning: global dev panel store + level overrides.
 * **`App` and `GameEngine` must both use this** so boss entry, HUD, sky/sun, and physics stay aligned.
 */
export function mergeLevelTuning(
  storeTuning: TuningProfile,
  level: LevelConfig
): TuningProfile {
  return { ...storeTuning, ...(level.tuningOverrides ?? {}) };
}

/** Coins (stars) needed to enter boss; level override or merged tuning `bossThreshold`. */
export function getBossEntryCoinThreshold(
  level: LevelConfig,
  tuning: TuningProfile
): number {
  return level.bossEntryCoinThreshold ?? tuning.bossThreshold;
}

/** Display-only metadata for all 9 planned campaign levels. */
export const CAMPAIGN_LEVEL_META: CampaignLevelMeta[] = [
  {
    id: 'BEACH',
    name: 'Sunny Shore',
    genre: 'runner',
    description: 'Dodge crabs, beachballs, and seagulls on a sunny beach run!',
    catPose: 'runner',
    victoryCondition: { type: 'boss', bossId: 'sandMonster' },
    starThresholds: [100, 300, 500],
  },
  {
    id: 'ROOFTOPS',
    name: 'City Heights',
    genre: 'platformer',
    description: 'Jump across rooftops and dodge pigeons above the city!',
    catPose: 'platformer',
    victoryCondition: { type: 'goal', description: 'Reach the penthouse' },
    starThresholds: [150, 400, 700],
  },
  {
    id: 'KITCHEN',
    name: 'Countertop Chaos',
    genre: 'launcher',
    description: 'Launch treats across the kitchen counter!',
    catPose: 'launcher',
    victoryCondition: { type: 'score', target: 500 },
    starThresholds: [200, 400, 600],
  },
  {
    id: 'SPACE',
    name: 'Cardboard Cosmos',
    genre: 'shooter',
    description: 'Defend your cardboard spaceship from alien mice!',
    catPose: 'pilot',
    victoryCondition: { type: 'boss', bossId: 'mouseKing' },
    starThresholds: [300, 600, 1000],
  },
  {
    id: 'YARN',
    name: 'Yarn Ball Bounce',
    genre: 'breakout',
    description: 'Break through the yarn wall with your bouncing ball!',
    catPose: 'paddle',
    victoryCondition: { type: 'clear', description: 'Break all blocks' },
    starThresholds: [200, 500, 800],
  },
  {
    id: 'STREET',
    name: 'Busy Crossing',
    genre: 'frogger',
    description: 'Cross the busy street to reach the fish market!',
    catPose: 'hopper',
    victoryCondition: { type: 'goal', description: 'Reach the fish market' },
    starThresholds: [100, 300, 500],
  },
  {
    id: 'GARDEN_WHACK',
    name: 'Garden Patrol',
    genre: 'whack',
    description: 'Whack the moles stealing your catnip!',
    catPose: 'swatter',
    victoryCondition: { type: 'score', target: 400 },
    starThresholds: [150, 350, 600],
  },
  {
    id: 'GARDEN_SNAKE',
    name: 'Garden Snake',
    genre: 'snake',
    description: 'Grow your tail by eating treats in the garden!',
    catPose: 'slitherer',
    victoryCondition: { type: 'survive', durationMs: 120000 },
    starThresholds: [200, 500, 900],
  },
  {
    id: 'CAT_TREE',
    name: 'The Cat Tree',
    genre: 'climber',
    description: 'Climb to the top of the ultimate cat tree!',
    catPose: 'climber',
    victoryCondition: { type: 'goal', description: 'Reach the top' },
    starThresholds: [250, 500, 1000],
  },
];

/** Campaign order; when adding levels, extend `LevelId` + registry and append here. */
export const LEVEL_ORDER: LevelId[] = ['BEACH', 'ROOFTOPS', 'KITCHEN', 'SPACE'];

export function isLevelUnlocked(
  defeatedBosses: Partial<Record<LevelId, boolean>>,
  id: LevelId
): boolean {
  const i = LEVEL_ORDER.indexOf(id);
  if (i < 0) return false;
  if (i === 0) return true;
  return !!defeatedBosses[LEVEL_ORDER[i - 1]];
}

export function getNextLevelId(current: LevelId): LevelId | null {
  const i = LEVEL_ORDER.indexOf(current);
  if (i < 0 || i >= LEVEL_ORDER.length - 1) return null;
  return LEVEL_ORDER[i + 1];
}

export function getPreviousLevelId(id: LevelId): LevelId | null {
  const i = LEVEL_ORDER.indexOf(id);
  if (i <= 0) return null;
  return LEVEL_ORDER[i - 1];
}
