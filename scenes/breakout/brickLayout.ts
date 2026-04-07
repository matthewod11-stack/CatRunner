import type { BreakoutBrick, BreakoutLevelConfig } from '../../types';

export interface PlacedBrick {
  def: BreakoutBrick;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

/** World-space centers for each brick definition (matches BreakoutScene grid math). */
export function placeBricks(
  levelWidth: number,
  config: BreakoutLevelConfig,
  brickList: BreakoutBrick[] = config.bricks
): PlacedBrick[] {
  const { brickWidth, brickHeight, gridCols } = config;
  const gridWidth = gridCols * brickWidth;
  const offsetX = (levelWidth - gridWidth) / 2;
  const offsetY = 60;

  return brickList.map((def) => ({
    def,
    centerX: offsetX + def.col * brickWidth + brickWidth / 2,
    centerY: offsetY + def.row * brickHeight + brickHeight / 2,
    width: brickWidth,
    height: brickHeight,
  }));
}

export function countBricks(bricks: PlacedBrick[]): number {
  return bricks.length;
}
