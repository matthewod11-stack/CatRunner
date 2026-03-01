
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameStatus, GameScore, HighScoreEntry, Outfit } from './types';
import GameEngine from './components/GameEngine';
import CatCustomizer from './components/CatCustomizer';
import AnimatedWater from './components/AnimatedWater';
import { getCatWisdom, getDeathMessage } from './services/geminiService';
import BalancePanel from './components/dev/BalancePanel';
import { TelemetryEvent } from './systems/telemetry/runTelemetry';

const MAX_LIVES = 9;
const BOSS_STARS_THRESHOLD = 50;

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.LEVEL_SELECTION);
  const [score, setScore] = useState<GameScore>({ current: 0, high: 0, coins: 0, multiplier: 1, streak: 0, lives: MAX_LIVES });
  const [highScores, setHighScores] = useState<HighScoreEntry[]>([]);
  const [wisdom, setWisdom] = useState<string>("Ready to pounce?");
  const [deathMsg, setDeathMsg] = useState<string>("");
  const [startAtBoss, setStartAtBoss] = useState<boolean>(false);
  
  const [kittyName, setKittyName] = useState<string>("Beach Kitty");
  const [customCatUrl, setCustomCatUrl] = useState<string | null>(null);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
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

  // Load persistence
  useEffect(() => {
    const savedScores = localStorage.getItem('beach-cat-scores-v2');
    if (savedScores) setHighScores(JSON.parse(savedScores));

    const savedLives = localStorage.getItem('beach-cat-lives');
    if (savedLives) {
        setScore(prev => ({ ...prev, lives: parseInt(savedLives) }));
    }

    const savedName = localStorage.getItem('beach-cat-name');
    if (savedName) setKittyName(savedName);

    const savedLook = localStorage.getItem('beach-cat-look');
    if (savedLook) setCustomCatUrl(savedLook);

    const savedOutfits = localStorage.getItem('beach-cat-outfits');
    if (savedOutfits) setOutfits(JSON.parse(savedOutfits));
  }, []);

  const fetchWisdom = async () => {
    const msg = await getCatWisdom(score.current);
    setWisdom(msg);
  };

  const handleGameOver = useCallback(async (finalScore: number) => {
    setStatus(GameStatus.GAMEOVER);

    const newEntry: HighScoreEntry = {
      name: kittyName,
      score: finalScore,
      date: Date.now(),
      catUrl: customCatUrl || undefined,
      isVictory: false
    };

    const newHighScores = [...highScores, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    setHighScores(newHighScores);
    localStorage.setItem('beach-cat-scores-v2', JSON.stringify(newHighScores));

    localStorage.setItem('beach-cat-lives', MAX_LIVES.toString());

    setScore(prev => ({
      ...prev,
      current: finalScore,
      high: Math.max(prev.high, finalScore),
      lives: 0
    }));

    const msg = await getDeathMessage(finalScore);
    setDeathMsg(msg);
  }, [highScores, kittyName, customCatUrl]);

  const handleVictory = useCallback((finalScore: number) => {
    const newEntry: HighScoreEntry = {
      name: kittyName,
      score: finalScore,
      date: Date.now(),
      catUrl: customCatUrl || undefined,
      isVictory: true
    };

    const newHighScores = [...highScores, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    setHighScores(newHighScores);
    localStorage.setItem('beach-cat-scores-v2', JSON.stringify(newHighScores));

    // Reset lives to max for next run (victory = fresh start)
    localStorage.setItem('beach-cat-lives', MAX_LIVES.toString());
    setScore(prev => ({
      ...prev,
      current: finalScore,
      high: Math.max(prev.high, finalScore),
      lives: MAX_LIVES
    }));
  }, [highScores, kittyName, customCatUrl]);

  const startGame = (bossMode: boolean = false) => {
    const currentLives = score.lives <= 0 ? MAX_LIVES : score.lives;
    setStartAtBoss(bossMode);
    setStatus(GameStatus.PLAYING);
    setScore(prev => ({ 
      ...prev, 
      current: 0, 
      coins: bossMode ? BOSS_STARS_THRESHOLD : 0, 
      multiplier: 1, 
      streak: 0, 
      lives: currentLives
    }));
    localStorage.setItem('beach-cat-lives', currentLives.toString());
  };

  const handleStatusChange = (newStatus: GameStatus) => {
    if (newStatus === GameStatus.VICTORY) {
      handleVictory(score.current);
    }
    setStatus(newStatus);
  };

  const handleScoreUpdate = (updatedScore: GameScore) => {
    setScore(updatedScore);
    localStorage.setItem('beach-cat-lives', updatedScore.lives.toString());
  };

  const saveCustomLook = (name: string, url: string | null, updatedOutfits: Outfit[]) => {
    console.log('[Kitty Closet] Saving:', { name, url: url?.substring(0, 50), outfitsCount: updatedOutfits?.length });

    try {
      // Update React state first
      const safeName = name || kittyName || 'Beach Kitty';
      setKittyName(safeName);
      setCustomCatUrl(url);
      setOutfits(updatedOutfits || []);

      // Then persist to localStorage (wrapped in try-catch to prevent blocking)
      try {
        localStorage.setItem('beach-cat-name', safeName);
        if (url) {
          localStorage.setItem('beach-cat-look', url);
        } else {
          localStorage.removeItem('beach-cat-look');
        }
        localStorage.setItem('beach-cat-outfits', JSON.stringify(updatedOutfits || []));
      } catch (storageError) {
        console.warn('[Kitty Closet] localStorage save failed:', storageError);
        // Continue anyway - state is updated even if localStorage fails
      }
    } catch (error) {
      console.error('[Kitty Closet] Save error:', error);
    }

    // ALWAYS navigate back to level selection, even if save had issues
    setStatus(GameStatus.LEVEL_SELECTION);
  };

  useEffect(() => {
    if (status === GameStatus.LEVEL_SELECTION) fetchWisdom();
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

  const isBossMoment = status === GameStatus.BOSS_INTRO || status === GameStatus.BOSS_FIGHT;

  // Day/night cycle aligned with star collection progress (0 to 50 stars = dawn to sunset)
  const getSkyStyle = () => {
    if (status === GameStatus.LEVEL_SELECTION || status === GameStatus.CUSTOMIZE || isBossMoment) {
      return {};
    }

    // Progress based on stars collected, not score - sunset at 50 stars (boss trigger)
    const starProgress = Math.min(score.coins / BOSS_STARS_THRESHOLD, 1);
    let r, g, b;

    if (starProgress < 0.5) {
      // Bright blue (#7dd3fc) to golden hour (#fed7aa) - first 25 stars
      const t = starProgress * 2;
      r = Math.floor(125 + t * (254 - 125));
      g = Math.floor(211 + t * (215 - 211));
      b = Math.floor(252 + t * (170 - 252));
    } else {
      // Golden hour (#fed7aa) to sunset (#dc2626) - stars 25-50
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
      className={`relative w-full h-screen-safe flex flex-col items-center justify-center overflow-hidden font-sans transition-all duration-2000 ${
        isBossMoment ? 'bg-orange-300' : 
        status === GameStatus.LEVEL_SELECTION ? 'bg-amber-50' : 
        status === GameStatus.CUSTOMIZE ? 'bg-amber-100' : 
        'bg-sky-300'
      }`}
      style={getSkyStyle()}
    >
      
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {status !== GameStatus.LEVEL_SELECTION && status !== GameStatus.CUSTOMIZE && (
          <>
            {/* Animated Sun - moves and changes color based on star collection */}
            {(() => {
              // Sun position tied to star progress (0-50 stars = dawn to sunset)
              const starProgress = Math.min(score.coins / BOSS_STARS_THRESHOLD, 1);
              // Calculate sun position: left (0) -> center (0.5) -> right (1.0)
              const sunX = starProgress < 0.3
                ? 12 + (starProgress / 0.3) * 38 // 12% to 50% (rising)
                : starProgress < 0.6
                ? 50 // Center (noon)
                : 50 + ((starProgress - 0.6) / 0.4) * 38; // 50% to 88% (setting)

              // Calculate sun color
              const sunColor = starProgress < 0.3
                ? 'bg-yellow-400'
                : starProgress < 0.6
                ? 'bg-orange-400'
                : 'bg-red-500';

              // Calculate sun size (larger at sunset)
              const sunSize = starProgress < 0.6 ? 28 : 32 + (starProgress - 0.6) * 8;
              
              return (
                <div 
                  className={`absolute w-${Math.floor(sunSize)} h-${Math.floor(sunSize)} rounded-full shadow-[0_0_60px_rgba(250,204,21,0.7)] animate-pulse transition-all duration-1000 ${isBossMoment ? 'bg-red-500' : sunColor}`}
                  style={{ 
                    top: '12%',
                    left: `${sunX}%`,
                    width: `${sunSize * 4}px`,
                    height: `${sunSize * 4}px`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              );
            })()}
            {status !== GameStatus.LEVEL_SELECTION && status !== GameStatus.CUSTOMIZE && (
              <>
                <AnimatedWater isBossMoment={isBossMoment} />
                <div className="absolute bottom-0 w-full h-1/4 bg-amber-100 border-t-4 border-amber-200" />
              </>
            )}
          </>
        )}
      </div>

      {status === GameStatus.LEVEL_SELECTION && (
        <div className="z-10 w-full max-w-5xl px-4 md:px-12 animate-[fadeIn_0.5s_ease-out]">
          {/* Header */}
          <div className="flex justify-between items-end mb-6">
            <div className="flex flex-col">
              <h1 className="text-4xl font-black text-amber-900 uppercase italic tracking-tighter">Beach Kitty</h1>
              <span className="text-amber-700 font-bold uppercase tracking-widest text-sm">Welcome back, {kittyName}</span>
            </div>
            <div className="bg-white/80 px-4 py-2 rounded-2xl border-2 border-amber-200 shadow-sm flex items-center gap-2">
              <span className="text-amber-800 font-black text-xs uppercase tracking-widest">Lives:</span>
              <span className="text-2xl font-black text-amber-900">🐾 {score.lives > 0 ? score.lives : MAX_LIVES}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* LEFT: Character Card - Vertical layout matching Hall of Fame */}
          <div className="bg-white/90 p-8 rounded-[3rem] border-4 border-amber-300 shadow-2xl flex flex-col">
            {/* Kitty Name & Stats */}
            <div className="text-center mb-6">
              <h2 className="text-3xl font-black text-amber-900 uppercase italic tracking-tighter mb-3">{kittyName}</h2>
              <span className="inline-block bg-amber-200 text-amber-900 px-5 py-2 rounded-full text-sm font-black uppercase tracking-widest">
                {outfits.length} {outfits.length === 1 ? 'Outfit' : 'Outfits'}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mb-6">
              <button
                onClick={() => setStatus(GameStatus.CUSTOMIZE)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white p-4 rounded-2xl font-black text-lg uppercase shadow-lg shadow-amber-200 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <span className="text-2xl">👗</span>
                <span>Kitty Closet</span>
              </button>

              <button
                onClick={() => startGame(false)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-2xl font-black text-lg uppercase shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="text-xl">🏃</span>
                <span>Run!</span>
              </button>

              {/* Boss button hidden but preserved for testing - set to true to re-enable */}
              {false && (
                <button
                  onClick={() => startGame(true)}
                  className="w-full bg-red-500 hover:bg-red-600 text-white p-3 rounded-xl font-black text-sm uppercase shadow-md transition-transform active:scale-95"
                >
                  👹 BOSS
                </button>
              )}
            </div>

            {/* Large Kitty Hero Image - Bottom */}
            <div className="flex-grow flex items-center justify-center mt-auto">
              <div className="w-96 h-96 bg-gradient-to-br from-amber-50 to-amber-100 rounded-[2rem] border-4 border-amber-200 shadow-inner flex items-center justify-center overflow-hidden relative">
                {customCatUrl ? (
                  <img
                    src={customCatUrl}
                    alt={kittyName}
                    className="w-full h-full object-contain scale-110"
                    style={{ mixBlendMode: 'multiply' }}
                  />
                ) : (
                  <div className="text-9xl">🐾</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-amber-200/30 to-transparent pointer-events-none" />
              </div>
            </div>
          </div>

          {/* RIGHT: High Scores & Wisdom */}
          <div className="bg-white/90 p-8 rounded-[3rem] border-4 border-amber-300 shadow-2xl flex flex-col">
              
              <div className="mb-6">
                <h2 className="text-3xl font-black text-amber-600 uppercase italic tracking-widest">Hall of Fame</h2>
              </div>
              
              {highScores.length > 0 ? (
                <div className="flex flex-col gap-4 flex-grow">
                  {highScores.map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-amber-50 p-4 rounded-2xl border-2 border-amber-100 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <span className={`w-8 h-8 flex items-center justify-center rounded-full font-black text-white ${idx === 0 ? 'bg-yellow-500' : 'bg-slate-400'}`}>
                            {idx + 1}
                          </span>
                        </div>
                        {entry.catUrl ? (
                          <div className="w-12 h-12 rounded-full border-2 border-amber-200 bg-amber-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                            <img 
                              src={entry.catUrl} 
                              alt={entry.name}
                              className="w-full h-full object-contain scale-110"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full border-2 border-amber-200 bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl">🐾</span>
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-xl font-bold text-slate-700 leading-none flex items-center gap-2">
                            {entry.name}
                            {entry.isVictory && <span className="text-yellow-500" title="Boss Defeated!">🏆</span>}
                          </span>
                        </div>
                      </div>
                      <span className="text-3xl font-black text-amber-900 tabular-nums">{entry.score}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-slate-400 italic">
                  <span className="text-5xl mb-4">🏆</span>
                  <p>No legends recorded yet...</p>
                </div>
              )}

              <div className="mt-8 pt-6 border-t-4 border-amber-100 text-center">
                <p className="text-slate-500 font-bold italic text-lg leading-snug">"{wisdom}"</p>
                <span className="text-xs uppercase text-amber-800 font-black tracking-widest block mt-2">- {kittyName}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {status === GameStatus.CUSTOMIZE && (
        <CatCustomizer 
          currentUrl={customCatUrl}
          currentName={kittyName}
          savedOutfits={outfits}
          onSave={saveCustomLook}
          onCancel={() => setStatus(GameStatus.LEVEL_SELECTION)}
        />
      )}

      {(status === GameStatus.PLAYING || status === GameStatus.BOSS_INTRO || status === GameStatus.BOSS_FIGHT) && (
        <GameEngine
          initialLives={score.lives}
          levelId="BEACH"
          startAtBoss={startAtBoss}
          customCatUrl={customCatUrl}
          onGameOver={handleGameOver}
          onScoreUpdate={handleScoreUpdate}
          onStatusChange={handleStatusChange}
          onTelemetryReady={handleTelemetryReady}
        />
      )}

      {status === GameStatus.GAMEOVER && (
        <div className="z-10 bg-white p-10 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] text-center max-w-md border-4 border-red-400 animate-[bounceIn_0.5s_ease-out]">
          <h2 className="text-7xl font-black text-red-600 mb-4 drop-shadow-md italic">CRASH!</h2>
          <p className="text-slate-700 mb-6 text-xl font-bold px-4 leading-snug">
            {deathMsg}
          </p>
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
            onClick={() => startGame(false)} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 px-8 rounded-3xl text-3xl transform transition active:scale-95 shadow-[0_10px_0_rgb(30,58,138)] hover:shadow-[0_8px_0_rgb(30,58,138)] mb-6"
          >
            START NEW RUN
          </button>
          
          <button 
            onClick={() => setStatus(GameStatus.LEVEL_SELECTION)} 
            className="w-full text-slate-500 font-black text-lg uppercase tracking-widest hover:text-slate-800 transition py-2"
          >
            CAMPAIGN MENU
          </button>
        </div>
      )}

      {status === GameStatus.VICTORY && (
        <div className="z-10 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 p-12 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] text-center max-w-2xl border-4 border-yellow-400 animate-[bounceIn_0.5s_ease-out] relative overflow-hidden">
          {/* Confetti/Sparkle effects */}
          <div className="absolute inset-0 pointer-events-none">
            {victoryConfetti.map((particle) => (
              <div
                key={particle.id}
                className="absolute w-2 h-2 rounded-full animate-[confetti_3s_ease-out_infinite]"
                style={{
                  left: particle.left,
                  top: particle.top,
                  backgroundColor: particle.color,
                  animationDelay: particle.animationDelay
                }}
              />
            ))}
          </div>
          
          <h2 className="text-8xl font-black text-yellow-600 mb-6 drop-shadow-lg italic relative z-10 animate-[pulse_2s_ease-in-out_infinite]">
            VICTORY!
          </h2>
          
          {/* Large Kitty Display */}
          <div className="mb-8 relative z-10">
            <div className="w-64 h-64 mx-auto bg-white rounded-full border-8 border-yellow-400 shadow-2xl flex items-center justify-center overflow-hidden relative">
              {customCatUrl ? (
                <img 
                  src={customCatUrl} 
                  alt={kittyName}
                  className="w-full h-full object-contain scale-110" 
                  style={{ mixBlendMode: 'multiply' }}
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
          
          <div className="flex flex-col gap-4 relative z-10">
            <button
              onClick={() => setStatus(GameStatus.LEVEL_SELECTION)}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-black py-6 px-8 rounded-3xl text-3xl transform transition active:scale-95 shadow-[0_10px_0_rgb(217,119,6)] hover:shadow-[0_8px_0_rgb(217,119,6)]"
            >
              CONTINUE
            </button>
            
            <button 
              onClick={() => setStatus(GameStatus.LEVEL_SELECTION)} 
              className="w-full text-slate-500 font-black text-lg uppercase tracking-widest hover:text-slate-800 transition py-2"
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

      {(status === GameStatus.PLAYING || status === GameStatus.BOSS_INTRO || status === GameStatus.BOSS_FIGHT) && (
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
                <span className="text-xl">★</span>{score.coins}<span className="text-xs text-yellow-800/40">/{BOSS_STARS_THRESHOLD}</span>
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
