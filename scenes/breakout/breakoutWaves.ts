import type { BreakoutBrick, BreakoutLevelConfig } from '../../types';

export function getBricksForWave(config: BreakoutLevelConfig, waveIndex: number): BreakoutBrick[] {
  if (config.waves && config.waves.length > 0) {
    return config.waves[waveIndex] ?? [];
  }
  return waveIndex === 0 ? config.bricks : [];
}

export function waveCount(config: BreakoutLevelConfig): number {
  if (config.waves && config.waves.length > 0) return config.waves.length;
  return 1;
}
