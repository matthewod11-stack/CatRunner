
import React, { memo } from 'react';
import { Obstacle } from '../types';

interface ObstacleComponentProps {
  obstacle: Obstacle;
  groundY: number;
}

// Memoized to prevent re-renders when props haven't changed
const ObstacleComponent: React.FC<ObstacleComponentProps> = memo(({ obstacle, groundY }) => {
  const renderIcon = () => {
    switch (obstacle.type) {
      case 'CRAB':
        return (
          <div className="w-full h-full anim-crab-sway">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            {/* Legs */}
            <g stroke="#ea580c" strokeWidth="6" strokeLinecap="round" fill="none">
              <path d="M25 75 Q 15 80 18 90" />
              <path d="M20 65 Q 10 65 10 75" />
              <path d="M22 55 Q 12 50 15 40" />
              <path d="M75 75 Q 85 80 82 90" />
              <path d="M80 65 Q 90 65 90 75" />
              <path d="M78 55 Q 88 50 85 40" />
            </g>
            {/* Eye Stalks */}
            <line x1="40" y1="50" x2="38" y2="35" stroke="#f97316" strokeWidth="4" />
            <line x1="60" y1="50" x2="62" y2="35" stroke="#f97316" strokeWidth="4" />
            {/* Pincers */}
            <g fill="#f97316" stroke="#ea580c" strokeWidth="1">
              <path d="M20 45 Q 5 45 5 25 Q 5 5 25 15 Q 15 25 25 35 Q 25 45 20 45 Z" />
              <path d="M80 45 Q 95 45 95 25 Q 95 5 75 15 Q 85 25 75 35 Q 75 45 80 45 Z" />
            </g>
            {/* Main Body */}
            <ellipse cx="50" cy="65" rx="35" ry="25" fill="#f97316" stroke="#ea580c" strokeWidth="1" />
            {/* Cheeks */}
            <circle cx="30" cy="72" r="6" fill="#fb923c" opacity="0.6" />
            <circle cx="70" cy="72" r="6" fill="#fb923c" opacity="0.6" />
            {/* Eyes */}
            <circle cx="38" cy="28" r="10" fill="white" />
            <circle cx="40" cy="26" r="6" fill="black" />
            <circle cx="42" cy="24" r="2" fill="white" />
            <circle cx="62" cy="28" r="10" fill="white" />
            <circle cx="60" cy="26" r="6" fill="black" />
            <circle cx="58" cy="24" r="2" fill="white" />
            {/* Smile */}
            <path d="M38 68 Q 50 82 62 68" fill="none" stroke="#9a3412" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
        );
      case 'BEACHBALL':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full animate-spin drop-shadow-lg">
            <circle cx="50" cy="50" r="48" fill="#2D1B5A" />
            <defs>
              <clipPath id="ballClip">
                <circle cx="50" cy="50" r="45" />
              </clipPath>
            </defs>
            <g clipPath="url(#ballClip)">
              <path d="M50 50 L 40 5 L 80 15 Z" fill="#FFD14D" />
              <path d="M50 50 L 80 15 L 100 55 Z" fill="#FFFFFF" />
              <path d="M50 50 L 100 55 L 75 95 Z" fill="#C7B8E8" />
              <path d="M50 50 L 75 95 L 30 95 Z" fill="#3B96FF" />
              <path d="M50 50 L 30 95 L 0 55 Z" fill="#FFFFFF" />
              <path d="M50 50 L 0 55 L 40 5 Z" fill="#F4446F" />
              <path d="M42 10 Q 75 45 42 90" fill="none" stroke="#2D1B5A" strokeWidth="4" opacity="0.3" />
              <path d="M10 55 Q 50 45 90 55" fill="none" stroke="#2D1B5A" strokeWidth="4" opacity="0.3" />
            </g>
            <circle cx="43" cy="43" r="10" fill="white" stroke="#2D1B5A" strokeWidth="4" />
            <ellipse cx="32" cy="32" rx="6" ry="3" fill="white" opacity="0.4" transform="rotate(-45, 32, 32)" />
            <circle cx="50" cy="50" r="46" fill="none" stroke="#2D1B5A" strokeWidth="4" />
          </svg>
        );
      case 'SEAGULL':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <g className="animate-bounce">
              {/* Legs */}
              <path d="M65 65 L 75 70 M 70 65 L 80 68" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
              <path d="M75 70 L 82 72 M 80 68 L 87 70" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
              {/* Tail */}
              <path d="M60 55 L 85 55 Q 90 55 90 60 L 70 65 Z" fill="white" stroke="#1e293b" strokeWidth="1" />
              <path d="M82 55 L 90 55 Q 90 58 90 60 L 85 58 Z" fill="#1e293b" />
              {/* Body */}
              <path d="M30 65 Q 45 75 70 65 Q 65 50 40 60 Z" fill="white" stroke="#1e293b" strokeWidth="1" />
              {/* Wing Back */}
              <g className="anim-wing-flap">
                <path d="M45 58 L 75 25 Q 85 20 80 35 L 55 60 Z" fill="white" stroke="#1e293b" strokeWidth="1" />
                <path d="M70 30 L 75 25 Q 85 20 80 35 L 75 35 Z" fill="#1e293b" />
              </g>
              {/* Head */}
              <circle cx="35" cy="62" r="12" fill="white" stroke="#1e293b" strokeWidth="1" />
              <circle cx="32" cy="60" r="1.5" fill="black" />
              {/* Beak */}
              <path d="M25 62 L 15 65 Q 10 68 15 70 L 25 68 Z" fill="#f97316" stroke="#c2410c" strokeWidth="1" />
              {/* Wing Front */}
              <g className={obstacle.isSwooping ? "anim-wing-flap-fast" : "anim-wing-flap"}>
                <path d="M40 62 L 10 55 Q 0 50 15 50 L 45 58 Z" fill="white" stroke="#1e293b" strokeWidth="1" />
                <path d="M20 52 L 10 55 Q 0 50 15 50 L 18 52 Z" fill="#1e293b" />
              </g>
              {/* Swooping indicator */}
              {obstacle.isSwooping && (
                <path d="M25 85 Q 50 90 75 85" stroke="#ef4444" strokeWidth="3" strokeDasharray="6 3" fill="none" opacity="0.8" className="animate-pulse" />
              )}
            </g>
          </svg>
        );
      case 'SANDCASTLE':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
            {/* Steps */}
            <path d="M40 85 L 60 85 L 62 92 L 38 92 Z" fill="#fb923c" />
            <path d="M42 88 L 58 88 L 60 92 L 40 92 Z" fill="#fdba74" />
            {/* Central Tower */}
            <path d="M38 85 L 35 45 Q 50 35 65 45 L 62 85 Z" fill="#fed7aa" />
            <path d="M40 40 L 40 32 L 45 32 L 45 35 L 50 35 L 50 32 L 55 32 L 55 35 L 60 35 L 60 32 L 60 40 Z" fill="#fdba74" />
            {/* Doorway */}
            <path d="M43 85 Q 43 55 50 55 Q 57 55 57 85 Z" fill="#fb923c" />
            {/* Windows */}
            <path d="M40 50 Q 40 42 44 42 Q 48 42 48 50 Z" fill="#fb923c" />
            <path d="M52 50 Q 52 42 56 42 Q 60 42 60 50 Z" fill="#fb923c" />
            {/* Left Tower */}
            <path d="M20 85 L 22 55 Q 30 48 38 55 L 40 85 Z" fill="#ffedd5" />
            <path d="M23 55 L 23 50 Q 30 45 37 50 L 37 55 Z" fill="#fed7aa" />
            <rect x="25" y="60" width="4" height="6" fill="#fb923c" />
            <rect x="25" y="70" width="4" height="6" fill="#fb923c" />
            {/* Right Tower */}
            <path d="M60 85 L 62 55 Q 70 48 78 55 L 80 85 Z" fill="#ffedd5" />
            <path d="M63 55 L 63 50 Q 70 45 77 50 L 77 55 Z" fill="#fed7aa" />
            <rect x="71" y="60" width="4" height="6" fill="#fb923c" />
            <rect x="71" y="70" width="4" height="6" fill="#fb923c" />
            {/* Front Walls */}
            <path d="M10 95 L 15 65 Q 25 60 35 65 L 40 95 Z" fill="#ffedd5" />
            <path d="M15 65 L 15 58 L 20 58 L 20 62 L 25 62 L 25 58 L 30 58 L 30 62 L 35 62 L 35 65 Z" fill="#fed7aa" />
            <path d="M60 95 L 65 65 Q 75 60 85 65 L 90 95 Z" fill="#ffedd5" />
            <path d="M65 65 L 65 58 L 70 58 L 70 62 L 75 62 L 75 58 L 80 58 L 80 62 L 85 62 L 85 65 Z" fill="#fed7aa" />
            {/* Flag */}
            <line x1="50" y1="20" x2="50" y2="35" stroke="#451a03" strokeWidth="2" />
            <g className="anim-flag-wave" style={{ transformOrigin: '50px 20px' }}>
              <path d="M50 20 L 65 25 L 50 30 Z" fill="#ef4444" stroke="#dc2626" strokeWidth="0.5" />
            </g>
          </svg>
        );
      case 'TIDEPOOL':
        return (
          <svg viewBox="0 0 100 40" className="w-full h-full drop-shadow-md">
            <defs>
              <radialGradient id="tidepoolGrad">
                <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.7" />
              </radialGradient>
            </defs>
            <ellipse cx="50" cy="20" rx="45" ry="15" fill="url(#tidepoolGrad)" opacity="0.85" />
            <ellipse cx="50" cy="20" rx="35" ry="12" fill="none" stroke="#bfdbfe" strokeWidth="1.5" opacity="0.6" className="anim-ripple" />
            <ellipse cx="50" cy="20" rx="40" ry="13" fill="none" stroke="#93c5fd" strokeWidth="1" opacity="0.4" className="anim-ripple2" />
            <circle cx="20" cy="15" r="4" fill="#cbd5e1" opacity="0.8" />
            <circle cx="80" cy="25" r="3.5" fill="#94a3b8" opacity="0.8" />
            <circle cx="35" cy="18" r="1" fill="white" opacity="0.5" className="anim-bubble" />
            <circle cx="65" cy="20" r="1.2" fill="white" opacity="0.5" className="anim-bubble" style={{ animationDelay: '1s' }} />
          </svg>
        );
      case 'COIN':
        return (
          <div className="w-full h-full anim-coin-float relative">
            <div className="absolute inset-0 rounded-full bg-yellow-400/30 blur-md animate-pulse" />
            <svg viewBox="0 0 100 100" className="relative z-10 drop-shadow-lg">
              <defs>
                <radialGradient id="coinGradient" cx="30%" cy="30%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="50%" stopColor="#facc15" />
                  <stop offset="100%" stopColor="#ca8a04" />
                </radialGradient>
              </defs>
              <circle cx="50" cy="50" r="40" fill="url(#coinGradient)" stroke="#a16207" strokeWidth="3" />
              <circle cx="50" cy="50" r="32" fill="none" stroke="#fef08a" strokeWidth="2" opacity="0.5" />
              <text x="50" y="62" fontSize="36" fontWeight="bold" textAnchor="middle" fill="#92400e">★</text>
              <circle cx="35" cy="35" r="4" fill="white" opacity="0.8" className="animate-pulse" />
            </svg>
          </div>
        );
      case 'SHELL':
        return (
          <div className="w-full h-full animate-bounce">
            <svg viewBox="0 0 100 100" className="drop-shadow-md">
              <defs>
                <linearGradient id="shellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fef3c7" />
                  <stop offset="50%" stopColor="#fde68a" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
              <ellipse cx="50" cy="55" rx="35" ry="40" fill="url(#shellGrad)" stroke="#d97706" strokeWidth="2" />
              <path d="M30 50 Q 50 35 70 50" fill="none" stroke="#f59e0b" strokeWidth="2" opacity="0.6" />
              <path d="M25 60 Q 50 45 75 60" fill="none" stroke="#f59e0b" strokeWidth="2" opacity="0.6" />
              <path d="M20 70 Q 50 55 80 70" fill="none" stroke="#f59e0b" strokeWidth="2" opacity="0.6" />
              <path d="M50 30 Q 60 40 55 50 Q 50 60 45 50 Q 40 40 50 30" fill="none" stroke="#d97706" strokeWidth="2" opacity="0.8" />
              <ellipse cx="45" cy="40" rx="12" ry="15" fill="white" opacity="0.3" />
              <circle cx="65" cy="35" r="3" fill="white" opacity="0.8" className="animate-pulse" />
            </svg>
          </div>
        );
      case 'SPEED':
        return (
          <div className="bg-blue-500 rounded-lg p-2 border-2 border-white shadow-lg animate-pulse h-full w-full flex items-center justify-center">
             <span className="text-white font-black text-2xl italic">S</span>
          </div>
        );
      case 'MAGNET':
        return (
          <div className="bg-yellow-500 rounded-lg p-2 border-2 border-white shadow-lg animate-pulse h-full w-full flex items-center justify-center">
             <span className="text-red-600 font-black text-2xl italic">U</span>
          </div>
        );
      case 'SUPER_SIZE':
        return (
          <div className="bg-purple-500 rounded-lg p-2 border-2 border-white shadow-lg animate-pulse h-full w-full flex items-center justify-center relative">
             <span className="text-white font-black text-2xl italic">S</span>
             <div className="absolute inset-0 bg-purple-300 rounded-lg animate-ping opacity-75" />
          </div>
        );
      case 'SAND_PROJECTILE':
        const rotation = obstacle.rotation || 0;
        return (
          <div className="w-full h-full relative" style={{ transform: `rotate(${rotation}deg)` }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute w-2 h-2 bg-amber-400/60 rounded-full blur-sm anim-trail-pulse" style={{ left: '10%', top: '20%' }} />
              <div className="absolute w-1.5 h-1.5 bg-amber-500/60 rounded-full blur-sm anim-trail-pulse" style={{ left: '15%', top: '30%', animationDelay: '0.1s' }} />
            </div>
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg anim-poop-spin">
              <path d="M50 10 C 60 10 70 20 70 35 C 70 50 85 50 85 70 C 85 90 15 90 15 70 C 15 50 30 50 30 35 C 30 20 40 10 50 10 Z" fill="#d97706" stroke="#92400e" strokeWidth="2.5" />
              <path d="M35 70 Q 50 60 65 70" fill="none" stroke="#92400e" strokeWidth="2" opacity="0.5" />
              <path d="M40 50 Q 50 40 60 50" fill="none" stroke="#92400e" strokeWidth="2" opacity="0.5" />
              <circle cx="20" cy="30" r="2.5" fill="#111" className="animate-pulse" />
              <circle cx="80" cy="40" r="2" fill="#111" className="animate-pulse" />
              <ellipse cx="40" cy="35" rx="8" ry="12" fill="#fb923c" opacity="0.3" />
            </svg>
          </div>
        );
      case 'PALM_TREE':
        return (
          <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-lg">
            <g className="anim-palm-sway">
              <path d="M45 110 Q 48 60 42 10 L 58 10 Q 52 60 55 110 Z" fill="#92400e" stroke="#451a03" strokeWidth="1" />
              {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                <path key={deg} d="M50 20 Q 80 0 110 30" fill="none" stroke="#166534" strokeWidth="12" strokeLinecap="round" transform={`rotate(${deg}, 50, 20)`} />
              ))}
            </g>
          </svg>
        );
      default:
        return null;
    }
  };

  const yPos = obstacle.y !== undefined ? obstacle.y : (obstacle.type === 'SEAGULL' || obstacle.type === 'REFEREE' ? 220 : groundY);

  if (obstacle.isCollected) return null;

  // Use transform for GPU-accelerated positioning instead of left/bottom
  return (
    <div
      className="absolute game-obstacle"
      style={{
        transform: `translate3d(${obstacle.x}px, ${-yPos}px, 0)`,
        width: `${obstacle.width}px`,
        height: `${obstacle.height}px`,
        bottom: 0,
        left: 0
      }}
    >
      {renderIcon()}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these specific props changed
  return prevProps.obstacle.x === nextProps.obstacle.x &&
         prevProps.obstacle.y === nextProps.obstacle.y &&
         prevProps.obstacle.isCollected === nextProps.obstacle.isCollected &&
         prevProps.obstacle.isSwooping === nextProps.obstacle.isSwooping &&
         prevProps.obstacle.rotation === nextProps.obstacle.rotation;
});

export default ObstacleComponent;
