import React from 'react';
import type { BackgroundEntity } from '../../types';

export function BeachBackgroundEntityView({ b }: { b: BackgroundEntity }) {
  return (
    <>
      {b.type === 'BOAT' && (
        <div className="relative w-full h-full animate-[boatBob_3s_ease-in-out_infinite]">
          <svg viewBox="0 0 240 120" className="w-full h-full drop-shadow-lg">
            <path d="M10 80 L 230 80 L 210 110 Q 120 120 30 110 Z" fill="#dc2626" />
            <path d="M10 80 L 230 80 L 225 60 L 40 60 L 15 50 L 10 55 Z" fill="#ffffff" />
            {[...Array(6)].map((_, i) => (
              <circle key={i} cx={50 + i * 30} cy={70} r="3" fill="#1e293b" opacity="0.6" />
            ))}
            <rect x="50" y="40" width="160" height="20" fill="#ffffff" />
            <rect x="80" y="25" width="100" height="15" fill="#ffffff" />
            <rect x="100" y="5" width="15" height="25" fill="#dc2626" />
            <rect x="100" y="5" width="15" height="6" fill="#1e293b" />
            <rect x="140" y="5" width="15" height="25" fill="#dc2626" />
            <rect x="140" y="5" width="15" height="6" fill="#1e293b" />
            <line x1="50" y1="40" x2="210" y2="40" stroke="#94a3b8" strokeWidth="1" />
            <line x1="80" y1="25" x2="180" y2="25" stroke="#94a3b8" strokeWidth="1" />
          </svg>
          <div className="absolute bottom-[-15px] left-0 w-full h-6 bg-gradient-to-r from-transparent via-white/30 to-transparent blur-md animate-[wakeFlow_2s_ease-in-out_infinite]" />
          <div className="absolute bottom-[-10px] w-full h-4 bg-white/20 blur-sm rounded-full" />
          <style>{`
            @keyframes boatBob {
              0%, 100% { transform: translateY(0) rotate(-1deg); }
              50% { transform: translateY(-4px) rotate(1deg); }
            }
            @keyframes wakeFlow {
              0%, 100% { opacity: 0.3; transform: scaleX(1); }
              50% { opacity: 0.5; transform: scaleX(1.1); }
            }
          `}</style>
        </div>
      )}
      {b.type === 'SURFER' && (
        <div className="relative w-full h-full animate-[surferWave_2s_ease-in-out_infinite]">
          <svg viewBox="0 0 70 50" className="w-full h-full drop-shadow-md">
            <path d="M0 35 Q 17.5 25 35 30 T 70 30 L 70 50 L 0 50 Z" fill="#60a5fa" opacity="0.6" />
            <ellipse cx="35" cy="22" rx="8" ry="12" fill="#fbbf24" />
            <ellipse cx="35" cy="30" rx="20" ry="4" fill="#facc15" stroke="#eab308" strokeWidth="1" />
            <path d="M25 20 Q 20 15 18 18" stroke="#fbbf24" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M45 20 Q 50 15 52 18" stroke="#fbbf24" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="15" cy="32" r="2" fill="white" opacity="0.7" />
            <circle cx="55" cy="32" r="2.5" fill="white" opacity="0.7" />
          </svg>
          <style>{`
            @keyframes surferWave {
              0%, 100% { transform: translateY(0) rotate(-2deg); }
              50% { transform: translateY(-3px) rotate(2deg); }
            }
          `}</style>
        </div>
      )}
      {b.type === 'AIRPLANE' && (
        <div className="flex items-center relative overflow-visible">
          <div className="relative w-20 h-10">
            <svg viewBox="0 0 100 60" className="w-full h-full">
              <path d="M20 30 L 70 15 L 80 30 L 70 45 Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
              <path
                d="M10 30 Q 10 20 40 25 L 90 25 Q 95 25 95 30 Q 95 35 90 35 L 40 35 Q 10 40 10 30"
                fill="#cbd5e1"
                stroke="#475569"
                strokeWidth="2"
              />
              <path d="M80 25 L 95 10 L 95 25 Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
              <circle cx="5" cy="30" r="4" fill="#1e293b" />
              <ellipse cx="5" cy="30" rx="2" ry="20" fill="white" opacity="0.4" className="animate-[spin_0.1s_linear_infinite]" />
            </svg>
          </div>
          <div className="relative">
            <div className="w-10 h-0.5 bg-slate-400 opacity-60" />
            <div className="bg-white/95 backdrop-blur-sm border-4 border-red-500 px-6 py-2 rounded-2xl shadow-xl flex items-center h-12 animate-[bannerWave_1.5s_ease-in-out_infinite]">
              <span className="text-red-600 font-black text-sm uppercase tracking-widest whitespace-nowrap drop-shadow-sm">
                {b.bannerText}
              </span>
            </div>
          </div>
          <div className="absolute -left-4 top-1/2 w-8 h-1 bg-gradient-to-r from-transparent via-white/40 to-white/20 blur-sm opacity-50" />
          <style>{`
            @keyframes bannerWave {
              0%, 100% { transform: translateY(0) rotate(-1deg); }
              25% { transform: translateY(-2px) rotate(0deg); }
              50% { transform: translateY(0) rotate(1deg); }
              75% { transform: translateY(-1px) rotate(0deg); }
            }
          `}</style>
        </div>
      )}
      {b.type === 'CLOUD' && (
        <svg viewBox="0 0 100 60" className="w-full h-full opacity-70">
          <ellipse cx="30" cy="30" rx="25" ry="15" fill="white" opacity="0.9" />
          <ellipse cx="50" cy="25" rx="30" ry="18" fill="white" opacity="0.9" />
          <ellipse cx="70" cy="30" rx="25" ry="15" fill="white" opacity="0.9" />
          <ellipse cx="50" cy="35" rx="35" ry="12" fill="white" opacity="0.8" />
        </svg>
      )}
      {b.type === 'JETSKI' && (
        <div className="relative w-full h-full animate-[jetskiBob_2s_ease-in-out_infinite]">
          <svg viewBox="0 0 80 60" className="w-full h-full drop-shadow-lg" style={{ transform: 'scaleX(-1)' }}>
            <ellipse cx="40" cy="35" rx="30" ry="12" fill="#ef4444" stroke="#dc2626" strokeWidth="2" />
            <ellipse cx="40" cy="30" rx="25" ry="8" fill="#f87171" />
            <rect x="35" y="20" width="10" height="8" rx="2" fill="#1e293b" />
            <path d="M30 20 Q 25 15 20 18" stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M50 20 Q 55 15 60 18" stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="40" cy="22" r="6" fill="#fbbf24" />
            <ellipse cx="40" cy="28" rx="8" ry="10" fill="#3b82f6" />
            <path
              d="M10 40 Q 20 30 30 35 T 50 35 T 70 35"
              stroke="white"
              strokeWidth="2"
              fill="none"
              opacity="0.6"
              strokeLinecap="round"
            />
            <circle cx="15" cy="38" r="2" fill="white" opacity="0.7" />
            <circle cx="25" cy="36" r="1.5" fill="white" opacity="0.7" />
            <circle cx="55" cy="36" r="1.5" fill="white" opacity="0.7" />
            <circle cx="65" cy="38" r="2" fill="white" opacity="0.7" />
          </svg>
          <div className="absolute bottom-[-10px] right-0 w-16 h-4 bg-gradient-to-l from-white/40 via-white/20 to-transparent blur-sm rounded-full animate-[wakeSpray_1.5s_ease-in-out_infinite]" />
          <style>{`
            @keyframes jetskiBob {
              0%, 100% { transform: translateY(0) rotate(-1deg); }
              50% { transform: translateY(-3px) rotate(1deg); }
            }
            @keyframes wakeSpray {
              0%, 100% { opacity: 0.4; transform: scaleX(1); }
              50% { opacity: 0.6; transform: scaleX(1.2); }
            }
          `}</style>
        </div>
      )}
      {b.type === 'BOAT_SINKING' && (
        <div className="relative w-full h-full animate-[sinkingBob_2s_ease-in-out_infinite]">
          <svg viewBox="0 0 260 140" className="w-full h-full drop-shadow-lg" style={{ transform: 'rotate(18deg)' }}>
            <ellipse cx="130" cy="120" rx="120" ry="15" fill="#3b82f6" opacity="0.4" />
            <ellipse cx="130" cy="125" rx="100" ry="10" fill="#60a5fa" opacity="0.5" />
            <path d="M30 90 L 230 70 L 220 110 Q 130 130 50 115 Z" fill="#dc2626" opacity="0.9" />
            <path d="M40 85 L 220 65 L 215 55 Q 130 45 50 55 Z" fill="#ffffff" opacity="0.8" />
            <rect x="110" y="30" width="8" height="35" fill="#78350f" />
            <rect x="140" y="20" width="6" height="20" fill="#78350f" transform="rotate(25, 143, 30)" />
            <circle cx="120" cy="25" r="12" fill="#64748b" opacity="0.6" className="animate-[smokePuff_1.5s_ease-out_infinite]" />
            <circle
              cx="135"
              cy="15"
              r="8"
              fill="#94a3b8"
              opacity="0.5"
              className="animate-[smokePuff_2s_ease-out_infinite]"
              style={{ animationDelay: '0.3s' }}
            />
            <circle cx="60" cy="100" r="5" fill="white" opacity="0.7" className="animate-[splash_1s_ease-out_infinite]" />
            <circle
              cx="200"
              cy="90"
              r="4"
              fill="white"
              opacity="0.6"
              className="animate-[splash_1.2s_ease-out_infinite]"
              style={{ animationDelay: '0.2s' }}
            />
            <circle
              cx="90"
              cy="115"
              r="6"
              fill="white"
              opacity="0.5"
              className="animate-[splash_0.8s_ease-out_infinite]"
              style={{ animationDelay: '0.5s' }}
            />
          </svg>
          <style>{`
            @keyframes sinkingBob {
              0%, 100% { transform: translateY(0) rotate(18deg); }
              50% { transform: translateY(8px) rotate(22deg); }
            }
            @keyframes smokePuff {
              0% { transform: translateY(0) scale(1); opacity: 0.6; }
              100% { transform: translateY(-30px) scale(1.5); opacity: 0; }
            }
            @keyframes splash {
              0%, 100% { transform: translateY(0) scale(1); opacity: 0.7; }
              50% { transform: translateY(-8px) scale(1.3); opacity: 0.3; }
            }
          `}</style>
        </div>
      )}
      {b.type === 'AIRPLANE_FIRE' && (
        <div className="flex items-center relative overflow-visible animate-[planeDive_4s_linear_infinite]">
          <div className="relative w-24 h-12">
            <svg viewBox="0 0 120 70" className="w-full h-full">
              <path d="M25 35 L 80 18 L 95 35 L 80 52 Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
              <path
                d="M15 35 Q 15 25 50 30 L 105 30 Q 110 30 110 35 Q 110 40 105 40 L 50 40 Q 15 45 15 35"
                fill="#cbd5e1"
                stroke="#475569"
                strokeWidth="2"
              />
              <path d="M90 30 L 108 15 L 108 30 Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
              <path d="M50 25 L 85 10 L 88 18 L 55 30 Z" fill="#1e293b" opacity="0.4" />
              <ellipse cx="70" cy="15" rx="8" ry="12" fill="#f97316" opacity="0.9" className="animate-[flicker_0.15s_ease-in-out_infinite]" />
              <ellipse cx="68" cy="12" rx="5" ry="8" fill="#fbbf24" opacity="0.9" className="animate-[flicker_0.1s_ease-in-out_infinite]" />
              <ellipse cx="75" cy="18" rx="6" ry="10" fill="#ef4444" opacity="0.8" className="animate-[flicker_0.12s_ease-in-out_infinite]" />
              <circle cx="8" cy="35" r="5" fill="#1e293b" />
              <ellipse cx="8" cy="35" rx="3" ry="22" fill="white" opacity="0.4" className="animate-[spin_0.08s_linear_infinite]" />
            </svg>
          </div>
          <div className="absolute -right-20 top-0 flex gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-600/60 blur-md animate-[smokeTrail_0.5s_ease-out_infinite]" />
            <div
              className="w-10 h-10 rounded-full bg-slate-500/50 blur-lg animate-[smokeTrail_0.6s_ease-out_infinite]"
              style={{ animationDelay: '0.1s' }}
            />
            <div
              className="w-12 h-12 rounded-full bg-slate-400/40 blur-xl animate-[smokeTrail_0.7s_ease-out_infinite]"
              style={{ animationDelay: '0.2s' }}
            />
          </div>
          <div className="absolute -right-10 top-1/4 flex gap-1">
            <div className="w-4 h-6 rounded-full bg-orange-500/70 blur-sm animate-[flicker_0.15s_ease-in-out_infinite]" />
            <div className="w-3 h-5 rounded-full bg-yellow-400/60 blur-sm animate-[flicker_0.1s_ease-in-out_infinite]" />
          </div>
          {b.bannerText && (
            <div className="relative ml-2">
              <div className="w-6 h-0.5 bg-slate-400 opacity-40" />
              <div
                className="bg-white/80 border-2 border-red-600 px-3 py-1 rounded-lg shadow-md animate-[bannerWobble_0.3s_ease-in-out_infinite]"
                style={{ transform: 'rotate(-5deg)' }}
              >
                <span className="text-red-600 font-black text-xs uppercase">{b.bannerText}</span>
              </div>
            </div>
          )}
          <style>{`
            @keyframes planeDive {
              0% { transform: rotate(-8deg); }
              50% { transform: rotate(-12deg); }
              100% { transform: rotate(-8deg); }
            }
            @keyframes flicker {
              0%, 100% { transform: scale(1); opacity: 0.9; }
              50% { transform: scale(1.15); opacity: 0.7; }
            }
            @keyframes smokeTrail {
              0% { transform: translateX(0) scale(1); opacity: 0.6; }
              100% { transform: translateX(-40px) scale(1.5); opacity: 0; }
            }
            @keyframes bannerWobble {
              0%, 100% { transform: rotate(-5deg) translateY(0); }
              50% { transform: rotate(-8deg) translateY(2px); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
