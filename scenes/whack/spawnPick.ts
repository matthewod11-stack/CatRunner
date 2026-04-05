export function normalizeWeights(weights: Record<string, number>): Record<string, number> {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  const sum = entries.reduce((s, [, w]) => s + w, 0);
  if (sum <= 0) return {};
  const out: Record<string, number> = {};
  for (const [k, w] of entries) out[k] = w / sum;
  return out;
}

/** `random` injectable for tests; returns uniform [0, 1). */
export function pickWeightedKey(
  weights: Record<string, number>,
  random: () => number = Math.random,
): string | null {
  const n = normalizeWeights(weights);
  const keys = Object.keys(n);
  if (keys.length === 0) return null;
  let r = random();
  for (const k of keys) {
    r -= n[k];
    if (r <= 0) return k;
  }
  return keys[keys.length - 1];
}
