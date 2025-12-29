
import React, { memo, useState, useEffect } from 'react';
import { Obstacle } from '../types';

// Seagull images
import seagullNormal from '../assets/seagull-normal.png';
import seagullSwoop from '../assets/seagull-swoop.png';
import seagullPoop from '../assets/seagull-poop.png';

interface ObstacleComponentProps {
  obstacle: Obstacle;
  groundY: number;
}

// Helper component to process images and remove magenta/white backgrounds
const ProcessedSprite: React.FC<{ src: string; className?: string }> = ({ src, className }) => {
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;

      // Check if a pixel is "background-like" (white, light gray, or pink/magenta)
      const isBackground = (i: number) => {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const isLight = r > 230 && g > 230 && b > 230;
        const isPink = r > 180 && g < 150 && b > 100 && (r - g) > 50;
        return isLight || isPink;
      };

      // Flood fill from edges
      const visited = new Set<number>();
      const toRemove = new Set<number>();
      const queue: number[] = [];

      for (let x = 0; x < width; x++) {
        queue.push(x);
        queue.push((height - 1) * width + x);
      }
      for (let y = 0; y < height; y++) {
        queue.push(y * width);
        queue.push(y * width + (width - 1));
      }

      while (queue.length > 0) {
        const pixelIndex = queue.shift()!;
        if (visited.has(pixelIndex)) continue;
        if (pixelIndex < 0 || pixelIndex >= width * height) continue;
        visited.add(pixelIndex);
        const i = pixelIndex * 4;
        if (!isBackground(i)) continue;
        toRemove.add(pixelIndex);
        const x = pixelIndex % width;
        const y = Math.floor(pixelIndex / width);
        if (x > 0) queue.push(pixelIndex - 1);
        if (x < width - 1) queue.push(pixelIndex + 1);
        if (y > 0) queue.push(pixelIndex - width);
        if (y < height - 1) queue.push(pixelIndex + width);
      }

      for (const pixelIndex of toRemove) {
        data[pixelIndex * 4 + 3] = 0;
      }

      ctx.putImageData(imageData, 0, 0);
      setProcessedUrl(canvas.toDataURL());
    };
  }, [src]);

  if (!processedUrl) return <div className={className} />;
  return <img src={processedUrl} alt="" className={className} />;
};

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
        // Select image based on seagull type and swooping state
        const seagullImage = obstacle.seagullType === 'poop'
          ? seagullPoop
          : obstacle.isSwooping
            ? seagullSwoop
            : seagullNormal;

        return (
          <div className={`w-full h-full drop-shadow-md ${obstacle.isSwooping ? '' : 'animate-bounce'}`}>
            <ProcessedSprite
              src={seagullImage}
              className={`w-full h-full object-contain ${obstacle.isSwooping ? 'anim-wing-flap-fast' : ''}`}
            />
            {/* Swooping indicator */}
            {obstacle.isSwooping && (
              <svg viewBox="0 0 100 20" className="absolute bottom-0 left-0 w-full h-6">
                <path d="M10 10 Q 50 18 90 10" stroke="#ef4444" strokeWidth="3" strokeDasharray="6 3" fill="none" opacity="0.8" className="animate-pulse" />
              </svg>
            )}
          </div>
        );
      case 'SANDCASTLE':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
            <defs>
              <linearGradient id="sandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <linearGradient id="sandLight" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fde68a" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
              <linearGradient id="sandDark" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>
            
            {/* Sand mound base */}
            <path d="M5 95 Q 10 75 20 70 Q 30 65 40 68 Q 50 70 60 68 Q 70 65 80 70 Q 90 75 95 95 Z" fill="url(#sandGrad)" />
            <path d="M8 95 Q 12 78 22 73 Q 32 68 42 70 Q 52 72 58 70 Q 68 67 78 73 Q 88 78 92 95 Z" fill="url(#sandLight)" opacity="0.6" />
            
            {/* Pebbles scattered on ground */}
            <circle cx="8" cy="96" r="1.5" fill="#a8a29e" />
            <circle cx="15" cy="97" r="1" fill="#78716c" />
            <circle cx="22" cy="96" r="1.2" fill="#a8a29e" />
            <circle cx="78" cy="97" r="1.1" fill="#78716c" />
            <circle cx="85" cy="96" r="1.3" fill="#a8a29e" />
            <circle cx="92" cy="97" r="0.9" fill="#78716c" />
            <circle cx="12" cy="98" r="0.8" fill="#d6d3d1" />
            <circle cx="88" cy="98" r="1" fill="#d6d3d1" />
            
            {/* Blue shovel on left */}
            <g transform="translate(5, 75)">
              {/* Shovel handle */}
              <line x1="0" y1="0" x2="8" y2="-20" stroke="#1e40af" strokeWidth="2.5" strokeLinecap="round" />
              {/* Shovel scoop */}
              <path d="M-3 18 Q -3 12 2 12 Q 7 12 7 18 Q 7 22 2 22 Q -3 22 -3 18 Z" fill="#3b82f6" stroke="#1e40af" strokeWidth="1" />
              <path d="M-2 18 Q -2 13 2 13 Q 6 13 6 18 Q 6 21 2 21 Q -2 21 -2 18 Z" fill="#60a5fa" />
            </g>
            
            {/* Left side wall/rampart */}
            <path d="M15 95 L 18 72 Q 25 68 32 72 L 35 95 Z" fill="url(#sandLight)" />
            <path d="M16 72 L 16 68 L 20 66 L 24 68 L 28 66 L 32 68 L 32 72 Z" fill="url(#sandDark)" opacity="0.7" />
            
            {/* Right side wall/rampart */}
            <path d="M65 95 L 68 72 Q 75 68 82 72 L 85 95 Z" fill="url(#sandLight)" />
            <path d="M66 72 L 66 68 L 70 66 L 74 68 L 78 66 L 82 68 L 82 72 Z" fill="url(#sandDark)" opacity="0.7" />
            
            {/* Left Tower */}
            <path d="M25 95 L 28 50 Q 35 42 42 50 L 45 95 Z" fill="url(#sandLight)" />
            <path d="M26 50 L 26 42 L 30 40 L 34 42 L 38 40 L 42 42 L 42 50 Z" fill="url(#sandDark)" opacity="0.8" />
            {/* Left tower windows */}
            <rect x="29" y="60" width="3" height="4" fill="#d97706" rx="0.5" />
            <rect x="29" y="70" width="3" height="4" fill="#d97706" rx="0.5" />
            <rect x="36" y="60" width="3" height="4" fill="#d97706" rx="0.5" />
            <rect x="36" y="70" width="3" height="4" fill="#d97706" rx="0.5" />
            {/* Left tower flag - blue */}
            <line x1="35" y1="42" x2="35" y2="50" stroke="#1e293b" strokeWidth="1.5" />
            <g className="anim-flag-wave" style={{ transformOrigin: '35px 42px' }}>
              <path d="M35 42 L 42 45 L 35 48 Z" fill="#3b82f6" stroke="#1e40af" strokeWidth="0.5" />
            </g>
            
            {/* Central Keep */}
            <path d="M38 95 L 40 40 Q 50 30 60 40 L 62 95 Z" fill="url(#sandLight)" />
            <path d="M39 40 L 39 30 L 44 28 L 48 30 L 52 28 L 56 30 L 60 28 L 61 30 L 61 40 Z" fill="url(#sandDark)" opacity="0.8" />
            {/* Central doorway */}
            <path d="M45 95 Q 45 60 50 60 Q 55 60 55 95 Z" fill="#d97706" />
            <path d="M46 95 Q 46 62 50 62 Q 54 62 54 95 Z" fill="#92400e" />
            {/* Central windows */}
            <path d="M42 50 Q 42 46 45 46 Q 48 46 48 50 Z" fill="#d97706" />
            <path d="M52 50 Q 52 46 55 46 Q 58 46 58 50 Z" fill="#d97706" />
            
            {/* Right Tower */}
            <path d="M55 95 L 58 50 Q 65 42 72 50 L 75 95 Z" fill="url(#sandLight)" />
            <path d="M56 50 L 56 42 L 60 40 L 64 42 L 68 40 L 72 42 L 72 50 Z" fill="url(#sandDark)" opacity="0.8" />
            {/* Right tower windows */}
            <rect x="59" y="60" width="3" height="4" fill="#d97706" rx="0.5" />
            <rect x="59" y="70" width="3" height="4" fill="#d97706" rx="0.5" />
            <rect x="66" y="60" width="3" height="4" fill="#d97706" rx="0.5" />
            <rect x="66" y="70" width="3" height="4" fill="#d97706" rx="0.5" />
            {/* Right tower flag - red */}
            <line x1="65" y1="42" x2="65" y2="50" stroke="#1e293b" strokeWidth="1.5" />
            <g className="anim-flag-wave" style={{ transformOrigin: '65px 42px' }}>
              <path d="M65 42 L 72 45 L 65 48 Z" fill="#ef4444" stroke="#dc2626" strokeWidth="0.5" />
            </g>
            
            {/* Additional small turrets on central keep */}
            <path d="M42 40 L 43 35 Q 46 32 49 35 L 50 40 Z" fill="url(#sandDark)" opacity="0.6" />
            <path d="M50 40 L 51 35 Q 54 32 57 35 L 58 40 Z" fill="url(#sandDark)" opacity="0.6" />
            
            {/* Texture/shadow details on sand mound */}
            <ellipse cx="30" cy="85" rx="8" ry="3" fill="url(#sandDark)" opacity="0.3" />
            <ellipse cx="70" cy="85" rx="8" ry="3" fill="url(#sandDark)" opacity="0.3" />
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
                <linearGradient id="shellPeach" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fef3c7" />
                  <stop offset="50%" stopColor="#fde68a" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
                <linearGradient id="shellPink" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fce7f3" />
                  <stop offset="50%" stopColor="#f9a8d4" />
                  <stop offset="100%" stopColor="#f472b6" />
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
              
              {/* Main shell body - organic curved shape */}
              <path d="M25 75 Q 20 60 25 45 Q 30 30 40 25 Q 50 20 60 25 Q 70 30 75 40 Q 80 50 78 65 Q 75 80 65 85 Q 50 90 35 85 Q 25 80 25 75 Z" 
                    fill="url(#shellPeach)" 
                    stroke="#1e293b" 
                    strokeWidth="1.5" />
              
              {/* Spiral top section - layered folds */}
              <path d="M30 45 Q 28 38 32 32 Q 36 28 42 30 Q 38 35 35 40 Q 32 45 30 45 Z" 
                    fill="url(#shellBeige)" 
                    stroke="#1e293b" 
                    strokeWidth="1" />
              <path d="M35 40 Q 33 33 37 27 Q 41 23 47 25 Q 43 30 40 35 Q 37 40 35 40 Z" 
                    fill="#fef3c7" 
                    stroke="#1e293b" 
                    strokeWidth="1" />
              <path d="M40 35 Q 38 28 42 22 Q 46 18 52 20 Q 48 25 45 30 Q 42 35 40 35 Z" 
                    fill="url(#shellPeach)" 
                    stroke="#1e293b" 
                    strokeWidth="1" />
              
              {/* Flared opening on right - wide aperture */}
              <path d="M65 50 Q 72 48 78 55 Q 80 62 75 70 Q 70 75 65 72 Q 60 68 58 62 Q 60 55 65 50 Z" 
                    fill="url(#shellInterior)" 
                    stroke="#1e293b" 
                    strokeWidth="1.5" />
              
              {/* Inner depth of opening - darker gradient */}
              <path d="M65 55 Q 70 53 74 58 Q 75 63 72 68 Q 68 71 65 68 Q 62 65 61 60 Q 62 57 65 55 Z" 
                    fill="#f43f5e" 
                    stroke="#1e293b" 
                    strokeWidth="1" 
                    opacity="0.8" />
              
              {/* Spiral lines indicating shell structure */}
              <path d="M30 50 Q 35 40 42 35 Q 50 32 58 38" 
                    fill="none" 
                    stroke="#d97706" 
                    strokeWidth="1" 
                    opacity="0.4" />
              <path d="M35 60 Q 40 50 47 45 Q 55 42 63 48" 
                    fill="none" 
                    stroke="#d97706" 
                    strokeWidth="1" 
                    opacity="0.4" />
              
              {/* Additional texture lines on main body */}
              <path d="M40 70 Q 45 65 50 60 Q 55 55 60 60" 
                    fill="none" 
                    stroke="#f59e0b" 
                    strokeWidth="0.8" 
                    opacity="0.3" />
              
              {/* Highlight on main body */}
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
