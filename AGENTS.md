# AGENTS.md

**Twin:** [CLAUDE.md](./CLAUDE.md) — keep both files aligned when architecture or workflow guidance changes.

Guidance for coding agents working in this repository.

## Project Overview

Beach Kitty is a Phaser-based nine-level campaign built with React 19, TypeScript, and Vite. React owns menus, campaign flow, HUD, customizer, and persistence surfaces. Phaser owns runtime gameplay through genre-specific scenes for runner, platformer, launcher, shooter, breakout, frogger, whack, snake, and climber modes.

## Canonical Files

- Active root roadmap — no root roadmap is active right now; next session should create `ROADMAP_CITYHEIGHTS.md`
- `PROGRESS.md` — the root session log
- `docs/` — supporting architecture, product, plan, and spec material
- GitHub Issues — active bug and technical-debt tracker

Historical planning material, including completed `ROADMAP_V4.md`, lives under `docs/archive/`. The retired `KNOWN_ISSUES` workflow is not part of the active loop.

## Development Commands

```bash
npm install
npm run dev
npm run build
npm run preview
npm run scaffold:level-art -- --level ROOFTOPS
npm run test:run
npm run test:smoke
npx tsc --noEmit
./scripts/dev-init.sh
```

## Current Runtime Snapshot

- `levels/index.ts` registers 9 runtime configs in `LEVEL_REGISTRY`.
- `App.tsx` routes 9 lazy Phaser scene imports through `PhaserGame`.
- `components/PhaserGame.tsx` and `scenes/shared/SceneBridge.ts` are the shared React/Phaser bridge.
- Gameplay is Phaser-only; there is no supported DOM-runner fallback path.
- Level 1 gameplay uses the committed Beach runner hero sheet from `assets/sprites/beach/hero/`, with animation contract/state mapping in `scenes/runner/heroSheet.ts`.
- `playwright/smoke.spec.ts` covers campaign boot, Kitty Closet, Phaser boot/eject, victory/game-over mutation, and Hall of Fame ordering/cap behavior.
- Custom cat assets live in IndexedDB plus localStorage metadata, with server-side Gemini generation and sprite matting support for optional identity surfaces.

## Active Docs

- `docs/architecture/level-development.md`
- `docs/architecture/behavior-system.md`
- `docs/architecture/level-runtime.md`
- `docs/architecture/asset-pipeline.md`
- `docs/architecture/level-art-pipeline.md`
- `docs/architecture/api-protection.md`
- `docs/product/qa-checklist.md`
- `docs/plans/README.md`
- `docs/templates/README.md`
- `docs/plans/level-1-asset-inventory.md`
- `docs/plans/level-1-beach-visual-brief.md`
- `docs/plans/level-1-beach-prompt-pack.md`
- `docs/plans/level-1-runner-hero-sheet-contract.md`
- `docs/plans/level-1-phase-4-playtest.md`
- `docs/plans/level-2-city-heights-visual-brief.md`
- `docs/plans/level-2-city-heights-prompt-pack.md`
- `docs/plans/level-2-city-heights-asset-inventory.md`
- `docs/plans/level-2-platformer-hero-sheet-contract.md`
- `docs/plans/level-2-city-heights-qa-checklist.md`
- `docs/specs/README.md`

## Game Studio Routing

Default execution model:

- `game-studio` routes browser-game work
- `phaser-2d-game` is the default implementation path for runtime/gameplay changes
- `sprite-pipeline` is the default path for 2D sprite-sheet and hero-sheet work
- `game-playtest` is the default path for browser smoke tests, screenshots, HUD review, and scene QA

## Current Focus

- Roadmap V4 Level 1 (`BEACH`) completion is closed through Phase 4 polish/playtest; use `docs/plans/level-1-phase-4-playtest.md` for the latest Beach visual evidence.
- Roadmap V4 Phase 5 is in place: use `npm run scaffold:level-art -- --level LEVEL_ID` and `docs/architecture/level-art-pipeline.md` before starting a remaining level's art pass.
- City Heights (`ROOFTOPS`) is the first non-runner seed, with platformer-specific docs under `docs/plans/level-2-*`.
- Next session should create `ROADMAP_CITYHEIGHTS.md` at the repo root; session tooling now discovers root `ROADMAP_*.md` files automatically.
- Keep live cat generation off the gameplay critical path unless it can satisfy the same constrained sheet contract as the default hero.
- Keep smoke coverage green and keep bundle-size follow-ups visible while asset plumbing evolves.

## Contributor Notes

- Prefer the active root roadmap and live code when secondary docs drift.
- Treat `PROGRESS.md` as the durable handoff log at the repo root.
- Treat `docs/plans/` and `docs/specs/` as active-only landing zones; move dated superseded artifacts into `docs/archive/`.
- Keep `AGENTS.md` and `CLAUDE.md` aligned as twins where possible.
- Do not reintroduce active backlog language around retired root files.
