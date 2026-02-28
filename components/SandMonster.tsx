
import React, { useEffect, useState } from 'react';
import bossImage from '../assets/sand-monster.jpeg';

interface SandMonsterProps {
  health: number;
  maxHealth: number;
  isIntro?: boolean;
  facingDirection?: 'left' | 'right'; // Add prop for flip direction
  isDefeating?: boolean; // When true, boss stays static (no floating)
}

const SandMonster: React.FC<SandMonsterProps> = ({ health, maxHealth, isIntro = false, facingDirection = 'right', isDefeating = false }) => {
  const [isHit, setIsHit] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const healthWidth = (health / maxHealth) * 100;

  // Process image to remove white background
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = bossImage;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // First pass: identify which white pixels are likely part of the character
      // by checking if they're adjacent to non-white pixels
      const isCharacterPixel = new Array(data.length / 4).fill(false);
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const isWhite = r > 220 && g > 220 && b > 220;
        
        if (!isWhite) {
          // Mark this pixel and its neighbors as character pixels
          const pixelIndex = i / 4;
          const x = pixelIndex % canvas.width;
          const y = Math.floor(pixelIndex / canvas.width);
          
          // Mark current pixel and 8 surrounding pixels as character
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < canvas.width && ny >= 0 && ny < canvas.height) {
                const neighborIndex = ny * canvas.width + nx;
                isCharacterPixel[neighborIndex] = true;
              }
            }
          }
        }
      }

      // Second pass: remove white background but preserve white character pixels
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const pixelIndex = i / 4;
        const isWhite = r > 220 && g > 220 && b > 220;
        
        if (isWhite && !isCharacterPixel[pixelIndex]) {
          // This is background white - make it transparent
          data[i + 3] = 0; 
        } else {
          // This is part of the character - preserve it and ensure full opacity
          data[i] = Math.min(255, r * 1.05);
          data[i+1] = Math.min(255, g * 1.05);
          data[i+2] = Math.min(255, b * 1.05);
          data[i+3] = 255; // Ensure full opacity for character pixels
        }
      }

      ctx.putImageData(imageData, 0, 0);
      setProcessedImageUrl(canvas.toDataURL());
    };
  }, []);

  // Flash when health changes
  useEffect(() => {
    if (health < maxHealth) {
      setIsHit(true);
      const timer = setTimeout(() => setIsHit(false), 100);
      return () => clearTimeout(timer);
    }
  }, [health, maxHealth]);

  // Handle flip direction
  useEffect(() => {
    setIsFlipped(facingDirection === 'left');
  }, [facingDirection]);

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

      {/* Shadow under boss */}
      <div className="absolute bottom-0 w-3/4 h-4 bg-black/20 rounded-full blur-md animate-[shadowPulse_4s_ease-in-out_infinite]" />

      {/* Boss Image with flip animation - static when defeating */}
      <div
        className={`relative w-full h-full ${isDefeating ? '' : 'animate-[bossFloat_4s_ease-in-out_infinite]'} transition-transform duration-500 ${isFlipped ? 'scale-x-[-1]' : 'scale-x-[1]'}`}
        style={{ transformOrigin: 'center' }}
      >
        {processedImageUrl ? (
          <img 
            src={processedImageUrl} 
            alt="Boss" 
            className="w-full h-full object-contain drop-shadow-2xl"
            style={{ imageRendering: 'auto' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <img 
              src={bossImage} 
              alt="Boss" 
              className="w-full h-full object-contain drop-shadow-2xl opacity-50"
              style={{ imageRendering: 'auto' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes bossFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        @keyframes shadowPulse {
          0%, 100% { transform: scaleX(1); opacity: 0.2; }
          50% { transform: scaleX(1.1); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default SandMonster;
