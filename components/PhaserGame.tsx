import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { BRIDGE_EVENTS } from '../scenes/shared/SceneBridge';
import type { SceneBridge } from '../scenes/shared/SceneBridge';
import type { HudUpdatePayload } from '../scenes/shared/bridgeProtocol';
import type { GameScore, GameStatus, LevelCompletePayload, LevelId } from '../types';

export interface PhaserGameProps {
  levelId: LevelId;
  catSpriteUrl: string | null;
  sceneInitData: Record<string, unknown>;
  sceneFactory: () => Promise<{ default: typeof SceneBridge } | typeof SceneBridge>;
  onScoreUpdate?: (score: GameScore) => void;
  onLivesChanged?: (lives: number) => void;
  onLevelComplete?: (payload: LevelCompletePayload) => void;
  onGameOver?: (finalScore: number) => void;
  onStatusChange?: (status: GameStatus) => void;
  onHudUpdate?: (data: HudUpdatePayload) => void;
}

const SCENE_KEY = 'active-level';

const PhaserGame: React.FC<PhaserGameProps> = ({
  levelId,
  catSpriteUrl,
  sceneInitData,
  sceneFactory,
  onScoreUpdate,
  onLivesChanged,
  onLevelComplete,
  onGameOver,
  onStatusChange,
  onHudUpdate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<SceneBridge | null>(null);

  // Keep callback refs fresh without re-mounting Phaser
  const propsRef = useRef({
    onScoreUpdate,
    onLivesChanged,
    onLevelComplete,
    onGameOver,
    onStatusChange,
    onHudUpdate,
  });
  propsRef.current = {
    onScoreUpdate,
    onLivesChanged,
    onLevelComplete,
    onGameOver,
    onStatusChange,
    onHudUpdate,
  };

  // Effect 1: Mount/unmount Phaser.Game — full restart when levelId changes
  useEffect(() => {
    if (!containerRef.current) return;

    let destroyed = false;
    const container = containerRef.current;
    let resizeObserver: ResizeObserver | null = null;

    (async () => {
      // Lazy-load the scene class
      const imported = await sceneFactory();
      if (destroyed) return;

      const SceneClass = 'default' in imported ? imported.default : imported;

      // Wait two frames for CSS layout to fully settle
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (destroyed) return;

      const initW = container.clientWidth || 800;
      const initH = container.clientHeight || 600;

      const game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: container,
        width: initW,
        height: initH,
        backgroundColor: '#87CEEB',
        scale: {
          mode: Phaser.Scale.NONE,  // Full manual control — no Phaser auto-scaling
        },
        scene: [],
      });

      if (destroyed) {
        game.destroy(true);
        return;
      }

      gameRef.current = game;

      // ResizeObserver — manually resize Phaser game when container changes
      resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          const w = Math.floor(entry.contentRect.width);
          const h = Math.floor(entry.contentRect.height);
          if (w > 0 && h > 0 && gameRef.current) {
            gameRef.current.scale.resize(w, h);
            // Also update the canvas element dimensions directly
            const canvas = gameRef.current.canvas;
            if (canvas) {
              canvas.width = w;
              canvas.height = h;
              canvas.style.width = w + 'px';
              canvas.style.height = h + 'px';
            }
          }
        }
      });
      resizeObserver.observe(container);

      // Add the scene class and start it with init data
      game.scene.add(SCENE_KEY, SceneClass, true, {
        levelId,
        catSpriteUrl,
        ...sceneInitData,
      });

      // Grab the scene instance once it's running
      const scene = game.scene.getScene(SCENE_KEY) as SceneBridge | null;
      if (!scene || destroyed) return;

      sceneRef.current = scene;

      // Wire bridge events to React callbacks via propsRef (stays fresh)
      scene.events.on(BRIDGE_EVENTS.SCORE_UPDATE, (s: GameScore) => {
        propsRef.current.onScoreUpdate?.(s);
      });
      scene.events.on(BRIDGE_EVENTS.LIVES_CHANGED, (l: number) => {
        propsRef.current.onLivesChanged?.(l);
      });
      scene.events.on(BRIDGE_EVENTS.LEVEL_COMPLETE, (p: LevelCompletePayload) => {
        propsRef.current.onLevelComplete?.(p);
      });
      scene.events.on(BRIDGE_EVENTS.GAME_OVER, (s: number) => {
        propsRef.current.onGameOver?.(s);
      });
      scene.events.on(BRIDGE_EVENTS.STATUS_CHANGE, (st: GameStatus) => {
        propsRef.current.onStatusChange?.(st);
      });
      scene.events.on(BRIDGE_EVENTS.HUD_UPDATE, (d: HudUpdatePayload) => {
        propsRef.current.onHudUpdate?.(d);
      });
    })();

    return () => {
      destroyed = true;
      sceneRef.current = null;
      if (resizeObserver) resizeObserver.disconnect();
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [levelId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect 2: Apply runtime patches when sceneInitData changes (mid-run tuning)
  useEffect(() => {
    sceneRef.current?.applyRuntimePatch(sceneInitData);
  }, [sceneInitData]);

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    />
  );
};

export default PhaserGame;
