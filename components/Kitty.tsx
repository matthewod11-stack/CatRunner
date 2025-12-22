
import React, { useState, useEffect } from 'react';

interface KittyProps {
  isJumping: boolean;
  isDucking: boolean;
  customUrl?: string | null;
  velocityY?: number;  // For squash/stretch effect
  isHurt?: boolean;    // For hit feedback
  isLanding?: boolean; // For landing squash
}

const Kitty: React.FC<KittyProps> = ({ isJumping, isDucking, customUrl, velocityY = 0, isHurt = false, isLanding = false }) => {
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);

  // Calculate squash/stretch based on velocity
  // Going up fast = stretch (taller, thinner)
  // Coming down fast = slight stretch
  // Landing = squash (shorter, wider)
  const getSquashStretch = () => {
    if (isLanding) {
      // Landing squash - wide and short
      return { scaleX: 1.3, scaleY: 0.7 };
    }
    if (isDucking) {
      return { scaleX: 1.2, scaleY: 0.5 };
    }
    if (velocityY > 10) {
      // Going up fast - stretch tall
      return { scaleX: 0.85, scaleY: 1.2 };
    }
    if (velocityY > 5) {
      // Going up - slight stretch
      return { scaleX: 0.9, scaleY: 1.1 };
    }
    if (velocityY < -10) {
      // Falling fast - stretch
      return { scaleX: 0.9, scaleY: 1.15 };
    }
    // Normal running - subtle bounce handled by animation
    return { scaleX: 1, scaleY: 1 };
  };

  const { scaleX, scaleY } = getSquashStretch();

  // Process the image to remove the white background using adjacency detection
  // This preserves white pixels that are part of the character (e.g., white cat fur)
  useEffect(() => {
    if (!customUrl) {
      setProcessedUrl(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = customUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Two-pass algorithm: identify white pixels that are part of the character
      // by checking if they're adjacent to non-white pixels
      const isCharacterPixel = new Array(data.length / 4).fill(false);

      // First pass: mark non-white pixels and their neighbors as character pixels
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const isWhite = r > 230 && g > 230 && b > 230;

        if (!isWhite) {
          // Mark this pixel and its neighbors as character pixels
          const pixelIndex = i / 4;
          const x = pixelIndex % canvas.width;
          const y = Math.floor(pixelIndex / canvas.width);

          // Mark current pixel and surrounding pixels (3x3 area) as character
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
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
        const isWhite = r > 230 && g > 230 && b > 230;

        if (isWhite && !isCharacterPixel[pixelIndex]) {
          // This is background white - make it transparent
          data[i + 3] = 0;
        } else {
          // This is part of the character - preserve it with slight contrast boost
          data[i] = Math.min(255, r * 1.05);
          data[i + 1] = Math.min(255, g * 1.05);
          data[i + 2] = Math.min(255, b * 1.05);
          data[i + 3] = 255; // Ensure full opacity for character pixels
        }
      }

      ctx.putImageData(imageData, 0, 0);
      setProcessedUrl(canvas.toDataURL());
    };
  }, [customUrl]);

  // Hurt effect - flash and shake
  const hurtStyle = isHurt ? {
    filter: 'brightness(2) saturate(0.5)',
    animation: 'hurtShake 0.1s ease-in-out infinite'
  } : {};

  return (
    <div
      className={`relative w-64 h-64 origin-bottom flex items-center justify-center`}
      style={{
        transform: `scaleX(${scaleX}) scaleY(${scaleY})`,
        transition: isLanding ? 'transform 0.1s ease-out' : 'transform 0.15s ease-out',
        ...hurtStyle
      }}
    >
      
      {customUrl ? (
        <div className="w-full h-full flex items-center justify-center">
            <img 
                src={processedUrl || customUrl} 
                alt="Custom Kitty" 
                className={`w-full h-full object-contain ${!isJumping ? 'animate-bounce' : ''} ${!processedUrl ? 'opacity-0' : 'opacity-100'}`}
                style={{ 
                  display: 'block'
                }}
            />
            {!processedUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
        </div>
      ) : (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
            {/* Tail with running wag */}
            <path d="M20 70 Q 10 50 20 40" stroke="white" strokeWidth="8" fill="none" strokeLinecap="round" className={!isJumping ? "animate-[tailWag_0.15s_ease-in-out_infinite]" : ""} style={{ transformOrigin: '20px 70px' }} />
            {/* Body */}
            <ellipse cx="50" cy="65" rx="32" ry="22" fill="white" />
            {/* Head */}
            <circle cx="72" cy="45" r="20" fill="white" />
            {/* Ears */}
            <path d="M62 35 L 58 12 L 72 30" fill="white" />
            <path d="M82 35 L 86 12 L 72 30" fill="white" />
            <path d="M62 35 L 60 20 L 70 32" fill="#fee2e2" />
            <path d="M82 35 L 84 20 L 74 32" fill="#fee2e2" />
            {/* Eyes */}
            <circle cx="68" cy="42" r="3" fill="#1e293b" />
            <circle cx="80" cy="42" r="3" fill="#1e293b" />
            {/* Nose */}
            <path d="M72 48 L 76 48 L 74 51 Z" fill="#f472b6" />
            {/* Running legs with alternating animation */}
            <circle cx="38" cy="84" r="8" fill="white" className={!isJumping ? "animate-[runLegFront_0.12s_ease-in-out_infinite]" : ""} style={{ transformOrigin: '38px 70px' }} />
            <circle cx="62" cy="84" r="8" fill="white" className={!isJumping ? "animate-[runLegBack_0.12s_ease-in-out_infinite]" : ""} style={{ transformOrigin: '62px 70px' }} />
        </svg>
      )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes hurtShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
        @keyframes tailWag {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes runLegFront {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-8px) translateX(5px); }
        }
        @keyframes runLegBack {
          0%, 100% { transform: translateY(-8px) translateX(-5px); }
          50% { transform: translateY(0) translateX(0); }
        }
        @keyframes kittyRun {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
};

export default Kitty;
