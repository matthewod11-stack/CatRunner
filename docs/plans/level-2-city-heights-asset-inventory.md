# Level 2 City Heights Asset Inventory

Active inventory for `ROOFTOPS` (`platformer`) art integration.

Related docs:

- [`level-2-city-heights-visual-brief.md`](./level-2-city-heights-visual-brief.md)
- [`level-2-city-heights-prompt-pack.md`](./level-2-city-heights-prompt-pack.md)
- [`level-2-platformer-hero-sheet-contract.md`](./level-2-platformer-hero-sheet-contract.md)
- [`level-2-city-heights-qa-checklist.md`](./level-2-city-heights-qa-checklist.md)

## Locked Decisions

1. World art is generated or authored outside the runtime, cleaned, committed, and loaded by deterministic keys.
2. The default gameplay cat for this genre must conform to `level-2-platformer-hero-sheet-contract.md`.
3. Runtime image generation is not part of shipped world-art loading.
4. The level-local asset root is `assets/sprites/rooftops/`.
5. `PlatformerScene` and platformer managers should move from procedural placeholder shapes toward a `scenes/platformer/rooftopsAssets.ts` manifest before final art tuning.

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
| Environment | sky, far skyline, mid skyline, building facade tile, rooftop cap/edge tile | Procedural Phaser shapes in `CityBackground` and `BuildingGenerator` | planned | Walkable rooftop edges must out-read facade detail; windows must not resemble coins |
| Platform/traversal props | fire escape, scaffold, clothesline, satellite dish bounce pad, rooftop props | Procedural manager shapes | planned | Usable surfaces need clear top/contact lines and distinct styling from skyline decoration |
| Enemies/hazards | pigeon, rat, raccoon idle/charge, AC unit, steam puff, neon sign on/off | Manager-generated sprites/shapes | planned | Stomp vs side-hit readability is the main acceptance rule |
| Collectibles | coin | Current platformer coin group visuals | planned | Coin must separate from warm facade windows |
| Projectiles/power-ups/FX | feather projectile, triple jump, glide, shield, stomp burst, dust, neon zap, shield pop | Procedural effects and manager shapes | planned | Each gameplay signal gets a deliberate color/silhouette; no generic circle-only power-up pass |
| Background entities | antennas, vents, water tanks, pipes, distant birds | Procedural decorative props | planned | Secondary to gameplay but useful for rooftop identity |
| Boss/finale | Pigeon King idle/swoop, attack, landed/vulnerable, hit, defeat; mini pigeon; feather projectile | `PigeonKingBoss` procedural shapes | planned | Boss vulnerability and attack tells must read without relying only on HP text |
| Hero | idle, run, jump rise, fall, land/stomp, glide/power-up, hurt, victory, defeat | Static custom cat texture or rectangle fallback in `PlatformerScene` | planned | Default animated sheet required before City Heights reaches Beach-level polish |
| HUD/support | distance, lives, boss HP pips, pause/readability surfaces | Existing Phaser text plus React shell | planned | HUD stays readable over moving city background and boss arena |

## Runtime Integration Targets

1. Add `scenes/platformer/rooftopsAssets.ts` once final assets exist.
2. Teach `CityBackground`, `BuildingGenerator`, `EnemyManager`, `HazardManager`, `PowerupManager`, and `PigeonKingBoss` to load through the manifest instead of local procedural stand-ins.
3. Add platformer asset-manifest tests that mirror `scenes/runner/beachAssets.test.ts`.
4. Add `scenes/platformer/heroSheet.ts` or equivalent for the default platformer hero contract and resolver.
5. Capture QA screenshots and link them from `level-2-city-heights-qa-checklist.md`.

## Deferred

- Per-user animated platformer cats until the default sheet and contract pass.
- Broad restyling of the campaign screen unless Level 2 screenshots show a specific route/readability issue.
- Rebuilding the platformer generation model; Phase 5 is about art/process repeatability, not changing City Heights mechanics first.
