# Docs Index

## Active

- `docs/architecture/`
- `docs/product/`
- `docs/plans/README.md`
- `docs/specs/README.md`
- `docs/templates/`

## Historical

- `docs/archive/`

`docs/plans/` and `docs/specs/` are active-only working areas. They may be nearly empty between initiatives; dated superseded artifacts belong under `docs/archive/`.

## Canonical Root Files

- active root roadmap when present (`ROADMAP_*.md` or `ROADMAP.md`)
- `PROGRESS.md`

No root roadmap is active right now. Completed `ROADMAP_V4.md` is archived at `docs/archive/roadmaps/ROADMAP_V4_2026-04-27_beach-completion-pipeline.md`; the next session should create `ROADMAP_CITYHEIGHTS.md`.

## Runtime Truth

- `App.tsx` owns top-level campaign state, persistence, and UI flow.
- `components/PhaserGame.tsx` plus `scenes/shared/SceneBridge.ts` are the active React/Phaser boundary.
- Gameplay always boots through Phaser scenes; there is no supported DOM-runner fallback.

## Repeatable Level Art

- `docs/architecture/level-art-pipeline.md` is the Phase 5 workflow for future level art passes.
- `docs/templates/` plus `scripts/scaffold-level-art-pipeline.mjs` generate per-level art briefs, prompt packs, asset inventories, hero-sheet contracts, QA checklists, and asset folders.
