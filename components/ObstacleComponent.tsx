
import React from 'react';
import { Obstacle } from '../types';

interface ObstacleComponentProps {
  obstacle: Obstacle;
  groundY: number;
}

const ObstacleComponent: React.FC<ObstacleComponentProps> = ({ obstacle, groundY }) => {
  const renderIcon = () => {
    switch (obstacle.type) {
      case 'CRAB':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            {/* Legs */}
            <g stroke="#ea580c" strokeWidth="6" strokeLinecap="round" fill="none">
              {/* Left legs */}
              <path d="M25 75 Q 15 80 18 90" />
              <path d="M20 65 Q 10 65 10 75" />
              <path d="M22 55 Q 12 50 15 40" />
              {/* Right legs */}
              <path d="M75 75 Q 85 80 82 90" />
              <path d="M80 65 Q 90 65 90 75" />
              <path d="M78 55 Q 88 50 85 40" />
            </g>

            {/* Eye Stalks */}
            <line x1="40" y1="50" x2="38" y2="35" stroke="#f97316" strokeWidth="4" />
            <line x1="60" y1="50" x2="62" y2="35" stroke="#f97316" strokeWidth="4" />

            {/* Pincers */}
            <g fill="#f97316" stroke="#ea580c" strokeWidth="1">
              {/* Left Pincer */}
              <path d="M20 45 Q 5 45 5 25 Q 5 5 25 15 Q 15 25 25 35 Q 25 45 20 45 Z" />
              {/* Right Pincer */}
              <path d="M80 45 Q 95 45 95 25 Q 95 5 75 15 Q 85 25 75 35 Q 75 45 80 45 Z" />
            </g>

            {/* Main Body */}
            <ellipse cx="50" cy="65" rx="35" ry="25" fill="#f97316" stroke="#ea580c" strokeWidth="1" />
            
            {/* Cheeks */}
            <circle cx="30" cy="72" r="6" fill="#fb923c" opacity="0.6" />
            <circle cx="70" cy="72" r="6" fill="#fb923c" opacity="0.6" />

            {/* Eyes */}
            <g>
              <circle cx="38" cy="28" r="10" fill="white" />
              <circle cx="40" cy="26" r="6" fill="black" />
              <circle cx="42" cy="24" r="2" fill="white" />
              
              <circle cx="62" cy="28" r="10" fill="white" />
              <circle cx="60" cy="26" r="6" fill="black" />
              <circle cx="58" cy="24" r="2" fill="white" />
            </g>

            {/* Smile */}
            <path d="M38 68 Q 50 82 62 68" fill="none" stroke="#9a3412" strokeWidth="3" strokeLinecap="round" />
          </svg>
        );
      case 'BEACHBALL':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full animate-spin drop-shadow-lg">
            {/* Base Circle with dark outline */}
            <circle cx="50" cy="50" r="48" fill="#2D1B5A" />
            
            {/* Colorful Segments */}
            <g>
              {/* Clipping path for segments to stay inside circle */}
              <defs>
                <clipPath id="ballClip">
                  <circle cx="50" cy="50" r="45" />
                </clipPath>
              </defs>
              
              <g clipPath="url(#ballClip)">
                {/* Yellow Segment */}
                <path d="M50 50 L 40 5 L 80 15 Z" fill="#FFD14D" />
                
                {/* White Segment Top Right */}
                <path d="M50 50 L 80 15 L 100 55 Z" fill="#FFFFFF" />
                
                {/* Lavender Segment */}
                <path d="M50 50 L 100 55 L 75 95 Z" fill="#C7B8E8" />
                
                {/* Blue Segment */}
                <path d="M50 50 L 75 95 L 30 95 Z" fill="#3B96FF" />
                
                {/* White Segment Bottom Left */}
                <path d="M50 50 L 30 95 L 0 55 Z" fill="#FFFFFF" />
                
                {/* Red Segment */}
                <path d="M50 50 L 0 55 L 40 5 Z" fill="#F4446F" />

                {/* Perspective lines (the curved seams) */}
                <path d="M42 10 Q 75 45 42 90" fill="none" stroke="#2D1B5A" strokeWidth="4" opacity="0.3" />
                <path d="M10 55 Q 50 45 90 55" fill="none" stroke="#2D1B5A" strokeWidth="4" opacity="0.3" />
              </g>
            </g>

            {/* Inner White Cap */}
            <circle cx="43" cy="43" r="10" fill="white" stroke="#2D1B5A" strokeWidth="4" />
            
            {/* Glossy Highlights */}
            <ellipse cx="32" cy="32" rx="6" ry="3" fill="white" opacity="0.4" transform="rotate(-45, 32, 32)" />
            <path d="M15 50 Q 20 65 30 70" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.2" />

            {/* Outer Border */}
            <circle cx="50" cy="50" r="46" fill="none" stroke="#2D1B5A" strokeWidth="4" />
          </svg>
        );
      case 'SEAGULL':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            {/* Body Group with subtle hover animation */}
            <g className="animate-[bounce_1.5s_ease-in-out_infinite]">
              {/* Legs */}
              <path d="M65 65 L 75 70 M 70 65 L 80 68" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
              <path d="M75 70 L 82 72 M 80 68 L 87 70" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
              
              {/* Tail with Black Tip */}
              <path d="M60 55 L 85 55 Q 90 55 90 60 L 70 65 Z" fill="white" stroke="#1e293b" strokeWidth="1" />
              <path d="M82 55 L 90 55 Q 90 58 90 60 L 85 58 Z" fill="#1e293b" />

              {/* Main Body */}
              <path d="M30 65 Q 45 75 70 65 Q 65 50 40 60 Z" fill="white" stroke="#1e293b" strokeWidth="1" />

              {/* Wing Back (Black Tip) */}
              <g>
                <path d="M45 58 L 75 25 Q 85 20 80 35 L 55 60 Z" fill="white" stroke="#1e293b" strokeWidth="1" />
                <path d="M70 30 L 75 25 Q 85 20 80 35 L 75 35 Z" fill="#1e293b" />
              </g>

              {/* Head */}
              <circle cx="35" cy="62" r="12" fill="white" stroke="#1e293b" strokeWidth="1" />
              
              {/* Eye */}
              <circle cx="32" cy="60" r="1.5" fill="black" />

              {/* Beak */}
              <path d="M25 62 L 15 65 Q 10 68 15 70 L 25 68 Z" fill="#f97316" stroke="#c2410c" strokeWidth="1" />
              
              {/* Wing Front (Black Tip) */}
              <g className="animate-[pulse_1s_ease-in-out_infinite]">
                <path d="M40 62 L 10 55 Q 0 50 15 50 L 45 58 Z" fill="white" stroke="#1e293b" strokeWidth="1" />
                <path d="M20 52 L 10 55 Q 0 50 15 50 L 18 52 Z" fill="#1e293b" />
              </g>

              {/* Swooping indicator */}
              {obstacle.isSwooping && (
                <path d="M30 80 Q 45 85 60 80" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 2" fill="none" opacity="0.6" />
              )}
            </g>
          </svg>
        );
      case 'SANDCASTLE':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            {/* Color Palette */}
            {/* Sand: #ffedd5 (extra light), #fed7aa (light), #fdba74 (mid), #fb923c (shade) */}
            
            {/* Steps / Foundation */}
            <path d="M40 85 L 60 85 L 62 92 L 38 92 Z" fill="#fb923c" />
            <path d="M42 88 L 58 88 L 60 92 L 40 92 Z" fill="#fdba74" />

            {/* Central Tower */}
            <path d="M38 85 L 35 45 Q 50 35 65 45 L 62 85 Z" fill="#fed7aa" />
            <path d="M40 40 L 40 32 L 45 32 L 45 35 L 50 35 L 50 32 L 55 32 L 55 35 L 60 35 L 60 32 L 60 40 Z" fill="#fdba74" />
            
            {/* Arched Doorway */}
            <path d="M43 85 Q 43 55 50 55 Q 57 55 57 85 Z" fill="#fb923c" />
            
            {/* Windows in Central Tower */}
            <path d="M40 50 Q 40 42 44 42 Q 48 42 48 50 Z" fill="#fb923c" />
            <path d="M52 50 Q 52 42 56 42 Q 60 42 60 50 Z" fill="#fb923c" />
            <path d="M46 48 Q 46 42 50 42 Q 54 42 54 48 Z" fill="#fb923c" />

            {/* Left Mid-Tower */}
            <path d="M20 85 L 22 55 Q 30 48 38 55 L 40 85 Z" fill="#ffedd5" />
            <path d="M23 55 L 23 50 Q 30 45 37 50 L 37 55 Z" fill="#fed7aa" />
            <rect x="25" y="60" width="4" height="6" fill="#fb923c" />
            <rect x="25" y="70" width="4" height="6" fill="#fb923c" />

            {/* Right Mid-Tower */}
            <path d="M60 85 L 62 55 Q 70 48 78 55 L 80 85 Z" fill="#ffedd5" />
            <path d="M63 55 L 63 50 Q 70 45 77 50 L 77 55 Z" fill="#fed7aa" />
            <rect x="71" y="60" width="4" height="6" fill="#fb923c" />
            <rect x="71" y="70" width="4" height="6" fill="#fb923c" />

            {/* Front Wide Left Wall */}
            <path d="M10 95 L 15 65 Q 25 60 35 65 L 40 95 Z" fill="#ffedd5" />
            <path d="M15 65 L 15 58 L 20 58 L 20 62 L 25 62 L 25 58 L 30 58 L 30 62 L 35 62 L 35 65 Z" fill="#fed7aa" />

            {/* Front Wide Right Wall */}
            <path d="M60 95 L 65 65 Q 75 60 85 65 L 90 95 Z" fill="#ffedd5" />
            <path d="M65 65 L 65 58 L 70 58 L 70 62 L 75 62 L 75 58 L 80 58 L 80 62 L 85 62 L 85 65 Z" fill="#fed7aa" />

            {/* Flag on top */}
            <line x1="50" y1="20" x2="50" y2="35" stroke="#451a03" strokeWidth="2" />
            <path d="M50 20 L 65 25 L 50 30 Z" fill="#ef4444" />

            {/* Sand Grain Details (Dots) */}
            <g fill="#fb923c" opacity="0.4">
              <circle cx="15" cy="85" r="1" />
              <circle cx="18" cy="88" r="0.8" />
              <circle cx="12" cy="82" r="0.5" />
              <circle cx="75" cy="85" r="1" />
              <circle cx="78" cy="82" r="0.8" />
              <circle cx="32" cy="70" r="0.6" />
              <circle cx="68" cy="70" r="0.6" />
            </g>
          </svg>
        );
      case 'FOOTBALL_PLAYER':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <rect x="30" y="50" width="40" height="40" rx="10" fill="#1e40af" />
            <circle cx="50" cy="40" r="20" fill="#f8fafc" stroke="#1e293b" strokeWidth="2" />
            <rect x="35" y="40" width="30" height="5" fill="#1e293b" />
            <path d="M25 60 Q 15 80 25 90" stroke="#1e40af" strokeWidth="8" fill="none" />
            <path d="M75 60 Q 85 80 75 90" stroke="#1e40af" strokeWidth="8" fill="none" />
          </svg>
        );
      case 'FLYING_FOOTBALL':
        return (
          <svg viewBox="0 0 100 60" className="w-full h-full animate-spin">
            <ellipse cx="50" cy="30" rx="45" ry="25" fill="#78350f" stroke="#451a03" strokeWidth="2" />
            <rect x="30" y="27" width="40" height="2" fill="white" />
            <rect x="35" y="22" width="2" height="12" fill="white" />
            <rect x="45" y="22" width="2" height="12" fill="white" />
            <rect x="55" y="22" width="2" height="12" fill="white" />
            <rect x="65" y="22" width="2" height="12" fill="white" />
          </svg>
        );
      case 'REFEREE':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <rect x="35" y="40" width="30" height="50" fill="white" />
            <rect x="35" y="40" width="5" height="50" fill="black" />
            <rect x="45" y="40" width="5" height="50" fill="black" />
            <rect x="55" y="40" width="5" height="50" fill="black" />
            <circle cx="50" cy="30" r="15" fill="#fecaca" />
            <rect x="45" y="15" width="10" height="5" fill="black" />
            <path d="M30 60 L 10 40" stroke="black" strokeWidth="6" />
            <path d="M70 60 L 90 40" stroke="black" strokeWidth="6" />
          </svg>
        );
      case 'WATER_COOLER':
        return (
          <svg viewBox="0 0 100 120" className="w-full h-full">
            <rect x="20" y="60" width="60" height="50" fill="#d1d5db" />
            <rect x="25" y="10" width="50" height="50" fill="#60a5fa" rx="5" />
            <rect x="45" y="75" width="10" height="15" fill="#1e3a8a" />
            <circle cx="50" cy="95" r="5" fill="#93c5fd" />
          </svg>
        );
      case 'TIDEPOOL':
        return (
            <svg viewBox="0 0 100 40" className="w-full h-full">
                <ellipse cx="50" cy="20" rx="45" ry="15" fill="#60a5fa" opacity="0.8" />
                <circle cx="20" cy="15" r="5" fill="#94a3b8" />
                <circle cx="80" cy="25" r="4" fill="#94a3b8" />
            </svg>
        );
      case 'COIN':
        return (
          <div className="w-full h-full animate-[bounce_1s_infinite]">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="#facc15" stroke="#a16207" strokeWidth="4" />
              <text x="50" y="65" fontSize="40" fontWeight="bold" textAnchor="middle" fill="#a16207">★</text>
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
      default:
        return null;
    }
  };

  const yPos = obstacle.y !== undefined ? obstacle.y : (obstacle.type === 'SEAGULL' || obstacle.type === 'REFEREE' ? 220 : groundY);

  if (obstacle.isCollected) return null;

  return (
    <div 
      className="absolute"
      style={{ 
        left: `${obstacle.x}px`, 
        bottom: `${yPos}px`,
        width: `${obstacle.width}px`,
        height: `${obstacle.height}px`
      }}
    >
      {renderIcon()}
    </div>
  );
};

export default ObstacleComponent;
