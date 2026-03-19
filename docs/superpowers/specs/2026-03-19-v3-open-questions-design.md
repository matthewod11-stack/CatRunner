# V3 Open Questions — Design Decisions

> **Date:** 2026-03-19
> **Status:** Approved
> **Parent spec:** [ROADMAP_V3_SPEC.md](../../../ROADMAP_V3_SPEC.md)
> **Scope:** Resolves the 9 open questions listed in the V3 spec (lines 595–613). These decisions constrain all subsequent V3 implementation work.

---

## 1. Level 1 Port Fidelity

**Decision:** Feel-identical, visuals improved.

The Phaser port of Beach Kitty must preserve the gameplay *feel* — jump arcs, gravity, collision forgiveness, speed curves, scoring math, boss mechanics, and timing. These physics constants and tuning values are the acceptance criteria for the port.

Visuals are free to use Phaser's native renderer. Inline JSX SVG obstacles will be redrawn as Phaser graphics/sprites (see §2). Particles, screen shake, and effects should use Phaser's built-in systems rather than replicating CSS transforms. The goal is "same game, better rendering" — not pixel-identical reproduction of DOM layout quirks.

**Acceptance test:** Side-by-side gameplay comparison. A player familiar with the current version should not notice a difference in *how the game plays*, even if it *looks* cleaner.

---

## 2. Asset Pipeline

**Decision:** Phaser graphics primitives, supplemented by Gemini-generated images.

All game art is rendered natively in Phaser — `Graphics` objects, sprite textures, and Phaser's drawing APIs. No SVG-to-canvas conversion pipeline. No build-time sprite sheet generation.

For richer art (enemies, bosses, backgrounds, themed objects), Gemini image generation (via MCP) produces textures that are loaded into Phaser as sprites. This pipeline is consistent across all 9 genres — every level uses the same asset approach.

The existing inline JSX SVGs in `ObstacleComponent.tsx` and `levels/beach/obstacles.tsx` are not ported. They remain available for React UI contexts (menus, level selection previews) but gameplay rendering is exclusively Phaser.

**Rationale:** One rendering paradigm across all 9 genres. Avoids carrying two systems (SVG conversion for legacy, Phaser native for new levels).

---

## 3. Level Design Tooling

**Decision:** Code-defined levels in TypeScript.

All level layouts — platforms, enemy positions, brick grids, lane configurations, wave formations — are defined as typed TypeScript data structures. No Tiled editor integration.

Example shape for a platformer level:

```typescript
interface PlatformDef {
  x: number;
  y: number;
  width: number;
  type: 'solid' | 'moving' | 'breakable' | 'one-way';
  moveConfig?: { axis: 'x' | 'y'; range: number; speed: number };
}
```

Each genre defines its own config interface extending `LevelConfigBase` (as outlined in the V3 spec). Level data lives in `levels/<levelname>.ts` files.

**Rationale:** AI-assisted iteration (Claude + Gemini) works faster with TypeScript configs than with binary/JSON map files. No external tooling dependency. Tiled can be introduced later for a specific level if the need arises, but is not part of the initial architecture.

---

## 4. Music

**Decision:** Hybrid — pre-composed tracks for music, procedural for SFX.

Each level ships with a pre-composed music track (`.mp3` or `.ogg`) stored in `assets/audio/`. Tracks are lazy-loaded per scene in Phaser's `preload()` — only the current level's track is in memory at any time. Phaser's audio system handles playback, looping, and crossfade on level transitions.

SFX remains procedural + file-backed via the existing `sfxService.ts` architecture. Genre-specific sound effects (pew-pew for shooter, squeaks for whack-a-mole) are added per level, following the same pattern.

The current procedural `audioService.ts` beach music is retired once Level 1 is ported to Phaser with its own pre-composed track.

**Rationale:** Pre-composed music sets genre mood instantly and sounds better than procedural generation across 9 diverse genres. Procedural SFX is responsive, lightweight, and already working. Lazy-loading keeps the bundle lean.

---

## 5. Mobile Touch Controls

**Decision:** Per-genre input handlers. Desktop is the primary platform.

Each Phaser scene owns its input setup — keyboard bindings and (where applicable) basic touch zones. There is no unified touch-control adapter or abstraction layer.

Desktop keyboard input is the design target. Mobile touch is supported as a best-effort secondary concern, not a design driver. No virtual joysticks, no drag-aim optimization for touch, no complex gesture detection unless a specific genre requires it (e.g., whack-a-mole tap detection is inherently touch-friendly).

If duplication emerges across scenes (e.g., identical tap-zone logic in 3+ scenes), extract a shared primitive at that point.

