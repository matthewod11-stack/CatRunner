# AGENTS.md

**Twin:** [CLAUDE.md](./CLAUDE.md) — keep both files aligned when architecture or workflow guidance changes.

Guidance for coding agents working in this repository.

## Project Overview

Beach Kitty is a Phaser-based nine-level campaign built with React 19, TypeScript, and Vite. React owns menus, campaign flow, HUD, customizer, and persistence surfaces. Phaser owns runtime gameplay through genre-specific scenes for runner, platformer, launcher, shooter, breakout, frogger, whack, snake, and climber modes.

## Canonical Files

- `ROADMAP_V3.md` — the active roadmap
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
npx tsc --noEmit
./scripts/dev-init.sh
```

## Current Runtime Snapshot

- `levels/index.ts` registers 9 runtime configs in `LEVEL_REGISTRY`.
- `App.tsx` routes 9 lazy Phaser scene imports through `PhaserGame`.
- `components/PhaserGame.tsx` and `scenes/shared/SceneBridge.ts` are the shared React/Phaser bridge.
- `GameEngine.tsx` still matters for the beach runner path and for legacy/runtime extraction work.
- Custom cat assets live in IndexedDB plus localStorage metadata, with server-side Gemini generation and sprite matting support.

## Active Docs

- `docs/architecture/level-development.md`
- `docs/architecture/behavior-system.md`
- `docs/architecture/level-runtime.md`
- `docs/architecture/api-protection.md`
- `docs/product/qa-checklist.md`
- `docs/plans/`
- `docs/specs/`

## Game Studio Routing

Default execution model:

- `game-studio` routes browser-game work
- `phaser-2d-game` is the default implementation path for runtime/gameplay changes
- `sprite-pipeline` is the default path for 2D sprite-sheet and hero-sheet work
- `game-playtest` is the default path for browser smoke tests, screenshots, HUD review, and scene QA

## Current Focus

- Keep root guidance and docs aligned with the live V3 campaign rather than older V2-era assumptions.
- Track active bugs and debt in GitHub Issues, not markdown parking lots.
- Continue the current platformer hero-sheet and sprite-matting work as active WIP inside the asset pipeline/tooling workstream.
- Address carried-forward correctness follow-ups such as non-runner victory labeling, hardcoded scene `levelId`s, Hall of Fame genre context, and bundle size.

## Contributor Notes

- Prefer `ROADMAP_V3.md` and live code when secondary docs drift.
- Treat `PROGRESS.md` as the durable handoff log at the repo root.
- Keep `AGENTS.md` and `CLAUDE.md` aligned as twins where possible.
- Do not reintroduce active backlog language around retired root files.
