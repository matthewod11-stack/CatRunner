import type {
  BehaviorType,
  LevelConfig,
  ObstacleDefinition,
  ObstacleType,
} from '../types';
import type { SwoopYParams } from './behaviors';

export function obstacleHasBehavior(
  def: ObstacleDefinition | undefined,
  behavior: BehaviorType
): boolean {
  return def?.behaviors.some(b => b.type === behavior) ?? false;
}

/**
 * Pick dive vs poop at spawn from composed behaviors (swoop / dropProjectile).
 */
export function pickSeagullSpawnVariant(
  def: ObstacleDefinition | undefined
): 'dive' | 'poop' {
  const hasSwoop = obstacleHasBehavior(def, 'swoop');
  const hasDrop = obstacleHasBehavior(def, 'dropProjectile');
  if (hasSwoop && hasDrop) return Math.random() < 0.5 ? 'dive' : 'poop';
  if (hasDrop) return 'poop';
  return 'dive';
}

/** Random Y in range, or fixed; `fallback` when `spawnY` is undefined. */
export function resolveObstacleSpawnY(
  spawnY: number | { min: number; max: number } | undefined,
  fallback: () => number
): number {
  if (spawnY === undefined) return fallback();
  if (typeof spawnY === 'number') return spawnY;
  const { min, max } = spawnY;
  if (max <= min) return min;
  return min + Math.random() * (max - min);
}

/** Y anchors for `computeSwoopY` from `swoop` behavior `config` keys. */
export function resolveSwoopConfig(
  def: ObstacleDefinition | undefined
): SwoopYParams {
  const swoop = def?.behaviors.find(b => b.type === 'swoop');
  const c = swoop?.config;
  return {
    swoopStartY: c?.swoopStartY ?? 400,
    swoopLowY: c?.swoopLowY ?? 170,
    swoopEndY: c?.swoopEndY ?? 280,
  };
}

export interface ResolvedDropProjectile {
  type: ObstacleType;
  width: number;
  height: number;
  poopDelayBase?: number;
  poopDelayRange?: number;
  poopDelayBaseLowLives?: number;
  poopDelayRangeLowLives?: number;
}

/**
 * Resolve dropped projectile shape from the source obstacle's `dropProjectile` behavior.
 */
export function resolveDropProjectileSpec(
  level: LevelConfig,
  sourceType: ObstacleType
): ResolvedDropProjectile | null {
  const def = level.obstacles.find(o => o.type === sourceType);
  const drop = def?.behaviors.find(b => b.type === 'dropProjectile');
  const pt = drop?.projectileType;
  if (!pt) return null;
  const proj = level.obstacles.find(o => o.type === pt);
  const c = drop?.config;
  return {
    type: pt,
    width: proj?.width ?? 60,
    height: proj?.height ?? 60,
    poopDelayBase: c?.poopDelayBase,
    poopDelayRange: c?.poopDelayRange,
    poopDelayBaseLowLives: c?.poopDelayBaseLowLives,
    poopDelayRangeLowLives: c?.poopDelayRangeLowLives,
  };
}
