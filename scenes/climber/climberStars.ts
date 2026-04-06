export function computeClimberStars(params: {
  deathCount: number;
  elapsedMs: number;
  parTimeMs: number;
}): 1 | 2 | 3 {
  const { deathCount, elapsedMs, parTimeMs } = params;
  if (deathCount === 0 && elapsedMs <= parTimeMs) return 3;
  if (deathCount === 0) return 2;
  return 1;
}
