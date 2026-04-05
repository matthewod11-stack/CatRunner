export function afterReachingGoal(input: {
  crossingsCompleted: number;
  crossingsToWin: number;
}): { type: 'victory' } | { type: 'continue'; nextCrossings: number } {
  const next = input.crossingsCompleted + 1;
  if (next >= input.crossingsToWin) return { type: 'victory' };
  return { type: 'continue', nextCrossings: next };
}
