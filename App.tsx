
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  GameStatus,
  GameScore,
  HighScoreEntry,
  Outfit,
  SavedCatLook,
  LevelId,
  VictoryFinalizePayload,
  LevelCompletePayload,
} from './types';
import GameEngine from './components/GameEngine';
import CampaignScreen from './components/LevelSelection';
import CatCustomizer from './components/CatCustomizer';
import AnimatedWater from './components/AnimatedWater';
import { getCatWisdom, getDeathMessage } from './services/geminiService';
import BalancePanel from './components/dev/BalancePanel';
import MatteCatImage from './components/MatteCatImage';
import HallOfFameCatAvatar from './components/HallOfFameCatAvatar';
import { TelemetryEvent } from './systems/telemetry/runTelemetry';
import { migrateCatStorageIfNeeded, readCatCharacterState, writeCatCharacterState } from './services/migrateCatStorage';
import {
  catAssetDbHolder,
  dataUrlToPngBlob,
  deleteCatSprite,
  getCatSprite,
  LEGACY_CAT_LOOK_KEY,
  LEGACY_CAT_OUTFITS_KEY,
  putCatSprite,
} from './services/catAssetStore';
import { blobContentKey } from './services/blobContentKey';
import { useMatteCatUrl } from './hooks/useMatteCatUrl';
import {
  getLevelConfig,
  getAnyLevelConfig,
  LEVEL_ORDER,
  CAMPAIGN_LEVEL_META,
  isLevelUnlocked,
  getNextLevelId,
  getBossEntryCoinThreshold,
  mergeLevelTuning,
} from './levels';
import { saveLevelResult, computeStars } from './services/levelCompletion';
import { loadCompletedLevels, saveCompletedLevels } from './services/levelProgress';
import {
  HALL_OF_FAME_STORAGE_KEY,
  mergeHallOfFameAfterRun,
  nextCompletedLevelsAfterWin,
  nextGameScoreAfterVictory,
} from './services/runOutcome';
import { useTuningStore } from './systems/tuning/useTuningStore';
import { useDocumentReducedMotionClass } from './hooks/usePrefersReducedMotion';
import PhaserGame from './components/PhaserGame';
import type { HudUpdatePayload } from './scenes/shared/bridgeProtocol';

const MAX_LIVES = 9;
const USE_PHASER_RUNNER = !new URLSearchParams(window.location.search).has('dom_runner');
const DEV_UNLOCK_ALL = import.meta.env.DEV || new URLSearchParams(window.location.search).has('unlock_all');

