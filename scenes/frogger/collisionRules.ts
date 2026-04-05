import type { FroggerLaneKind } from '../../types';

export interface PlayerHitbox {
  x: number;
  y: number;
  halfCell: number;
}

export interface MoverHitbox {
  x: number;
  y: number;
  halfWidth: number;
  halfHeight: number;
}

/** Extra horizontal slack as a fraction of player half-cell. */
export function horizontalSlackForKind(kind: FroggerLaneKind): number {
  switch (kind) {
    case 'road':
      return 0.4;
    case 'medianSlow':
      return 0.45;
    case 'bike':
      return 0.25;
    case 'safe':
      return 0.4;
  }
}

export function hazardOverlap(
  player: PlayerHitbox,
  mover: MoverHitbox,
  kind: FroggerLaneKind
): boolean {
  if (kind === 'safe') return false;
  const slack = horizontalSlackForKind(kind) * player.halfCell;
  const dx = Math.abs(mover.x - player.x);
  const dy = Math.abs(mover.y - player.y);
  if (dx >= mover.halfWidth + player.halfCell * 0.4 + slack) return false;
  if (dy >= player.halfCell * 0.8) return false;
  return true;
}
