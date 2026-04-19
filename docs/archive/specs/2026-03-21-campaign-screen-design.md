# Campaign Screen Redesign — Design Spec

**Date:** 2026-03-21
**Context:** Phase 0 of V3 expands from 1 level to 9. The current home screen is a 2-column layout built for a single-level game. It needs to show 9 levels with genre tags, star progress, and unlock status without feeling cluttered.

---

## Decision: 3×3 Grid + Sidebar

### Layout

```
┌─────────────────────────────────────────────────┐
│  HEADER: "Beach Kitty" title  |  Playing as X   │
│           wisdom quote (italic)                  │
├──────────────────────────────┬──────────────────┤
│                              │                  │
│   3×3 LEVEL GRID             │   SIDEBAR        │
│                              │                  │
│  ┌────┐ ┌────┐ ┌────┐       │  ┌────────────┐  │
│  │BACH│ │ROOF│ │KTCH│       │  │Kitty Closet│  │
│  │★★★ │ │☆☆☆ │ │ 🔒 │       │  │   button   │  │
│  └────┘ └────┘ └────┘       │  └────────────┘  │
│  ┌────┐ ┌────┐ ┌────┐       │                  │
│  │SPCE│ │YARN│ │STRT│       │  MINI HALL OF    │
│  │ 🔒 │ │ 🔒 │ │ 🔒 │       │  FAME (top 3)   │
│  └────┘ └────┘ └────┘       │                  │
│  ┌────┐ ┌────┐ ┌────┐       │  1. Name  450 🏆 │
│  │GWAK│ │GSNK│ │TREE│       │  2. Name  320    │
│  │ 🔒 │ │ 🔒 │ │ 🔒 │       │  3. Name  210    │
│  └────┘ └────┘ └────┘       │                  │
│                              │                  │
│  [ ▶ PLAY — Sunny Shore ]    │                  │
│                              │                  │
├──────────────────────────────┴──────────────────┤
│  FOOTER: Lives 🐾 9   |   1/9 complete  3/27★  │
└─────────────────────────────────────────────────┘
```

### Level Card States

Each card shows: emoji icon, level name, genre tag, star progress.

| State | Appearance |
|-------|-----------|
| **Completed** | Green border, filled stars (★★★), genre tag visible |
| **Unlocked (current)** | Blue/amber border, empty stars (☆☆☆), genre tag visible, pulsing glow |
| **Locked** | Dimmed (opacity 0.5), 🔒 icon replaces emoji, genre tag visible but muted |
| **Selected** | Scale up slightly, thicker border, "PLAY" button appears below grid |
| **Coming soon** (no config in registry) | Same as locked but with "Coming Soon" badge instead of unlock requirement |

### Component Mapping

| Element | Current Location | New Location |
|---------|-----------------|-------------|
| Title + "Playing as X" | Header (left) | Header (left) |
| Lives counter | Header (right) | Footer bar |
| Wisdom quote | Hall of Fame section bottom | Header subtitle |
| Level selector | Left column, vertical list | Center, 3×3 grid |
| Run/Play button | Left column, below level list | Below grid, shows selected level name |
| Cat hero image | Left column, large square | Removed (cat shown on cards in Phase 1) |
| Kitty Closet button | Left column, above level list | Sidebar, top |
| Hall of Fame | Right column, full list | Sidebar, compact (top 3 only) |
| Overall progress | Not shown | Footer bar (X/9 complete, Y/27 ★) |

### Data Source

- Grid iterates `CAMPAIGN_LEVEL_META` (all 9 levels — display-only metadata)
- "Implemented" check: `LEVEL_REGISTRY[levelId] !== undefined`
- "Unlocked" check: existing `isLevelUnlocked(completedLevels, id)`
- Star display: reads from `levelCompletion.loadLevelResult(levelId)` (Phase 0 service)

### What This Does NOT Cover

- Card artwork/thumbnails per level (deferred — emoji placeholder for now)
- Cat character shown on cards (deferred to Phase 1)
- Hall of Fame level-scoped display (deferred to Phase 1)
- Mobile responsive layout (stretch goal, not Phase 0)
- Cutscene entry points (Phase 0 adds the type, UI deferred)
