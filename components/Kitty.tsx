
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

  // Process the image to remove background using flood fill from corners
  // This preserves interior white pixels (fur, teeth) while removing edge-connected background
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
      const width = canvas.width;
      const height = canvas.height;

      // Check if a pixel is "background-like" (white, light gray, or pink/magenta)
      const isBackground = (i: number) => {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // White/light gray background
        const isLight = r > 230 && g > 230 && b > 230;
        // Pink/magenta backgrounds - high red, lower green, medium-high blue
        // Covers hot pink, magenta, fuchsia variants
        const isPink = r > 180 && g < 150 && b > 100 && (r - g) > 50;
        return isLight || isPink;
      };

      // Flood fill from corners to mark background pixels
      const visited = new Set<number>();
      const toRemove = new Set<number>();
      const queue: number[] = [];

      // Start flood fill from all four corners and edges
      for (let x = 0; x < width; x++) {
        queue.push(x); // Top edge
        queue.push((height - 1) * width + x); // Bottom edge
      }
      for (let y = 0; y < height; y++) {
        queue.push(y * width); // Left edge
        queue.push(y * width + (width - 1)); // Right edge
      }

      // BFS flood fill
      while (queue.length > 0) {
        const pixelIndex = queue.shift()!;
        if (visited.has(pixelIndex)) continue;
        if (pixelIndex < 0 || pixelIndex >= width * height) continue;

        visited.add(pixelIndex);
        const i = pixelIndex * 4;

        if (!isBackground(i)) continue;

        // Mark for removal
        toRemove.add(pixelIndex);

        // Add neighbors (4-connected)
        const x = pixelIndex % width;
        const y = Math.floor(pixelIndex / width);

        if (x > 0) queue.push(pixelIndex - 1);
        if (x < width - 1) queue.push(pixelIndex + 1);
        if (y > 0) queue.push(pixelIndex - width);
        if (y < height - 1) queue.push(pixelIndex + width);
      }

      // Remove background pixels
      for (const pixelIndex of toRemove) {
        data[pixelIndex * 4 + 3] = 0; // Set alpha to 0
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
