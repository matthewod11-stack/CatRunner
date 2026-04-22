# Level Runtime Contract

Authoritative split between **`App`**, **`PhaserGame` / `SceneBridge`**, and level data so the live multi-genre runtime stays predictable. Implementation checklist: [level-development.md](./level-development.md).

## Resolution Order

1. **`LevelId`** — chosen in `App` (`selectedLevel`), passed into `PhaserGame`, then copied into `SceneBridge`.
2. **Level config lookup** — `App` resolves **`anyLevelConfig`** with `getAnyLevelConfig(selectedLevel)` for scene selection. The runner path also resolves runner-only config with `getLevelConfig(selectedLevel)` where boss-threshold tuning still matters.
3. **Bridge handoff** — `PhaserGame` boots the active scene with `{ levelId, catSpriteUrl, ...sceneInitData }`, and `SceneBridge` owns the runtime `levelId` plus the event contract back to React.
4. **Merged tuning** — exactly one function defines how the dev tuning store combines with a runner level:

   **`mergeLevelTuning(storeTuning, level)`** from [`levels/catalog.ts`](../levels/catalog.ts)

   - **`App`** uses it for runner HUD state, sky/sun progression, boss-practice setup, and `bossCoinTarget`.
   - **`RunnerScene`** receives the same merged tuning through scene init data.

   Do not reimplement `{ ...store, ...level.tuningOverrides }` elsewhere; that risks HUD and runtime drift when the balance panel or `tuningOverrides` change.

5. **Boss entry coin count** — **`getBossEntryCoinThreshold(levelConfig, mergedTuning)`** still applies to the runner path. `App` uses it for the HUD denominator and sky progression, and `RunnerScene` uses the same threshold in gameplay.

## What Owns What

| Concern | Owner |
|--------|--------|
| Campaign order, unlock rules | `LEVEL_ORDER`, `isLevelUnlocked`, `loadCompletedLevels` / `saveCompletedLevels` |
| Campaign metadata lookup | `CAMPAIGN_LEVEL_META`, `getCampaignLevelMeta`, `getCampaignLevelOrder` |
| Level data registry | `LEVEL_REGISTRY`, `getAnyLevelConfig`, `getLevelConfig` |
| React/Phaser boot and event bridge | `PhaserGame`, `SceneBridge`, `bridgeProtocol` |
| Gameplay runtime | Genre scenes under `scenes/` |
| Top-level game status, Hall of Fame, wisdom/death AI, level picker | `App` |
| Progressive sky / sun (`theme.skyProgressMode`, gradients) | `App` only (reads `score.coins` from runtime via score updates) |
| Victory persistence (`completedLevels`, scores, stars) | `App` + `services/runOutcome.ts` + `services/levelCompletion.ts` |

## Runner-Specific Note

`getLevelConfig`, `mergeLevelTuning`, and `getBossEntryCoinThreshold` are runner-specific helpers today. Non-runner scenes should use `getAnyLevelConfig` plus genre-local managers and scoring rules.

## Boss Threshold And Balance Panel

Changing **`bossThreshold`** in the dev panel updates the store; `App` recomputes the runner threshold immediately, and `RunnerScene` receives the same merged value, so the star counter denominator, sky progress, and boss trigger stay aligned.

## Regression Tests

- [`levels/catalog.test.ts`](../levels/catalog.test.ts) — order, metadata lookup, tuning, unlock helpers.
- [`scenes/shared/SceneBridge.test.ts`](../scenes/shared/SceneBridge.test.ts) — bridge event protocol and `levelId` attachment.
