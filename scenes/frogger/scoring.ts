/** Points awarded each time the player reaches a new highest row index in one crossing. */
export const ROW_ADVANCE_POINTS = 10;
export const CROSSING_BONUS_POINTS = 100;

export function scoreAfterHigherRow(
  previousHighestRow: number,
  newRow: number,
  currentScore: number
): { score: number; highestRow: number } {
  if (newRow <= previousHighestRow) {
    return { score: currentScore, highestRow: previousHighestRow };
  }
  return {
    score: currentScore + ROW_ADVANCE_POINTS,
    highestRow: newRow,
  };
}

export function scoreAfterCrossing(currentScore: number): number {
  return currentScore + CROSSING_BONUS_POINTS;
}
