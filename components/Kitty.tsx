
import React, { useState, useEffect } from 'react';

interface KittyProps {
  isJumping: boolean;
  isDucking: boolean;
  customUrl?: string | null;
}

const Kitty: React.FC<KittyProps> = ({ isJumping, isDucking, customUrl }) => {
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);

  // Process the image to remove the white background using a canvas
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

      // Aggressive background stripping
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Slightly lower threshold to catch "near-white" compression artifacts
        if (r > 220 && g > 220 && b > 220) {
          data[i + 3] = 0; 
        } else {
          // Boost contrast slightly for the character itself
          data[i] = Math.min(255, r * 1.1);
          data[i+1] = Math.min(255, g * 1.1);
          data[i+2] = Math.min(255, b * 1.1);
        }
      }

      ctx.putImageData(imageData, 0, 0);
      setProcessedUrl(canvas.toDataURL());
    };
  }, [customUrl]);

  return (
    <div className={`relative w-32 h-32 transition-all duration-150 origin-bottom flex items-center justify-center
        ${isDucking ? 'scale-y-50' : ''}`}>
      
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
            <path d="M20 70 Q 10 50 20 40" stroke="white" strokeWidth="8" fill="none" strokeLinecap="round" className={!isJumping ? "animate-bounce" : ""} />
            <ellipse cx="50" cy="65" rx="32" ry="22" fill="white" />
            <circle cx="72" cy="45" r="20" fill="white" />
            <path d="M62 35 L 58 12 L 72 30" fill="white" />
            <path d="M82 35 L 86 12 L 72 30" fill="white" />
            <path d="M62 35 L 60 20 L 70 32" fill="#fee2e2" />
            <path d="M82 35 L 84 20 L 74 32" fill="#fee2e2" />
            <circle cx="68" cy="42" r="3" fill="#1e293b" />
            <circle cx="80" cy="42" r="3" fill="#1e293b" />
            <path d="M72 48 L 76 48 L 74 51 Z" fill="#f472b6" />
            <circle cx="38" cy="84" r="8" fill="white" className={!isJumping ? "animate-[bounce_0.2s_infinite]" : ""} />
            <circle cx="62" cy="84" r="8" fill="white" className={!isJumping ? "animate-[bounce_0.2s_infinite_0.1s]" : ""} />
        </svg>
      )}
    </div>
  );
};

export default Kitty;
