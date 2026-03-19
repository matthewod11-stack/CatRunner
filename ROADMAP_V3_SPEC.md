# Beach Kitty Roadmap V3 — Nine Lives Campaign

> **Purpose:** High-level spec for transforming Beach Kitty from a single endless-runner into a nine-level campaign where each level is a distinct game genre — all powered by the same custom cat character.
>
> **Status:** Draft spec. Will go through multiple review/revision passes before implementation begins.
>
> **Predecessor:** [ROADMAP_V2.md](./ROADMAP_V2.md) (complete) | [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) | [docs/ROADMAP_V1_COMPLETE.md](./docs/ROADMAP_V1_COMPLETE.md)

---

## Vision

A cat has nine lives. Each life is a different "dream" — a different game genre played with the same custom AI-generated cat. The player progresses through all nine to reach cat paradise at the top of the Great Cat Tree.

Levels unlock linearly (beat boss / clear goal → unlock next). Hall of Fame, character customization, AI integration, and the campaign shell persist across all nine.

---

## The Nine Lives

| # | Name | Genre | Core Mechanic | Input | Orientation |
|---|------|-------|---------------|-------|-------------|
| 1 | **Sunny Shore** | Endless Runner | Auto-scroll, jump/duck, collect stars, boss fight | Jump / Duck | Horizontal scroll |
| 2 | **Rooftop Prowl** | Platformer (Mario) | Free X/Y movement, designed levels, platforms | Move / Jump | Horizontal camera |
| 3 | **Counter Chaos** | Launcher (Angry Birds) | Drag-to-aim, physics sim, destructible structures | Drag & release | Static screen |
| 4 | **Cosmic Kitty** | Space Shooter (Galaga) | Move horizontally, shoot furballs, enemy waves | Move / Shoot | Vertical scroll |
| 5 | **Yarn Breaker** | Breakout (Arkanoid) | Paddle (paw) movement, ball (yarn) physics, brick grid | Paddle move | Static screen |
| 6 | **Busy Whiskers** | Frogger | Discrete grid/lane movement, timing-based crossing | Grid step | Static / vertical |
| 7 | **Mouse Hunt** | Whack-a-Mole | Tap/click targets before they disappear, combo chains | Tap / Click | Static screen |
| 8 | **Catnip Garden** | Snake | Continuous direction movement, growing tail, self-collision | Direction keys | Static wraparound |
| 9 | **The Cat Tree** | Vertical Climber (Doodle Jump) | Auto-bounce on platforms, horizontal control, ascend | Horizontal + auto-jump | Vertical scroll |

---

## Narrative Frame

Each level is a "past life" the cat lived. Between levels, short cutscenes narrate how the cat lost that life and woke into the next dream. Defeating all nine bosses/goals means the cat ascends the Great Cat Tree and earns eternal catnip.

Campaign screen: a vertical cat tree with nine branches. Each branch shows a ghostly paw print (locked), a glowing paw (unlocked), or a trophy paw (cleared). The cat sprite sits on the highest cleared branch.

---

## Architecture: React + Phaser 3

### Rendering split

The current approach (React DOM elements for game objects) works for Level 1 but won't scale to 9 genres with physics, tile maps, particles, and varied input. The V3 architecture:

```
React (UI shell — menus, HUD, customizer, cutscenes, campaign screen)
  │
  ├── App.tsx — game state machine, genre router, progression
  ├── CampaignScreen.tsx — the cat tree level selector (replaces LevelSelection)
  ├── CatCustomizer.tsx — unchanged
  ├── CutscenePlayer.tsx — between-level story beats
  ├── HUD overlay — score, lives, genre-specific indicators
  └── Hall of Fame, victory, game over screens
  │
Phaser 3 (game viewport — one Scene per genre)
  │
  ├── RunnerScene — Level 1 (port of current GameEngine)
  ├── PlatformerScene — Level 2
  ├── LauncherScene — Level 3
  ├── ShooterScene — Level 4
  ├── BreakoutScene — Level 5
  ├── FroggerScene — Level 6
  ├── WhackScene — Level 7
  ├── SnakeScene — Level 8
  └── ClimberScene — Level 9
  │
Shared services (unchanged)
  ├── services/audioService.ts, sfxService.ts
  ├── services/geminiService.ts + server API routes
  ├── services/catAssetStore.ts, migrateCatStorage.ts
  ├── services/levelProgress.ts, runOutcome.ts
  └── systems/tuning/, systems/telemetry/
```

