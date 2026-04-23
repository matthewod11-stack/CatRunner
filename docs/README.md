# Docs Index

## Active

- `docs/architecture/`
- `docs/product/`
- `docs/plans/README.md`
- `docs/specs/README.md`

## Historical

- `docs/archive/`

`docs/plans/` and `docs/specs/` are active-only working areas. They may be nearly empty between initiatives; dated superseded artifacts belong under `docs/archive/`.

## Canonical Root Files

- `ROADMAP_V4.md`
- `PROGRESS.md`

## Runtime Truth

- `App.tsx` owns top-level campaign state, persistence, and UI flow.
- `components/PhaserGame.tsx` plus `scenes/shared/SceneBridge.ts` are the active React/Phaser boundary.
- Gameplay always boots through Phaser scenes; there is no supported DOM-runner fallback.
