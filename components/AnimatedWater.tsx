
import React from 'react';

interface AnimatedWaterProps {
  isBossMoment?: boolean;
}

const AnimatedWater: React.FC<AnimatedWaterProps> = ({ isBossMoment = false }) => {
  return (
    <div className={`absolute bottom-0 w-full h-1/2 overflow-hidden ${isBossMoment ? 'opacity-90' : 'opacity-80'}`}>
      {/* Base water gradient */}
      <div className={`absolute inset-0 ${isBossMoment ? 'bg-gradient-to-t from-orange-800 to-orange-600' : 'bg-gradient-to-t from-blue-600 to-blue-400'}`} />
      
      {/* Wave Layer 1 - Slow moving large waves */}
      <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 400" preserveAspectRatio="none">
        <defs>
          <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isBossMoment ? "#ea580c" : "#60a5fa"} stopOpacity="0.6" />
            <stop offset="100%" stopColor={isBossMoment ? "#dc2626" : "#3b82f6"} stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <path
          d="M0,300 Q360,250 720,280 T1440,300 L1440,400 L0,400 Z"
          fill="url(#waveGrad1)"
          className="animate-[wave1_8s_ease-in-out_infinite]"
          style={{
            transformOrigin: 'center',
          }}
        />
      </svg>

      {/* Wave Layer 2 - Medium speed waves */}
      <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 400" preserveAspectRatio="none">
        <defs>
          <linearGradient id="waveGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isBossMoment ? "#f97316" : "#93c5fd"} stopOpacity="0.5" />
            <stop offset="100%" stopColor={isBossMoment ? "#ea580c" : "#60a5fa"} stopOpacity="0.7" />
          </linearGradient>
        </defs>
        <path
          d="M0,320 Q240,270 480,300 T1440,320 L1440,400 L0,400 Z"
          fill="url(#waveGrad2)"
          className="animate-[wave2_6s_ease-in-out_infinite]"
          style={{
            transformOrigin: 'center',
          }}
        />
      </svg>

      {/* Wave Layer 3 - Fast small waves */}
      <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 400" preserveAspectRatio="none">
        <defs>
          <linearGradient id="waveGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isBossMoment ? "#fb923c" : "#bfdbfe"} stopOpacity="0.4" />
            <stop offset="100%" stopColor={isBossMoment ? "#f97316" : "#93c5fd"} stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <path
          d="M0,340 Q180,310 360,330 T1440,340 L1440,400 L0,400 Z"
          fill="url(#waveGrad3)"
          className="animate-[wave3_4s_ease-in-out_infinite]"
          style={{
            transformOrigin: 'center',
          }}
        />
      </svg>

      {/* Foam/whitecap effects */}
      <div className="absolute bottom-0 w-full h-16 overflow-hidden">
        <div className="absolute bottom-0 w-full h-full bg-gradient-to-t from-white/30 to-transparent animate-[foam_3s_ease-in-out_infinite]" />
        <div className="absolute bottom-4 left-0 w-full h-2 bg-white/20 blur-sm animate-[foam2_2.5s_ease-in-out_infinite]" />
      </div>

      {/* Sparkle particles on surface */}
      <div className="absolute bottom-1/4 w-full h-full pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: `${10 + Math.random() * 20}%`,
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              opacity: 0.6,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes wave1 {
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(-20px) translateY(-10px); }
        }
        @keyframes wave2 {
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(-30px) translateY(-5px); }
        }
        @keyframes wave3 {
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(-40px) translateY(-8px); }
        }
        @keyframes foam {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 0.5; transform: translateY(-4px); }
        }
        @keyframes foam2 {
          0%, 100% { opacity: 0.2; transform: translateX(0); }
          50% { opacity: 0.4; transform: translateX(10px); }
        }
      `}</style>
    </div>
  );
};

export default AnimatedWater;

