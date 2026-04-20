import { describe, it, expect } from 'vitest';
import { BRIDGE_EVENTS, withSceneLevelId } from './bridgeProtocol';

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

  it('attaches the current scene levelId to level-complete payloads', () => {
    expect(
      withSceneLevelId('ROOFTOPS', {
        finalScore: 900,
        gameScore: { current: 900, high: 900, coins: 25, multiplier: 3, streak: 4, lives: 2 },
        victoryType: 'goal',
      })
    ).toEqual({
      levelId: 'ROOFTOPS',
      finalScore: 900,
      gameScore: { current: 900, high: 900, coins: 25, multiplier: 3, streak: 4, lives: 2 },
      victoryType: 'goal',
    });
  });
});
