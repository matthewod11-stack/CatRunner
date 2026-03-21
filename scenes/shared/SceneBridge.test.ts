import { describe, it, expect } from 'vitest';
import { BRIDGE_EVENTS } from './bridgeProtocol';

describe('SceneBridge event protocol', () => {
  it('defines all required bridge event names', () => {
    expect(BRIDGE_EVENTS).toEqual({
      SCORE_UPDATE: 'scoreUpdate',
      LIVES_CHANGED: 'livesChanged',
      LEVEL_COMPLETE: 'levelComplete',
      GAME_OVER: 'gameOver',
      STATUS_CHANGE: 'statusChange',
      HUD_UPDATE: 'hudUpdate',
    });
  });

  it('has exactly 6 events', () => {
    expect(Object.keys(BRIDGE_EVENTS)).toHaveLength(6);
  });
});