**Rationale:** The game is primarily played on desktop. Per-genre handlers are simplest and most explicit. Premature abstraction across 9 wildly different input models would create more complexity than it saves.

---

## 6. Campaign Persistence

**Decision:** Per-level high scores + 1–3 star ratings.

On level completion, each genre reports:

```typescript
interface LevelResult {
  levelId: LevelId;
  score: number;        // genre-specific raw score
  stars: 1 | 2 | 3;    // based on genre-specific thresholds
}
```

Persisted in localStorage (one key per level, e.g., `beach-kitty-level-BEACH`). The campaign screen displays star count on each branch of the cat tree. Hall of Fame continues to track top scores with `levelId` context.

Existing `defeatedBosses` persistence remains for unlock progression. No mid-level checkpoints, no collectible tracking, no cumulative campaign score.

**Rationale:** Stars on the campaign tree give visual richness and replay motivation with minimal persistence complexity. Arcade-style levels (2–5 minutes each) don't benefit from mid-level saves.

---

## 7. Difficulty Scaling

**Decision:** Self-contained per level.

Each level has its own internal difficulty curve (wave escalation, speed increase over time, shorter windows, etc.) but there is no campaign-wide difficulty ramp. Level 1 and Level 9 do not differ in baseline difficulty — the challenge comes from the genre itself.

The level order in the spec (runner → platformer → launcher → shooter → breakout → frogger → whack → snake → climber) naturally progresses from accessible to demanding genres. This implicit ordering provides enough campaign arc without artificial tuning.

**Rationale:** Genre variety *is* the difficulty curve. Players who struggle on one genre aren't permanently stuck behind an artificially inflated wall. Each level being self-contained also means replaying any cleared level feels appropriately challenging regardless of campaign progress.

---

## 8. Cutscenes

**Decision:** Static, hand-written cutscene scripts.

All cutscene text is authored in advance — 9 intro cutscenes, 8 transition cutscenes, and 1 finale. No Gemini API calls between levels. Cutscenes play instantly with no network dependency.

AI text generation (wisdom quotes, death messages) continues in its current role within gameplay, not in the narrative layer.

**Production pipeline note:** Video cutscenes with subtitles will be produced on a separate machine using a DaVinci Resolve MCP connector integrated with Claude Code. The cutscene system should be designed to support both text-only frames (initial implementation) and video playback (future upgrade). The `CutsceneConfig` type should accommodate both:

```typescript
interface CutsceneFrame {
  type: 'text' | 'video';
  // text frames
  text?: string;
  image?: string;         // static background image URL
  // video frames
  videoSrc?: string;      // path to video file
  subtitles?: string;     // path to subtitle track
  // shared
  durationMs?: number;    // auto-advance timing
  transition?: 'fade' | 'slide' | 'cut';
}
```

**Rationale:** Cutscenes are structural narrative — they need to be coherent and reliable. The Resolve video pipeline enables high-quality production without runtime API dependency.

---

## 9. Bundle Size

**Decision:** Code-split per scene, lazy-load assets.

Phaser core loads once on first gameplay entry. Each Phaser scene is a dynamic `import()` — Vite handles the code splitting natively. Per-level assets (music tracks, generated textures) load in each scene's `preload()`.

The campaign screen is pure React — no Phaser loaded until the player starts a level. This keeps initial page load fast.

```
Initial load:  React shell + campaign screen (~200KB)
First play:    + Phaser core (~1MB, cached thereafter)
Per level:     + scene code (~10-50KB) + assets (music ~200KB, textures variable)
```

**Rationale:** Vite dynamic imports make per-scene splitting nearly free. Phaser's `preload()` naturally handles asset loading with a loading bar. Players only download what they play.

---

## Decision Summary

| # | Question | Decision | Key constraint |
|---|----------|----------|----------------|
| 1 | Port fidelity | Feel-identical, visuals improved | Physics constants are acceptance criteria |
| 2 | Asset pipeline | Phaser graphics + Gemini images | One rendering paradigm for all 9 genres |
| 3 | Level tooling | Code-defined TypeScript | AI-friendly, no external tooling |
| 4 | Music | Pre-composed tracks, procedural SFX | Lazy-loaded per scene |
| 5 | Mobile controls | Per-genre handlers | Desktop primary, mobile best-effort |
| 6 | Persistence | Per-level high scores + stars | localStorage, no mid-level saves |
| 7 | Difficulty | Self-contained per level | Genre variety is the difficulty curve |
| 8 | Cutscenes | Static/hand-written | Video upgrade path via Resolve pipeline |
| 9 | Bundle size | Code-split per scene | Vite dynamic imports, lazy asset loading |
