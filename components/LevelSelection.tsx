import React from 'react';
import type { LevelId } from '../types';
import { getLevelConfig, getPreviousLevelId, isLevelUnlocked } from '../levels';
import type { DefeatedBossesState } from '../services/levelProgress';

export interface LevelSelectionProps {
  levelOrder: LevelId[];
  defeatedBosses: DefeatedBossesState;
  selectedLevel: LevelId;
  onSelectLevel: (id: LevelId) => void;
  className?: string;
}

const LevelSelection: React.FC<LevelSelectionProps> = ({
  levelOrder,
  defeatedBosses,
  selectedLevel,
  onSelectLevel,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`} role="group" aria-label="Level selection">
      {levelOrder.length === 1 ? (
        <p className="text-xs text-amber-800/90 font-bold leading-snug -mt-0.5 mb-0.5">
          Season 1 is live. More shores are on the roadmap — beat the boss here first.
        </p>
      ) : null}
      <span id="level-select-label" className="text-[10px] uppercase font-black text-amber-800/70 tracking-widest">
        Choose level
      </span>
      <div className="grid grid-cols-1 gap-2">
        {levelOrder.map(id => {
          const cfg = getLevelConfig(id);
          const unlocked = isLevelUnlocked(defeatedBosses, id);
          const cleared = !!defeatedBosses[id];
          const selected = selectedLevel === id;
          const prevId = getPreviousLevelId(id);
          const prevName = prevId ? getLevelConfig(prevId).name : '';

          return (
            <button
              key={id}
              type="button"
              disabled={!unlocked}
              aria-disabled={!unlocked}
              aria-pressed={selected}
              aria-describedby="level-select-label"
              onClick={() => unlocked && onSelectLevel(id)}
              className={[
                'relative text-left rounded-2xl border-4 px-4 py-3 min-h-[52px] transition-all',
                selected
                  ? 'border-amber-500 bg-amber-50 shadow-md scale-[1.02]'
                  : 'border-amber-200 bg-white/90 hover:border-amber-300',
                !unlocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-[0.99]',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-black text-amber-900 uppercase italic tracking-tight text-sm">
                    {cfg.name}
                  </p>
                  <p className="text-xs text-amber-800/80 font-medium leading-snug mt-0.5">
                    {cfg.description}
                  </p>
                  {!unlocked && prevName && (
                    <p className="text-[11px] font-bold text-amber-800 mt-1 leading-snug">
                      <span className="uppercase tracking-wide text-amber-700">Locked</span> — defeat the boss on{' '}
                      <span className="font-black">{prevName}</span> to unlock.
                    </p>
                  )}
                  {unlocked && !cleared && (
                    <p className="text-[10px] uppercase font-black text-emerald-700 mt-1 tracking-wide">Unlocked</p>
                  )}
                  {unlocked && cleared && (
                    <p className="text-[10px] uppercase font-black text-amber-700 mt-1 tracking-wide">Boss cleared</p>
                  )}
                </div>
                {cleared && (
                  <span
                    className="shrink-0 text-lg leading-none"
                    title="Boss defeated"
                    aria-label="Boss defeated"
                  >
                    🏆
                  </span>
                )}
              </div>
              {!unlocked && (
                <div className="absolute inset-0 rounded-[0.85rem] bg-amber-100/40 pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LevelSelection;
