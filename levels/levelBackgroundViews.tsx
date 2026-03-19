import type { FC } from 'react';
import type { BackgroundEntity, LevelId } from '../types';
import { BeachBackgroundEntityView } from './beach/backgroundEntities';

export type BackgroundEntityViewProps = { b: BackgroundEntity };

/** Map each level id to its parallax SVG renderer. Register new levels here (and add art module under `levels/<id>/`). */
export const BACKGROUND_ENTITY_VIEW_BY_LEVEL: Record<LevelId, FC<BackgroundEntityViewProps>> = {
  BEACH: BeachBackgroundEntityView,
};

export function BackgroundEntityRenderer({ levelId, b }: { levelId: LevelId; b: BackgroundEntity }) {
  const Comp = BACKGROUND_ENTITY_VIEW_BY_LEVEL[levelId];
  return <Comp b={b} />;
}
