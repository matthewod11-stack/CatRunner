# Level 1 Phase 4 Playtest Notes

Status: Complete on 2026-04-27.

Local target: `http://127.0.0.1:3000/?unlock_all=1`

## Scope

- Beach runner readability after final world art, parallax, hero scale, and baseline tuning.
- Keyboard feel for jump, duck/shell fire, pause, resume, and boss-practice flow.
- HUD readability in the CRT frame: score, lives, multiplier, boss coin target, and shell ammo.
- Terminal flows for victory, game over, replay, campaign return, and Hall of Fame persistence.

## Findings

- Jump readability is clear with the committed hero sheet: the shadow/feet baseline remains grounded on takeoff and the pose separates from the sand and water bands.
- Obstacle recognition is readable at runner speed for the checked Beach entities; the crab silhouette, coin color, and lane placement stand out against the final background layers.
- Boss clarity is acceptable: the Sand Monster scale reads immediately, the `Press DOWN to throw shells!` prompt is visible, and shell ammo reaches zero without hiding the rest of the HUD.
- Pause now works from keyboard focus after scene start/resume. `P` and `Escape` toggle the React pause overlay, and the canvas is focusable after Phaser boot.
- Victory and game-over overlays display authoritative final scores after the run ends. Late Phaser score packets are ignored once React enters a terminal run state.
- Hall of Fame, replay, and campaign-return behavior remains covered by Playwright smoke, including ordering and cap behavior.

## Artifacts

- [`01-run-start.png`](../artifacts/level-1-phase-4/01-run-start.png)
- [`02-jump-readability.png`](../artifacts/level-1-phase-4/02-jump-readability.png)
- [`03-obstacle-readability.png`](../artifacts/level-1-phase-4/03-obstacle-readability.png)
- [`04-pause.png`](../artifacts/level-1-phase-4/04-pause.png)
- [`05-boss-start.png`](../artifacts/level-1-phase-4/05-boss-start.png)
- [`06-boss-shells.png`](../artifacts/level-1-phase-4/06-boss-shells.png)
- [`07-victory.png`](../artifacts/level-1-phase-4/07-victory.png)
- [`08-game-over.png`](../artifacts/level-1-phase-4/08-game-over.png)
- [`phase4-capture.json`](../artifacts/level-1-phase-4/phase4-capture.json)

## Follow-Ups

- Keep the existing production large-chunk warning visible as a later bundle-size task.
- If the Beach hero sheet is regenerated, rerun this capture set so baseline and hitbox evidence stays tied to the shipped art.
