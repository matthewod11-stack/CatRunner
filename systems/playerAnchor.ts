import type { ThemeConfig } from '../types';

/** Resolve screen-space player anchors from level theme (defaults match legacy beach layout). */
export function resolvePlayerAnchor(theme: ThemeConfig): {
  anchorLeft: number;
  anchorLeftSuperSized: number;
  hitboxLeft: number;
  hitboxCenterX: number;
  projectileAimX: number;
} {
  const anchorLeft = theme.playerAnchorLeftPx ?? 100;
  const anchorLeftSuperSized =
    theme.playerAnchorLeftPxSuperSized ?? Math.max(8, anchorLeft - 60);
  const hitboxLeft = anchorLeft + 24;
  return {
    anchorLeft,
    anchorLeftSuperSized,
    hitboxLeft,
    hitboxCenterX: anchorLeft + 64,
    projectileAimX: hitboxLeft + 40,
  };
}
