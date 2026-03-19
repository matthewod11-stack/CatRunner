import type {
  BackgroundConfig,
  BackgroundEntity,
  BackgroundEntityDefinition,
  BackgroundEntityType,
} from '../types';

function yFromDef(
  innerH: number,
  def: BackgroundEntityDefinition | undefined,
  fallbackMin: number,
  fallbackMax: number
): number {
  const r = def?.spawnYRange;
  if (r) {
    return innerH * (r.min + Math.random() * (r.max - r.min));
  }
  return innerH * (fallbackMin + Math.random() * (fallbackMax - fallbackMin));
}

export type BackgroundSpawnContext = {
  isChaosMode: boolean;
  gameSpeed: number;
  innerWidth: number;
  innerHeight: number;
  getBgEntityDef: (t: BackgroundEntityType) => BackgroundEntityDefinition | undefined;
  background: BackgroundConfig;
};

const DEFAULT_CHAOS_TYPES: BackgroundEntityType[] = ['BOAT_SINKING', 'AIRPLANE_FIRE'];
const DEFAULT_MID_TYPES: BackgroundEntityType[] = ['BOAT', 'SURFER', 'AIRPLANE', 'JETSKI'];

/**
 * Spawns parallax background rows from `LevelConfig.background` (entity defs + optional pool/chance fields).
 * Pure — safe to unit test with a stub `getBgEntityDef`.
 */
export function spawnBackgroundEntities(ctx: BackgroundSpawnContext): BackgroundEntity[] {
  const { isChaosMode, gameSpeed, innerWidth: W, innerHeight: H, getBgEntityDef, background } = ctx;
  const out: BackgroundEntity[] = [];
  const nextId = () => Date.now() + Math.random();

  if (isChaosMode) {
    const chaosTypes = background.chaosSpawnTypes ?? DEFAULT_CHAOS_TYPES;
    if (chaosTypes.length === 0) return out;

    const type = chaosTypes[Math.floor(Math.random() * chaosTypes.length)];
    const def = getBgEntityDef(type);
    if (!def) return out;

    const y =
      type === 'BOAT_SINKING'
        ? yFromDef(H, def, 0.32, 0.4)
        : yFromDef(H, def, 0.5, 0.7);
    const bannerText = def.defaultBannerText ?? (type === 'AIRPLANE_FIRE' ? 'HELP!' : '');
    out.push({
      id: nextId(),
      type,
      x: W + 300,
      y,
      speed: gameSpeed * def.speedMultiplier,
      width: def.width,
      height: def.height,
      bannerText,
      depth: def.depth,
      isChaos: true,
    });
    return out;
  }

  const cloudChance = background.cloudSpawnChance ?? 0.3;
  const cloudType = background.cloudEntityType ?? 'CLOUD';

  if (cloudChance > 0 && Math.random() < cloudChance) {
    const cloudDef = getBgEntityDef(cloudType);
    if (cloudDef) {
      const baseW = cloudDef.width;
      const cloudSize = baseW * (0.8 + Math.random() * 0.6);
      const cloudY = yFromDef(H, cloudDef, 0.55, 0.7);
      const mult = cloudDef.speedMultiplier;
      out.push({
        id: nextId(),
        type: cloudType,
        x: W + 200,
        y: cloudY,
        speed: gameSpeed * mult,
        width: cloudSize,
        height: cloudDef.height * (cloudSize / baseW),
        depth: 'far',
      });
    }
  }

  const midTypes =
    background.midLayerSpawnTypes !== undefined
      ? background.midLayerSpawnTypes
      : DEFAULT_MID_TYPES;
  if (midTypes.length === 0) return out;

  const type = midTypes[Math.floor(Math.random() * midTypes.length)];
  const def = getBgEntityDef(type);
  if (!def) return out;

  const sm = def.speedMultiplier;
  const y = yFromDef(H, def, 0.3, 0.45);
  let x = W + 500;
  if (def.spawnEdge === 'left') {
    x = -200 - Math.random() * 300;
  }
  const bannerText = def.defaultBannerText ?? '';
  out.push({
    id: nextId(),
    type,
    x,
    y,
    speed: gameSpeed * sm,
    width: def.width,
    height: def.height,
    bannerText,
    depth: def.depth,
  });

  return out;
}
