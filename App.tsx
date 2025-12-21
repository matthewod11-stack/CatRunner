
import React, { useState, useEffect, useCallback } from 'react';
import { GameStatus, GameScore, LevelId, LevelDef, HighScoreEntry, Outfit } from './types';
import GameEngine from './components/GameEngine';
import CatCustomizer from './components/CatCustomizer';
import { getCatWisdom, getDeathMessage } from './services/geminiService';

const LEVELS: LevelDef[] = [
  { id: 'BEACH', name: 'Sunny Beach', unlocked: true, theme: 'bg-sky-400', requirement: 'Available' },
  { id: 'FOOTBALL', name: 'Football Field', unlocked: true, theme: 'bg-green-700', requirement: 'Touchdown Ready!' },
  { id: 'DUNGEON', name: 'Shadow Dungeon', unlocked: false, theme: 'bg-slate-800', requirement: 'Beat Football Boss' },
  { id: 'CITY', name: 'In the City', unlocked: false, theme: 'bg-indigo-900', requirement: 'Beat Dungeon Boss' },
];

const MAX_LIVES = 9;
const BOSS_STARS_THRESHOLD = 75;
const YARDS_GOAL = 100;

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.LEVEL_SELECTION);
  const [selectedLevel, setSelectedLevel] = useState<LevelId>('BEACH');
  const [unlockedLevels, setUnlockedLevels] = useState<LevelId[]>(['BEACH', 'FOOTBALL']);
  const [score, setScore] = useState<GameScore>({ current: 0, high: 0, coins: 0, multiplier: 1, streak: 0, lives: MAX_LIVES, yards: 0 });
  const [highScores, setHighScores] = useState<HighScoreEntry[]>([]);
  const [wisdom, setWisdom] = useState<string>("Ready to pounce?");
  const [deathMsg, setDeathMsg] = useState<string>("");
  const [startAtBoss, setStartAtBoss] = useState<boolean>(false);
  
  const [kittyName, setKittyName] = useState<string>("Beach Kitty");
  const [customCatUrl, setCustomCatUrl] = useState<string | null>(null);
  const [outfits, setOutfits] = useState<Outfit[]>([]);

  // Load persistence
  useEffect(() => {
    const savedScores = localStorage.getItem('beach-cat-scores-v2');
    if (savedScores) setHighScores(JSON.parse(savedScores));
    
    const savedUnlocks = localStorage.getItem('beach-cat-unlocks');
    if (savedUnlocks) setUnlockedLevels(JSON.parse(savedUnlocks));

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
      date: Date.now()
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
  }, [highScores, kittyName]);

  const startGame = (levelId: LevelId, bossMode: boolean = false) => {
    const currentLives = score.lives <= 0 ? MAX_LIVES : score.lives;
    setSelectedLevel(levelId);
    setStartAtBoss(bossMode);
    setStatus(GameStatus.PLAYING);
    setScore(prev => ({ 
      ...prev, 
      current: 0, 
      coins: bossMode ? BOSS_STARS_THRESHOLD : 0, 
      multiplier: 1, 
      streak: 0, 
      lives: currentLives,
      yards: 0
    }));
    localStorage.setItem('beach-cat-lives', currentLives.toString());
  };

  const handleStatusChange = (newStatus: GameStatus) => {
    if (status === GameStatus.BOSS_FIGHT && newStatus === GameStatus.PLAYING) {
      if (selectedLevel === 'FOOTBALL' && !unlockedLevels.includes('DUNGEON')) {
        const newUnlocks: LevelId[] = [...unlockedLevels, 'DUNGEON'];
        setUnlockedLevels(newUnlocks);
        localStorage.setItem('beach-cat-unlocks', JSON.stringify(newUnlocks));
      }
    }
    setStatus(newStatus);
  };

  const handleScoreUpdate = (updatedScore: GameScore) => {
    setScore(updatedScore);
    localStorage.setItem('beach-cat-lives', updatedScore.lives.toString());
  };

  const saveCustomLook = (name: string, url: string | null, updatedOutfits: Outfit[]) => {
    setKittyName(name);
    setCustomCatUrl(url);
    setOutfits(updatedOutfits);
    
    localStorage.setItem('beach-cat-name', name);
    if (url) localStorage.setItem('beach-cat-look', url);
    else localStorage.removeItem('beach-cat-look');
    localStorage.setItem('beach-cat-outfits', JSON.stringify(updatedOutfits));
    
    setStatus(GameStatus.LEVEL_SELECTION);
  };

  useEffect(() => {
    if (status === GameStatus.LEVEL_SELECTION) fetchWisdom();
  }, [status]);

  const isBossMoment = status === GameStatus.BOSS_INTRO || status === GameStatus.BOSS_FIGHT;

  return (
    <div className={`relative w-full h-screen flex flex-col items-center justify-center overflow-hidden font-sans transition-colors duration-1000 ${
      isBossMoment ? 'bg-orange-300' : 
      status === GameStatus.LEVEL_SELECTION ? 'bg-amber-50' : 
      status === GameStatus.CUSTOMIZE ? 'bg-amber-100' : 
      (selectedLevel === 'FOOTBALL' ? 'bg-[#0a051a]' : 'bg-sky-300')
    }`}>
      
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {status !== GameStatus.LEVEL_SELECTION && status !== GameStatus.CUSTOMIZE && (
          <>
            <div className={`absolute top-12 right-12 w-28 h-28 rounded-full shadow-[0_0_60px_rgba(250,204,21,0.7)] animate-pulse transition-colors ${isBossMoment ? 'bg-red-500' : 'bg-yellow-400'}`} />
            {selectedLevel === 'BEACH' && (
              <>
                <div className={`absolute bottom-0 w-full h-1/2 opacity-80 transition-all ${isBossMoment ? 'bg-gradient-to-t from-orange-800 to-orange-600' : 'bg-gradient-to-t from-blue-600 to-blue-400'}`} />
                <div className="absolute bottom-0 w-full h-1/4 bg-amber-100 border-t-4 border-amber-200" />
              </>
            )}
            {selectedLevel === 'FOOTBALL' && (
               <div className="absolute inset-0 w-full h-full">
                 {/* Night Sky with Stars */}
                 <div className="absolute inset-0 bg-gradient-to-b from-[#0a051a] via-[#1a0b35] to-[#2d1b5a]">
                    {[...Array(50)].map((_, i) => (
                      <div 
                        key={i} 
                        className="absolute bg-white rounded-full animate-pulse"
                        style={{ 
                          top: `${Math.random() * 60}%`, 
                          left: `${Math.random() * 100}%`,
                          width: `${Math.random() * 3}px`,
                          height: `${Math.random() * 3}px`,
                          opacity: Math.random() * 0.8,
                          animationDelay: `${Math.random() * 5}s`
                        }} 
                      />
                    ))}
                 </div>
                 
                 {/* Stadium Stands Shape */}
                 <svg className="absolute bottom-[25%] w-full h-[40%]" viewBox="0 0 1440 400" preserveAspectRatio="none">
                    <path d="M0 300 Q 720 150 1440 300 L 1440 400 L 0 400 Z" fill="#1e1b4b" opacity="0.8" />
                    <path d="M0 320 Q 720 180 1440 320 L 1440 400 L 0 400 Z" fill="#312e81" opacity="0.6" />
                    <path d="M0 350 Q 720 220 1440 350 L 1440 400 L 0 400 Z" fill="#4338ca" opacity="0.4" />
                 </svg>

                 {/* Dramatic Light Beams (Static) */}
                 <div className="absolute top-0 w-full h-full flex justify-around pointer-events-none opacity-20">
                    <div className="w-[40vw] h-full bg-gradient-to-b from-white to-transparent transform -skew-x-12 translate-x-[-10%]" />
                    <div className="w-[40vw] h-full bg-gradient-to-b from-white to-transparent transform skew-x-12 translate-x-[10%]" />
                 </div>
               </div>
            )}
          </>
        )}
      </div>

      {status === GameStatus.LEVEL_SELECTION && (
        <div className="z-10 w-full max-w-6xl px-12 grid grid-cols-1 md:grid-cols-2 gap-12 animate-[fadeIn_0.5s_ease-out]">
          
          {/* LEFT: Levels Selection */}
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-end mb-2">
                <div className="flex flex-col">
                  <h1 className="text-4xl font-black text-amber-900 uppercase italic tracking-tighter">Beach Cat Runner</h1>
                  <span className="text-amber-700 font-bold uppercase tracking-widest text-sm">Welcome back, {kittyName}</span>
                </div>
                <div className="flex gap-4">
                  <div className="bg-white/80 px-4 py-2 rounded-2xl border-2 border-amber-200 shadow-sm flex items-center gap-2">
                      <span className="text-amber-800 font-black text-xs uppercase tracking-widest">Lives:</span>
                      <span className="text-2xl font-black text-amber-900">🐾 {score.lives > 0 ? score.lives : MAX_LIVES}</span>
                  </div>
                </div>
            </div>
            
            <div className="flex flex-col gap-4">
              {LEVELS.map((level) => {
                const isUnlocked = unlockedLevels.includes(level.id);
                return (
                  <div 
                    key={level.id}
                    className={`group relative overflow-hidden rounded-3xl p-6 h-32 border-4 transition-all flex items-center justify-between
                      ${isUnlocked 
                        ? 'bg-white border-amber-200 shadow-xl' 
                        : 'bg-slate-200 border-slate-300 opacity-60 grayscale'}`}
                  >
                    <div 
                        onClick={() => isUnlocked && startGame(level.id, false)}
                        className="flex items-center gap-6 z-10 cursor-pointer flex-grow"
                    >
                      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-black ${level.theme}`}>
                        {level.id === 'BEACH' ? '🏖️' : level.id === 'DUNGEON' ? '🏰' : level.id === 'FOOTBALL' ? '🏈' : '🏙️'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-2xl font-black text-slate-800 uppercase leading-none">{level.name}</span>
                        <span className={`text-sm font-bold mt-1 ${isUnlocked ? 'text-amber-600' : 'text-slate-500'}`}>
                          {isUnlocked ? (level.id !== 'BEACH' && level.id !== 'FOOTBALL' ? 'TBD - COMING SOON' : 'PLAY NOW') : level.requirement}
                        </span>
                      </div>
                    </div>
                    
                    {isUnlocked && (
                      <div className="flex flex-col gap-2 z-20">
                          <button 
                            onClick={(e) => { e.stopPropagation(); startGame(level.id, false); }}
                            className="bg-amber-500 hover:bg-amber-600 text-white p-2 px-4 rounded-xl font-black text-xs uppercase shadow-md transition-transform active:scale-95"
                          >
                            RUN
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); startGame(level.id, true); }}
                            className="bg-red-500 hover:bg-red-600 text-white p-2 px-4 rounded-xl font-black text-xs uppercase shadow-md transition-transform active:scale-95"
                          >
                            BOSS
                          </button>
                      </div>
                    )}
                    
                    {!isUnlocked && (
                       <svg className="w-8 h-8 text-slate-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: High Scores & Wisdom */}
          <div className="flex flex-col gap-8">
            <div className="bg-white/90 p-8 rounded-[3rem] border-4 border-amber-300 shadow-2xl flex-grow flex flex-col">
              
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-black text-amber-600 uppercase italic tracking-widest">Hall of Fame</h2>
                <button 
                  onClick={() => setStatus(GameStatus.CUSTOMIZE)}
                  className="bg-pink-500 hover:bg-pink-600 text-white p-3 px-6 rounded-2xl font-black text-xs uppercase shadow-lg shadow-pink-100 transition-transform active:scale-95 flex items-center gap-2"
                >
                  <span>👗</span> Kitty Closet
                </button>
              </div>
              
              {highScores.length > 0 ? (
                <div className="flex flex-col gap-4 flex-grow">
                  {highScores.map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-amber-50 p-4 rounded-2xl border-2 border-amber-100 shadow-sm">
                      <div className="flex items-center gap-4">
                        <span className={`w-8 h-8 flex items-center justify-center rounded-full font-black text-white ${idx === 0 ? 'bg-yellow-500' : 'bg-slate-400'}`}>
                          {idx + 1}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-xl font-bold text-slate-700 leading-none">{entry.name}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-black">{new Date(entry.date).toLocaleDateString()}</span>
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
          levelId={selectedLevel}
          startAtBoss={startAtBoss}
          onGameOver={handleGameOver}
          onScoreUpdate={handleScoreUpdate}
          onStatusChange={handleStatusChange}
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
            onClick={() => startGame(selectedLevel, false)} 
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

      {(status === GameStatus.PLAYING || status === GameStatus.BOSS_INTRO || status === GameStatus.BOSS_FIGHT) && (
        <div className="absolute top-6 left-6 z-20 flex flex-col gap-4 pointer-events-none animate-[slideDown_0.3s_ease-out]">
          <div className="bg-white/90 backdrop-blur-md px-6 py-4 rounded-3xl border-2 border-white shadow-xl flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-black text-amber-800/60">{selectedLevel === 'FOOTBALL' ? 'YARDS' : 'SCORE'}</span>
              <span className="text-3xl font-black text-amber-900 tabular-nums leading-none">
                {selectedLevel === 'FOOTBALL' ? (score.yards || 0) : score.current}
                {selectedLevel === 'FOOTBALL' && <span className="text-xs ml-1">/{YARDS_GOAL}</span>}
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
            
            {selectedLevel !== 'FOOTBALL' && (
              <>
                <div className="w-px h-10 bg-amber-900/10" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-black text-yellow-800/60">Stars</span>
                  <span className="text-3xl font-black text-yellow-600 tabular-nums leading-none flex items-center gap-1">
                    <span className="text-xl">★</span>{score.coins}<span className="text-xs text-yellow-800/40">/{BOSS_STARS_THRESHOLD}</span>
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
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
