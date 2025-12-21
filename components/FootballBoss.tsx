
import React, { useEffect, useState } from 'react';

interface FootballBossProps {
  health: number;
  maxHealth: number;
}

const FootballBoss: React.FC<FootballBossProps> = ({ health, maxHealth }) => {
  const [isHit, setIsHit] = useState(false);
  const healthWidth = (health / maxHealth) * 100;

  useEffect(() => {
    if (health < maxHealth) {
      setIsHit(true);
      const timer = setTimeout(() => setIsHit(false), 100);
      return () => clearTimeout(timer);
    }
  }, [health, maxHealth]);

  return (
    <div className={`relative w-full h-full flex flex-col items-center transition-all duration-75 ${isHit ? 'brightness-125 scale-105' : ''}`}>
      {/* Health Bar */}
      <div className="absolute -top-16 w-full h-6 bg-slate-900/60 rounded-full overflow-hidden border-2 border-white shadow-2xl z-20">
        <div 
          className={`h-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 transition-all duration-300 ${isHit ? 'brightness-150' : ''}`}
          style={{ width: `${healthWidth}%` }}
        />
        <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
      </div>

      <svg viewBox="0 0 240 240" className="w-full h-full drop-shadow-[0_20px_35px_rgba(0,0,0,0.5)] overflow-visible">
        {/* Shadow */}
        <ellipse cx="120" cy="225" rx="80" ry="15" fill="black" opacity="0.2" />

        {/* Arms - Massive and Muscular */}
        <g className="animate-[bounce_2s_ease-in-out_infinite]">
          {/* Left Arm */}
          <path 
            d="M50 120 C 10 120 -10 180 20 210 C 40 230 70 200 80 180" 
            fill="#d19a7e" 
            stroke="#5c3a2a" 
            strokeWidth="3" 
          />
          {/* Right Arm */}
          <path 
            d="M190 120 C 230 120 250 180 220 210 C 200 230 170 200 160 180" 
            fill="#d19a7e" 
            stroke="#5c3a2a" 
            strokeWidth="3" 
          />
        </g>

        {/* Torso / Jersey */}
        <path 
          d="M60 100 L 180 100 L 190 200 Q 120 215 50 200 Z" 
          fill="#dc2626" 
          stroke="#7f1d1d" 
          strokeWidth="3" 
        />
        
        {/* Massive Shoulders / Pads */}
        <path d="M40 90 Q 30 70 80 75 Q 120 80 160 75 Q 210 70 200 90 L 190 120 L 50 120 Z" fill="#dc2626" stroke="#7f1d1d" strokeWidth="3" />
        
        {/* Jersey Stripes */}
        <path d="M45 105 L 195 105" stroke="white" strokeWidth="6" opacity="0.8" />
        <path d="M48 112 L 192 112" stroke="white" strokeWidth="3" opacity="0.6" />

        {/* Number 6 */}
        <g transform="translate(100, 135)">
          <text 
            x="20" 
            y="40" 
            fontSize="50" 
            fontFamily="Impact, sans-serif" 
            fontWeight="900" 
            textAnchor="middle" 
            fill="black"
            stroke="white"
            strokeWidth="2"
            className="italic"
          >
            6
          </text>
        </g>

        {/* Helmet */}
        <g transform="translate(120, 65)">
          {/* Main shell */}
          <circle r="45" fill="white" stroke="#1e293b" strokeWidth="3" />
          {/* Red Stripe */}
          <rect x="-8" y="-45" width="16" height="40" fill="#dc2626" />
          <rect x="-12" y="-45" width="2" height="40" fill="#dc2626" opacity="0.5" />
          <rect x="10" y="-45" width="2" height="40" fill="#dc2626" opacity="0.5" />
          
          {/* Face Mask */}
          <path d="M-35 10 Q -35 45 0 45 Q 35 45 35 10" fill="none" stroke="#1e293b" strokeWidth="4" />
          <path d="M-35 25 L 35 25" stroke="#1e293b" strokeWidth="3" />
          <path d="M-35 35 L 35 35" stroke="#1e293b" strokeWidth="3" />
          <path d="M-10 10 L -10 45" stroke="#1e293b" strokeWidth="3" />
          <path d="M10 10 L 10 45" stroke="#1e293b" strokeWidth="3" />
          
          {/* Angry Eyes inside helmet */}
          <g transform="translate(0, 5)">
            <path d="M-20 -5 Q -10 5 0 -5" fill="none" stroke="black" strokeWidth="4" />
            <path d="M20 -5 Q 10 5 0 -5" fill="none" stroke="black" strokeWidth="4" />
            <circle cx="-12" cy="5" r="3" fill="black" />
            <circle cx="12" cy="5" r="3" fill="black" />
          </g>
        </g>

        {/* Pants Base */}
        <path d="M70 200 L 170 200 L 160 230 Q 120 235 80 230 Z" fill="white" stroke="#1e293b" strokeWidth="2" />
      </svg>
    </div>
  );
};

export default FootballBoss;
