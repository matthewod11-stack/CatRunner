import type { FroggerLevelConfig, FroggerLane } from '../types';

// ─── Lane definitions (bottom to top) ───────────────────────────────

const CELL = 48;
const LANE_H = CELL;

// Helper: build lanes from bottom of playfield upward
function lane(index: number, type: FroggerLane['type'], dir: 1 | -1, speed: number, objWidth: number, color: number, gap: number): FroggerLane {
  return {
    y: 600 - index * LANE_H, // 600 is bottom of play area
    type,
    direction: dir,
    speed,
    objects: { width: objWidth, height: LANE_H - 4, color, gap },
  };
}

const LANES: FroggerLane[] = [
  // Row 0: start (safe)
  lane(0, 'safe', 1, 0, 0, 0x44aa44, 0),
  // Rows 1-4: road section
  lane(1, 'road', -1, 80, 60, 0xcc3333, 200),   // slow cars left
  lane(2, 'road', 1, 120, 80, 0x3333cc, 180),    // fast trucks right
  lane(3, 'road', -1, 60, 50, 0xcccc33, 250),    // slow taxis left
  lane(4, 'road', 1, 100, 100, 0x884422, 160),   // big bus right
  // Row 5: median (safe)
  lane(5, 'safe', 1, 0, 0, 0x44aa44, 0),
  // Rows 6-9: water section
  lane(6, 'water', 1, 50, 120, 0x664422, 200),   // logs right
  lane(7, 'water', -1, 70, 90, 0x664422, 180),   // logs left
  lane(8, 'water', 1, 90, 80, 0x226644, 150),    // lily pads right
  lane(9, 'water', -1, 60, 140, 0x664422, 220),  // big log left
  // Row 10: goal (safe)
  lane(10, 'safe', 1, 0, 0, 0xffaa44, 0),
];

// ─── Level Config ───────────────────────────────────────────────────

export const STREET_LEVEL_CONFIG: FroggerLevelConfig = {
  id: 'STREET',
  name: 'Busy Crossing',
  genre: 'frogger',
  description: 'Cross the busy street to reach the fish market!',
  catPose: 'hopper',
  victoryCondition: { type: 'goal', description: 'Reach the fish market' },
  starThresholds: [100, 300, 500],

  lanes: LANES,
  cellSize: CELL,
  startCol: 10, // center of 20-col grid
  timeLimit: 60, // 60 seconds
  bgColor: '#1a2a1a',
  crossingsToWin: 3,

  startLives: 3,
};
