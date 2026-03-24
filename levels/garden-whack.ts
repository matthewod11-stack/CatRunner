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
    bonus:  { type: 'bonus',  visibleMs: 800,  points: 30, color: 0xffcc44 },
    sneaky: { type: 'sneaky', visibleMs: 500,  points: 50, color: 0x8844ff },
  },

  timeLimit: 60,
  spawnIntervalRange: [800, 1500], // starts slow, speeds up
  bgColor: '#2a4a1a',
  startLives: 3,
};
