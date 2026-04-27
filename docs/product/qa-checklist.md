# Manual QA checklist

Use before a release or after high-risk gameplay, UX, or AI changes. Complements `npm run test:run`, `npm run build`, and optional `npx tsc --noEmit`.

For level-specific art and gameplay passes, scaffold a focused checklist with `npm run scaffold:level-art -- --level LEVEL_ID` and keep screenshots under `docs/artifacts/level-N-name/`.

## Browser playthrough (required for release candidates)

Run `npm run dev`, use a **clean profile** or private window once per release to catch migration and storage edge cases.

1. **Level select** — First level starts unlocked; copy and `aria` regions render without console errors.
2. **Full run** — Play Beach through boss win: score and lives behave sanely (after victory, lives should refill to max on continue/next run); victory screen shows progress copy; **Continue** returns to level select with boss marked cleared.
3. **Game over** — Die once; death message loads (needs `GEMINI_API_KEY`); Hall of Fame updates; **Try again** / menu work.
4. **Hall of Fame** — New row shows name, score, date, cat avatar (blob or legacy URL).
5. **Boss practice** — If exposed in UI, start at boss; confirm threshold matches tuning expectations.

## Customizer and assets

1. Open closet; **Generate with AI** (with API key) or skip if offline.
2. **Save to closet** — Thumbnail appears; equip updates in-game cat.
3. **Delete a look** — Row removed immediately from storage (no need to Equip & Exit first); equipped cat clears if that asset was equipped (no broken image on title or Hall of Fame).

## AI endpoints (`/api/cat/*`)

With dev server and `.env.local`:

1. **Generate** — 200 + PNG (or structured error if quota/key missing).
2. **Wisdom / death** — JSON responses; no key leakage in network tab response bodies.

## Accessibility spot-check

1. Tab through level cards and closet controls; focus visible.
2. Toggle OS **Reduce motion** — intense animations (speed lines, sun pulse, confetti) should calm or stop.

## Automated checks (CI / local)

```bash
npm run test:run
npm run build
# optional: full program typecheck (includes tests)
npx tsc --noEmit
```

---

After a session touching this list, add a short note to [../PROGRESS.md](../PROGRESS.md) if behavior changed materially.
