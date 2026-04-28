import type { PlatformGenerationConfig, PlatformerLevelConfig, PlatformerOpeningRouteConfig, ZoneConfig } from '../../types';

export function getZoneIndex(zones: ZoneConfig[], distance: number): number {
  for (let i = zones.length - 1; i >= 0; i--) {
    if (distance >= zones[i].startDistance) return i;
  }
  return 0;
}

export function resolveZoneParams(
  base: PlatformGenerationConfig,
  zone: ZoneConfig,
): PlatformGenerationConfig {
  return {
    ...base,
    ...zone.generation,
  };
}

export function isBeforeOpeningRouteHandoff(
  config: PlatformerLevelConfig,
  worldX: number,
): boolean {
  return Boolean(config.openingRoute && worldX < config.openingRoute.handoffX);
}

export function validateOpeningRouteConfig(
  route: PlatformerOpeningRouteConfig,
  config: PlatformerLevelConfig,
): string[] {
  const errors: string[] = [];

  if (!route.id.trim()) errors.push('openingRoute.id is required');
  if (!Number.isFinite(route.handoffX) || route.handoffX <= 0) {
    errors.push('openingRoute.handoffX must be a positive finite number');
  }
  if (route.platforms.length === 0) {
    errors.push('openingRoute.platforms must include at least one platform');
  }

  let previousEnd = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < route.platforms.length; i++) {
    const platform = route.platforms[i];
    if (!Number.isFinite(platform.x) || !Number.isFinite(platform.width) || !Number.isFinite(platform.rooftopY)) {
      errors.push(`openingRoute.platforms[${i}] must use finite x, width, and rooftopY values`);
      continue;
    }
    if (platform.width <= 0) errors.push(`openingRoute.platforms[${i}].width must be positive`);
    if (platform.x < previousEnd) errors.push(`openingRoute.platforms[${i}] overlaps or is out of order`);
    if (platform.rooftopY < 80 || platform.rooftopY > config.generation.deathY - 80) {
      errors.push(`openingRoute.platforms[${i}].rooftopY must stay inside the playable vertical band`);
    }
    previousEnd = platform.x + platform.width;
  }

  const firstPlatform = route.platforms[0];
  if (firstPlatform && !(firstPlatform.x <= 200 && firstPlatform.x + firstPlatform.width >= 200)) {
    errors.push('openingRoute first platform must support the default player start x=200');
  }

  const lastPlatform = route.platforms.at(-1);
  if (lastPlatform && route.handoffX < lastPlatform.x + lastPlatform.width) {
    errors.push('openingRoute.handoffX must be at or beyond the final opening-route platform');
  }

  for (const collection of [
    ['enemies', route.enemies ?? []],
    ['hazards', route.hazards ?? []],
  ] as const) {
    const [name, entries] = collection;
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (!Number.isInteger(entry.platformIndex) || entry.platformIndex < 0 || entry.platformIndex >= route.platforms.length) {
        errors.push(`openingRoute.${name}[${i}].platformIndex must reference an existing platform`);
      }
      if (!Number.isFinite(entry.x) || entry.x < 0 || entry.x > route.handoffX + 200) {
        errors.push(`openingRoute.${name}[${i}].x must be finite and inside the opening slice`);
      }
    }
  }

  for (let i = 0; i < (route.coins ?? []).length; i++) {
    const coin = route.coins![i];
    if (!Number.isFinite(coin.x) || !Number.isFinite(coin.y)) {
      errors.push(`openingRoute.coins[${i}] must use finite x and y values`);
    }
  }

  for (let i = 0; i < (route.powerups ?? []).length; i++) {
    const powerup = route.powerups![i];
    if (!Number.isFinite(powerup.x) || !Number.isFinite(powerup.y)) {
      errors.push(`openingRoute.powerups[${i}] must use finite x and y values`);
    }
  }

  return errors;
}
