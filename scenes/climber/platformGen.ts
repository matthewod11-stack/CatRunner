import type { ClimberLevelConfig } from '../../types';
import type { GeneratedPlatformRow, PlatformKind } from './types';

/**
 * Deterministic PRNG returning values in [0, 1). Same integer seed yields the same sequence (mulberry32).
 */
export function createSeededRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function nextWorldY(
  prevWorldY: number,
  gapMin: number,
  gapMax: number,
  rng: () => number,
): number {
  const g = gapMin + rng() * (gapMax - gapMin);
  return prevWorldY - g;
}

function rollKind(
  rng: () => number,
  springChance: number,
  breakableChance: number,
): PlatformKind {
  const u = rng();
  if (u < springChance) return 'spring';
  if (u < springChance + breakableChance) return 'breakable';
  return 'solid';
}

export interface RollPlatformRowArgs {
  rng: () => number;
  screenWidth: number;
  prevWorldY: number;
  platformConfig: ClimberLevelConfig['platformConfig'];
  /** Probability in [0, 1] that this row includes a vertical sticky strip */
  stickyStripChance: number;
  /** Minimum distance from screen left/right edges to platform outer edge */
  margin?: number;
}

export function rollPlatformRow(args: RollPlatformRowArgs): GeneratedPlatformRow {
  const {
    rng,
    screenWidth,
    prevWorldY,
    platformConfig,
    stickyStripChance,
    margin = 8,
  } = args;
  const [wMin, wMax] = platformConfig.widthRange;
  const [gMin, gMax] = platformConfig.gapYRange;

  const worldY = nextWorldY(prevWorldY, gMin, gMax, rng);
  const width = wMin + rng() * (wMax - wMin);
  const halfW = width / 2;
  const innerMin = margin + halfW;
  const innerMax = screenWidth - margin - halfW;
  const centerX =
    innerMax >= innerMin
      ? innerMin + rng() * (innerMax - innerMin)
      : screenWidth / 2;

  const kind = rollKind(rng, platformConfig.springChance, platformConfig.breakableChance);
  const hasStickyStrip = rng() < stickyStripChance;

  return { worldY, centerX, width, kind, hasStickyStrip };
}
