import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { BossComponentId } from '../types';

export type BossViewProps = {
  health: number;
  maxHealth: number;
  facingDirection?: 'left' | 'right';
  isDefeating?: boolean;
  isIntro?: boolean;
};

export const DEFAULT_BOSS_COMPONENT_ID: BossComponentId = 'sandMonster';

export const LAZY_BOSS_COMPONENTS: Record<
  BossComponentId,
  LazyExoticComponent<ComponentType<BossViewProps>>
> = {
  sandMonster: lazy(() => import('../components/SandMonster')),
};

export function resolveLazyBoss(
  id: BossComponentId | undefined
): LazyExoticComponent<ComponentType<BossViewProps>> {
  const key = id ?? DEFAULT_BOSS_COMPONENT_ID;
  return LAZY_BOSS_COMPONENTS[key] ?? LAZY_BOSS_COMPONENTS[DEFAULT_BOSS_COMPONENT_ID];
}
