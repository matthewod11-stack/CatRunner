import type { LauncherActConfig } from '../../types';

export function resolveActForRound(
  roundIndex1Based: number,
  acts: LauncherActConfig[] | undefined
): LauncherActConfig | null {
  if (!acts || acts.length === 0) return null;
  const hit = acts.find(
    (act) => roundIndex1Based >= act.roundStart && roundIndex1Based <= act.roundEnd
  );
  return hit ?? acts[acts.length - 1];
}

export function pickStructureKey(
  act: LauncherActConfig,
  rng: () => number
): string {
  const pool = act.structurePool;
  if (pool.length === 0) throw new Error('LauncherActConfig.structurePool is empty');
  const w = act.weights;
  if (!w || w.length !== pool.length) {
    const i = Math.floor(rng() * pool.length) % pool.length;
    return pool[i];
  }
  const total = w.reduce((s, n) => s + n, 0);
  if (total <= 0) {
    return pool[Math.floor(rng() * pool.length) % pool.length];
  }
  let r = rng() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= w[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}