### React ↔ Phaser bridge

A `PhaserGame` React component mounts/destroys a `Phaser.Game` instance inside a div. Communication:

- **React → Phaser:** Pass level config, cat sprite URL, and tuning via Phaser Scene `init()` data or a shared registry object.
- **Phaser → React:** Phaser emits events (`scoreUpdate`, `livesChanged`, `bossDefeated`, `gameOver`, `victoryFinalize`) that the React wrapper translates into callbacks (`onScoreUpdate`, `onGameOver`, `onVictoryFinalize` — same interface as today's `GameEngine` props).
- **HUD stays in React** — overlaid on the Phaser canvas via absolute positioning. This keeps HUD styling consistent and avoids reimplementing UI in Phaser.

### Genre-level config

`LevelConfig` becomes a discriminated union on `genre`:

```typescript
type LevelGenre = 'runner' | 'platformer' | 'launcher' | 'shooter'
                | 'breakout' | 'frogger' | 'whack' | 'snake' | 'climber';

interface LevelConfigBase {
  id: LevelId;
  name: string;
  description: string;
  genre: LevelGenre;
  theme: ThemeConfig;
  catPose: CatPoseId;           // which sprite pose set this level uses
  tuningOverrides?: Partial<TuningProfile>;
  boss?: BossConfig;            // not every genre has a traditional boss
  victoryCondition: VictoryCondition;
  cutscene?: { intro?: CutsceneConfig; outro?: CutsceneConfig };
}
```

Each genre extends this with genre-specific fields (world map, enemy waves, brick layout, lane config, etc.). The Phaser scene loader reads the typed config.

---

## Character Model Per Genre

### The problem

The current cat is a single AI-generated PNG shown as a side-running sprite. A platformer needs idle/walk/jump poses. A space shooter needs a forward-facing cat in a box ship. Whack-a-mole needs a paw. Each genre needs the cat to look different while remaining recognizably the same character.

### Approach: Pose variants from a single source image

1. **Base sprite:** The AI-generated custom cat PNG (or default cat) remains the canonical character image. Stored in IndexedDB as today.

2. **Pose generation (two tiers):**
   - **Tier 1 — Programmatic transforms (ship first):** For most genres, transform the base sprite via canvas/CSS: flip, rotate, scale, crop to head, add overlays (helmet, spaceship frame, paw cutout). This is fast, deterministic, and free.
   - **Tier 2 — AI pose variants (stretch goal):** Use Gemini image generation to create genre-specific poses from the base sprite (e.g., "draw this cat sitting in a cardboard spaceship"). Store as additional IndexedDB assets keyed by `(catAssetId, poseId)`. Expensive, optional, and can fail gracefully back to Tier 1.

3. **Pose registry:**
   ```typescript
   type CatPoseId =
     | 'runner'      // side-running, current default
     | 'platformer'  // side-view idle/walk/jump
     | 'pilot'       // forward-facing in cardboard box ship
     | 'launcher'    // sitting, tail-flick for launch
     | 'paddle'      // paw only (breakout)
     | 'hopper'      // top-down-ish (frogger)
     | 'swatter'     // paw with claws (whack)
     | 'slitherer'   // head for snake
     | 'climber';    // side-view arms-up
   ```

4. **Fallback chain:** AI pose → programmatic transform → base sprite unchanged. Every genre must look acceptable with just the base sprite and programmatic transforms.

---

## Phase Plan

### Phase 0: Foundation — Phaser Integration + Bridge

**Goal:** Add Phaser 3 to the project, create the React↔Phaser bridge component, and verify it works alongside the existing React UI without breaking anything.

**Tasks:**
- [ ] Install `phaser` as a dependency
- [ ] Create `components/PhaserGame.tsx` — mounts a Phaser.Game in a div, handles resize, cleanup
- [ ] Define the bridge event protocol (TypeScript interfaces for all Phaser→React events)
- [ ] Create a minimal test scene (`scenes/TestScene.ts`) that renders a colored rect and emits a score event — verify React HUD updates
- [ ] Verify Vite builds with Phaser (tree-shaking config, bundle size check)
- [ ] Verify Vercel deployment still works
- [ ] Update `CLAUDE.md` / `AGENTS.md` with Phaser architecture notes
- [ ] Document Phaser dev workflow in README (how to run, hot reload behavior)

**Key decisions:**
- Phaser AUTO mode (WebGL with Canvas fallback) or force WebGL?
- Does Phaser own the full viewport or a sub-region? (Recommendation: full viewport, React HUD overlays)
- Asset loading strategy: Phaser's loader vs. shared service?

**Estimated scope:** 1–2 days

---

### Phase 1: Port Level 1 (Beach Runner) to Phaser

**Goal:** Reimplement the current `GameEngine.tsx` as a Phaser `RunnerScene` with identical gameplay. The React HUD, App state machine, and all services remain unchanged. This is the proof that the architecture works.

**Tasks:**
- [ ] Create `scenes/RunnerScene.ts` — Phaser scene with `init`, `preload`, `create`, `update`
- [ ] Port player physics (gravity, jump, double-jump, ducking) to Phaser Arcade Physics
- [ ] Port obstacle spawning logic (weighted pool, patterns, life-assist scaling)
- [ ] Port collectible logic (coins, shells, power-ups) and scoring
- [ ] Port collision detection (AABB → Phaser overlap/collider with forgiveness padding)
- [ ] Port seagull swoop/poop behaviors
- [ ] Port boss fight (Sand Monster spawn, projectile arcs, health, defeat animation)
- [ ] Port visual effects: particles → Phaser particle emitter, screen shake → camera shake, speed lines, hit flash
- [ ] Port background parallax layers (boats, surfers, planes, clouds)
- [ ] Convert SVG obstacle art to Phaser-compatible textures (render SVGs to canvas at build time or use Phaser's SVG texture support)
- [ ] Wire `RunnerScene` events to `PhaserGame` bridge → App callbacks
- [ ] Wire input: keyboard (Space, Arrow, P/Esc) + touch (left-half jump, right-half duck)
- [ ] Verify gameplay feel is identical (record side-by-side video comparison)
- [ ] Verify mobile touch controls work
- [ ] Verify dev BalancePanel tuning still affects gameplay (bridge tuning store → scene)
- [ ] Regression: run existing Vitest suite — all tests pass
- [ ] Remove or archive old `components/GameEngine.tsx` (keep as reference until confident)

**Risk:** This is the largest single phase. The runner is ~1600 lines of tightly coupled logic. Porting it faithfully while learning Phaser's API will take patience.

**Estimated scope:** 5–8 days

---

### Phase 2: Campaign Screen + Cutscene System

**Goal:** Replace the flat level-selection UI with the Nine Lives campaign tree. Add a cutscene player for between-level story beats.

**Tasks:**
- [ ] Design campaign screen layout (vertical cat tree, 9 branches, cat sprite on highest cleared)
- [ ] Create `components/CampaignScreen.tsx` — replace `LevelSelection.tsx`
- [ ] Implement lock/unlock/cleared visual states per branch
- [ ] Wire to existing `defeatedBosses` + `levelProgress` persistence
- [ ] Create `components/CutscenePlayer.tsx` — sequential text + image frames with transitions
- [ ] Define `CutsceneConfig` type (frames, text, optional voiceover placeholder, duration)
- [ ] Write intro cutscene for Level 1 (cat falls asleep on the beach, dreams begin)
- [ ] Write transition cutscene template (cat loses a life, wakes in next dream)
- [ ] Wire cutscene triggers: before first play, between level transitions
- [ ] Update App.tsx state machine: `CUTSCENE` status, `CAMPAIGN` replaces `LEVEL_SELECTION`

**Creative dependency:** Cutscene writing and art direction. Placeholder text is fine for V3 initial pass.

**Estimated scope:** 3–5 days

---

### Phase 3: Character Pose System

**Goal:** Build the infrastructure for genre-specific cat appearances so each level shows an appropriate version of the player's custom cat.

**Tasks:**
- [ ] Define `CatPoseId` type and pose registry
- [ ] Create `services/catPoseTransforms.ts` — programmatic transforms per pose (canvas operations: crop, rotate, overlay, frame)
- [ ] Create pose overlay assets (spaceship frame, helmet, paw cutout template, etc.)
- [ ] Integrate pose system with `PhaserGame` bridge — scene receives pose-transformed texture
- [ ] Update `Kitty.tsx` equivalent in Phaser (sprite with pose-aware texture)
- [ ] Test: custom cat renders correctly in runner pose (Level 1, no regression)
- [ ] Test: custom cat renders as pilot pose (Level 4 preview in campaign screen)
- [ ] Stretch: Gemini-based pose variant generation (Tier 2) with fallback to Tier 1

**Estimated scope:** 3–4 days (Tier 1 only); +2–3 days for Tier 2 AI poses

---

### Phase 4: Level 2 — Rooftop Prowl (Platformer)

**Goal:** First new genre. Cat navigates city rooftops at night jumping between buildings, climbing fire escapes, avoiding enemies. Boss: Raccoon on a water tower.

**New systems required:**
- [ ] Bidirectional player movement (left/right + jump, `vx` + `vy`)
- [ ] Camera follow with bounds (Phaser `startFollow` + `setBounds`)
- [ ] Platform collision with one-way pass-through (Phaser Arcade `checkDown`)
- [ ] Moving platforms (Phaser tweens or path followers)
- [ ] Level map system — evaluate Tiled editor integration (`this.make.tilemap`) vs. code-defined layouts
- [ ] Enemy patrol AI (walk between waypoints, turn at platform edges)
- [ ] Stomp-to-kill mechanic (reuse stomp collision concept from runner)
- [ ] Goal trigger (reach the end of the level / rooftop)
- [ ] Platformer-specific HUD (lives, score, maybe a mini-map or progress bar)

**Level design tasks:**
- [ ] Design 1–3 platformer stages (or one long stage with checkpoints)
- [ ] Place platforms, enemies, collectibles, hazards
- [ ] Design boss fight: Raccoon water tower encounter
- [ ] Create obstacle/enemy sprites (pigeons, alley cats, trash cans)
- [ ] Design rooftop tileset or background art
- [ ] Design night sky + city parallax background

**Theme:** Nighttime city. Neon signs, lit windows, clotheslines, AC units as platforms, pigeon coops, fire escapes. Moon rises as you progress.

**Estimated scope:** 8–12 days

---

### Phase 5: Level 3 — Counter Chaos (Launcher)

**Goal:** Angry Birds but you're a cat on a kitchen counter pushing objects off to break structures below.

**New systems required:**
- [ ] Drag-to-aim input (touch and mouse)
- [ ] Projectile physics — Phaser Matter.js integration (better than Arcade for destructibles)
- [ ] Destructible structures (stacked objects: glass = fragile, ceramic = medium, cast iron = tough)
- [ ] Damage/destruction thresholds and collapse physics
- [ ] Level-complete scoring (stars based on destruction %, shots used)
- [ ] Multiple projectile types (water glass, coffee mug, fishbowl — different weights/properties)
- [ ] Victory condition: destroy target structure / score threshold

**Level design tasks:**
- [ ] Design 5–10 launcher puzzles (increasing complexity)
- [ ] Design kitchen environment art (counter, floor, shelves)
- [ ] Design destructible structure sprites and physics shapes
- [ ] Design projectile sprites
- [ ] Design boss: kitchen appliance that fights back? Or a dog guarding the counter?

**Theme:** Sunny kitchen. Granite countertops, hanging pots, fruit bowl, window with garden view. Very domestic, very cat.

**Estimated scope:** 6–10 days

---

### Phase 6: Level 4 — Cosmic Kitty (Space Shooter)

**Goal:** Galaga-style vertical shooter. Cat in a cardboard-box spaceship shoots furballs at descending waves of alien mice.

**New systems required:**
- [ ] Player horizontal movement at screen bottom
- [ ] Shoot mechanic (furballs, fire rate, upgrade tiers)
- [ ] Enemy wave system (formation patterns, descent paths, attack runs)
- [ ] Enemy bullet patterns (simple → bullet-hell-lite at higher waves)
- [ ] Power-ups: laser pointer beam (piercing), spray bottle (area damage), catnip (bullet time / slow-mo)
- [ ] Wave-based progression with boss wave every N waves
- [ ] Score multiplier for chain kills

**Level design tasks:**
- [ ] Design 10–15 enemy wave formations
- [ ] Design enemy types (mouse grunt, mouse bomber, mouse shield, mouse commander)
- [ ] Design boss: Giant Space Mouse or Cat-shaped mothership
- [ ] Design space background (parallax starfield, nebula, cat constellations)
- [ ] Design cardboard-box spaceship sprite
- [ ] Sound: pew-pew furballs, mouse squeaks, space ambience

**Theme:** Deep space, but silly. Cardboard aesthetics. Stars are yarn balls. Planets are cat toys.

**Estimated scope:** 6–10 days

---

### Phase 7: Levels 5–7 (Breakout, Frogger, Whack-a-Mole)

**Goal:** Three simpler genres that can be built in a concentrated sprint. These are mechanically well-understood games with smaller engine requirements.

#### Level 5 — Yarn Breaker (Breakout)
- [ ] Paddle (paw) at bottom, controlled by mouse/touch/keys
- [ ] Ball (yarn) physics with angle reflection
- [ ] Brick grid (fish bowls, bird cages, mouse traps) — different hit counts
- [ ] Power-ups: multi-ball, wide paw, sticky paw, fireball (destroys all)
- [ ] Boss: a row of indestructible bricks that move and shoot back
- [ ] ~10 level layouts (brick arrangements)

#### Level 6 — Busy Whiskers (Frogger)
- [ ] Lane system with moving hazards (cars, bikes, dogs on leashes)
- [ ] River section with floating platforms (logs, lily pads, pool floats)
- [ ] Discrete grid movement (one step per input)
- [ ] Fish collectibles in the river for bonus points
- [ ] Timer pressure (cat must reach home before time runs out)
- [ ] Boss: a busy intersection that gets increasingly chaotic
- [ ] 5–8 stage layouts (different lane configurations)

#### Level 7 — Mouse Hunt (Whack-a-Mole)
- [ ] Grid of holes, mice pop up with random timing
- [ ] Tap/click to swat — hit detection on mouse sprites
- [ ] Mouse variants: normal, cheese mouse (bonus), sneaky mouse (fakes), armored mouse (2 hits)
- [ ] Combo system (sequential hits increase multiplier)
- [ ] Speed escalation over time
- [ ] Boss: giant mouse that takes many hits, has feint patterns
- [ ] Session-based: survive N rounds or reach target score

**Estimated scope:** 4–5 days each, ~12–15 days total for all three

---

### Phase 8: Levels 8–9 (Snake, Vertical Climber)

**Goal:** The final two levels. These are the hardest (for the player) and serve as the campaign climax.

#### Level 8 — Catnip Garden (Snake)
- [ ] Grid-based continuous movement (cat head leads, tail follows)
- [ ] Catnip pickups grow the tail
- [ ] Self-collision = death
- [ ] Garden walls and obstacles (fences, flower pots)
- [ ] Cucumber spawns — instant scare/death zone (cat meme reference)
- [ ] Special catnip: speed boost, invincibility, tail shrink
- [ ] Boss: a dog that chases you around the garden, you must lead it into traps
- [ ] Wrap-around edges or walled arena (design decision)

#### Level 9 — The Cat Tree (Vertical Climber)
- [ ] Vertical auto-scroll upward (camera rises, fall off bottom = death)
- [ ] Platforms: solid shelves, springs (super bounce), breakable (one use), moving (sway)
- [ ] Horizontal player control (left/right), auto-bounce on platform contact
- [ ] Enemies: birds, dangling toy distractions (slow effect), rival cats (knock-off)
- [ ] Increasing difficulty as height increases (platforms farther apart, more moving/breakable)
- [ ] Boss at the top: The Legendary Red Dot — laser pointer that moves unpredictably
- [ ] Thematic climax: ascending through clouds to cat paradise

**Estimated scope:** 5–6 days each, ~10–12 days total

---

### Phase 9: Polish, Balancing, and Ship

**Goal:** Make the full campaign feel like a cohesive product.

**Tasks:**
- [ ] Balance pass on all 9 levels (difficulty curve across the campaign)
- [ ] Consistent scoring system across genres (normalize so Hall of Fame makes sense)
- [ ] Write all 9 cutscene scripts (intro + 8 transitions + finale)
- [ ] Sound design pass — each level needs distinct music and genre-appropriate SFX
- [ ] Campaign screen polish — animations, transitions, visual feedback
- [ ] Mobile/touch QA pass on all 9 genres
- [ ] Performance profiling — ensure smooth 60fps on mid-range devices with Phaser
- [ ] Accessibility pass — keyboard nav, reduced-motion, screen reader for menus/cutscenes
- [ ] Update Hall of Fame to show which levels scores came from
- [ ] Victory screen for completing all 9 lives (The Great Ascension)
- [ ] Update all documentation (CLAUDE.md, AGENTS.md, README, docs/)
- [ ] Full regression test suite for shared services
- [ ] Manual QA playthrough of all 9 levels (update docs/QA_CHECKLIST.md)

**Estimated scope:** 5–8 days

---

## Prerequisites and Setup

### Phaser 3 setup

```bash
npm install phaser
```

Vite config may need adjustments for Phaser's bundle:
- Phaser is large (~1MB minified). Evaluate `phaser/dist/phaser-custom` or `phaser.min.js` for tree-shaking.
- Verify Vite's `optimizeDeps` handles Phaser correctly.
- Consider code-splitting: load only the Phaser scene for the current level.

### Project structure (proposed)

```
├── components/
│   ├── PhaserGame.tsx          # React wrapper for Phaser canvas
│   ├── CampaignScreen.tsx      # Nine Lives cat tree selector
│   ├── CutscenePlayer.tsx      # Between-level story player
│   ├── HUD.tsx                 # Genre-aware score/lives overlay
│   ├── Kitty.tsx               # (Kept for React-rendered contexts)
│   ├── CatCustomizer.tsx       # (unchanged)
│   └── ...existing UI components
├── scenes/
│   ├── RunnerScene.ts          # Level 1 — Beach
│   ├── PlatformerScene.ts      # Level 2 — Rooftops
│   ├── LauncherScene.ts        # Level 3 — Kitchen
│   ├── ShooterScene.ts         # Level 4 — Space
│   ├── BreakoutScene.ts        # Level 5 — Yarn
│   ├── FroggerScene.ts         # Level 6 — Street
│   ├── WhackScene.ts           # Level 7 — Garden
│   ├── SnakeScene.ts           # Level 8 — Catnip
│   ├── ClimberScene.ts         # Level 9 — Cat Tree
│   └── shared/
│       ├── SceneBridge.ts      # Event protocol + shared scene base
│       ├── SpriteLoader.ts     # Shared cat sprite loading
│       └── EffectsManager.ts   # Shake, flash, particles (shared)
├── levels/
│   ├── catalog.ts              # LEVEL_ORDER, unlock logic
│   ├── index.ts                # Registry, getLevelConfig
│   ├── beach.ts                # Level 1 config (updated type)
│   ├── rooftops.ts             # Level 2 config
│   ├── kitchen.ts              # Level 3 config
│   ├── space.ts                # Level 4 config
│   ├── yarn.ts                 # Level 5 config
│   ├── street.ts               # Level 6 config
│   ├── garden-whack.ts         # Level 7 config
│   ├── garden-snake.ts         # Level 8 config
│   ├── cattree.ts              # Level 9 config
│   └── beach/                  # (existing — obstacles, backgrounds)
├── assets/                     # NEW — Phaser-loaded assets
│   ├── sprites/                # Character poses, enemies per level
│   ├── tilesets/               # Platformer tiles, brick layouts
│   ├── backgrounds/            # Parallax layers per level
│   └── audio/                  # Per-level music + SFX
├── services/
│   ├── catPoseTransforms.ts    # NEW — programmatic pose variants
│   └── ...existing services
└── types.ts                    # Extended with genre union
```

### Claude Code / AI assistant considerations

- **CLAUDE.md** and **AGENTS.md** must be updated at each phase boundary with the new architecture.
- Phaser scenes are plain TypeScript classes (not React components) — AI assistants should know to use Phaser APIs, not React patterns, inside `scenes/`.
- Level design data (tile maps, wave patterns, brick layouts) should be JSON or TypeScript configs, not hardcoded in scene logic — keeps AI-assisted iteration fast.
- Asset pipeline: SVGs → PNGs at build time, or Phaser texture generation from SVG strings at runtime. Decide in Phase 0.

---

## Type System Changes

### LevelId expansion

```typescript
export type LevelId =
  | 'BEACH'        // Life 1
  | 'ROOFTOPS'     // Life 2
  | 'KITCHEN'      // Life 3
  | 'SPACE'        // Life 4
  | 'YARN'         // Life 5
  | 'STREET'       // Life 6
  | 'GARDEN_WHACK' // Life 7
  | 'GARDEN_SNAKE' // Life 8
  | 'CAT_TREE';    // Life 9
```

### LevelConfig discriminated union

```typescript
type LevelGenre = 'runner' | 'platformer' | 'launcher' | 'shooter'
                | 'breakout' | 'frogger' | 'whack' | 'snake' | 'climber';

interface LevelConfigBase {
  id: LevelId;
  name: string;
  description: string;
  genre: LevelGenre;
  theme: ThemeConfig;
  catPose: CatPoseId;
  tuningOverrides?: Partial<TuningProfile>;
  victoryCondition: VictoryCondition;
  cutscene?: { intro?: CutsceneConfig; outro?: CutsceneConfig };
}

// Genre-specific configs extend the base
interface RunnerLevelConfig extends LevelConfigBase {
  genre: 'runner';
  obstacles: ObstacleDefinition[];
  patterns: PatternStep[][];
  background: BackgroundConfig;
  boss: BossConfig;
  harmfulTypes?: EntityType[];
  magnetAttractTypes?: EntityType[];
  bossEntryCoinThreshold?: number;
}

interface PlatformerLevelConfig extends LevelConfigBase {
  genre: 'platformer';
  world: PlatformerWorld;
  enemies: PlatformerEnemyDef[];
  boss?: BossConfig;
}

interface LauncherLevelConfig extends LevelConfigBase {
  genre: 'launcher';
  puzzles: LauncherPuzzle[];
  projectileTypes: LauncherProjectileDef[];
}

// ... one interface per genre

type LevelConfig = RunnerLevelConfig | PlatformerLevelConfig
                 | LauncherLevelConfig | ShooterLevelConfig
                 | BreakoutLevelConfig | FroggerLevelConfig
                 | WhackLevelConfig | SnakeLevelConfig
                 | ClimberLevelConfig;
```

### VictoryCondition

```typescript
type VictoryCondition =
  | { type: 'boss'; bossId: string }
  | { type: 'goal'; description: string }     // reach the end
  | { type: 'score'; target: number }          // hit score threshold
  | { type: 'survive'; durationMs: number }    // last N seconds
  | { type: 'clear'; description: string };    // destroy all targets
```

### GameStatus additions

```typescript
export enum GameStatus {
  CAMPAIGN = 'CAMPAIGN',           // was LEVEL_SELECTION
  CUSTOMIZE = 'CUSTOMIZE',
  CUTSCENE = 'CUTSCENE',          // NEW
  PLAYING = 'PLAYING',
  BOSS_FIGHT = 'BOSS_FIGHT',
  GAMEOVER = 'GAMEOVER',
  VICTORY = 'VICTORY',
  CAMPAIGN_COMPLETE = 'CAMPAIGN_COMPLETE', // NEW — all 9 cleared
}
```

---

## Scoring System Across Genres

Each genre uses its own internal scoring, but the Hall of Fame needs a unified currency.

**Proposal:** Each level reports a normalized `finalScore` (0–999) based on genre-specific criteria:

| Genre | Score basis |
|-------|-----------|
| Runner | Distance × multiplier + coins |
| Platformer | Coins + time bonus + enemy stomps |
| Launcher | Destruction % × efficiency bonus |
| Shooter | Kills × chain multiplier |
| Breakout | Bricks destroyed × speed bonus |
| Frogger | Crossings × fish bonus − time penalty |
| Whack | Hits × combo multiplier |
| Snake | Length × catnip collected |
| Climber | Height reached × collectibles |

Hall of Fame entries include `levelId` so scores are contextual.

---

## Open Questions (for review)

1. **Level 1 port fidelity:** Should the Phaser port of Beach Kitty be pixel-identical to the current DOM version, or is "same feel, better performance" acceptable?

2. **Asset pipeline:** SVGs are currently inline JSX. Do we pre-render to PNG sprite sheets, or generate Phaser textures at runtime from SVG strings? Pre-render is faster at runtime but adds a build step.

3. **Tiled editor vs. code-defined levels:** For the platformer, do we integrate the Tiled map editor (industry standard, visual level design, `.tmj` export) or define platforms in TypeScript configs? Tiled is better for complex levels but adds tooling.

4. **Music:** Each level needs distinct music. Keep the procedural Web Audio approach (more work per genre) or switch to pre-composed audio files (simpler, more expressive)? Hybrid is possible — procedural for some, files for others.

5. **Mobile controls:** Each genre needs different touch controls (virtual joystick for platformer, tap for whack, drag for launcher). Design a unified touch-control adapter or handle per-genre?

6. **Campaign persistence:** Currently only `defeatedBosses` + Hall of Fame are saved. Should we save mid-level progress, per-level high scores, stars earned, collectibles found?

7. **Difficulty scaling:** Does the game get harder as you progress through levels (9 is hardest), or is each level self-contained difficulty? The "dream" metaphor supports either.

8. **AI cutscenes:** Should Gemini generate per-run cutscene text (like current wisdom/death messages), or are cutscenes static/hand-written?

9. **Bundle size:** Phaser is ~1MB. With 9 levels of assets, the total bundle could grow. Code-split per-level? Lazy-load assets?

---

## Rough Timeline

| Phase | Scope | Calendar estimate |
|-------|-------|-------------------|
| 0 | Phaser integration + bridge | 1–2 days |
| 1 | Port Level 1 to Phaser | 5–8 days |
| 2 | Campaign screen + cutscenes | 3–5 days |
| 3 | Character pose system | 3–4 days |
| 4 | Level 2 — Platformer | 8–12 days |
| 5 | Level 3 — Launcher | 6–10 days |
| 6 | Level 4 — Space Shooter | 6–10 days |
| 7 | Levels 5–7 — Breakout, Frogger, Whack | 12–15 days |
| 8 | Levels 8–9 — Snake, Climber | 10–12 days |
| 9 | Polish + balancing + ship | 5–8 days |
| **Total** | | **~60–90 days** |

This is a multi-month project. The critical path is: Phase 0 → Phase 1 → Phase 2, then levels can be built in any order (though the campaign unlock order suggests building them roughly sequentially).

---

## Success Criteria

- [ ] All 9 levels are playable and feel like distinct games
- [ ] Custom AI-generated cat carries through all 9 genres with appropriate poses
- [ ] Campaign screen tells a cohesive "nine lives" story
- [ ] Cutscenes connect the narrative between levels
- [ ] Hall of Fame tracks scores across all levels
- [ ] Performance: solid 60fps on mid-range mobile (Phaser WebGL)
- [ ] Same Vite + Vercel deployment pipeline — no infrastructure changes
- [ ] Gemini AI integration preserved (custom cats, wisdom, death messages)
- [ ] Level 1 (Beach) feels at least as good as the current DOM version

---

## What This Spec Does NOT Cover

- Detailed level layouts (platform placement, enemy positions, brick patterns, wave formations)
- Specific art direction per level (color palettes, sprite art, tileset design)
- Cutscene scripts and narrative writing
- Sound design per level (music composition, SFX selection)
- Monetization or distribution strategy
- Multiplayer or leaderboard features
- Localization

These are creative and design tasks that should be separate documents, tackled per-level during implementation.
