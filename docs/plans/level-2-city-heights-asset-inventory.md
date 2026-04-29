# Level 2 City Heights Asset Inventory

Active inventory for `ROOFTOPS` (`platformer`) art integration.

Related docs:

- [`level-2-city-heights-art-bible.md`](./level-2-city-heights-art-bible.md)
- [`level-2-city-heights-visual-brief.md`](./level-2-city-heights-visual-brief.md)
- [`level-2-city-heights-prompt-pack.md`](./level-2-city-heights-prompt-pack.md)
- [`level-2-platformer-hero-sheet-contract.md`](./level-2-platformer-hero-sheet-contract.md)
- [`level-2-city-heights-qa-checklist.md`](./level-2-city-heights-qa-checklist.md)

## Locked Decisions

1. City Heights is the flagship true-pixel platformer slice.
2. World art is generated or authored outside the runtime, cleaned, committed, and loaded by deterministic keys.
3. The default gameplay cat is Beach Kitty redesigned for platformer movement.
4. Custom/generated gameplay cats are deferred until they satisfy the same sheet contract.
5. Runtime image generation is not part of shipped world-art loading.
6. The first deliverable is the deterministic opening route before broad full-level polish.
7. The level-local asset root is `assets/sprites/rooftops/`.

## Target Directory Shape

```text
assets/sprites/rooftops/
  environment/
  obstacles/
  collectibles/
  entities/
  boss/
  hero/
  fx/
```

## Status Vocabulary

- `planned`
- `generated`
- `selected`
- `cleaned`
- `integrated`
- `verified`
- `deferred`

## Asset Inventory

| Family | Needed Assets | Current Source | Status | Acceptance Notes |
| --- | --- | --- | --- | --- |
| Environment | sky, far skyline, mid skyline, facade tile, rooftop cap tile | generated baseline under `assets/sprites/rooftops/environment/` | integrated | True pixel PNGs; roof lip must out-read facade detail |
| Platform/traversal props | fire escape, scaffold, clothesline, satellite dish bounce pad, rooftop props | generated baseline for fire escape, clothesline, satellite | integrated | Usable top/contact lines are mandatory |
| Enemies/hazards | pigeon, rat, raccoon idle/charge, AC unit, steam puff, neon sign on/off | selected cleanup pass under `obstacles/` and `fx/` | verified | Stomp vs side-hit readability remains the main QA rule |
| Collectibles | coin | generated baseline under `collectibles/` | integrated | Coin must separate from warm facade windows |
| Projectiles/power-ups/FX | feather projectile, triple jump, glide, shield, shield bubble, stomp/dust/steam support | selected cleanup pass under `fx/` | verified | Shield is external bubble; glide is a hero animation state |
| Background entities | fire escape, antennas, vents, water tanks, distant birds | fire escape baseline; others still procedural | planned | Secondary to gameplay but useful for rooftop identity |
| Boss/finale | Pigeon King idle/swoop, attack, landed/vulnerable, hit, defeat; mini pigeon; feather projectile; yarn-shot boss projectile | generated boss baseline plus runtime yarn-shot texture in the authored boss slice | verified | Larger boss scale, throw-hit, stomp-hit, and three-hit defeat are captured in the Phase 7 artifact set |
| Hero | idle, run, jump rise, fall, land/stomp, glide, hurt, victory, defeat, power-up | selected cleanup pass in the 64x64 platformer sheet | verified | Must pass `level-2-platformer-hero-sheet-contract.md` |
| HUD/support | distance, lives, boss HP text, pause/readability surfaces | existing Phaser text plus React shell | integrated | HUD stays readable over moving city background and switches to boss HP during `BOSS_FIGHT` |

## Runtime Integration Targets

1. Use `scenes/platformer/rooftopsAssets.ts` for deterministic texture keys and imports.
2. Use `scenes/platformer/heroSheet.ts` for the default platformer hero contract and resolver.
3. Seed `levels/rooftops.ts` with an opening-route config before procedural generation resumes.
4. Teach `CityBackground`, `BuildingGenerator`, `EnemyManager`, `HazardManager`, `PowerupManager`, and `PigeonKingBoss` to prefer manifest assets when available.
5. Capture QA screenshots and link them from `level-2-city-heights-qa-checklist.md`.

## Deferred

- Per-user animated platformer cats.
- Full 15,000px level polish.
- Broad campaign-screen restyling.
- Importing Weezy code or assets.
- Rebuilding the platformer generation model beyond the opening-route seam.
