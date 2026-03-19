# Level runtime contract

Authoritative split between **`App`**, **`GameEngine`**, and **level data** so multi-level work stays predictable. Implementation checklist: [LEVEL_DEVELOPMENT.md](./LEVEL_DEVELOPMENT.md).

## Resolution order

1. **`LevelId`** — chosen in `App` (`selectedLevel`), passed to `GameEngine` as `levelId`.
2. **`LevelConfig`** — `App` uses `getLevelConfig(selectedLevel)` and passes **`levelConfig`** into `GameEngine`. The engine may fall back to `LEVEL_REGISTRY[levelId]` only when `levelConfig` is omitted (e.g. tests); production **`App` always passes the prop**.
3. **Merged tuning** — exactly one function defines how the dev tuning store combines with the level:

   **`mergeLevelTuning(storeTuning, level)`** from [`levels/catalog.ts`](../levels/catalog.ts)

   - **`App`** uses it for `mergedTuning` (HUD, sky/sun, `startGame` boss-practice coin count, `bossCoinTarget`).
   - **`GameEngine`** uses it for `effectiveTuning` (physics, spawns, boss coin trigger).

   Do not reimplement `{ ...store, ...level.tuningOverrides }` elsewhere; that risks HUD and engine drifting apart when the balance panel or `tuningOverrides` change.

4. **Boss entry coin count** — **`getBossEntryCoinThreshold(levelConfig, mergedTuning)`** (same merged profile as in step 3). Engine triggers the boss when `coinsRef.current >=` this value during `PLAYING`. App shows `score.coins / bossCoinTarget` and drives progressive sky/sun with **`score.coins / bossCoinTarget`** where `bossCoinTarget` is the same threshold.

## What owns what

| Concern | Owner |
|--------|--------|
| Campaign order, unlock rules | `LEVEL_ORDER`, `isLevelUnlocked`, `loadDefeatedBosses` / `saveDefeatedBosses` |
| Level data registry | `LEVEL_REGISTRY`, `getLevelConfig` |
| Physics loop, collisions, spawning, `coinsRef`, boss fight | `GameEngine` |
| Top-level game status, Hall of Fame, wisdom/death AI, level picker | `App` |
| Progressive sky / sun (`theme.skyProgressMode`, gradients) | `App` only (reads `score.coins` from engine via `onScoreUpdate`) |
| Victory persistence (boss defeated, scores) | `App` + `services/runOutcome.ts` |

## Boss threshold and balance panel

Changing **`bossThreshold`** in the dev panel updates the store; both `App` and `GameEngine` recompute merged tuning and **`getBossEntryCoinThreshold`**, so the star counter denominator, sky progress, and engine trigger stay aligned for the active level.

## Regression tests

- [`levels/catalog.test.ts`](../levels/catalog.test.ts) — `mergeLevelTuning`, `getBossEntryCoinThreshold`, unlock helpers.
