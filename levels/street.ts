import type { FroggerCrossingPhase, FroggerLane, FroggerLaneKind, FroggerLevelConfig } from '../types';

const CELL = 48;

function lane(
  index: number,
  kind: FroggerLaneKind,
  dir: 1 | -1,
  speed: number,
  objWidth: number,
  color: number,
  gap: number
): FroggerLane {
  return {
    y: 600 - index * CELL,
    kind,
    direction: dir,
    speed,
    objects: { width: objWidth, height: CELL - 4, color, gap },
  };
}

/** Teaching: road → median only (no bike). */
const PHASE_TEACH: FroggerCrossingPhase = {
  label: 'teach',
  lanes: [
    lane(0, 'safe', 1, 0, 0, 0x44aa44, 0),
    lane(1, 'road', -1, 65, 58, 0xcc3333, 230),
    lane(2, 'road', 1, 85, 65, 0x3333cc, 210),
    lane(3, 'medianSlow', -1, 32, 95, 0x996633, 300),
    lane(4, 'safe', 1, 0, 0, 0x44aa44, 0),
  ],
};

const PHASE_MID: FroggerCrossingPhase = {
  label: 'mid',
  lanes: [
    lane(0, 'safe', 1, 0, 0, 0x44aa44, 0),
    lane(1, 'road', -1, 75, 55, 0xcc3333, 210),
    lane(2, 'road', 1, 95, 70, 0x3333cc, 190),
    lane(3, 'medianSlow', -1, 38, 88, 0xaa6644, 270),
    lane(4, 'bike', 1, 115, 38, 0x888899, 130),
    lane(5, 'safe', 1, 0, 0, 0xffaa44, 0),
  ],
};

const PHASE_HARD: FroggerCrossingPhase = {
  label: 'hard',
  lanes: [
    lane(0, 'safe', 1, 0, 0, 0x44aa44, 0),
    lane(1, 'road', -1, 85, 50, 0xcc3333, 190),
    lane(2, 'road', 1, 110, 65, 0x3333cc, 170),
    lane(3, 'road', -1, 70, 72, 0xcccc33, 200),
    lane(4, 'medianSlow', -1, 42, 92, 0x886644, 250),
    lane(5, 'medianSlow', 1, 48, 85, 0x886644, 240),
    lane(6, 'bike', -1, 125, 34, 0x9999aa, 120),
    lane(7, 'bike', 1, 140, 36, 0x777788, 110),
    lane(8, 'safe', 1, 0, 0, 0xffaa44, 0),
  ],
};

export const STREET_LEVEL_CONFIG: FroggerLevelConfig = {
  id: 'STREET',
  name: 'Busy Crossing',
  genre: 'frogger',
  description: 'Cross the busy street to reach the fish market!',
  catPose: 'hopper',
  victoryCondition: { type: 'goal', description: 'Reach the fish market' },
  starThresholds: [100, 300, 500],

  phases: [PHASE_TEACH, PHASE_MID, PHASE_HARD],
  cellSize: CELL,
  startCol: 10,
  timeLimit: 60,
  bgColor: '#1a2a1a',
  crossingsToWin: 3,
  startLives: 3,
};
