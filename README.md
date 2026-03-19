<div align="center">

# Beach Kitty

A browser game where a custom AI-generated cat runs, jumps, and fights its way through nine distinct game genres — from endless runner to space shooter to snake.

[Play Now](https://www.beachkittygame.games/)

![Beach Kitty gameplay](docs/screenshots/gameplay.png)

</div>

---

## About

Beach Kitty started as an endless runner and is evolving into a nine-level campaign called **Nine Lives**. Each level is a different game genre — platformer, launcher, space shooter, breakout, frogger, whack-a-mole, snake, and vertical climber — all played with the same custom cat character. The cat is generated from a text prompt using Google Gemini, and AI also writes the in-game quips and death messages.

The game runs entirely in the browser. Gemini API calls go through same-origin server routes so the key never touches the client.

## Features

- **Double jump and duck** with squash-and-stretch animation and freeze-frame hit feedback
- **Boss fight** against the Sand Monster after collecting enough coins
- **Power-ups** — speed boost, coin magnet, super size with invincibility
- **AI cat customizer** — describe any cat and Gemini generates a sprite, matted and ready to play
- **Procedural music** that reacts to game speed, plus file-backed SFX
- **Custom cat wardrobe** with IndexedDB sprite storage and localStorage metadata
- **Pattern-based spawning** scaled by progress, with life-assist difficulty adjustment
- **Accessible** — landmark roles, `aria-live` regions, `prefers-reduced-motion` support

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Language | TypeScript |
| Build | Vite |
| AI | Google Gemini (server-side `/api/cat/*` routes) |
| Image processing | sharp (server-side sprite matting) |
| Audio | Web Audio API (procedural music + SFX) |
| Graphics | Canvas API, inline SVG |
| Hosting | Vercel |
| Testing | Vitest |

## Getting Started

```bash
git clone https://github.com/matthewod11-stack/CatRunner.git
cd CatRunner
npm install
npm run dev
```

The dev server starts on **port 3000**.

### AI features

Add a `.env.local` file with your Gemini API key:

```
GEMINI_API_KEY=your_key_here
```

The game works without it — AI cat generation, wisdom quotes, and death messages will be unavailable but gameplay is unaffected.

## Controls

| Action | Keyboard | Touch |
|--------|----------|-------|
| Jump | Space / Up | Tap left half |
| Duck | Down | Tap right half |
| Double jump | Jump while airborne | Tap left half while airborne |
| Pause | P / Esc | — |

<details>
<summary><strong>Development</strong></summary>

### Commands

```bash
npm run dev          # Dev server (port 3000)
npm run build        # Production build
npm run test:run     # Run tests (CI mode)
npm run preview      # Preview production build
```

### Dev balance panel

Press **backtick** (`` ` ``) during gameplay to open the tuning panel. Adjust physics, spawning, boss pressure, and assist values in real time. Named presets persist in localStorage. Export telemetry JSON for balancing analysis.

### Architecture

- **CLAUDE.md** / **AGENTS.md** — Full architecture reference (twin docs, kept in sync)
- **docs/LEVEL_DEVELOPMENT.md** — Adding new levels
- **docs/BEHAVIOR_SYSTEM.md** — Obstacle behaviors and collision handlers
- **docs/LEVEL_RUNTIME.md** — Runtime tuning contract
- **docs/API_PROTECTION.md** — Rate limits, timeouts, prompt hardening
- **docs/QA_CHECKLIST.md** — Manual QA for releases

### Roadmap

The project is heading toward a **Nine Lives** campaign — nine levels, each a different game genre, powered by Phaser 3. See [ROADMAP_V3.md](ROADMAP_V3.md) for the implementation plan and [ROADMAP_V3_SPEC.md](ROADMAP_V3_SPEC.md) for the design spec.

</details>

## Built With

Built with [Claude Code](https://claude.ai/code) and [Google Gemini](https://ai.google.dev/).

## License

MIT — see [LICENSE](LICENSE).
