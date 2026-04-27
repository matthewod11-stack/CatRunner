# Level Pipeline Templates

Templates in this directory are inputs for `scripts/scaffold-level-art-pipeline.mjs`.

Use:

```bash
npm run scaffold:level-art -- --level ROOFTOPS --dry-run
npm run scaffold:level-art -- --level ROOFTOPS
```

The scaffold replaces `{{PLACEHOLDER}}` tokens with campaign metadata and writes active plan docs under `docs/plans/`. It also creates level-local asset directories under `assets/sprites/<level-slug>/`.

Templates are intentionally plain Markdown or non-compiled text files so they can evolve without changing runtime behavior. The manifest source is `level-asset-manifest.template.ts.txt` so `npx tsc --noEmit` does not try to compile unresolved placeholders.
