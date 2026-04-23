# CatRunner — Project State

> Cross-surface context document. Shared across Claude Chat, Claude Code, and related sessions.
> Last updated: 2026-04-23

---

## Elevator Pitch

CatRunner, branded in-product as Beach Kitty, is a nine-level multi-genre browser-game campaign built with React, TypeScript, Vite, and Phaser 3. The same custom AI-generated cat moves through runner, platformer, launcher, shooter, breakout, frogger, whack, snake, and climber scenes with shared campaign progression, Hall of Fame persistence, and custom sprite handling.

## Current Reality

- The multi-genre Phaser runtime already exists. This is not a pre-Phaser planning repo.
- `levels/index.ts` registers 9 level configs in `LEVEL_REGISTRY`.
- `App.tsx` routes 9 lazy scene imports through `PhaserGame`.
- Gameplay is Phaser-only; there is no supported DOM-runner fallback.
- React owns shell/UI concerns; Phaser owns gameplay scenes.
- A Playwright smoke harness now covers campaign boot, Phaser boot/eject, victory/game-over mutation, and Hall of Fame ordering/cap behavior.
- The active roadmap has shifted from migration cleanup to Level 1 completion and repeatable asset-pipeline work.

## Current Workstreams

- Level 1 (`BEACH`) completion under `ROADMAP_V4.md`
- Repeatable asset-pipeline work for world art, hero sheets, and runtime manifests
- Optional cat-generation work kept off the gameplay critical path unless it satisfies the same sheet contract as the default hero
- Performance/shipping readiness, including oversized main bundle follow-up work

## Stack Snapshot

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | React 19 + TypeScript | Vite app shell |
| Runtime | Phaser 3 | Genre scenes and bridge architecture |
| AI | Google Gemini | Optional cat-generation and text features |
| Image processing | sharp + in-app matting helpers | Fallback path for optional cat identity surfaces |
| Asset storage | IndexedDB + localStorage | Cat wardrobe, sprite metadata, Hall of Fame data |
| Testing | Vitest + Playwright smoke + `npx tsc --noEmit` + Vite build | Current verification baseline |

## Canonical Workflow

- Start from `ROADMAP_V4.md` for active roadmap direction.
- Use `PROGRESS.md` for session handoff and continuity.
- Use `docs/` for active architecture and product docs, plus `docs/plans/README.md` and `docs/specs/README.md` as the current working entrypoints.
- Use GitHub Issues for bugs and technical debt.

Historical planning material lives under `docs/archive/`.
