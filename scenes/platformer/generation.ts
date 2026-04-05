import type { PlatformGenerationConfig, ZoneConfig } from '../../types';

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
