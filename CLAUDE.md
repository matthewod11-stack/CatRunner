# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Beach Kitty is an endless runner game built with React 19 + TypeScript + Vite. A cat runs along a beach dodging obstacles, collecting coins/shells, and fighting a boss (Sand Monster). Gemini AI requests are proxied through server-side API routes for key safety.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server on port 3000
npm run build        # Production build
npm run preview      # Preview production build
```

## Environment Setup

Set `GEMINI_API_KEY` in `.env.local` for AI features (custom cat generation, wisdom quotes, death messages). In production, configure `GEMINI_API_KEY` on the server environment.

## Architecture

### Core Game Loop
- **App.tsx** - Root component managing game states (`GameStatus` enum: LEVEL_SELECTION, PLAYING, BOSS_FIGHT, GAMEOVER, VICTORY, CUSTOMIZE). Handles persistence via localStorage for high scores, lives, kitty name, and custom outfits.
- **GameEngine.tsx** - Main game loop using `requestAnimationFrame`. Contains all physics (gravity, jump/duck mechanics), collision detection, obstacle spawning patterns, and boss fight logic. Uses refs (`scoreRef`, `livesRef`, `obstaclesRef`, etc.) for mutable game state to avoid React re-render overhead.

### Game Mechanics (defined in GameEngine.tsx)
- **Physics constants**: GRAVITY=0.75, JUMP_FORCE=17, GROUND_Y=100
- **Scoring**: Coins=1 point each, Shells=5 points, multiplier increases with streak
- **Boss trigger**: Collect 50 stars (BOSS_THRESHOLD) to start boss fight
- **Double jump**: `jumpCount` tracks jumps, max 2 before landing
- **Power-ups**: SPEED (1.7x), MAGNET (attracts coins), SUPER_SIZE (3x scale + invincibility)

### Component Architecture
- **Kitty.tsx** - Player character with custom URL support. Uses Canvas API to strip white backgrounds from AI-generated images.
- **ObstacleComponent.tsx** - Renders all obstacle types (CRAB, BEACHBALL, SEAGULL, SANDCASTLE, TIDEPOOL, PALM_TREE, COIN, SHELL, power-ups, SAND_PROJECTILE) as inline SVGs with CSS animations.
- **SandMonster.tsx** - Boss enemy with health bar, facing direction state, and attack animations.
- **CatCustomizer.tsx** - "Kitty Closet" UI for generating/saving custom cat appearances via Gemini AI.
- **AnimatedWater.tsx** - Decorative animated water background element.

### AI Integration (services/geminiService.ts + api/cat/*)
- Frontend calls same-origin endpoints at `/api/cat/*`
- Server handlers use Gemini with `GEMINI_API_KEY`
- `getCatWisdom(score)` - Generates sassy one-liners for level selection screen
- `getDeathMessage(score)` - Generates game over messages
- `generateCustomCat(description)` - Uses `gemini-2.5-flash-image` to create custom cat sprites from text descriptions

### Types (types.ts)
All game types are defined here:
- `GameStatus` enum for state machine
- `ObstacleType`, `PowerUpType`, `EntityType` unions
- `WorldEntity`, `Obstacle`, `Bullet`, `Particle` interfaces for game objects
- `PlayerState` for jump/duck/hurt tracking
- `GameScore`, `HighScoreEntry`, `Outfit` for persistence

### Pattern System
BEACH_PATTERNS in GameEngine.tsx defines spawn sequences (e.g., CRAB → COIN → SEAGULL) with timing delays. Pattern difficulty scales with score progress.

### Audio System (services/audioService.ts)
Procedural background music using Web Audio API oscillators. Features:
- Beach-y chord progression (C major pentatonic)
- Tempo dynamically adjusts with game speed (100-180 BPM)
- Boss mode switches to faster, more intense tempo
- Starts/stops based on game state and pause

## Key Implementation Details

- Collision detection uses AABB (axis-aligned bounding boxes) with padding for forgiveness
- Background entities (boats, surfers, airplanes, jetskis) have parallax depth layers
- Screen shake effect managed via `screenShake` state with intensity decay
- Audio uses Web Audio API for retro sound effects (oscillator-based)
- Seagulls have two behavior types: 'dive' (swoops at player) and 'poop' (drops projectiles)
- All styling uses Tailwind CSS loaded via CDN

## Game Feel / "Juice" Features

The game uses several techniques to make actions feel satisfying:

- **Squash/Stretch**: Cat stretches when jumping up, squashes on landing (Kitty.tsx)
- **Freeze Frames**: Brief pause (40-200ms) on impacts for dramatic effect (triggerFreezeFrame)
- **Screen Shake**: Varies by intensity - small for boss projectiles, big for player hits
- **Hit Flash**: Red screen overlay flashes briefly when player takes damage
- **Speed Lines**: White streaks appear across screen when speed exceeds threshold
- **Dust Trail**: Sand particles kick up behind cat while running on ground
- **Coin Glow**: Coins have radial gradient, sparkle, and pulsing glow effect
- **Float-up Scores**: Collected items show "+N" that pops big then floats up and fades
