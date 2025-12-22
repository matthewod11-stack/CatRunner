import React, { useEffect, useRef } from 'react';
import { Particle, Bullet } from '../types';

interface GameCanvasProps {
  particlesRef: React.MutableRefObject<Particle[]>;
  bulletsRef: React.MutableRefObject<Bullet[]>;
  width: number;
  height: number;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ particlesRef, bulletsRef, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw Particles
    const particles = particlesRef.current;
    for (const p of particles) {
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color || '#ffffff';
      ctx.beginPath();
      // Draw circle
      ctx.arc(p.x, height - p.y, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Add a slight glow for "juice"
      if (p.opacity > 0.5) {
         ctx.globalAlpha = p.opacity * 0.3;
         ctx.beginPath();
         ctx.arc(p.x, height - p.y, p.size, 0, Math.PI * 2);
         ctx.fill();
      }
    }
    
    // Reset Alpha
    ctx.globalAlpha = 1.0;

    // Draw Bullets (Poop emojis)
    const bullets = bulletsRef.current;
    ctx.font = "28px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const b of bullets) {
      // Bullets in this game seem to be DOM based with bottom-left positioning
      // DOM 'bottom' = canvas 'height - y'
      // But we need to match the DOM positioning exactly.
      // DOM: left: b.x, bottom: b.y
      const x = b.x + b.size / 2;
      const y = height - b.y - b.size / 2;
      ctx.fillText("💩", x, y);
    }
    
    // Optional: Vignette for focus
    const gradient = ctx.createRadialGradient(width/2, height/2, height/3, width/2, height/2, height);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,0.1)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    requestRef.current = requestAnimationFrame(render);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(render);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [width, height]);

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      className="absolute inset-0 pointer-events-none z-20"
    />
  );
};

export default GameCanvas;
