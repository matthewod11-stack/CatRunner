# Level {{LEVEL_NUMBER}} {{LEVEL_NAME}} Asset Inventory

Active inventory for `{{LEVEL_ID}}` (`{{GENRE}}`) art integration.

Related docs:

- [`{{VISUAL_BRIEF_DOC}}`](./{{VISUAL_BRIEF_DOC}})
- [`{{PROMPT_PACK_DOC}}`](./{{PROMPT_PACK_DOC}})
- [`{{HERO_CONTRACT_DOC}}`](./{{HERO_CONTRACT_DOC}})
- [`{{QA_CHECKLIST_DOC}}`](./{{QA_CHECKLIST_DOC}})

## Locked Decisions

1. World art is generated or authored outside the runtime, cleaned, committed, and loaded by deterministic keys.
2. The default gameplay cat for this genre must conform to `{{HERO_CONTRACT_DOC}}`.
3. Runtime image generation is not part of shipped world-art loading.
4. The level-local asset root is `assets/sprites/{{ASSET_SLUG}}/`.
5. Scene integration should use a manifest or key registry before final art tuning.

## Target Directory Shape

```text
assets/sprites/{{ASSET_SLUG}}/
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
| Environment | TODO | `assets/sprites/{{ASSET_SLUG}}/environment/` | planned | Opaque full-bleed or tile rules; readable behind gameplay and HUD |
| Obstacles/enemies | TODO | `assets/sprites/{{ASSET_SLUG}}/obstacles/` | planned | True alpha, clear silhouettes, documented baseline/scale |
| Collectibles | TODO | `assets/sprites/{{ASSET_SLUG}}/collectibles/` | planned | Distinct from hazards and UI counters |
| Projectiles/power-ups/FX | TODO | `assets/sprites/{{ASSET_SLUG}}/fx/` | planned | Each gameplay visual gets a deliberate asset/effect |
| Background entities | TODO | `assets/sprites/{{ASSET_SLUG}}/entities/` | planned | Secondary to gameplay, useful for parallax/depth |
| Boss/finale | TODO | `assets/sprites/{{ASSET_SLUG}}/boss/` | planned | State changes readable without relying only on particles |
| Hero | TODO | `assets/sprites/{{ASSET_SLUG}}/hero/` | planned | Conforms to `{{HERO_CONTRACT_DOC}}` |
| HUD/support | TODO | React/Phaser surfaces | planned | HUD remains readable and does not compete with gameplay |

## Genre-Specific Inventory Additions

{{GENRE_ASSET_FAMILIES}}

## Runtime Integration Targets

1. Create a level asset manifest or key registry near the `{{GENRE}}` scene code.
2. Replace placeholder art for every shipped gameplay element.
3. Tune scale, origin, baseline, and hitboxes against final art.
4. Capture QA screenshots and link them from `{{QA_CHECKLIST_DOC}}`.

## Deferred

- TODO: assets or custom-cat features explicitly out of this pass.
