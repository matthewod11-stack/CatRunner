import React, { useMemo } from 'react';
import type { LevelId, CampaignLevelMeta, HighScoreEntry, LevelResult } from '../types';
import { CAMPAIGN_LEVEL_META, LEVEL_ORDER, isLevelUnlocked } from '../levels';
import { LEVEL_REGISTRY } from '../levels';
import type { DefeatedBossesState } from '../services/levelProgress';
import { loadLevelResult } from '../services/levelCompletion';

/** Emoji icon per level id — placeholder until real art exists */
const LEVEL_EMOJI: Record<LevelId, string> = {
  BEACH: '🏖️',
  ROOFTOPS: '🏙️',
  KITCHEN: '🍳',
  SPACE: '🚀',
  YARN: '🧶',
  STREET: '🚗',
  GARDEN_WHACK: '🌻',
  GARDEN_SNAKE: '🐍',
  CAT_TREE: '🌳',
};

export interface CampaignScreenProps {
  defeatedBosses: DefeatedBossesState;
  selectedLevel: LevelId;
  onSelectLevel: (id: LevelId) => void;
  onPlay: () => void;
  onOpenCloset: () => void;
  highScores: HighScoreEntry[];
  kittyName: string;
  wisdom: string;
  lives: number;
}

const CampaignScreen: React.FC<CampaignScreenProps> = ({
  defeatedBosses,
  selectedLevel,
  onSelectLevel,
  onPlay,
  onOpenCloset,
  highScores,
  kittyName,
  wisdom,
  lives,
}) => {
  const levelResults = useMemo(() => {
    const results: Partial<Record<LevelId, LevelResult>> = {};
    for (const meta of CAMPAIGN_LEVEL_META) {
      const r = loadLevelResult(meta.id);
      if (r) results[meta.id] = r;
    }
    return results;
  }, [defeatedBosses]); // re-read when completion state changes

  const completedCount = CAMPAIGN_LEVEL_META.filter(m => !!defeatedBosses[m.id]).length;
  const totalStars = (Object.values(levelResults) as (LevelResult | undefined)[]).reduce<number>((sum, r) => sum + (r?.stars ?? 0), 0);

  const selectedMeta = CAMPAIGN_LEVEL_META.find(m => m.id === selectedLevel);

  return (
    <div className="w-full max-w-5xl px-4 md:px-12 animate-[fadeIn_0.5s_ease-out]">
      {/* HEADER */}
      <header className="mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-800/80">Nine Lives Campaign</p>
            <h1 className="text-4xl md:text-5xl font-black text-amber-900 uppercase italic tracking-tighter leading-tight">
              Beach Kitty
            </h1>
            <span className="text-amber-700 font-bold uppercase tracking-widest text-sm mt-1">
              Playing as <span className="text-amber-900">{kittyName}</span>
            </span>
          </div>
        </div>
        {wisdom && (
          <p className="text-slate-500 font-bold italic text-sm leading-snug mt-3">
            &ldquo;{wisdom}&rdquo; <span className="text-xs not-italic uppercase text-amber-800 font-black tracking-widest">— {kittyName}</span>
          </p>
        )}
      </header>

      {/* GRID + SIDEBAR */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-6 md:gap-8">
        {/* MAIN: 3×3 Level Grid */}
        <div>
          <div className="grid grid-cols-3 gap-3" role="group" aria-label="Level selection">
            {CAMPAIGN_LEVEL_META.map(meta => {
              const isImplemented = !!LEVEL_REGISTRY[meta.id];
              const unlocked = isImplemented && isLevelUnlocked(defeatedBosses, meta.id);
              const cleared = !!defeatedBosses[meta.id];
              const selected = selectedLevel === meta.id;
              const playable = unlocked && isImplemented;

              return (
                <button
                  key={meta.id}
                  type="button"
                  disabled={!playable}
                  aria-disabled={!playable}
                  aria-pressed={selected}
                  onClick={() => playable && onSelectLevel(meta.id)}
                  className={[
                    'relative text-center rounded-2xl border-3 p-3 min-h-[100px] transition-all flex flex-col items-center justify-center gap-1',
                    selected && playable
                      ? 'border-amber-500 bg-amber-50 shadow-lg scale-[1.04] ring-2 ring-amber-300'
                      : cleared
                        ? 'border-emerald-300 bg-white/90 hover:border-emerald-400'
                        : playable
                          ? 'border-amber-200 bg-white/90 hover:border-amber-400'
                          : 'border-slate-200 bg-slate-50/80',
                    !playable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.97]',
                  ].join(' ')}
                >
                  <span className="text-2xl" aria-hidden>{playable ? LEVEL_EMOJI[meta.id] : '🔒'}</span>
                  <span className="font-black text-[11px] uppercase tracking-tight text-amber-900 leading-tight">
                    {meta.name}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600/70">
                    {meta.genre}
                  </span>
                  {playable ? (
                    <span className="text-xs text-amber-500 leading-none mt-0.5">
                      {(() => {
                        const result = levelResults[meta.id];
                        const stars = result?.stars ?? 0;
                        return '★'.repeat(stars) + '☆'.repeat(3 - stars);
                      })()}
                    </span>
                  ) : !isImplemented ? (
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider mt-0.5">
                      Coming Soon
                    </span>
                  ) : (
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider mt-0.5">
                      Locked
                    </span>
                  )}
                  {cleared && (
                    <span className="absolute top-1 right-1.5 text-sm" title="Completed" aria-label="Completed">🏆</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Play Button */}
          {selectedMeta && (
            <button
              type="button"
              onClick={onPlay}
              className="w-full mt-4 min-h-[48px] bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-2xl font-black text-lg uppercase shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
              aria-label={`Start run on ${selectedMeta.name}`}
            >
              <span className="text-xl" aria-hidden>▶</span>
              <span>Play — {selectedMeta.name}</span>
            </button>
          )}

          {/* Footer Progress */}
          <div className="flex items-center justify-between mt-3 px-1">
            <span className="text-[10px] font-black uppercase text-amber-700/60 tracking-widest">
              {completedCount}/9 complete
            </span>
            <span className="text-[10px] font-black uppercase text-amber-700/60 tracking-widest">
              🐾 {lives} lives
            </span>
            <span className="text-[10px] font-black uppercase text-amber-700/60 tracking-widest">
              {totalStars}/27 ★
            </span>
          </div>
        </div>

        {/* SIDEBAR */}
        <aside className="flex flex-col gap-4">
          {/* Kitty Closet */}
          <button
            type="button"
            onClick={onOpenCloset}
            className="w-full min-h-[44px] bg-amber-500 hover:bg-amber-600 text-white p-3 rounded-2xl font-black text-sm uppercase shadow-md shadow-amber-200 transition-all active:scale-95 flex items-center justify-center gap-2"
            aria-label="Open Kitty Closet to customize your cat"
          >
            <span className="text-lg" aria-hidden>👗</span>
            <span>Kitty Closet</span>
          </button>

          {/* Mini Hall of Fame */}
          <section
            className="bg-white/90 p-4 rounded-2xl border-2 border-amber-200 shadow-sm flex flex-col"
            aria-labelledby="hof-sidebar-heading"
          >
            <h3 id="hof-sidebar-heading" className="text-sm font-black text-amber-600 uppercase italic tracking-widest mb-2">
              Hall of Fame
            </h3>
            {highScores.length > 0 ? (
              <ul className="flex flex-col gap-2 list-none p-0 m-0" role="list">
                {highScores.slice(0, 3).map((entry, idx) => (
                  <li
                    key={`${entry.date}-${idx}`}
                    className="flex items-center justify-between bg-amber-50 px-3 py-2 rounded-xl border border-amber-100 gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full font-black text-white text-[10px] ${idx === 0 ? 'bg-yellow-500' : 'bg-slate-400'}`}
                        aria-hidden
                      >
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-700 truncate flex items-center gap-1">
                        {entry.name}
                        {entry.isVictory && <span className="text-yellow-500 text-[10px]">🏆</span>}
                      </span>
                    </div>
                    <span className="text-sm font-black text-amber-900 tabular-nums shrink-0">{entry.score}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-2">No runs yet</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
};

export default CampaignScreen;

// Re-export type for App.tsx backwards compat
export type { DefeatedBossesState };
