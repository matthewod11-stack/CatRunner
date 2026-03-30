# CatRunner — Project State

> Cross-surface context document. Shared across Claude Chat, Claude Code, and Cowork sessions.
> Last updated: 2026-03-24

---

## Elevator Pitch

CatRunner is a polished endless runner game where a cat sprints along a beach dodging obstacles, collecting coins and shells, and battling bosses — built entirely with AI-assisted development. It features Gemini-powered custom cat generation, a multi-level system with boss fights, power-ups, a hall of fame, and a retro TV-screen aesthetic. It's a showcase of what one developer can build when AI handles the heavy lifting on game physics, sprite generation, and level design.

## Project Overview

Built with React 19 + TypeScript + Vite using Phaser 3 for the game engine. The core loop runs on requestAnimationFrame with physics, collision detection, and spawning systems. Features include double jump, power-ups (speed, magnet, super size), a multi-level system with boss fights (Sand Monster), and Gemini AI integration for custom cat sprite generation and in-game wisdom quotes. The game uses a level registry/catalog architecture for extensibility, with per-level tuning profiles, boss configurations, and background entity systems. Sprites are persisted in IndexedDB with localStorage metadata.

## Current Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | React 19 + TypeScript | Vite 6 bundler |
| Game Engine | Phaser 3 | Physics, collisions, spawning |
| AI | Google Gemini | Custom cat generation, quotes, death messages |
| Asset Storage | IndexedDB + localStorage | Sprite persistence, cat state, hall of fame |
| Testing | Vitest 4 | Unit tests |
| Styling | CSS | Retro TV-screen aesthetic |

## Status

**V2 complete, V3 in progress.** V2 shipped multi-level system, boss fights, level selection, and hall of fame. V3 is adding the Phaser-based TV screen HUD redesign, new levels, and polish. Phase 0 and Phase 1 of V3 underway.
