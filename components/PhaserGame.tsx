import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
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
const GAME_W = 960;
const GAME_H = 720;

function enforceCanvasFill(canvas: HTMLCanvasElement): void {
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', 'Beach Kitty gameplay canvas');
  canvas.style.setProperty('display', 'block', 'important');
  canvas.style.setProperty('width', '100%', 'important');
  canvas.style.setProperty('height', '100%', 'important');
  canvas.style.setProperty('max-width', '100%', 'important');
  canvas.style.setProperty('max-height', '100%', 'important');
  canvas.style.setProperty('outline', 'none', 'important');
}

function focusCanvas(canvas: HTMLCanvasElement | null): void {
  canvas?.focus({ preventScroll: true });
}

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

  const propsRef = useRef({
    onScoreUpdate, onLivesChanged, onLevelComplete,
    onGameOver, onStatusChange, onHudUpdate,
  });
  propsRef.current = {
    onScoreUpdate, onLivesChanged, onLevelComplete,
    onGameOver, onStatusChange, onHudUpdate,
  };

  useEffect(() => {
    if (!containerRef.current) return;

    let destroyed = false;
    const container = containerRef.current;
    let resizeObserver: ResizeObserver | null = null;

    (async () => {
      const imported = await sceneFactory();
      if (destroyed) return;
      const SceneClass = 'default' in imported ? imported.default : imported;

      const game = new Phaser.Game({
        type: Phaser.AUTO,
        // React owns the TV-screen box; Phaser owns the fixed logical resolution.
        parent: null,
        width: GAME_W,
        height: GAME_H,
        backgroundColor: '#87CEEB',
        scale: { parent: null, mode: Phaser.Scale.NONE },
        physics: {
          default: 'arcade',
          arcade: { gravity: { x: 0, y: 0 }, debug: false },
        },
        scene: [],
      });

      const canvas = game.canvas as HTMLCanvasElement | null;
      if (canvas) {
        container.replaceChildren(canvas);
        enforceCanvasFill(canvas);
        requestAnimationFrame(() => {
          if (!destroyed) {
            enforceCanvasFill(canvas);
            focusCanvas(canvas);
          }
        });
        resizeObserver = new ResizeObserver(() => {
          enforceCanvasFill(canvas);
        });
        resizeObserver.observe(container);
      }

      if (destroyed) { game.destroy(true); return; }
      gameRef.current = game;

      game.scene.add(SCENE_KEY, SceneClass, true, {
        levelId,
        catSpriteUrl,
        ...sceneInitData,
        bridgeCallbacks: {
          onScoreUpdate: (s: GameScore) => propsRef.current.onScoreUpdate?.(s),
          onLivesChanged: (l: number) => propsRef.current.onLivesChanged?.(l),
          onLevelComplete: (p: LevelCompletePayload) => propsRef.current.onLevelComplete?.(p),
          onGameOver: (s: number) => propsRef.current.onGameOver?.(s),
          onStatusChange: (st: GameStatus) => propsRef.current.onStatusChange?.(st),
          onHudUpdate: (d: HudUpdatePayload) => propsRef.current.onHudUpdate?.(d),
        },
      });

      const scene = game.scene.getScene(SCENE_KEY) as SceneBridge | null;
      if (!scene || destroyed) return;
      sceneRef.current = scene;
    })();

    return () => {
      destroyed = true;
      resizeObserver?.disconnect();
      sceneRef.current = null;
      if (gameRef.current) { gameRef.current.destroy(true); gameRef.current = null; }
    };
  }, [levelId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    sceneRef.current?.applyRuntimePatch(sceneInitData);
    if (sceneInitData.isPaused === false) {
      focusCanvas(gameRef.current?.canvas as HTMLCanvasElement | null);
    }
  }, [sceneInitData]);

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    />
  );
};

export default PhaserGame;
