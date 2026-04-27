# Repeatable Level Art Pipeline

Roadmap V4 Phase 5 turns the Beach process into the default way to finish the remaining campaign levels. This document is the operating workflow for world art, hero sheets, manifests, and QA evidence.

Use this pipeline before changing runtime art for a level. The goal is to make each level start from a known set of files and gates instead of another asset strategy debate.

## Quick Start

```bash
npm run scaffold:level-art -- --level ROOFTOPS --dry-run
npm run scaffold:level-art -- --level ROOFTOPS
```

The scaffold creates per-level plan documents and committed asset directories. It does not generate gameplay art, edit scene code, or overwrite existing plans unless `--force` is passed.

## Required Deliverables

Each level needs:

- visual brief
- prompt pack or source-generation notes
- asset inventory with status and acceptance notes
- level-local asset directories under `assets/sprites/<level-slug>/`
- runtime asset manifest or key registry once finals exist
- genre hero-sheet contract
- QA checklist with screenshot/capture links

## Phase Gates

### 0. Kickoff

Inputs:

- `levels/catalog.ts` metadata
- current `levels/<level>.ts` config
- archived design notes when they exist
- scaffolded docs from `scripts/scaffold-level-art-pipeline.mjs`

Gate:

- level id, genre, victory condition, asset slug, and owner docs are explicit.

### 1. Visual Brief

Manual/product-led work.

Record:

- theme and player fantasy
- palette
- line style
- camera/readability rules
- gameplay-layer hierarchy
- UI/HUD relationship
- boss or finale visual promise

Gate:

- a reviewer can reject an asset candidate by pointing to the brief.

### 2. Prompt Pack

Model-assisted or manual source-generation planning.

Record:

- global prompt invariants
- one prompt per asset family
- export target path
- transparency rule
- rejection criteria

Gate:

- prompts are written before asset generation and are not improvised inside runtime integration.

### 3. Candidate Generation

Model-assisted or manual art production outside the game runtime.

Rules:

- generate or author outside the shipped gameplay runtime
- select strong candidates before cleanup
- reject fake transparency and unreadable silhouettes early
- keep source notes in the prompt pack when prompts or manual construction change

Gate:

- selected assets have enough quality to clean, not merely enough quality to compile.

### 4. Cleanup And Export

Manual cleanup.

Allowed:

- crop
- true-alpha cleanup
- color balancing
- silhouette fixes
- frame alignment
- tile seam fixes

Not allowed as the normal path:

- checkerboard or fake-transparency rescue
- runtime shader hacks as primary cleanup
- accepting model mistakes because scene code can hide them

Gate:

- exported files match the target directory, dimensions, alpha rule, and baseline/origin notes.

### 5. Runtime Manifest And Integration

Runtime/code work.

Each level should get a manifest or key registry near its scene family, following the Beach pattern in `scenes/runner/beachAssets.ts`.

Record:

- deterministic Phaser texture keys
- final import paths
- gameplay type to texture mapping
- variant sets
- boss/finale state textures
- any deliberate fallback art

Gate:

- scene code loads through the manifest instead of scattered ad hoc imports.

### 6. Hero-Sheet Contract

Genre-specific sprite-pipeline work.

Each genre declares:

- fixed frame size and sheet layout
- required animation states
- anchor/origin
- baseline or contact point
- collision boxes separate from visual padding
- runtime state resolver priority
- future custom-cat swap rules

Gate:

- the default gameplay cat is animated for the genre, and later swaps can be tested against the same contract.

### 7. QA And Capture

Manual plus browser automation.

Run:

```bash
npm run test:run
npx tsc --noEmit
npm run build
npm run test:smoke
```

Capture:

- level start/readability
- representative core mechanic
- hazard/enemy interaction
- boss/finale or victory path
- pause/HUD readability
- victory and game-over surfaces

Gate:

- QA notes link to artifacts and name remaining follow-ups.

## Status Vocabulary

Use these statuses in asset inventories:

- `planned` - needed but not produced
- `generated` - candidate exists outside final runtime path
- `selected` - candidate chosen for cleanup
- `cleaned` - exported and committed
- `integrated` - manifest and scene use it
- `verified` - seen in-game and covered by QA notes
- `deferred` - intentionally out of scope for this pass

## Responsibility Split

| Step | Model-assisted | Manual cleanup/review | Runtime integration |
| --- | --- | --- | --- |
| Visual brief | Optional mood exploration | Required direction and acceptance rules | None |
| Prompt pack | Drafting candidates | Required prompt review | None |
| Candidate generation | Optional image/vector generation | Required selection/rejection | None |
| Cleanup/export | Optional background removal assist | Required final alpha, crop, alignment | None |
| Manifest | None | Naming review | Required |
| Hero sheet | Optional sheet generation | Required frame/alignment review | Required resolver and hitboxes |
| QA | Optional capture automation | Required play feel judgment | Required test/smoke fixes |

## Directory Shape

```text
assets/
  sprites/
    <level-slug>/
      environment/
      obstacles/
      collectibles/
      entities/
      boss/
      hero/
      fx/
```

Non-runner levels may rename families when the genre needs it, but the first pass should keep this shape unless there is a concrete reason not to.

## Repeatability Rule

If a future level needs a different process, document the difference in that level's asset inventory before implementing it. Do not let scene code become the first place where the process changes.
