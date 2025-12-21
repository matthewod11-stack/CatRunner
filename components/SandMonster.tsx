
import React, { useEffect, useState } from 'react';

interface SandMonsterProps {
  health: number;
  maxHealth: number;
  isIntro?: boolean;
}

const SandMonster: React.FC<SandMonsterProps> = ({ health, maxHealth, isIntro = false }) => {
  const [isHit, setIsHit] = useState(false);
  const healthWidth = (health / maxHealth) * 100;

  // Flash when health changes
  useEffect(() => {
    if (health < maxHealth) {
      setIsHit(true);
      const timer = setTimeout(() => setIsHit(false), 100);
      return () => clearTimeout(timer);
    }
  }, [health, maxHealth]);

  return (
    <div className={`relative w-full h-full flex flex-col items-center transition-all duration-75 ${isHit ? 'brightness-150 scale-105' : ''}`}>
      {/* Health Bar - Hidden during intro */}
      {!isIntro && (
        <div className="absolute -top-16 w-full h-5 bg-amber-950/40 rounded-full overflow-hidden border-2 border-white shadow-xl z-20">
          <div 
            className={`h-full bg-gradient-to-r from-red-500 via-orange-400 to-yellow-300 transition-all duration-300 ${isHit ? 'brightness-200' : ''}`}
            style={{ width: `${healthWidth}%` }}
          />
          <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
        </div>
      )}

      <svg viewBox="0 0 240 240" className="w-full h-full drop-shadow-2xl overflow-visible translate-y-4">
        {/* Background Sand Mound Base */}
        <path 
          d="M20 220 Q 120 180 220 220 L 210 235 Q 120 210 30 235 Z" 
          fill={isHit ? "#ef4444" : "#c4a484"} 
          opacity="0.6"
        />

        {/* Arms - Bulky and Dripping */}
        <g className="animate-[bounce_3s_ease-in-out_infinite]">
          {/* Left Large Claw/Arm */}
          <g>
            <path 
              d="M60 160 C 20 160 10 120 15 90 C 18 60 45 65 55 85 C 65 105 75 140 80 160" 
              fill={isHit ? "#f87171" : "#d97706"} 
              stroke="#92400e" 
              strokeWidth="2"
            />
          </g>

          {/* Right Large Claw/Arm */}
          <g>
            <path 
              d="M180 160 C 220 160 230 120 225 90 C 222 60 195 65 185 85 C 175 105 165 140 160 160" 
              fill={isHit ? "#f87171" : "#d97706"} 
              stroke="#92400e" 
              strokeWidth="2"
            />
          </g>
        </g>

        {/* Lumpy Body Shape */}
        <path 
          d="M50 210 Q 60 130 120 70 Q 180 130 190 210 Q 120 230 50 210" 
          fill={isHit ? "#ef4444" : "#d97706"} 
          stroke="#92400e" 
          strokeWidth="3"
        />

        {/* Eyes */}
        <g transform="translate(120, 125)">
          <circle cx="-25" cy="-5" r="22" fill={isHit ? "#fee2e2" : "white"} stroke="#451a03" strokeWidth="3" />
          <circle cx="25" cy="-5" r="22" fill={isHit ? "#fee2e2" : "white"} stroke="#451a03" strokeWidth="3" />
          <circle cx="-18" cy="-5" r="6" fill={isHit ? "#991b1b" : "#1e293b"} />
          <circle cx="18" cy="-5" r="6" fill={isHit ? "#991b1b" : "#1e293b"} />
        </g>

        {/* Mischievous Grin */}
        <path d="M85 155 Q 120 185 155 155" fill="none" stroke="#451a03" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
  );
};

export default SandMonster;
