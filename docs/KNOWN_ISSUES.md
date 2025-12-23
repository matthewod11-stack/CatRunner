# Beach Kitty Multi-Level System — Known Issues & Parking Lot

> **Purpose:** Track issues, blockers, and deferred decisions.
> **Related Docs:** [ROADMAP.md](./ROADMAP.md) | [PROGRESS.md](./PROGRESS.md)

---

## How to Use This Document

**Add issues here when:**
- You encounter a bug that isn't blocking current work
- You discover something that needs investigation later
- A decision needs to be made but can wait
- You find edge cases that need handling eventually

**Format:**
```markdown
### [PHASE-X] Brief description
**Status:** Open | In Progress | Resolved | Deferred
**Severity:** Blocker | High | Medium | Low
**Discovered:** YYYY-MM-DD
**Description:** What happened / what's the issue
**Workaround:** (if any)
**Resolution:** (when resolved)
```

---

## Open Issues

*No open issues yet*

---

## Resolved Issues

*No resolved issues yet*

---

## Deferred Decisions

### [PHASE-6] Seagull Behavior Split Strategy
**Status:** Deferred to Phase 6B
**Discovered:** 2025-12-23
**Description:** Seagulls currently have two behavior modes ('dive' and 'poop') determined at spawn time. Need to decide:
1. Keep as single obstacle type with behavior variant
2. Split into two obstacle types (SEAGULL_DIVE, SEAGULL_POOP)
3. Use behavior composition (base seagull + attached behavior)

**Recommendation:** Option 3 (behavior composition) aligns with the behavior library design

---

### [PHASE-4] Collectible Theming
**Status:** Deferred to Phase 4
**Discovered:** 2025-12-23
**Description:** Should collectibles (COIN, SHELL) be level-themed or stay universal?
- Universal: Same star/shell across all levels (simpler)
- Themed: Forest has acorns, Volcano has gems (more immersive)

**Recommendation:** Keep universal for v1, add themed variants later

---

## Technical Debt

| Item | Phase | Priority | Notes |
|------|-------|----------|-------|
| GameEngine.tsx is ~1700 lines | 6 | Medium | Will be reduced during abstraction |
| Inline SVGs in ObstacleComponent | 5 | Low | Moving to per-level files |
| Hardcoded physics constants | 6 | Low | Consider making level-configurable |

---

## Edge Cases to Handle

| Case | Phase | Priority | Notes |
|------|-------|----------|-------|
| Level unlock on boss defeat | 7 | High | Need to persist across sessions |
| Mid-level quit behavior | 7 | Medium | Should progress save? |
| Power-up theming | 4 | Low | Same power-ups all levels for now |
