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

    (async () => {
      // Lazy-load the scene class
      const imported = await sceneFactory();
      if (destroyed) return;

      const SceneClass = 'default' in imported ? imported.default : imported;

      // Wait a frame for CSS layout to settle, then read container dimensions
      await new Promise(r => requestAnimationFrame(r));
      if (destroyed) return;

      const initW = container.clientWidth || 800;
      const initH = container.clientHeight || 600;

      const game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: container,
        width: initW,
        height: initH,
        backgroundColor: '#bfdbfe',
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        // Start with no scenes — we add + start manually below
        scene: [],
      });

      // Force Phaser canvas to fill container via CSS
      const canvas = container.querySelector('canvas');
      if (canvas) {
        canvas.style.width = '100%';
        canvas.style.height = '100%';
      }

      if (destroyed) {
        game.destroy(true);
        return;
      }

      gameRef.current = game;

      // ResizeObserver — manually resize Phaser when container size changes
      const ro = new ResizeObserver(entries => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0 && game.scale) {
            game.scale.resize(width, height);
          }
        }
      });
      ro.observe(container);
      // Store for cleanup
      (game as any).__resizeObserver = ro;

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
      if (gameRef.current) {
        const ro = (gameRef.current as any).__resizeObserver as ResizeObserver | undefined;
        if (ro) ro.disconnect();
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
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
    />
  );
};

export default PhaserGame;
