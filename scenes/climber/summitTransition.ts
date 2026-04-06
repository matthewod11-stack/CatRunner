export function shouldEnterSummit(params: {
  highestWorldY: number;
  entryWorldY: number;
  alreadyEntered: boolean;
}): boolean {
  if (params.alreadyEntered) return false;
  // highestWorldY is negative when climbing; summit starts when player has climbed past threshold (more negative)
  return params.highestWorldY <= params.entryWorldY;
}
