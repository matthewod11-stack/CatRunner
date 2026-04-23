# Asset Pipeline

This document defines how Beach Kitty should create, clean, store, and integrate gameplay art after the Phaser-only reset. It exists to keep Beach Level 1 from becoming another one-off art experiment and to make future levels repeatable.

## Goals

- Make Level 1 (`BEACH`) look like a finished game rather than a wireframe with swapped PNGs.
- Keep art generation outside the gameplay runtime.
- Give every level the same asset workflow so new scenes do not restart the strategy conversation.
- Keep optional AI cat customization from blocking gameplay quality.

## Core Rules

- World art is prebuilt, reviewed, and committed before gameplay integration.
- Runtime image generation is not part of shipped world building.
- Shipped world art must use true transparency or intentional opaque full-bleed backgrounds.
- Fake transparency, checkerboard backgrounds, and runtime chroma rescue are not acceptable for world assets.
- Gameplay cat art must satisfy a documented animation-sheet contract.
- Matting is a fallback for optional cat customization, not the foundation of level art.

## Asset Classes

### 1. World Art

Includes:

- tiles
- environment layers
- obstacles
- collectibles
- background entities
- bosses
- HUD/support art

Policy:

- Generated or authored ahead of time.
- Cleaned before integration.
- Stored as committed files under a level-specific asset layout.
- Loaded by deterministic Phaser keys.

### 2. Gameplay Cat Art

Includes:

- runner hero sheet
- platformer hero sheet
- later genre-specific cat sheets

Policy:

- Gameplay uses constrained sheets, not arbitrary one-off still images.
- Each genre declares its required states and frame layout.
- Default gameplay cat sheet must exist even if custom-cat features are disabled.

### 3. Optional Cat Identity / Closet Art

Includes:

- live-generated closet looks
- reference portraits
- non-critical identity surfaces

Policy:

- Optional feature, not Level 1 critical path.
- Can use Gemini plus server/client matting as a fallback workflow.
- Must never force world-art or gameplay runtime design decisions.

## Recommended Workflow

### Step 1: Write The Art Brief

For each level, define:

- visual theme
- palette
- outline / contrast style
- camera angle
- mood
- readability constraints
- asset inventory

The art brief should exist before prompt writing or generation.

### Step 2: Generate A Prompt Pack

For each asset family, write prompts that keep:

- subject
- framing
- background rule
- outline weight
- palette intent
- export size target

Do not improvise prompts asset by asset during runtime integration.

### Step 3: Generate Outside The Game

Use model-assisted generation or manual art creation outside the runtime. Generate several candidates, select the strongest one, and reject weak outputs early instead of planning to rescue them in code.

### Step 4: Clean The Selected Asset

Allowed cleanup:

- crop
- true-alpha cleanup
- background removal when source obeys the agreed chroma rule
- color balancing
- silhouette fixes
- frame alignment

Disallowed cleanup as a normal pipeline:

- relying on checkerboard or fake-transparency erosion
- treating runtime shader/code hacks as the primary fix
- shipping model mistakes because the scene already compiles

### Step 5: Export To The Runtime Contract

Every shipped asset should have:

- final committed file
- target dimensions
- transparency rule
- origin / baseline note if gameplay alignment matters
- manifest entry or deterministic load key

### Step 6: Integrate And QA

Integration should verify:

- scale
- baseline / feet placement
- parallax depth
- readability against gameplay speed
- hitbox alignment
- pause / HUD readability
- victory / game-over presentation

## Transparency Rules

- Use true alpha where gameplay sprites need transparency.
- Use opaque full-bleed art where the asset is meant to fill the frame.
- Do not accept gray/white checkerboard backgrounds as “close enough.”
- Do not rely on `catSpriteMattingCore`-style rescue for shipped world art.

## Gameplay Cat Policy

- Level 1 assumes a curated runner hero sheet as the baseline gameplay cat.
- The current live cat generator is optional and off the Level 1 critical path.
- If live cat generation returns later for gameplay, it must output a constrained sheet that matches the same contract as the default hero.
- A static cat still image is not sufficient for a completed action game level.

## Target Directory Shape

The exact file structure can evolve, but future work should trend toward level-local grouping instead of one flat sprite pile. A target layout looks like this:

```text
assets/
  sprites/
    beach/
      environment/
      obstacles/
      entities/
      boss/
      hero/
```

And the runtime should have a corresponding manifest or registry layer instead of scattering keys through one giant scene file.

## Required Deliverables Per Level

- level art brief
- prompt pack or source-generation notes
- cleaned final assets
- asset manifest / key registry
- QA notes
- screenshots or capture from the integrated level

## Acceptance Checklist

- No shipped world art depends on runtime image generation.
- No shipped world art depends on fake-transparency cleanup.
- Gameplay cat is animated and readable.
- Asset naming and loading are deterministic.
- Another level can copy the same process without inventing a new strategy.
