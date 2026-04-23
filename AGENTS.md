# AGENTS.md

**Twin:** [CLAUDE.md](./CLAUDE.md) — keep both files aligned when architecture or workflow guidance changes.

Guidance for coding agents working in this repository.

## Project Overview

Beach Kitty is a Phaser-based nine-level campaign built with React 19, TypeScript, and Vite. React owns menus, campaign flow, HUD, customizer, and persistence surfaces. Phaser owns runtime gameplay through genre-specific scenes for runner, platformer, launcher, shooter, breakout, frogger, whack, snake, and climber modes.

## Canonical Files

- `ROADMAP_V4.md` — the active roadmap
- `PROGRESS.md` — the root session log
- `docs/` — supporting architecture, product, plan, and spec material
- GitHub Issues — active bug and technical-debt tracker

Historical planning material lives under `docs/archive/`. The retired `KNOWN_ISSUES` workflow is not part of the active loop.

## Development Commands

```bash
npm install
npm run dev
npm run build
npm run preview
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
- `playwright/smoke.spec.ts` covers campaign boot, Kitty Closet, Phaser boot/eject, victory/game-over mutation, and Hall of Fame ordering/cap behavior.
- Custom cat assets live in IndexedDB plus localStorage metadata, with server-side Gemini generation and sprite matting support for optional identity surfaces.

## Active Docs

- `docs/architecture/level-development.md`
- `docs/architecture/behavior-system.md`
- `docs/architecture/level-runtime.md`
- `docs/architecture/asset-pipeline.md`
- `docs/architecture/api-protection.md`
- `docs/product/qa-checklist.md`
- `docs/plans/README.md`
- `docs/specs/README.md`

## Game Studio Routing

Default execution model:

- `game-studio` routes browser-game work
- `phaser-2d-game` is the default implementation path for runtime/gameplay changes
- `sprite-pipeline` is the default path for 2D sprite-sheet and hero-sheet work
- `game-playtest` is the default path for browser smoke tests, screenshots, HUD review, and scene QA

## Current Focus

- Execute `ROADMAP_V4.md` around Level 1 (`BEACH`) completion rather than more migration-era cleanup.
- Use Beach as the proving ground for a repeatable world-art and hero-sheet pipeline that later levels can copy.
- Keep live cat generation off the gameplay critical path unless it can satisfy the same constrained sheet contract as the default hero.
- Keep smoke coverage green and keep bundle-size follow-ups visible while asset plumbing evolves.

## Contributor Notes

- Prefer `ROADMAP_V4.md` and live code when secondary docs drift.
- Treat `PROGRESS.md` as the durable handoff log at the repo root.
- Treat `docs/plans/` and `docs/specs/` as active-only landing zones; move dated superseded artifacts into `docs/archive/`.
- Keep `AGENTS.md` and `CLAUDE.md` aligned as twins where possible.
- Do not reintroduce active backlog language around retired root files.
