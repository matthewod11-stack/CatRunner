
import React, { memo } from 'react';
import { Obstacle } from '../types';
import { useLevelContext } from '../contexts/LevelContext';
import { BeachObstacleIcon, isBeachObstacleType } from '../levels';

interface ObstacleComponentProps {
  obstacle: Obstacle;
  groundY: number;
}

const ObstacleComponent: React.FC<ObstacleComponentProps> = memo(({ obstacle, groundY }) => {
  const { levelId } = useLevelContext();

  const renderIcon = () => {
    if (levelId === 'BEACH' && isBeachObstacleType(obstacle.type)) {
      return <BeachObstacleIcon obstacle={obstacle} />;
    }

    switch (obstacle.type) {
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
                <linearGradient id="shellPeach" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fef3c7" />
                  <stop offset="50%" stopColor="#fde68a" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
                <radialGradient id="shellInterior" cx="70%" cy="50%">
                  <stop offset="0%" stopColor="#fda4af" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#fb7185" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.5" />
                </radialGradient>
                <linearGradient id="shellBeige" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fef3c7" />
                  <stop offset="100%" stopColor="#fde68a" />
                </linearGradient>
              </defs>

              <path
                d="M25 75 Q 20 60 25 45 Q 30 30 40 25 Q 50 20 60 25 Q 70 30 75 40 Q 80 50 78 65 Q 75 80 65 85 Q 50 90 35 85 Q 25 80 25 75 Z"
                fill="url(#shellPeach)"
                stroke="#1e293b"
                strokeWidth="1.5"
              />

              <path
                d="M30 45 Q 28 38 32 32 Q 36 28 42 30 Q 38 35 35 40 Q 32 45 30 45 Z"
                fill="url(#shellBeige)"
                stroke="#1e293b"
                strokeWidth="1"
              />
              <path
                d="M35 40 Q 33 33 37 27 Q 41 23 47 25 Q 43 30 40 35 Q 37 40 35 40 Z"
                fill="#fef3c7"
                stroke="#1e293b"
                strokeWidth="1"
              />
              <path
                d="M40 35 Q 38 28 42 22 Q 46 18 52 20 Q 48 25 45 30 Q 42 35 40 35 Z"
                fill="url(#shellPeach)"
                stroke="#1e293b"
                strokeWidth="1"
              />

              <path
                d="M65 50 Q 72 48 78 55 Q 80 62 75 70 Q 70 75 65 72 Q 60 68 58 62 Q 60 55 65 50 Z"
                fill="url(#shellInterior)"
                stroke="#1e293b"
                strokeWidth="1.5"
              />

              <path
                d="M65 55 Q 70 53 74 58 Q 75 63 72 68 Q 68 71 65 68 Q 62 65 61 60 Q 62 57 65 55 Z"
                fill="#f43f5e"
                stroke="#1e293b"
                strokeWidth="1"
                opacity="0.8"
              />

              <path
                d="M30 50 Q 35 40 42 35 Q 50 32 58 38"
                fill="none"
                stroke="#d97706"
                strokeWidth="1"
                opacity="0.4"
              />
              <path
                d="M35 60 Q 40 50 47 45 Q 55 42 63 48"
                fill="none"
                stroke="#d97706"
                strokeWidth="1"
                opacity="0.4"
              />

              <path
                d="M40 70 Q 45 65 50 60 Q 55 55 60 60"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="0.8"
                opacity="0.3"
              />

              <ellipse cx="45" cy="50" rx="12" ry="18" fill="white" opacity="0.2" />
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
      default:
        return null;
    }
  };

  const yPos = obstacle.y !== undefined ? obstacle.y : obstacle.type === 'SEAGULL' ? 220 : groundY;

  if (obstacle.isCollected) return null;

  return (
    <div
      className="absolute game-obstacle"
      style={{
        transform: `translate3d(${obstacle.x}px, ${-yPos}px, 0)`,
        width: `${obstacle.width}px`,
        height: `${obstacle.height}px`,
        bottom: 0,
        left: 0,
      }}
    >
      {renderIcon()}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.obstacle.x === nextProps.obstacle.x &&
    prevProps.obstacle.y === nextProps.obstacle.y &&
    prevProps.obstacle.isCollected === nextProps.obstacle.isCollected &&
    prevProps.obstacle.isSwooping === nextProps.obstacle.isSwooping &&
    prevProps.obstacle.rotation === nextProps.obstacle.rotation
  );
});

export default ObstacleComponent;
