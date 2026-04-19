# CatRunner — Project State

> Cross-surface context document. Shared across Claude Chat, Claude Code, and related sessions.
> Last updated: 2026-04-19

---

## Elevator Pitch

CatRunner, branded in-product as Beach Kitty, is a nine-level multi-genre browser-game campaign built with React, TypeScript, Vite, and Phaser 3. The same custom AI-generated cat moves through runner, platformer, launcher, shooter, breakout, frogger, whack, snake, and climber scenes with shared campaign progression, Hall of Fame persistence, and custom sprite handling.

## Current Reality

- The multi-genre Phaser runtime already exists. This is not a pre-Phaser planning repo.
- `levels/index.ts` registers 9 level configs in `LEVEL_REGISTRY`.
- `App.tsx` routes 9 lazy scene imports through `PhaserGame`.
- React owns shell/UI concerns; Phaser owns gameplay scenes.
- The current cleanup work is about canonical docs and workflow alignment, not initial Phaser adoption.

## Current Workstreams

- Canonical roadmap and docs alignment around `ROADMAP_V3.md`, `PROGRESS.md`, `docs/`, and GitHub Issues
- Correctness follow-ups from the repo audit, including non-runner victory labels, hardcoded scene `levelId`s, and Hall of Fame genre context
- Asset pipeline/tooling work, with platformer hero-sheet and sprite-matting work as active WIP
- Performance/shipping readiness, including oversized main bundle follow-up work

## Stack Snapshot

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | React 19 + TypeScript | Vite app shell |
| Runtime | Phaser 3 | Genre scenes and bridge architecture |
| AI | Google Gemini | Custom cat generation and text features |
| Image processing | sharp + in-app matting helpers | Server-side and client fallback paths |
| Asset storage | IndexedDB + localStorage | Cat wardrobe, sprite metadata, Hall of Fame data |
| Testing | Vitest + `npx tsc --noEmit` + Vite build | Current verification baseline |

## Canonical Workflow

- Start from `ROADMAP_V3.md` for active roadmap direction.
- Use `PROGRESS.md` for session handoff and continuity.
- Use `docs/` for supporting architecture, product, plans, and specs.
- Use GitHub Issues for bugs and technical debt.

Historical planning material lives under `docs/archive/`.