function formatHallOfFameDate(ts: number): string {
  try {
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

const App: React.FC = () => {
  const prefersReducedMotion = useDocumentReducedMotionClass();

  const [status, setStatus] = useState<GameStatus>(GameStatus.CAMPAIGN);
  const [score, setScore] = useState<GameScore>({ current: 0, high: 0, coins: 0, multiplier: 1, streak: 0, lives: MAX_LIVES });
  const [highScores, setHighScores] = useState<HighScoreEntry[]>([]);
  const [wisdom, setWisdom] = useState<string>("Ready to pounce?");
  const [deathMsg, setDeathMsg] = useState<string>("");
  const [startAtBoss, setStartAtBoss] = useState<boolean>(false);
  const [phaserPaused, setPhaserPaused] = useState(false);
  const [shellAmmo, setShellAmmo] = useState<number | undefined>(undefined);
  const [defeatedBosses, setDefeatedBosses] = useState(() => loadCompletedLevels());
  const [selectedLevel, setSelectedLevel] = useState<LevelId>(() => LEVEL_ORDER[0]);

  const { tuning } = useTuningStore();
  const anyLevelConfig = useMemo(() => getAnyLevelConfig(selectedLevel), [selectedLevel]);
  const isRunnerLevel = anyLevelConfig.genre === 'runner';
  const levelConfig = useMemo(
    () => isRunnerLevel ? getLevelConfig(selectedLevel) : null,
    [selectedLevel, isRunnerLevel]
  );
  const mergedTuning = useMemo(
    () => levelConfig ? mergeLevelTuning(tuning, levelConfig) : tuning,
    [tuning, levelConfig]
  );
  const bossCoinTarget = useMemo(
    () => levelConfig ? getBossEntryCoinThreshold(levelConfig, mergedTuning) : 0,
    [levelConfig, mergedTuning]
  );
  const skyProgressMode = levelConfig?.theme.skyProgressMode ?? 'coinsToBoss';

  const [kittyName, setKittyName] = useState<string>("Beach Kitty");
  const [customCatUrl, setCustomCatUrl] = useState<string | null>(null);
  /** IndexedDB + beach-cat-cat-state-v1 */
  const [useIndexedCatAssets, setUseIndexedCatAssets] = useState(false);
  const [catAssetsReady, setCatAssetsReady] = useState(false);
  const [equippedAssetId, setEquippedAssetId] = useState<string | null>(null);
  const [savedLooks, setSavedLooks] = useState<SavedCatLook[]>([]);
  /** Legacy localStorage outfits when IndexedDB unavailable */
  const [legacyOutfits, setLegacyOutfits] = useState<Outfit[]>([]);
  const [closetSession, setClosetSession] = useState(0);
  const equippedObjectUrlRef = useRef<string | null>(null);
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [getTelemetryEvents, setGetTelemetryEvents] = useState<(() => TelemetryEvent[]) | null>(null);
  const victoryConfetti = useMemo(
    () =>
      Array.from({ length: 20 }, (_, index) => ({
        id: index,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        color: ['#fbbf24', '#f59e0b', '#ef4444', '#f97316', '#facc15'][Math.floor(Math.random() * 5)],
        animationDelay: `${Math.random() * 2}s`,
      })),
    []
  );

  const equippedFromSavedServerMatte = useMemo(
    () =>
      savedLooks.some((l) => l.assetId === equippedAssetId && l.mattedOnServer === true),
    [savedLooks, equippedAssetId]
  );

  /** Single matting pass for equipped cat — shared by level select, closet, victory, and in-game Kitty. */
  const { displayUrl: equippedMattedUrl, isProcessing: equippedMatting } = useMatteCatUrl(customCatUrl, {
    alreadyMatted: equippedFromSavedServerMatte,
  });
  const equippedMattedState = customCatUrl
    ? { displayUrl: equippedMattedUrl, isProcessing: equippedMatting }
    : undefined;

  const revokeEquippedObjectUrl = useCallback(() => {
    if (equippedObjectUrlRef.current) {
      URL.revokeObjectURL(equippedObjectUrlRef.current);
      equippedObjectUrlRef.current = null;
    }
  }, []);

  // Scores, lives, name (sync); cat sprites async via IndexedDB migration
  useEffect(() => {
    const savedScores = localStorage.getItem(HALL_OF_FAME_STORAGE_KEY);
    if (savedScores) setHighScores(JSON.parse(savedScores));

    const savedLives = localStorage.getItem('beach-cat-lives');
    if (savedLives) {
      setScore((prev) => ({ ...prev, lives: parseInt(savedLives) }));
    }

    const savedName = localStorage.getItem('beach-cat-name');
    if (savedName) setKittyName(savedName);
  }, []);

  useEffect(() => {
    saveCompletedLevels(defeatedBosses);
  }, [defeatedBosses]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const db = await migrateCatStorageIfNeeded();
      if (cancelled) return;

      if (db) {
        setUseIndexedCatAssets(true);
        const st = readCatCharacterState();
        if (st) {
          setEquippedAssetId(st.equippedAssetId);
          setSavedLooks(st.looks);
          if (st.equippedAssetId) {
            const blob = await getCatSprite(db, st.equippedAssetId);
            if (!cancelled && blob) {
              revokeEquippedObjectUrl();
              const u = URL.createObjectURL(blob);
              equippedObjectUrlRef.current = u;
              setCustomCatUrl(u);
            } else if (!cancelled) {
              setCustomCatUrl(null);
              setEquippedAssetId(null);
              try {
                writeCatCharacterState({ schema: 1, equippedAssetId: null, looks: st.looks });
              } catch {
                /* ignore */
              }
            }
          } else if (!cancelled) {
            setCustomCatUrl(null);
          }
        }
      } else {
        setUseIndexedCatAssets(false);
        catAssetDbHolder.db = null;
        const savedLook = localStorage.getItem(LEGACY_CAT_LOOK_KEY);
        if (savedLook) setCustomCatUrl(savedLook);
        const rawOutfits = localStorage.getItem(LEGACY_CAT_OUTFITS_KEY);
        if (rawOutfits) {
          try {
            setLegacyOutfits(JSON.parse(rawOutfits) as Outfit[]);
          } catch {
            setLegacyOutfits([]);
          }
        }
      }

      if (!cancelled) setCatAssetsReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [revokeEquippedObjectUrl]);

  const ingestClosetDataUrl = useCallback(
    async (
      dataUrl: string,
      displayName: string,
      existingLooks: SavedCatLook[],
      options?: { mattedOnServer?: boolean }
    ): Promise<SavedCatLook> => {
      const db = catAssetDbHolder.db;
      if (!db) throw new Error('IndexedDB not available');
      const blob = dataUrlToPngBlob(dataUrl);
      if (!blob) throw new Error('Invalid image data');
      const contentKey = await blobContentKey(blob);
      const dup = existingLooks.find((l) => l.contentKey === contentKey);
      if (dup) return dup;
      const assetId = crypto.randomUUID();
      const ok = await putCatSprite(db, assetId, blob);
      if (!ok) throw new Error('Could not save sprite');
      return {
        id: crypto.randomUUID(),
        name: displayName,
        assetId,
        createdAt: Date.now(),
        contentKey,
        ...(options?.mattedOnServer ? { mattedOnServer: true as const } : {}),
      };
    },
    []
  );

  const handleIndexedSave = useCallback(
    async (
      args: { playerDisplayName: string },
      equip: { type: 'dataUrl'; url: string } | { type: 'assetId'; assetId: string } | null,
      looks: SavedCatLook[]
    ) => {
      const db = catAssetDbHolder.db;
      if (!db) return;

      const removed = savedLooks.filter((s) => !looks.some((l) => l.assetId === s.assetId));
      for (const r of removed) {
        try {
          await deleteCatSprite(db, r.assetId);
        } catch {
          /* ignore */
        }
      }

      revokeEquippedObjectUrl();

      let nextEquipped: string | null = null;

      if (!equip) {
        setCustomCatUrl(null);
      } else if (equip.type === 'dataUrl') {
        const blob = dataUrlToPngBlob(equip.url);
        if (blob) {
          const contentKey = await blobContentKey(blob);
          const match = looks.find((l) => l.contentKey === contentKey);
          if (match) {
            let spriteBlob: Blob | undefined = await getCatSprite(db, match.assetId);
            if (!spriteBlob) {
              const repaired = await putCatSprite(db, match.assetId, blob);
              if (repaired) spriteBlob = blob;
            }
            if (spriteBlob) {
              nextEquipped = match.assetId;
              const u = URL.createObjectURL(spriteBlob);
              equippedObjectUrlRef.current = u;
              setCustomCatUrl(u);
            } else {
              setCustomCatUrl(null);
            }
          } else {
            const id = crypto.randomUUID();
            const ok = await putCatSprite(db, id, blob);
            if (ok) {
              nextEquipped = id;
              const u = URL.createObjectURL(blob);
              equippedObjectUrlRef.current = u;
              setCustomCatUrl(u);
            } else {
              setCustomCatUrl(null);
            }
          }
        } else {
          setCustomCatUrl(null);
        }
      } else {
        try {
          const blob = await getCatSprite(db, equip.assetId);
          if (blob) {
            nextEquipped = equip.assetId;
            const u = URL.createObjectURL(blob);
            equippedObjectUrlRef.current = u;
            setCustomCatUrl(u);
          } else {
            setCustomCatUrl(null);
          }
        } catch {
          setCustomCatUrl(null);
        }
      }

      setEquippedAssetId(nextEquipped);
      setSavedLooks(looks);
      const player = args.playerDisplayName.trim() || 'Beach Kitty';
      setKittyName(player);
      try {
        writeCatCharacterState({ schema: 1, equippedAssetId: nextEquipped, looks });
      } catch (e) {
        console.warn('[catAssets] Failed to persist character state', e);
      }
      try {
        localStorage.setItem('beach-cat-name', player);
      } catch {
        /* ignore */
      }
      setStatus(GameStatus.CAMPAIGN);
    },
    [savedLooks, revokeEquippedObjectUrl]
  );

  const handleClosetLookDelete = useCallback(
    async (nextLooks: SavedCatLook[], deletedAssetId: string) => {
      const wasEquipped = equippedAssetId === deletedAssetId;
      const nextEquipped = wasEquipped ? null : equippedAssetId;

      try {
        writeCatCharacterState({
          schema: 1,
          equippedAssetId: nextEquipped,
          looks: nextLooks,
        });
      } catch (e) {
        console.warn('[catAssets] Failed to persist after closet delete', e);
        throw e;
      }

      setSavedLooks(nextLooks);
      if (wasEquipped) {
        revokeEquippedObjectUrl();
        setEquippedAssetId(null);
        setCustomCatUrl(null);
      }

      const db = catAssetDbHolder.db;
      if (db) {
        try {
          await deleteCatSprite(db, deletedAssetId);
        } catch {
          /* ignore */
        }
      }
    },
    [equippedAssetId, revokeEquippedObjectUrl]
  );

  const fetchWisdom = async () => {
    const msg = await getCatWisdom(score.current);
    setWisdom(msg);
  };

  const handleGameOver = useCallback(
    async (finalScore: number) => {
      setStatus(GameStatus.GAMEOVER);

      setHighScores((prev) => {
        const newEntry: HighScoreEntry = {
          name: kittyName,
          score: finalScore,
          date: Date.now(),
          levelId: selectedLevel,
          ...(useIndexedCatAssets
            ? { catAssetId: equippedAssetId ?? undefined }
            : { catUrl: customCatUrl || undefined }),
          isVictory: false,
        };
        const next = mergeHallOfFameAfterRun(prev, newEntry);
        try {
          localStorage.setItem(HALL_OF_FAME_STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });

      localStorage.setItem('beach-cat-lives', MAX_LIVES.toString());

      setScore((prev) => ({
        ...prev,
        current: finalScore,
        high: Math.max(prev.high, finalScore),
        lives: 0,
      }));

      const msg = await getDeathMessage(finalScore);
      setDeathMsg(msg);
    },
    [kittyName, customCatUrl, useIndexedCatAssets, equippedAssetId, selectedLevel]
  );

  const handleVictoryFinalize = useCallback(
    (payload: VictoryFinalizePayload) => {
      const { finalScore, levelId: levelBeat, gameScore } = payload;
      setDefeatedBosses((prev) => nextCompletedLevelsAfterWin(prev, levelBeat));

      setHighScores((prev) => {
        const newEntry: HighScoreEntry = {
          name: kittyName,
          score: finalScore,
          date: Date.now(),
          levelId: levelBeat,
          ...(useIndexedCatAssets
            ? { catAssetId: equippedAssetId ?? undefined }
            : { catUrl: customCatUrl || undefined }),
          isVictory: true,
        };
        const next = mergeHallOfFameAfterRun(prev, newEntry);
        try {
          localStorage.setItem(HALL_OF_FAME_STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });

      localStorage.setItem('beach-cat-lives', MAX_LIVES.toString());
      setScore((prev) =>
        nextGameScoreAfterVictory(gameScore, finalScore, MAX_LIVES, prev.high)
      );
    },
    [kittyName, customCatUrl, useIndexedCatAssets, equippedAssetId]
  );

  // Phaser bridge: level complete (victory via RunnerScene)
  const handleLevelComplete = useCallback(
    (payload: LevelCompletePayload) => {
      const { finalScore, levelId: levelBeat, gameScore } = payload;

      // Update completed levels (useEffect persists via saveCompletedLevels)
      setDefeatedBosses(prev => nextCompletedLevelsAfterWin(prev, levelBeat));

      // Save per-level result with stars
      const meta = CAMPAIGN_LEVEL_META.find(m => m.id === levelBeat);
      if (meta) {
        saveLevelResult({
          levelId: levelBeat,
          score: finalScore,
          stars: computeStars(finalScore, meta.starThresholds),
        });
      }

      // Hall of Fame entry
      setHighScores(prev => {
        const newEntry: HighScoreEntry = {
          name: kittyName,
          score: finalScore,
          date: Date.now(),
          levelId: levelBeat,
          ...(useIndexedCatAssets
            ? { catAssetId: equippedAssetId ?? undefined }
            : { catUrl: customCatUrl || undefined }),
          isVictory: true,
        };
        const next = mergeHallOfFameAfterRun(prev, newEntry);
        try { localStorage.setItem(HALL_OF_FAME_STORAGE_KEY, JSON.stringify(next)); } catch {}
        return next;
      });

      // Reuse existing helper for authoritative score + lives reset
      localStorage.setItem('beach-cat-lives', MAX_LIVES.toString());
      setScore(prev => nextGameScoreAfterVictory(gameScore, finalScore, MAX_LIVES, prev.high));

      setStatus(GameStatus.VICTORY);
    },
    [kittyName, customCatUrl, useIndexedCatAssets, equippedAssetId]
  );

  // Phaser bridge: HUD updates (pause state + shell ammo)
  const handleHudUpdate = useCallback((data: HudUpdatePayload) => {
    if (data.isPaused !== undefined) setPhaserPaused(data.isPaused);
    if (data.shellAmmo !== undefined) setShellAmmo(data.shellAmmo);
  }, []);

  const startGame = (bossMode: boolean = false) => {
    if (!DEV_UNLOCK_ALL && !isLevelUnlocked(defeatedBosses, selectedLevel)) return;
    const currentLives = score.lives <= 0 ? MAX_LIVES : score.lives;
    setStartAtBoss(bossMode);
    setStatus(GameStatus.PLAYING);
    setShellAmmo(undefined);
    setScore(prev => ({
      ...prev,
      current: 0,
      coins: bossMode ? bossCoinTarget : 0,
      multiplier: 1,
      streak: 0,
      lives: currentLives
    }));
    localStorage.setItem('beach-cat-lives', currentLives.toString());
  };

  const handleStatusChange = (newStatus: GameStatus) => {
    setStatus(newStatus);
  };

  const handleScoreUpdate = (updatedScore: GameScore) => {
    setScore(updatedScore);
    localStorage.setItem('beach-cat-lives', updatedScore.lives.toString());
  };

  const saveLegacyCustomLook = (name: string, url: string | null, updatedOutfits: Outfit[]) => {
    console.log('[Kitty Closet] Saving (legacy):', {
      name,
      url: url?.substring(0, 50),
      outfitsCount: updatedOutfits?.length,
    });

    try {
      const safeName = name || kittyName || 'Beach Kitty';
      setKittyName(safeName);
      setCustomCatUrl(url);
      setLegacyOutfits(updatedOutfits || []);

      try {
        localStorage.setItem('beach-cat-name', safeName);
        if (url) {
          localStorage.setItem(LEGACY_CAT_LOOK_KEY, url);
        } else {
          localStorage.removeItem(LEGACY_CAT_LOOK_KEY);
        }
        localStorage.setItem(LEGACY_CAT_OUTFITS_KEY, JSON.stringify(updatedOutfits || []));
      } catch (storageError) {
        console.warn('[Kitty Closet] localStorage save failed:', storageError);
      }
    } catch (error) {
      console.error('[Kitty Closet] Save error:', error);
    }

    setStatus(GameStatus.CAMPAIGN);
  };

  useEffect(() => {
    return () => {
      if (equippedObjectUrlRef.current) {
        URL.revokeObjectURL(equippedObjectUrlRef.current);
        equippedObjectUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (status === GameStatus.CAMPAIGN) fetchWisdom();
  }, [status]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '`') setShowDevPanel(prev => !prev);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleTelemetryReady = useCallback((getter: () => TelemetryEvent[]) => {
    setGetTelemetryEvents(() => getter);
  }, []);

  const isBossMoment = status === GameStatus.BOSS_FIGHT;

  const getSkyStyle = () => {
    if (status === GameStatus.CAMPAIGN || status === GameStatus.CUSTOMIZE || isBossMoment) {
      return {};
    }

    if (skyProgressMode === 'static' && levelConfig) {
      const [top, bottom] = levelConfig.theme.skyGradient;
      return {
        background: `linear-gradient(to bottom, ${top}, ${bottom})`,
      };
    }

    // Non-runner levels handle their own sky inside Phaser
    if (!levelConfig) return {};

    const denom = Math.max(1, bossCoinTarget);
    const starProgress = Math.min(score.coins / denom, 1);
    let r, g, b;

    if (starProgress < 0.5) {
      // First half of progress to boss entry (normalized by `bossCoinTarget`, not a fixed star count)
      const t = starProgress * 2;
      r = Math.floor(125 + t * (254 - 125));
      g = Math.floor(211 + t * (215 - 211));
      b = Math.floor(252 + t * (170 - 252));
    } else {
      // Second half of progress to boss entry
      const t = (starProgress - 0.5) * 2;
      r = Math.floor(254 + t * (220 - 254));
      g = Math.floor(215 + t * (38 - 215));
      b = Math.floor(170 + t * (38 - 170));
    }

    return {
      background: `linear-gradient(to bottom, rgb(${r}, ${g}, ${b}), rgb(${Math.max(0, r - 50)}, ${Math.max(0, g - 50)}, ${Math.max(0, b - 50)}))`
    };
  };

  return (
    <div 
      role="application"
      aria-label="Beach Kitty game"
      className={`relative w-full h-screen-safe flex flex-col items-center justify-center overflow-hidden font-sans transition-all duration-2000 ${
        isBossMoment ? 'bg-orange-300' : 
        status === GameStatus.CAMPAIGN ? 'bg-amber-50' : 
        status === GameStatus.CUSTOMIZE ? 'bg-amber-100' : 
        'bg-sky-300'
      }`}
      style={getSkyStyle()}
    >
      
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {status !== GameStatus.CAMPAIGN && status !== GameStatus.CUSTOMIZE && (
          <>
            {/* Animated Sun - moves and changes color based on star collection */}
            {(() => {
              if (skyProgressMode === 'static') {
                const sunSize = 30;
                return (
                  <div
                    className={`absolute rounded-full shadow-[0_0_60px_rgba(250,204,21,0.7)] motion-intense-pulse animate-pulse transition-all duration-1000 ${isBossMoment ? 'bg-red-500' : 'bg-yellow-400'}`}
                    style={{
                      top: '12%',
                      left: '50%',
                      width: `${sunSize * 4}px`,
                      height: `${sunSize * 4}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                );
              }

              const denom = Math.max(1, bossCoinTarget);
              const starProgress = Math.min(score.coins / denom, 1);
              const sunX =
                starProgress < 0.3
                  ? 12 + (starProgress / 0.3) * 38
                  : starProgress < 0.6
                    ? 50
                    : 50 + ((starProgress - 0.6) / 0.4) * 38;

              const sunColor =
                starProgress < 0.3
                  ? 'bg-yellow-400'
                  : starProgress < 0.6
                    ? 'bg-orange-400'
                    : 'bg-red-500';

              const sunSize = starProgress < 0.6 ? 28 : 32 + (starProgress - 0.6) * 8;

              return (
                <div
                  className={`absolute rounded-full shadow-[0_0_60px_rgba(250,204,21,0.7)] motion-intense-pulse animate-pulse transition-all duration-1000 ${isBossMoment ? 'bg-red-500' : sunColor}`}
                  style={{
                    top: '12%',
                    left: `${sunX}%`,
                    width: `${sunSize * 4}px`,
                    height: `${sunSize * 4}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              );
            })()}
            {status !== GameStatus.CAMPAIGN && status !== GameStatus.CUSTOMIZE && (
              <>
                <AnimatedWater isBossMoment={isBossMoment} />
                <div className="absolute bottom-0 w-full h-1/4 bg-amber-100 border-t-4 border-amber-200" />
              </>
            )}
          </>
        )}
      </div>

      {status === GameStatus.CAMPAIGN && (
        <main className="z-10 w-full animate-[fadeIn_0.5s_ease-out]">
          <CampaignScreen
            defeatedBosses={defeatedBosses}
            selectedLevel={selectedLevel}
            onSelectLevel={setSelectedLevel}
            onPlay={() => startGame(false)}
            onOpenCloset={() => {
              setClosetSession((s) => s + 1);
              setStatus(GameStatus.CUSTOMIZE);
            }}
            highScores={highScores}
            kittyName={kittyName}
            wisdom={wisdom}
            lives={score.lives > 0 ? score.lives : MAX_LIVES}
            devUnlockAll={DEV_UNLOCK_ALL}
          />
        </main>
      )}

      {status === GameStatus.CUSTOMIZE &&
        (useIndexedCatAssets ? (
          <CatCustomizer
            key={`closet-idx-${closetSession}`}
            mode="indexed"
            storageReady={catAssetsReady}
            currentEquippedAssetId={equippedAssetId}
            currentDisplayUrl={customCatUrl}
            equippedMatted={equippedMattedState}
            savedLooks={savedLooks}
            ingestClosetDataUrl={ingestClosetDataUrl}
            onSave={handleIndexedSave}
            onClosetLookDelete={handleClosetLookDelete}
            playerDisplayName={kittyName}
            onCancel={() => setStatus(GameStatus.CAMPAIGN)}
          />
        ) : (
          <CatCustomizer
            key={`closet-legacy-${closetSession}`}
            mode="legacy"
            currentUrl={customCatUrl}
            currentName={kittyName}
            savedOutfits={legacyOutfits}
            onSave={saveLegacyCustomLook}
            onCancel={() => setStatus(GameStatus.CAMPAIGN)}
          />
        ))}

      {(status === GameStatus.PLAYING || status === GameStatus.BOSS_FIGHT) && (
        USE_PHASER_RUNNER ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #2d2d44 100%)' }}>
            {/* Retro TV/VCR Frame */}
            <div className="relative" style={{ width: '85vw', maxWidth: '1100px' }}>
              {/* TV Body — JVC-style boxy warm-gray plastic */}
              <div className="relative rounded-[0.75rem]"
                style={{
                  background: 'linear-gradient(180deg, #e8e6e2 0%, #dddad4 40%, #d5d2cc 100%)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.1)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 48px',
                }}>
                {/* Left column — screen + VCR */}
                <div style={{ padding: '18px 12px 18px 18px' }}>
                  {/* Screen bezel (inner plastic frame) */}
                  <div style={{
                    background: 'linear-gradient(180deg, #e0ddd8, #d8d5d0)',
                    borderRadius: '4px',
                    padding: '6px',
                  }}>
                    {/* Black CRT frame */}
                    <div style={{
                      background: '#0a0a0a',
                      borderRadius: '10px',
                      padding: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                    }}>
                      {/* ── VFD-style HUD shelf (built into TV frame) ── */}
                      <div className="flex items-center justify-between pointer-events-none" style={{
                        height: '28px',
                        padding: '0 8px',
                        marginBottom: '4px',
                        background: 'linear-gradient(180deg, #0f0f0f 0%, #1a1a1a 50%, #111 100%)',
                        borderRadius: '4px 4px 0 0',
                        borderBottom: '1px solid #222',
                        fontFamily: "'Courier New', 'Consolas', monospace",
                      }}>
                        {/* Score — green VFD glow */}
                        <div className="flex items-center gap-1.5">
                          <span style={{ fontSize: '8px', fontWeight: 700, color: '#555', letterSpacing: '1px' }}>SCORE</span>
                          <span style={{
                            fontSize: '16px', fontWeight: 900, letterSpacing: '1px',
                            color: '#4ade80',
                            textShadow: '0 0 6px rgba(74,222,128,0.6), 0 0 12px rgba(74,222,128,0.2)',
                            fontVariantNumeric: 'tabular-nums',
                          }}>{String(score.current).padStart(6, '0')}</span>
                        </div>

                        {/* Lives — red LED dots */}
                        <div className="flex items-center gap-1.5">
                          <span style={{ fontSize: '8px', fontWeight: 700, color: '#555', letterSpacing: '1px' }}>LIVES</span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: Math.max(score.lives, 0) }, (_, i) => (
                              <div key={i} style={{
                                width: '7px', height: '7px', borderRadius: '50%',
                                background: '#ef4444',
                                boxShadow: '0 0 4px rgba(239,68,68,0.7), 0 0 8px rgba(239,68,68,0.3)',
                              }} />
                            ))}
                            {Array.from({ length: Math.max(9 - score.lives, 0) }, (_, i) => (
                              <div key={`e-${i}`} style={{
                                width: '7px', height: '7px', borderRadius: '50%',
                                background: '#2a1a1a',
                                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
                              }} />
                            ))}
                          </div>
                        </div>

                        {/* Multiplier — amber VFD */}
                        <div className="flex items-center gap-1.5">
                          <span style={{ fontSize: '8px', fontWeight: 700, color: '#555', letterSpacing: '1px' }}>MULT</span>
                          <span style={{
                            fontSize: '14px', fontWeight: 900,
                            color: score.multiplier > 1 ? '#fbbf24' : '#665500',
                            textShadow: score.multiplier > 1 ? '0 0 6px rgba(251,191,36,0.6)' : 'none',
                            fontVariantNumeric: 'tabular-nums',
                          }}>x{score.multiplier}</span>
                        </div>

                        {/* Stars / boss coins — yellow VFD */}
                        <div className="flex items-center gap-1.5">
                          <span style={{ fontSize: '8px', fontWeight: 700, color: '#555', letterSpacing: '1px' }}>★</span>
                          <span style={{
                            fontSize: '14px', fontWeight: 900,
                            color: '#fbbf24',
                            textShadow: '0 0 6px rgba(251,191,36,0.4)',
                            fontVariantNumeric: 'tabular-nums',
                          }}>{score.coins}<span style={{ color: '#554400', fontSize: '10px' }}>/{bossCoinTarget}</span></span>
                        </div>

                        {/* Shell ammo — pink VFD (boss fight only) */}
                        {status === GameStatus.BOSS_FIGHT && shellAmmo !== undefined && (
                          <div className="flex items-center gap-1.5">
                            <span style={{ fontSize: '8px', fontWeight: 700, color: '#555', letterSpacing: '1px' }}>AMMO</span>
                            <span style={{
                              fontSize: '14px', fontWeight: 900,
                              color: shellAmmo === 0 ? '#ef4444' : '#f472b6',
                              textShadow: shellAmmo === 0 ? '0 0 8px rgba(239,68,68,0.8)' : '0 0 6px rgba(244,114,182,0.5)',
                              fontVariantNumeric: 'tabular-nums',
                              animation: shellAmmo === 0 ? 'pulse 1s infinite' : 'none',
                            }}>{shellAmmo}</span>
                          </div>
                        )}

                        {/* CH indicator (was inside screen) */}
                        <span style={{
                          fontSize: '10px', fontWeight: 700,
                          color: '#4ade80',
                          textShadow: '0 0 6px rgba(74,222,128,0.4)',
                          letterSpacing: '2px',
                        }}>CH03</span>
                      </div>

                      {/* CRT Glass — the actual screen */}
                      <div className="relative overflow-hidden" style={{
                        borderRadius: '6px',
                        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.3)',
                        aspectRatio: '4/3',
                      }}>
                        {/* CRT reflections */}
                        <div className="absolute inset-0 z-20 pointer-events-none" style={{
                          background: 'radial-gradient(ellipse at 25% 15%, rgba(255,255,255,0.12) 0%, transparent 50%), radial-gradient(ellipse at 75% 85%, rgba(255,255,255,0.04) 0%, transparent 40%)',
                        }} />
                        {/* Scanlines */}
                        <div className="absolute inset-0 z-20 pointer-events-none opacity-[0.06]" style={{
                          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 4px)',
                        }} />

                        {/* === GAME CONTENT === */}
                        {/* Phaser canvas */}
                        <PhaserGame
                          levelId={selectedLevel}
                          catSpriteUrl={customCatUrl}
                          sceneInitData={
                            isRunnerLevel
                              ? {
                                  levelConfig,
                                  initialLives: score.lives > 0 ? score.lives : MAX_LIVES,
                                  startAtBoss,
                                  tuning: mergedTuning,
                                  isPaused: phaserPaused,
                                  onTelemetryReady: handleTelemetryReady,
                                }
                              : {
                                  levelConfig: anyLevelConfig,
                                  initialLives: score.lives > 0 ? score.lives : MAX_LIVES,
                                  isPaused: phaserPaused,
                                }
                          }
                          sceneFactory={
                            {
                              runner: () => import('./scenes/RunnerScene'),
                              platformer: () => import('./scenes/PlatformerScene'),
                              launcher: () => import('./scenes/LauncherScene'),
                              shooter: () => import('./scenes/ShooterScene'),
                              breakout: () => import('./scenes/BreakoutScene'),
                              frogger: () => import('./scenes/FroggerScene'),
                            }[anyLevelConfig.genre] ?? (() => import('./scenes/RunnerScene'))
                          }
                          onScoreUpdate={handleScoreUpdate}
                          onLevelComplete={handleLevelComplete}
                          onGameOver={(finalScore: number) => handleGameOver(finalScore)}
                          onStatusChange={handleStatusChange}
                          onHudUpdate={handleHudUpdate}
                        />
                        {/* Phaser pause overlay */}
                        {phaserPaused && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center animate-[fadeIn_0.2s_ease-out]">
                            <h2 className="text-6xl font-black text-white italic tracking-tighter uppercase mb-8 drop-shadow-[0_8px_0_rgba(0,0,0,0.5)]">PAUSED</h2>
                            <div className="flex flex-col gap-4 w-full max-w-xs px-6">
                              <button
                                onClick={() => setPhaserPaused(false)}
                                className="w-full bg-white text-amber-900 font-black py-4 rounded-2xl text-2xl shadow-[0_8px_0_#d97706] hover:shadow-[0_4px_0_#d97706] transition-all active:translate-y-1 active:shadow-none"
                              >
                                RESUME
                              </button>
                              <button
                                onClick={() => { setPhaserPaused(false); setStatus(GameStatus.CAMPAIGN); }}
                                className="w-full bg-red-600 text-white font-black py-4 rounded-2xl text-2xl shadow-[0_8px_0_#7f1d1d] hover:shadow-[0_4px_0_#7f1d1d] transition-all active:translate-y-1 active:shadow-none"
                              >
                                MAIN MENU
                              </button>
                            </div>
                            <p className="mt-8 text-white/50 font-bold tracking-widest text-xs uppercase">Press 'P' or 'ESC' to Resume</p>
                          </div>
                        )}
                        {/* === END GAME CONTENT === */}
                      </div>
                    </div>
                  </div>

                  {/* Brand label below screen */}
                  <div className="text-center mt-2" style={{
                    fontSize: '16px',
                    fontWeight: 900,
                    letterSpacing: '6px',
                    fontStyle: 'italic',
                    color: '#6b6860',
                  }}>BEACH KITTY</div>

                  {/* VCR Section */}
                  <div className="mt-2 flex items-center justify-between gap-3" style={{ height: '56px' }}>
                    {/* Left: VCR label */}
                    <div style={{ fontSize: '8px', fontWeight: 700, color: '#8a8880', letterSpacing: '1.5px' }}>
                      4 HEAD<br/>VCR COMBO
                    </div>

                    {/* Center: Tape slot */}
                    <div className="flex-1 mx-2">
                      <div style={{
                        height: '8px',
                        background: '#2a2a28',
                        borderRadius: '2px',
                        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6)',
                        maxWidth: '200px',
                        margin: '0 auto',
                      }} />
                    </div>

                    {/* Right: Transport buttons (functional) */}
                    <div className="flex items-center gap-1">
                      {[
                        { label: '▶ PLAY', action: () => setPhaserPaused(false) },
                        { label: '⏸ PAUSE', action: () => setPhaserPaused(true) },
                        { label: '⏏ EJECT', action: () => { setPhaserPaused(false); setStatus(GameStatus.CAMPAIGN); } },
                      ].map(({ label, action }) => (
                        <button key={label} onClick={action} className="flex items-center justify-center cursor-pointer hover:brightness-90 active:translate-y-px" style={{
                          width: label.includes('EJECT') ? '36px' : '32px',
                          height: '20px',
                          background: 'linear-gradient(180deg, #d5d2cc, #c8c5c0)',
                          borderRadius: '2px',
                          border: 'none',
                          boxShadow: '0 1px 0 #b8b5b0, inset 0 1px 0 rgba(255,255,255,0.3)',
                        }}>
                          <span style={{ fontSize: '5px', fontWeight: 800, color: '#6b6860', letterSpacing: '0.5px' }}>{label}</span>
                        </button>
                      ))}
                    </div>

                    {/* RCA jacks */}
                    <div className="flex items-center gap-1 ml-2">
                      {[['#eab308','VIDEO'], ['#ffffff','AUDIO L'], ['#ef4444','AUDIO R']].map(([color, label]) => (
                        <div key={label} className="flex flex-col items-center">
                          <div style={{
                            width: '10px', height: '10px', borderRadius: '50%',
                            background: color,
                            border: '2px solid #4a4a48',
                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)',
                          }} />
                          <span style={{ fontSize: '4px', color: '#8a8880', marginTop: '1px' }}>{label}</span>
                        </div>
                      ))}
                    </div>

                    {/* CH/VOL + POWER */}
                    <div className="flex items-center gap-2 ml-2">
                      {['CH', 'VOL'].map(label => (
                        <div key={label} className="flex flex-col items-center gap-0.5">
                          <div style={{ width: '14px', height: '10px', background: '#c8c5c0', borderRadius: '2px', boxShadow: '0 1px 0 #b8b5b0' }} />
                          <span style={{ fontSize: '5px', color: '#8a8880', fontWeight: 700 }}>{label}</span>
                          <div style={{ width: '14px', height: '10px', background: '#c8c5c0', borderRadius: '2px', boxShadow: '0 1px 0 #b8b5b0' }} />
                        </div>
                      ))}
                      {/* POWER */}
                      <div className="flex flex-col items-center ml-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.6)' }} />
                        <div style={{
                          width: '20px', height: '16px', marginTop: '2px',
                          background: 'linear-gradient(180deg, #888, #666)',
                          borderRadius: '3px', boxShadow: '0 1px 0 #555',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span style={{ fontSize: '5px', fontWeight: 900, color: '#ddd' }}>POWER</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right column — speaker grille */}
                <div className="flex flex-col justify-center gap-[3px] pr-3" style={{ paddingTop: '18px', paddingBottom: '56px' }}>
                  {Array.from({ length: 10 }, (_, i) => (
                    <div key={i} style={{
                      height: '3px',
                      background: 'linear-gradient(90deg, #b8b5b0, #a8a5a0)',
                      borderRadius: '1px',
                      boxShadow: 'inset 0 1px 0 rgba(0,0,0,0.15)',
                    }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <GameEngine
            key={selectedLevel}
            initialLives={score.lives}
            levelId={selectedLevel}
            levelConfig={levelConfig}
            startAtBoss={startAtBoss}
            customCatUrl={customCatUrl}
            equippedCatMatting={equippedMattedState}
            onGameOver={handleGameOver}
            onScoreUpdate={handleScoreUpdate}
            onVictoryFinalize={handleVictoryFinalize}
            onStatusChange={handleStatusChange}
            onTelemetryReady={handleTelemetryReady}
          />
        )
      )}

      {status === GameStatus.GAMEOVER && (
        <div
          role="alert"
          aria-live="assertive"
          className="z-10 bg-white p-10 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] text-center max-w-md border-4 border-red-400 animate-[bounceIn_0.5s_ease-out]"
        >
          <h2 className="text-7xl font-black text-red-600 mb-4 drop-shadow-md italic">CRASH!</h2>
          <p className="text-slate-700 mb-6 text-xl font-bold px-4 leading-snug">{deathMsg}</p>
          <p className="text-red-500 font-black text-sm uppercase tracking-widest mb-10">All 9 Lives Exhausted!</p>
          
          <div className="grid grid-cols-2 gap-6 mb-10">
            <div className="bg-amber-100/80 p-6 rounded-[2rem] border-2 border-amber-200 shadow-sm">
              <span className="block text-xs uppercase text-amber-700 font-black tracking-widest mb-1">Score</span>
              <span className="text-5xl font-black text-amber-900 tabular-nums">{score.current}</span>
            </div>
            <div className="bg-blue-100/80 p-6 rounded-[2rem] border-2 border-blue-200 shadow-sm">
              <span className="block text-xs uppercase text-blue-700 font-black tracking-widest mb-1">Best</span>
              <span className="text-5xl font-black text-blue-900 tabular-nums">{score.high}</span>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => startGame(false)}
            className="w-full min-h-[48px] bg-blue-600 hover:bg-blue-700 text-white font-black py-6 px-8 rounded-3xl text-3xl transform transition active:scale-95 shadow-[0_10px_0_rgb(30,58,138)] hover:shadow-[0_8px_0_rgb(30,58,138)] mb-6"
          >
            START NEW RUN
          </button>

          <button
            type="button"
            onClick={() => setStatus(GameStatus.CAMPAIGN)}
            className="w-full min-h-[44px] text-slate-500 font-black text-lg uppercase tracking-widest hover:text-slate-800 transition py-3"
          >
            CAMPAIGN MENU
          </button>
        </div>
      )}

      {status === GameStatus.VICTORY && (
        <div
          role="alert"
          aria-live="assertive"
          className="z-10 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 p-12 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] text-center max-w-2xl border-4 border-yellow-400 animate-[bounceIn_0.5s_ease-out] relative overflow-hidden"
        >
          {!prefersReducedMotion && (
            <div className="absolute inset-0 pointer-events-none motion-intense" aria-hidden>
              {victoryConfetti.map((particle) => (
                <div
                  key={particle.id}
                  className="absolute w-2 h-2 rounded-full animate-[confetti_3s_ease-out_infinite]"
                  style={{
                    left: particle.left,
                    top: particle.top,
                    backgroundColor: particle.color,
                    animationDelay: particle.animationDelay,
                  }}
                />
              ))}
            </div>
          )}

          <h2
            className={`text-8xl font-black text-yellow-600 mb-6 drop-shadow-lg italic relative z-10 ${prefersReducedMotion ? '' : 'motion-intense-pulse animate-[pulse_2s_ease-in-out_infinite]'}`}
          >
            VICTORY!
          </h2>
          
          {/* Large Kitty Display */}
          <div className="mb-8 relative z-10">
            <div className="w-64 h-64 mx-auto bg-white rounded-full border-8 border-yellow-400 shadow-2xl flex items-center justify-center overflow-hidden relative">
              {customCatUrl ? (
                <MatteCatImage
                  src={customCatUrl}
                  alt={kittyName}
                  className="w-full h-full"
                  imgClassName="w-full h-full object-contain scale-110 drop-shadow-md"
                  mattedFromParent={equippedMattedState}
                />
              ) : (
                <div className="text-9xl">🐾</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-yellow-200/30 to-transparent pointer-events-none" />
            </div>
            <p className="text-3xl font-black text-amber-900 mt-4 uppercase tracking-wider">{kittyName}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-6 mb-8 relative z-10">
            <div className="bg-yellow-100/80 p-6 rounded-[2rem] border-2 border-yellow-300 shadow-lg">
              <span className="block text-xs uppercase text-yellow-700 font-black tracking-widest mb-1">Final Score</span>
              <span className="text-5xl font-black text-yellow-900 tabular-nums">{score.current}</span>
            </div>
            <div className="bg-orange-100/80 p-6 rounded-[2rem] border-2 border-orange-300 shadow-lg">
              <span className="block text-xs uppercase text-orange-700 font-black tracking-widest mb-1">Multiplier Bonus</span>
              <span className="text-5xl font-black text-orange-900 tabular-nums">+{score.multiplier - 1}</span>
            </div>
          </div>

          <p className="text-center text-lg font-black text-amber-900 uppercase tracking-wide mb-6 relative z-10 leading-snug">
            {(() => {
              const nextId = getNextLevelId(selectedLevel);
              const nextUnlocked =
                nextId !== null && isLevelUnlocked(defeatedBosses, nextId);
              if (nextUnlocked) {
                return (
                  <>
                    <span className="block text-sm font-bold text-amber-800/90 normal-case tracking-normal mb-1">
                      Progress
                    </span>
                    Next level unlocked:{' '}
                    <span className="text-yellow-600">{getLevelConfig(nextId).name}</span>
                  </>
                );
              }
              return (
                <>
                  <span className="block text-sm font-bold text-amber-800/90 normal-case tracking-normal mb-1">
                    Progress
                  </span>
                  {getLevelConfig(selectedLevel).name} cleared — you can run it again anytime.
                </>
              );
            })()}
          </p>
          
          <div className="flex flex-col gap-4 relative z-10">
            <button
              type="button"
              onClick={() => {
                const nextId = getNextLevelId(selectedLevel);
                if (nextId !== null && isLevelUnlocked(defeatedBosses, nextId)) {
                  setSelectedLevel(nextId);
                }
                setStatus(GameStatus.CAMPAIGN);
              }}
              className="w-full min-h-[48px] bg-yellow-500 hover:bg-yellow-600 text-white font-black py-6 px-8 rounded-3xl text-3xl transform transition active:scale-95 shadow-[0_10px_0_rgb(217,119,6)] hover:shadow-[0_8px_0_rgb(217,119,6)]"
            >
              CONTINUE
            </button>
            
            <button
              type="button"
              onClick={() => setStatus(GameStatus.CAMPAIGN)}
              className="w-full min-h-[44px] text-slate-500 font-black text-lg uppercase tracking-widest hover:text-slate-800 transition py-3"
            >
              MAIN MENU
            </button>
          </div>
          
          <style>{`
            @keyframes confetti {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(-200px) rotate(360deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {(status === GameStatus.PLAYING || status === GameStatus.BOSS_FIGHT) && !USE_PHASER_RUNNER && (
        <div
          className="absolute top-6 left-6 z-20 flex flex-col gap-4 pointer-events-none animate-[slideDown_0.3s_ease-out]"
          style={{ marginTop: 'env(safe-area-inset-top)', marginLeft: 'env(safe-area-inset-left)' }}
        >
          <div className="bg-white/90 backdrop-blur-md px-6 py-4 rounded-3xl border-2 border-white shadow-xl flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-black text-amber-800/60">SCORE</span>
              <span className="text-3xl font-black text-amber-900 tabular-nums leading-none">
                {score.current}
              </span>
            </div>
            <div className="w-px h-10 bg-amber-900/10" />
            
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-black text-red-800/60">Lives</span>
              <div className="flex items-center gap-1">
                 <span className="text-2xl">🐾</span>
                 <span className="text-3xl font-black text-red-600 leading-none">{score.lives}</span>
              </div>
            </div>

            <div className="w-px h-10 bg-amber-900/10" />
            <div className="flex flex-col relative">
              <span className="text-[10px] uppercase font-black text-purple-800/60">Multiplier</span>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-purple-700 tabular-nums leading-none">x{score.multiplier}</span>
                <div className="h-1.5 w-16 bg-purple-100 rounded-full overflow-hidden mb-1 border border-purple-200">
                   <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${(score.streak / 5) * 100}%` }} />
                </div>
              </div>
            </div>
            
            <div className="w-px h-10 bg-amber-900/10" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-black text-yellow-800/60">Stars</span>
              <span className="text-3xl font-black text-yellow-600 tabular-nums leading-none flex items-center gap-1">
                <span className="text-xl">★</span>{score.coins}<span className="text-xs text-yellow-800/40">/{bossCoinTarget}</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {showDevPanel && (
        <BalancePanel getTelemetryEvents={getTelemetryEvents ?? undefined} />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}} />
    </div>
  );
};

export default App;
