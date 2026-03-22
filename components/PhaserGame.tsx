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

    (async () => {
      const imported = await sceneFactory();
      if (destroyed) return;
      const SceneClass = 'default' in imported ? imported.default : imported;

      const GAME_W = 960;
      const GAME_H = 720;

      const game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: container,
        width: GAME_W,
        height: GAME_H,
        backgroundColor: '#87CEEB',
        scale: { mode: Phaser.Scale.NONE },
        scene: [],
      });

      // Force canvas to fill container — override any Phaser sizing
      const canvas = container.querySelector('canvas');
      if (canvas) {
        canvas.style.cssText = 'width:100%!important;height:100%!important;display:block!important;';
      }

      if (destroyed) { game.destroy(true); return; }
      gameRef.current = game;

      game.scene.add(SCENE_KEY, SceneClass, true, {
        levelId, catSpriteUrl, ...sceneInitData,
      });

      const scene = game.scene.getScene(SCENE_KEY) as SceneBridge | null;
      if (!scene || destroyed) return;
      sceneRef.current = scene;

      scene.events.on(BRIDGE_EVENTS.SCORE_UPDATE, (s: GameScore) => propsRef.current.onScoreUpdate?.(s));
      scene.events.on(BRIDGE_EVENTS.LIVES_CHANGED, (l: number) => propsRef.current.onLivesChanged?.(l));
      scene.events.on(BRIDGE_EVENTS.LEVEL_COMPLETE, (p: LevelCompletePayload) => propsRef.current.onLevelComplete?.(p));
      scene.events.on(BRIDGE_EVENTS.GAME_OVER, (s: number) => propsRef.current.onGameOver?.(s));
      scene.events.on(BRIDGE_EVENTS.STATUS_CHANGE, (st: GameStatus) => propsRef.current.onStatusChange?.(st));
      scene.events.on(BRIDGE_EVENTS.HUD_UPDATE, (d: HudUpdatePayload) => propsRef.current.onHudUpdate?.(d));
    })();

    return () => {
      destroyed = true;
      sceneRef.current = null;
      if (gameRef.current) { gameRef.current.destroy(true); gameRef.current = null; }
    };
  }, [levelId]); // eslint-disable-line react-hooks/exhaustive-deps

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
