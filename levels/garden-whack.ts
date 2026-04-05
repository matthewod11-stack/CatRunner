import type { WhackLevelConfig } from '../types';

export const GARDEN_WHACK_LEVEL_CONFIG: WhackLevelConfig = {
  id: 'GARDEN_WHACK',
  name: 'Garden Patrol',
  genre: 'whack',
  description: 'Whack the moles stealing your catnip!',
  catPose: 'swatter',
  victoryCondition: { type: 'score', target: 400 },
  starThresholds: [150, 350, 600],

  gridCols: 3,
  gridRows: 3,

  mouseTypes: {
    normal: { type: 'normal', visibleMs: 1200, points: 10, color: 0x888888 },
    bonus: { type: 'bonus', visibleMs: 800, points: 30, color: 0xffcc44 },
    sneaky: { type: 'sneaky', visibleMs: 500, points: 50, color: 0x8844ff },
    power_slow: {
      type: 'power_slow',
      visibleMs: 1000,
      points: 5,
      color: 0x44ccff,
      grantsEffect: 'slow_mo',
      effectDurationSec: 3,
    },
    power_double: {
      type: 'power_double',
      visibleMs: 900,
      points: 5,
      color: 0xff88cc,
      grantsEffect: 'double_score',
      effectDurationSec: 5,
    },
  },

  wavePhaseTimeLimitSec: 45,
  waves: [
    {
      index: 0,
      durationSec: 15,
      spawnIntervalRange: [1400, 2200],
      spawnWeights: { normal: 7, bonus: 2, sneaky: 1, power_slow: 0, power_double: 0 },
    },
    {
      index: 1,
      durationSec: 15,
      spawnIntervalRange: [900, 1600],
      spawnWeights: { normal: 4, bonus: 3, sneaky: 2, power_slow: 1, power_double: 0 },
    },
    {
      index: 2,
      durationSec: 15,
      spawnIntervalRange: [550, 1100],
      spawnWeights: { normal: 2, bonus: 3, sneaky: 3, power_slow: 1, power_double: 1 },
    },
  ],

  boss: {
    hitsToDefeat: 5,
    visibleMs: 2200,
    hitInvulnMs: 450,
    emergeDelayMs: [600, 1200],
    color: 0x6b4423,
    radiusPx: 38,
  },
  bossTimeLimitSec: 30,

  bgColor: '#2a4a1a',
  startLives: 3,
};
