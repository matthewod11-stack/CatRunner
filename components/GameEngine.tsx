
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Obstacle, PlayerState, ObstacleType, Particle, ActivePowerUp, PowerUpType, GameScore, GameStatus, Bullet, EntityType, BackgroundEntity, BackgroundEntityType, LevelId } from '../types';
import Kitty from './Kitty';
import ObstacleComponent from './ObstacleComponent';
import SandMonster from './SandMonster';
import GameCanvas from './GameCanvas';
import { startMusic, stopMusic, setMusicTempo, setBossMode } from '../services/audioService';

interface GameEngineProps {
  initialLives: number;
  levelId: LevelId;
  startAtBoss?: boolean;
  onGameOver: (score: number) => void;
  onScoreUpdate: (score: GameScore) => void;
  onStatusChange?: (status: GameStatus) => void;
}

const GRAVITY = 0.75;
const JUMP_FORCE = 17;
const BOUNCE_FORCE = 15;
const INITIAL_SPEED = 7.5;
const SPEED_INCREMENT = 0.002; // Increased from 0.0015 to compensate for safety gaps
const GROUND_Y = 100;
const POWERUP_THRESHOLD = 20;
const BOSS_THRESHOLD = 50;
const STREAK_REQUIRED = 5;
const INVINCIBILITY_DURATION = 2000;
const PATTERN_END_GAP = 600; // Minimum ms gap after pattern completes
const HARMFUL_COOLDOWN = 400; // Minimum ms between harmful spawns (for poop stacking)

interface PatternStep {
  type: EntityType;
  delay: number;
  y?: number;
}

const HARMFUL_TYPES: EntityType[] = ['CRAB', 'BEACHBALL', 'SAND_PROJECTILE', 'PALM_TREE'];

const BEACH_PATTERNS: PatternStep[][] = [
  // Easy: Single obstacle + coin
  [{ type: 'CRAB', delay: 700 }, { type: 'COIN', delay: 400, y: 200 }],
  [{ type: 'BEACHBALL', delay: 800 }, { type: 'COIN', delay: 400, y: 200 }, { type: 'BEACHBALL', delay: 800 }],
  
  // Medium: Two obstacles with gap
  [{ type: 'CRAB', delay: 600 }, { type: 'COIN', delay: 400, y: 220 }, { type: 'SEAGULL', delay: 700 }],
  [{ type: 'BEACHBALL', delay: 700 }, { type: 'SANDCASTLE', delay: 900 }, { type: 'COIN', delay: 400, y: 200 }],
  [{ type: 'CRAB', delay: 600 }, { type: 'SEAGULL', delay: 500, y: 150 }, { type: 'COIN', delay: 300, y: 250 }],
  
  // Hard: Three obstacles in sequence
  [{ type: 'CRAB', delay: 600 }, { type: 'BEACHBALL', delay: 500 }, { type: 'CRAB', delay: 600 }, { type: 'COIN', delay: 400, y: 200 }],
  [{ type: 'SEAGULL', delay: 700, y: 180 }, { type: 'CRAB', delay: 600 }, { type: 'SEAGULL', delay: 700, y: 200 }, { type: 'COIN', delay: 400, y: 250 }],
  
  // Gauntlet: Mixed obstacles requiring jump/duck combos
  [{ type: 'CRAB', delay: 550 }, { type: 'SEAGULL', delay: 450, y: 140 }, { type: 'BEACHBALL', delay: 600 }, { type: 'SEAGULL', delay: 500, y: 160 }, { type: 'COIN', delay: 350, y: 240 }],
];


const GameEngine: React.FC<GameEngineProps> = ({ initialLives, levelId, startAtBoss = false, onGameOver, onScoreUpdate, onStatusChange }) => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.PLAYING);
  const [isPaused, setIsPaused] = useState(false);
  const [player, setPlayer] = useState<PlayerState>({
    y: 0, vy: 0, isJumping: false, isDucking: false, jumpCount: 0, isHurt: false
  });
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [backgroundEntities, setBackgroundEntities] = useState<BackgroundEntity[]>([]);
  // particles and bullets are now managed via refs and Canvas
  const [activePowerUp, setActivePowerUp] = useState<ActivePowerUp | null>(null);
  const [boss, setBoss] = useState<Obstacle | null>(null);
  const [multFeedback, setMultFeedback] = useState<string | null>(null);
  const [customCatUrl, setCustomCatUrl] = useState<string | null>(null);
  const [floatingScores, setFloatingScores] = useState<Array<{ id: number; x: number; y: number; value: number }>>([]);
  const [screenShake, setScreenShake] = useState<{ x: number; y: number; intensity: number }>({ x: 0, y: 0, intensity: 0 });
  const [bossFacingDirection, setBossFacingDirection] = useState<'left' | 'right'>('right');
  const [isFrozen, setIsFrozen] = useState(false);
  const freezeUntilRef = useRef<number>(0);
  const [hitFlash, setHitFlash] = useState(false);

  // Boss defeat animation state
  const [bossDefeating, setBossDefeating] = useState(false);
  const [defeatPoops, setDefeatPoops] = useState<Array<{
    id: number;
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    vy: number;
    size: number;
    landed: boolean;
    rotation: number;
  }>>([]);
  const defeatAnimationStartRef = useRef<number>(0);
  const defeatPoopsSpawnedRef = useRef<number>(0);
  
  const requestRef = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const distanceRef = useRef(0);
  const coinsRef = useRef(startAtBoss ? BOSS_THRESHOLD : 0);
  const livesRef = useRef(initialLives);
  const speedRef = useRef(INITIAL_SPEED);
  const streakRef = useRef(0);
  const multiplierRef = useRef(1);
  const slowdownUntilRef = useRef(0);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const backgroundRef = useRef<BackgroundEntity[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const playerRef = useRef<PlayerState>(player);
  const activePowerUpRef = useRef<ActivePowerUp | null>(null);
  const invincibilityUntilRef = useRef<number>(0);
  const lastObstacleTime = useRef<number>(0);
  const lastBackgroundTime = useRef<number>(0);
  const coinCounterRef = useRef(0);
  const lastShotTime = useRef<number>(0);
  const bossHealthRef = useRef<number>(100);
  const patternQueue = useRef<PatternStep[]>([]);
  const nextSpawnTime = useRef<number>(0);
  const consecutiveHarmfulRef = useRef(0);
  const lastHarmfulSpawnTime = useRef<number>(0); // For poop stacking prevention
  const patternEndTime = useRef<number>(0); // For mandatory gap after patterns
  const prevVyRef = useRef<number>(0);
  const prevLivesRef = useRef(initialLives);

  useEffect(() => {
    const savedLook = localStorage.getItem('beach-cat-look');
    setCustomCatUrl(savedLook);
  }, []);

  // Music lifecycle management
  useEffect(() => {
    if (isPaused) {
      stopMusic();
      return;
    }

    if (status === GameStatus.PLAYING) {
      startMusic(100 + Math.floor(speedRef.current * 3));
      setBossMode(false);
    } else if (status === GameStatus.BOSS_FIGHT) {
      startMusic(150);
      setBossMode(true);
    } else {
      stopMusic();
    }

    return () => {
      stopMusic();
    };
  }, [status, isPaused]);

  const playSound = useCallback((type: string) => {
    try {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const audioCtx = new AudioContext();
      const osc = audioCtx.createOscillator();
      const windowGain = audioCtx.createGain();
      const isBossFight = status === GameStatus.BOSS_FIGHT;
      
      if (type === 'fart') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(110, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.2); windowGain.gain.setValueAtTime(0.1, audioCtx.currentTime); }
      else if (type === 'coin') { osc.type = 'sine'; osc.frequency.setValueAtTime(880, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.1); windowGain.gain.setValueAtTime(0.05, audioCtx.currentTime); }
      else if (type === 'mult') { osc.type = 'triangle'; osc.frequency.setValueAtTime(440, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); windowGain.gain.setValueAtTime(0.2, audioCtx.currentTime); }
      else if (type === 'hit') { 
        // Enhanced hit sound for boss fight
        if (isBossFight) {
          osc.type = 'square'; 
          osc.frequency.setValueAtTime(80, audioCtx.currentTime); 
          osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.3); 
          windowGain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        } else {
          osc.type = 'square'; osc.frequency.setValueAtTime(100, audioCtx.currentTime); windowGain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        }
      }
      else if (type === 'boing') { osc.type = 'sine'; osc.frequency.setValueAtTime(400, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.2); windowGain.gain.setValueAtTime(0.2, audioCtx.currentTime); }
      else if (type === 'shoot') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.2); windowGain.gain.setValueAtTime(0.1, audioCtx.currentTime); }
      else if (type === 'boss_alert') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(300, audioCtx.currentTime); osc.frequency.linearRampToValueAtTime(150, audioCtx.currentTime + 0.5); windowGain.gain.setValueAtTime(0.2, audioCtx.currentTime); }
      else if (type === 'poop_launch') { 
        // Lower pitch thump for poop launch
        osc.type = 'sawtooth'; 
        osc.frequency.setValueAtTime(60, audioCtx.currentTime); 
        osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.15); 
        windowGain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      }
      else if (type === 'boss_hit') { 
        // Bigger impact sound for boss hits
        osc.type = 'square'; 
        osc.frequency.setValueAtTime(50, audioCtx.currentTime); 
        osc.frequency.exponentialRampToValueAtTime(25, audioCtx.currentTime + 0.4); 
        windowGain.gain.setValueAtTime(0.4, audioCtx.currentTime);
      }
      else if (type === 'boss_rumble') { 
        // Subtle rumble for boss movement
        osc.type = 'sawtooth'; 
        osc.frequency.setValueAtTime(45, audioCtx.currentTime); 
        windowGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      }
      
      const duration = type === 'boss_hit' ? 0.5 : (type === 'poop_launch' ? 0.3 : 0.2);
      windowGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
      osc.connect(windowGain); windowGain.connect(audioCtx.destination);
      osc.start(); osc.stop(audioCtx.currentTime + duration + 0.1);
    } catch (error) {}
  }, [status]);

  const spawnBopParticles = useCallback((x: number, y: number, color: string = '#ffffff', count?: number, isBoss?: boolean) => {
    const numParticles = isBoss ? (count || 20) : (count || 8);
    const spread = isBoss ? 20 : 10;
    const speed = isBoss ? 15 : 8;
    const newParticles: Particle[] = [];
    for (let i = 0; i < numParticles; i++) {
      newParticles.push({ 
        id: Math.random() + Date.now(), 
        x, 
        y, 
        vx: (Math.random() - 0.5) * spread, 
        vy: Math.random() * speed - (isBoss ? 5 : 0), 
        size: isBoss ? (8 + Math.random() * 12) : (5 + Math.random() * 8), 
        opacity: 0.9, 
        life: 1.0, 
        color 
      });
    }
    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, []);
  
  const spawnPoopLaunchParticles = useCallback((x: number, y: number) => {
    const numParticles = 15;
    const newParticles: Particle[] = [];
    for (let i = 0; i < numParticles; i++) {
      const angle = (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = 4 + Math.random() * 6;
      newParticles.push({ 
        id: Math.random() + Date.now(), 
        x, 
        y, 
        vx: Math.cos(angle) * speed, 
        vy: Math.sin(angle) * speed, 
        size: 3 + Math.random() * 6, 
        opacity: 0.8, 
        life: 1.0, 
        color: `rgba(${217 - Math.random() * 40}, ${119 - Math.random() * 30}, ${6 + Math.random() * 20}, 0.9)` // Sand/brown colors
      });
    }
    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, []);
  
  const triggerScreenShake = useCallback((intensity: number) => {
    setScreenShake({ x: (Math.random() - 0.5) * intensity, y: (Math.random() - 0.5) * intensity, intensity });
  }, []);

  // Freeze frame for dramatic impact - pauses game briefly
  const triggerFreezeFrame = useCallback((durationMs: number) => {
    freezeUntilRef.current = Date.now() + durationMs;
    setIsFrozen(true);
  }, []);

  const spawnSandParticles = useCallback((x: number, y: number, intensity: number = 1.0) => {
    if (levelId !== 'BEACH') return; // Only spawn sand on beach level
    const numParticles = Math.floor(6 * intensity);
    const catFeetX = x;
    const catFeetY = GROUND_Y + y;
    const newParticles: Particle[] = [];
    for (let i = 0; i < numParticles; i++) {
      const angle = (Math.random() - 0.5) * Math.PI * 0.6; // Arc pattern
      const speed = 3 + Math.random() * 4;
      newParticles.push({ 
        id: Math.random() + Date.now(), 
        x: catFeetX + (Math.random() - 0.5) * 20, 
        y: catFeetY, 
        vx: Math.cos(angle) * speed, 
        vy: Math.sin(angle) * speed + Math.random() * 2, 
        size: 2 + Math.random() * 4, 
        opacity: 0.7, 
        life: 1.0, 
        color: `rgba(${251 - Math.random() * 30}, ${219 - Math.random() * 30}, ${116 - Math.random() * 20}, 0.8)` // Amber/tan sand colors
      });
    }
    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, [levelId]);

  const spawnFartTrail = useCallback(() => {
    const numParticles = 6;
    const catCenterX = 100 + 64; 
    const catBottomY = GROUND_Y + playerRef.current.y + 10;
    const newParticles: Particle[] = [];
    for (let i = 0; i < numParticles; i++) {
      newParticles.push({ id: Math.random() + Date.now(), x: catCenterX + (Math.random() - 0.5) * 30, y: catBottomY + (Math.random() - 0.5) * 15, vx: -speedRef.current - (Math.random() * 3), vy: (status === GameStatus.PLAYING ? (Math.random() - 0.5) * 4 : 0), size: 15 + Math.random() * 20, opacity: 0.7, life: 1.0, color: 'rgba(120, 53, 15, 0.4)' });
    }
    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, [status]);

  const shootPoop = useCallback(() => {
    const now = Date.now();
    if (now - lastShotTime.current < 150) return; 
    playSound('shoot');
    bulletsRef.current = [...bulletsRef.current, { id: now, x: 100 + 100, y: GROUND_Y + playerRef.current.y + 50, speed: 18, size: 28 }];
    lastShotTime.current = now;
  }, [playSound]);

  const performJump = useCallback(() => {
    if (playerRef.current.jumpCount < 2) {
      playSound('fart'); spawnFartTrail();
      const catFeetX = 100 + 64;
      spawnSandParticles(catFeetX, playerRef.current.y, 0.8);
      playerRef.current = { ...playerRef.current, vy: JUMP_FORCE, jumpCount: playerRef.current.jumpCount + 1, isJumping: true, isDucking: false };
    }
  }, [playSound, spawnFartTrail, spawnSandParticles]);

  const performDuck = useCallback((isDucking: boolean) => {
    if (status === GameStatus.BOSS_FIGHT) { if (isDucking) shootPoop(); return; }
    if (isDucking && !playerRef.current.isDucking && playerRef.current.y <= 5) {
      // Spawn small sand particles when ducking starts
      const catFeetX = 100 + 64;
      spawnSandParticles(catFeetX, playerRef.current.y, 0.5);
    }
    playerRef.current = { ...playerRef.current, isDucking: isDucking };
  }, [status, shootPoop, spawnSandParticles]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'KeyP' || e.code === 'Escape') {
      setIsPaused(p => !p);
      return;
    }
    if (isPaused) return;
    if (e.repeat) return;
    if (e.code === 'Space' || e.code === 'ArrowUp') performJump();
    else if (e.code === 'ArrowDown') performDuck(true);
  }, [performJump, performDuck, isPaused]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === 'ArrowDown') performDuck(false);
  }, [performDuck]);

  // Touch handlers for mobile/tablet
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (isPaused) return;
    e.preventDefault();

    const touch = e.touches[0];
    const screenMidpoint = window.innerWidth / 2;

    if (touch.clientX < screenMidpoint) {
      performJump();
    } else {
      performDuck(true);
    }
  }, [isPaused, performJump, performDuck]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    performDuck(false);
  }, [performDuck]);

  const spawnEntity = useCallback((typeOverride?: EntityType, yOverride?: number) => {
    if (status !== GameStatus.PLAYING && !typeOverride) {
      if (status === GameStatus.BOSS_FIGHT && boss) {
        // Enhanced projectile spawning - varies based on boss health
        const healthPercent = (bossHealthRef.current / 100);
        const spawnRate = healthPercent < 0.3 ? 0.65 : (healthPercent < 0.6 ? 0.5 : 0.4); // Faster when low health
        
        if (Math.random() < spawnRate) {
          // Boss shoots from his face area (center-top of boss)
          const bossFaceX = boss.x + boss.width * 0.5;
          const bossFaceY = boss.y + boss.height * 0.85; // Near top of boss, where face is
          
          // Calculate kitty's current position for aiming
          const kittyX = 100 + 24 + 40; // Left position + padding + half kitty width
          const kittyY = GROUND_Y + playerRef.current.y + 50; // Ground + player y + half kitty height
          
          // Calculate direction to kitty (straight horizontal with slight vertical adjustment)
          const dx = kittyX - bossFaceX;
          const dy = kittyY - bossFaceY;
          
          // For straight shot, prioritize horizontal aim with minimal vertical variation
          const verticalOffset = dy * 0.3; // Only aim 30% at vertical position for straighter shot
          
          // Add some variation for dodging - more variation when boss is low health
          const accuracy = healthPercent < 0.3 ? 0.85 : (healthPercent < 0.6 ? 0.9 : 0.95);
          const angleVariation = (1 - accuracy) * 0.25; // Less vertical variation for straighter shots
          
          // Calculate angle with preference for horizontal
          const baseAngle = Math.atan2(verticalOffset, dx);
          const angle = baseAngle + (Math.random() - 0.5) * angleVariation;
          
          // Projectile velocity components - mostly horizontal
          const baseSpeed = 12 + Math.random() * 4; // 12-16 speed for faster straight shots
          const speed = healthPercent < 0.3 ? baseSpeed * 1.2 : baseSpeed;
          const vx = Math.cos(angle) * speed;
          const vy = Math.sin(angle) * speed * 0.4; // Reduce vertical component for straighter trajectory
          
          // Spawn launch particles
          spawnPoopLaunchParticles(bossFaceX, bossFaceY);
          playSound('poop_launch');
          triggerScreenShake(3); // Small shake on launch
          
          obstaclesRef.current.push({ 
            id: Date.now() + Math.random(), 
            type: 'SAND_PROJECTILE', 
            x: bossFaceX, 
            y: bossFaceY, 
            width: 100, 
            height: 100, 
            speed: vx, // Store horizontal speed in speed property
            vx: vx, // Horizontal velocity
            vy: vy, // Vertical velocity (reduced for straight shot)
            rotation: 0, // Initial rotation
            isPassed: false 
          });
          
          // Flip boss direction based on where kitty is
          setBossFacingDirection(dx < 0 ? 'left' : 'right');
        }
      }
      return;
    }

    const beachTypes: ObstacleType[] = ['CRAB', 'CRAB', 'CRAB', 'BEACHBALL', 'SEAGULL', 'SANDCASTLE', 'TIDEPOOL', 'PALM_TREE'];
    
    let isCoin = Math.random() < 0.85; // Increased for more frequent stars
    let isShell = false;
    if (!isCoin && Math.random() < 0.15) {
      // 15% chance of shell when not spawning coin
      isShell = true;
    }
    if (consecutiveHarmfulRef.current >= 2) { isCoin = true; isShell = false; }

    const selectedType = typeOverride || (isShell ? 'SHELL' : (isCoin ? 'COIN' : beachTypes[Math.floor(Math.random() * beachTypes.length)]));
    
    if (HARMFUL_TYPES.includes(selectedType)) consecutiveHarmfulRef.current++; else consecutiveHarmfulRef.current = 0;
    
    let height = 120, width = 120, y = yOverride ?? GROUND_Y, isSwooping = false;
    
    if (selectedType === 'COIN' || selectedType === 'SHELL' || selectedType === 'SPEED' || selectedType === 'MAGNET' || selectedType === 'SUPER_SIZE') { width = 60; height = 60; if (yOverride === undefined) y = GROUND_Y + Math.random() * 250; }
    else if (selectedType === 'SEAGULL') { 
      height = 90; 
      width = 110; 
      const seagullType = Math.random() < 0.5 ? 'dive' : 'poop';
      if (seagullType === 'dive') {
        isSwooping = Math.random() < 0.6;
        if (yOverride === undefined) y = isSwooping ? 350 : 220;
      } else {
        // 'poop' type - higher altitude, no swooping
        isSwooping = false;
        if (yOverride === undefined) y = 350 + Math.random() * 50; // 350-400px range
      }
      obstaclesRef.current.push({ 
        id: Date.now() + Math.random(), 
        type: selectedType as any, 
        x: window.innerWidth + 200, 
        y, 
        isSwooping, 
        seagullType,
        lastPoopTime: Date.now(),
        width, 
        height, 
        speed: speedRef.current, 
        isPassed: false 
      });
      return; // Early return to skip the default push below
    }
    else if (selectedType === 'BEACHBALL') width = 140; 
    else if (selectedType === 'CRAB') { width = 130; height = 110; }
    else if (selectedType === 'SANDCASTLE') { width = 160; height = 130; } 
    else if (selectedType === 'TIDEPOOL') { width = 220; height = 50; }
    else if (selectedType === 'PALM_TREE') { width = 100; height = 180; }
    
    obstaclesRef.current.push({ id: Date.now() + Math.random(), type: selectedType as any, x: window.innerWidth + 200, y, isSwooping, width, height, speed: speedRef.current, isPassed: false });
  }, [status, boss, spawnPoopLaunchParticles, playSound, triggerScreenShake]);

  const spawnBackgroundDeco = useCallback((isChaosMode: boolean = false) => {
    if (isChaosMode) {
      // Boss fight chaos mode - sinking boats and burning planes
      const chaosTypes: BackgroundEntityType[] = ['BOAT_SINKING', 'AIRPLANE_FIRE'];
      const type = chaosTypes[Math.floor(Math.random() * chaosTypes.length)];
      let y = 0, x = window.innerWidth + 300, speed = 0, width = 0, height = 0, bannerText = "";
      const depth: 'far' | 'mid' | 'near' = 'mid';

      if (type === 'BOAT_SINKING') {
        y = window.innerHeight * 0.32 + Math.random() * (window.innerHeight * 0.08);
        width = 260;
        height = 140;
        speed = speedRef.current * 1.2; // Faster than normal
      } else if (type === 'AIRPLANE_FIRE') {
        y = window.innerHeight * 0.5 + Math.random() * (window.innerHeight * 0.2);
        width = 180;
        height = 80;
        speed = speedRef.current * 1.5; // Very fast - flying out of frame
        bannerText = "HELP!";
      }
      backgroundRef.current.push({ id: Date.now(), type, x, y, speed, width, height, bannerText, depth, isChaos: true });
      return;
    }

    // Normal gameplay backgrounds
    // Far layer: Clouds
    if (Math.random() < 0.3) {
      const cloudY = window.innerHeight * 0.55 + Math.random() * (window.innerHeight * 0.15);
      const cloudSize = 80 + Math.random() * 60;
      backgroundRef.current.push({
        id: Date.now(),
        type: 'CLOUD',
        x: window.innerWidth + 200,
        y: cloudY,
        speed: speedRef.current * 0.1,
        width: cloudSize,
        height: cloudSize * 0.6,
        depth: 'far'
      });
    }

    // Mid layer: Boats, surfers, airplanes, jetskiers
    const types: BackgroundEntityType[] = ['BOAT', 'SURFER', 'AIRPLANE', 'JETSKI'];
    const type = types[Math.floor(Math.random() * types.length)];
    let y = 0, x = window.innerWidth + 500, speed = 2, width = 100, height = 100, bannerText = "", depth: 'far' | 'mid' | 'near' = 'mid';
    if (type === 'BOAT') {
      y = window.innerHeight * 0.35 + Math.random() * (window.innerHeight * 0.1);
      width = 240;
      height = 120;
      speed = speedRef.current * 0.4;
      depth = 'mid';
    }
    else if (type === 'SURFER') {
      y = window.innerHeight * 0.28 + Math.random() * (window.innerHeight * 0.05);
      width = 70;
      height = 50;
      speed = speedRef.current * 0.5;
      depth = 'mid';
    }
    else if (type === 'AIRPLANE') {
      y = window.innerHeight * 0.55 + Math.random() * (window.innerHeight * 0.15);
      width = 160;
      height = 60;
      speed = speedRef.current * 0.6;
      bannerText = "WHO FARTED?";
      depth = 'mid';
    }
    else if (type === 'JETSKI') {
      x = -200 - Math.random() * 300;
      y = window.innerHeight * 0.25 + Math.random() * (window.innerHeight * 0.15);
      width = 80;
      height = 60;
      speed = speedRef.current * 0.7;
      depth = 'mid';
    }
    backgroundRef.current.push({ id: Date.now(), type, x, y, speed, width, height, bannerText, depth });
  }, []);

  const triggerBossFight = useCallback(() => {
    setStatus(GameStatus.BOSS_FIGHT);
    onStatusChange?.(GameStatus.BOSS_FIGHT);
    obstaclesRef.current = [];
    setObstacles([]);
    playSound('boss_alert');
    bossHealthRef.current = 100;
    setBossFacingDirection('right');
    triggerScreenShake(5); // Initial boss entrance shake
    setBoss({ id: 999, type: 'BOSS', x: window.innerWidth - 450, y: GROUND_Y + 100, width: 320, height: 320, speed: 0, isPassed: false, health: 100, maxHealth: 100 });
  }, [onStatusChange, playSound, triggerScreenShake]);

  const update = useCallback((time: number) => {
    if (isPaused) return;

    const now = Date.now();

    // Handle freeze frame - skip updates but keep rendering
    if (now < freezeUntilRef.current) {
      return; // Skip this frame for dramatic effect
    } else if (isFrozen) {
      setIsFrozen(false);
    }
    const isSlowed = now < slowdownUntilRef.current;
    const speedMultiplier = isSlowed ? 0.4 : (activePowerUpRef.current?.type === 'SPEED' ? 1.7 : 1.0);
    
    if (status === GameStatus.PLAYING) {
        scoreRef.current += 1 * multiplierRef.current;
        distanceRef.current += speedRef.current * speedMultiplier;
    }

    if (activePowerUpRef.current && now > activePowerUpRef.current.endTime) {
        activePowerUpRef.current = null;
        setActivePowerUp(null);
    }

    const isCurrentlyHurt = now < invincibilityUntilRef.current;
    if (scoreRef.current % 10 === 0) {
      onScoreUpdate({ 
        current: Math.floor(scoreRef.current / 10), 
        high: 0, 
        coins: coinsRef.current, 
        multiplier: multiplierRef.current, 
        streak: streakRef.current, 
        lives: livesRef.current
      });
    }

    if (status === GameStatus.PLAYING) {
        speedRef.current += SPEED_INCREMENT * speedMultiplier;
        // Dynamically adjust music tempo as speed increases
        if (Math.random() < 0.02) { // Don't update every frame to avoid jitter
          setMusicTempo(100 + Math.floor(speedRef.current * 4));
        }
    } else {
        speedRef.current = Math.max(0, speedRef.current * 0.95);
    }

    const p = playerRef.current;
    let newY = p.y + p.vy;
    let newVy = p.vy - GRAVITY;
    const wasInAir = prevVyRef.current < 0; // Was moving down (falling)
    if (newY <= 0) { 
      newY = 0; 
      newVy = 0; 
      p.isJumping = false; 
      p.jumpCount = 0;
      // Spawn sand particles on landing
      if (wasInAir) {
        const catFeetX = 100 + 64;
        spawnSandParticles(catFeetX, 0, 1.2);
      }
    }
    prevVyRef.current = newVy;
    playerRef.current = { ...p, y: newY, vy: newVy, isHurt: isCurrentlyHurt };
    setPlayer({ ...playerRef.current });

    // Running dust trail - spawn particles while on ground and moving
    if (status === GameStatus.PLAYING && newY <= 5 && !p.isDucking && Math.random() < 0.3) {
      const catFeetX = 100 + 50 + (Math.random() - 0.5) * 30;
      particlesRef.current.push({
        id: Date.now() + Math.random(),
        x: catFeetX,
        y: GROUND_Y + 5,
        vx: -speedRef.current * 0.5 - Math.random() * 2,
        vy: Math.random() * 3 + 1,
        size: 3 + Math.random() * 4,
        opacity: 0.5,
        life: 0.6,
        color: `rgba(251, 219, 116, ${0.4 + Math.random() * 0.3})` // Sand color
      });
    }

    // Background spawning - normal during PLAYING, chaos during BOSS_FIGHT
    const isBossFight = status === GameStatus.BOSS_FIGHT;
    const spawnInterval = isBossFight ? 2000 : 4000; // Faster spawns during boss
    if ((status === GameStatus.PLAYING || isBossFight) && time - lastBackgroundTime.current > spawnInterval) {
      spawnBackgroundDeco(isBossFight);
      lastBackgroundTime.current = time;
    }
    backgroundRef.current = backgroundRef.current.map(b => {
      // Full speed during PLAYING or BOSS_FIGHT, slow otherwise
      const isActive = status === GameStatus.PLAYING || status === GameStatus.BOSS_FIGHT;
      const speedMult = isActive ? 1.0 : 0.1;

      // Jetskiers move right (positive direction), everything else moves left
      if (b.type === 'JETSKI') {
        return { ...b, x: b.x + (b.speed * speedMult) };
      } else {
        return { ...b, x: b.x - (b.speed * speedMult) };
      }
    }).filter(b => {
      // Filter out entities that have moved off-screen
      if (b.type === 'JETSKI') {
        return b.x < window.innerWidth + 200;
      } else {
        return b.x > -1500;
      }
    });
    setBackgroundEntities([...backgroundRef.current]);

    particlesRef.current = particlesRef.current.map(part => ({ ...part, x: part.x + part.vx, y: part.y + part.vy, life: part.life - 0.02, opacity: part.life * 0.6, size: part.size + 0.4 })).filter(part => part.life > 0);
    
    bulletsRef.current = bulletsRef.current.map(b => b.x < window.innerWidth + 100 ? { ...b, x: b.x + b.speed } : b).filter(b => b.x < window.innerWidth + 100);

    if (activePowerUpRef.current?.type === 'MAGNET') {
      const catX = 100 + 64, catY = GROUND_Y + playerRef.current.y + 40;
      obstaclesRef.current.forEach(obs => { if (obs.type === 'COIN') { const dx = catX - obs.x, dy = catY - (obs.y || GROUND_Y); const dist = Math.sqrt(dx * dx + dy * dy); if (dist < 450) { obs.x += dx * 0.2; obs.y = (obs.y || GROUND_Y) + dy * 0.2; } } });
    }

    if (status === GameStatus.PLAYING && coinsRef.current >= BOSS_THRESHOLD) {
        triggerBossFight();
    }

    if (status === GameStatus.PLAYING) {
      if (now > nextSpawnTime.current) {
        // Check if we're still in mandatory gap after pattern completed
        const inPatternGap = now < patternEndTime.current;

        if (patternQueue.current.length === 0 && !inPatternGap) {
          const patternChance = Math.min(0.15 + (scoreRef.current / 12000), 0.7);
          // Don't start new pattern if player is invincible (just took damage)
          const isPlayerRecovering = now < invincibilityUntilRef.current;

          if (Math.random() < patternChance && !isPlayerRecovering) {
            patternQueue.current = [...BEACH_PATTERNS[Math.floor(Math.random() * BEACH_PATTERNS.length)]];
            consecutiveHarmfulRef.current = 0; // Reset harmful counter at pattern start
          }
          else {
            if (coinCounterRef.current >= POWERUP_THRESHOLD) { spawnEntity(Math.random() > 0.5 ? 'SPEED' : 'MAGNET'); coinCounterRef.current = 0; }
            else { spawnEntity(); }
            nextSpawnTime.current = now + (1200 - Math.min(speedRef.current * 45, 800) + (Math.random() - 0.5) * 400) / speedMultiplier;
          }
        }
        if (patternQueue.current.length > 0) {
          const step = patternQueue.current.shift()!;
          spawnEntity(step.type, step.y);
          // Track harmful spawn time
          if (HARMFUL_TYPES.includes(step.type)) {
            lastHarmfulSpawnTime.current = now;
          }
          nextSpawnTime.current = now + (step.delay / speedMultiplier);

          // If pattern just finished, set mandatory gap before next spawn
          if (patternQueue.current.length === 0) {
            patternEndTime.current = now + PATTERN_END_GAP;
            consecutiveHarmfulRef.current = 0; // Reset after pattern
          }
        }
      }
    } else if (status === GameStatus.BOSS_FIGHT) {
      if (time - lastObstacleTime.current > 1100) { spawnEntity(); lastObstacleTime.current = time; }
    }
    
    // Handle seagull poop drops - with stacking prevention
    if (status === GameStatus.PLAYING || status === GameStatus.BOSS_FIGHT) {
      // Skip poop if harmful obstacle spawned too recently (prevents impossible stacking)
      const canSpawnPoop = (now - lastHarmfulSpawnTime.current) > HARMFUL_COOLDOWN;

      obstaclesRef.current.forEach(obs => {
        if (obs.type === 'SEAGULL' && obs.seagullType === 'poop' && obs.lastPoopTime && canSpawnPoop) {
          const timeSinceLastPoop = now - obs.lastPoopTime;
          // Drop poop every 2-3 seconds
          if (timeSinceLastPoop > 2000 + Math.random() * 1000) {
            // Spawn poop projectile falling downward
            const seagullX = obs.x + obs.width / 2;
            const seagullY = obs.y ?? 220;
            obstaclesRef.current.push({
              id: Date.now() + Math.random(),
              type: 'SAND_PROJECTILE',
              x: seagullX,
              y: seagullY,
              width: 60,
              height: 60,
              speed: 0, // No horizontal movement
              vx: 0,
              vy: 2 + Math.random() * 2, // Fall downward
              rotation: 0,
              isPassed: false
            });
            obs.lastPoopTime = now;
            lastHarmfulSpawnTime.current = now; // Track this as harmful spawn too
          }
        }
      });
    }

    // Screen shake decay
    if (screenShake.intensity > 0) {
      setScreenShake(prev => ({
        x: (Math.random() - 0.5) * prev.intensity,
        y: (Math.random() - 0.5) * prev.intensity,
        intensity: prev.intensity * 0.92 // Decay multiplier
      }));
    }
    
    // Ambient particles during boss fight
    if (status === GameStatus.BOSS_FIGHT && Math.random() < 0.15) {
      const ambientX = window.innerWidth * (0.5 + Math.random() * 0.5);
      const ambientY = GROUND_Y + 50 + Math.random() * 300;
      particlesRef.current.push({
        id: Date.now() + Math.random(),
        x: ambientX,
        y: ambientY,
        vx: -2 - Math.random() * 3,
        vy: (Math.random() - 0.5) * 2,
        size: 2 + Math.random() * 4,
        opacity: 0.4,
        life: 1.0,
        color: `rgba(${217 - Math.random() * 20}, ${119 - Math.random() * 20}, ${6 + Math.random() * 15}, 0.6)`
      });
    }
    
    if (status === GameStatus.BOSS_FIGHT && boss) {
        // Enhanced boss movement with horizontal sway
        const healthPercent = bossHealthRef.current / 100;
        const swayAmount = healthPercent < 0.3 ? 30 : 15; // More sway when low health
        const horizontalSway = Math.sin(time / 800) * swayAmount;
        const baseX = window.innerWidth - 450;
        
        const updatedBoss = { 
          ...boss, 
          x: Math.max(window.innerWidth - 500, baseX + horizontalSway), 
          y: GROUND_Y + Math.sin(time / 500) * 50 + 50, 
          health: bossHealthRef.current 
        };
        setBoss(updatedBoss);
        
        // Update facing direction based on movement
        if (horizontalSway > 5) {
          setBossFacingDirection('right');
        } else if (horizontalSway < -5) {
          setBossFacingDirection('left');
        }
        
        bulletsRef.current = bulletsRef.current.filter(b => {
            const hit = b.x > updatedBoss.x && 
                        b.x < updatedBoss.x + updatedBoss.width &&
                        b.y > updatedBoss.y && 
                        b.y < updatedBoss.y + updatedBoss.height;
            if (hit) {
                bossHealthRef.current -= 4;
                // Enhanced hit effects
                spawnBopParticles(b.x, b.y, '#ff6b6b', 25, true);
                triggerScreenShake(8); // Big shake on hit
                triggerFreezeFrame(40); // Brief freeze on boss hit
                playSound('boss_hit');

                if (bossHealthRef.current <= 0 && !bossDefeating) {
                    playSound('mult');
                    triggerScreenShake(15); // Big shake on defeat
                    triggerFreezeFrame(200); // Longer freeze on boss defeat
                    coinsRef.current = 0;
                    multiplierRef.current += 3;

                    // Start the defeat animation instead of immediate victory
                    setBossDefeating(true);
                    defeatAnimationStartRef.current = Date.now();
                    defeatPoopsSpawnedRef.current = 0;
                    setDefeatPoops([]);

                    // Clear all projectiles
                    obstaclesRef.current = obstaclesRef.current.filter(obs => obs.type !== 'SAND_PROJECTILE');
                }
                return false;
            }
            return true;
        });
    }

    // Boss defeat animation - poop pyramid burial
    if (bossDefeating && boss) {
      const now = Date.now();
      const animationElapsed = now - defeatAnimationStartRef.current;

      // Pyramid configuration: 10 rows for 60 poops - MASSIVE pyramid!
      const POOP_SIZE = 45;
      const TOTAL_POOPS = 60; // Quadruple the original!
      const SPAWN_INTERVAL = 45; // Rapid fire spawns
      const SPAWN_DURATION = TOTAL_POOPS * SPAWN_INTERVAL;

      // Spawn poops progressively
      const poopsToSpawn = Math.min(TOTAL_POOPS, Math.floor(animationElapsed / SPAWN_INTERVAL));

      if (defeatPoopsSpawnedRef.current < poopsToSpawn) {
        const bossCenter = boss.x + boss.width / 2;
        const bossBottom = boss.y;

        // Calculate pyramid position for this poop
        const poopIndex = defeatPoopsSpawnedRef.current;

        // Determine which row and position in row (supports up to 11 rows for 60+ poops)
        let row = 0;
        let posInRow = 0;
        let countInPrevRows = 0;
        const MAX_ROWS = 11;
        for (let r = 0; r < MAX_ROWS; r++) {
          const rowSize = r + 1;
          if (poopIndex < countInPrevRows + rowSize) {
            row = r;
            posInRow = poopIndex - countInPrevRows;
            break;
          }
          countInPrevRows += rowSize;
        }

        // Calculate target position (pyramid stacking from bottom)
        const rowSize = row + 1;
        const rowWidth = rowSize * POOP_SIZE * 0.85;
        const startX = bossCenter - rowWidth / 2;
        const targetX = startX + posInRow * POOP_SIZE * 0.85 + POOP_SIZE / 2;
        const targetY = bossBottom + (MAX_ROWS - 1 - row) * POOP_SIZE * 0.6; // Stack from bottom up

        // Spawn from random position above
        const spawnX = bossCenter + (Math.random() - 0.5) * 300;
        const spawnY = 600 + Math.random() * 200; // Start high above

        const newPoop = {
          id: now + defeatPoopsSpawnedRef.current,
          x: spawnX,
          y: spawnY,
          targetX,
          targetY,
          vy: 0,
          size: POOP_SIZE + Math.random() * 10,
          landed: false,
          rotation: Math.random() * 360
        };

        setDefeatPoops(prev => [...prev, newPoop]);
        defeatPoopsSpawnedRef.current++;

        // Play a thump sound for each poop
        if (defeatPoopsSpawnedRef.current % 3 === 0) {
          playSound('poop_launch');
        }
      }

      // Update poop positions
      setDefeatPoops(prev => prev.map(poop => {
        if (poop.landed) return poop;

        const gravity = 0.6; // Slower fall for dramatic effect
        const newVy = poop.vy + gravity;
        let newY = poop.y - newVy; // Moving down (decreasing y in this coordinate system)
        let newX = poop.x + (poop.targetX - poop.x) * 0.05; // Slower ease toward target X

        // Check if landed
        if (newY <= poop.targetY) {
          newY = poop.targetY;
          triggerScreenShake(3); // Small shake on land
          return { ...poop, x: poop.targetX, y: newY, vy: 0, landed: true };
        }

        return {
          ...poop,
          x: newX,
          y: newY,
          vy: newVy,
          rotation: poop.rotation + 4 // Slower spin
        };
      }));

      // Check if animation is complete
      const allLanded = defeatPoops.length === TOTAL_POOPS && defeatPoops.every(p => p.landed);
      const minAnimationTime = SPAWN_DURATION + 8500; // Bask in the glory! (3.5s + 5s extra)

      if (allLanded && animationElapsed > minAnimationTime) {
        // Transition to victory
        setStatus(GameStatus.VICTORY);
        onStatusChange?.(GameStatus.VICTORY);
        setBoss(null);
        setBossDefeating(false);
        setDefeatPoops([]);
      }
    }

    // Bullets handled by Canvas now

    // Calculate kitty size based on SUPER_SIZE power-up (base size is 2x for bigger character)
    const isSuperSized = activePowerUpRef.current?.type === 'SUPER_SIZE';
    const baseKittyW = 160, baseKittyH = playerRef.current.isDucking ? 90 : 200;
    const kittyW = isSuperSized ? baseKittyW * 3 : baseKittyW;
    const kittyH = isSuperSized ? baseKittyH * 3 : baseKittyH;
    const kittyL = 100 + 24 - (isSuperSized ? baseKittyW : 0); // Adjust left position for centered scaling
    const kittyR = 100 + 24 + kittyW;
    const kittyB = GROUND_Y + playerRef.current.y;
    const kittyT = GROUND_Y + playerRef.current.y + kittyH;
    const kRect = { l: kittyL, r: kittyR, b: kittyB, t: kittyT };
    
    obstaclesRef.current = obstaclesRef.current.map(obs => {
      let newX = obs.x;
      let newY = obs.y ?? GROUND_Y;
      
      // Enhanced projectile physics with arc trajectory
      if (obs.type === 'SAND_PROJECTILE') {
        const gravity = 0.4; // Gravity for arc
        const friction = 0.98; // Slight air resistance
        
        // Update velocities
        const vx = (obs.vx ?? obs.speed) * friction;
        const vy = (obs.vy ?? 0) + gravity; // Apply gravity
        
        // Update position
        newX = obs.x + vx;
        newY = (obs.y ?? GROUND_Y) + vy;
        
        // Calculate rotation based on movement direction
        const angle = Math.atan2(vy, vx) * (180 / Math.PI);
        obs.rotation = angle;
        obs.vx = vx;
        obs.vy = vy;
        
        // Remove if off screen or hit ground
        if (newX < -200 || newY > GROUND_Y + 400) {
          obs.isPassed = true;
        }
      } else {
        // Regular obstacle movement
        const step = speedRef.current * speedMultiplier;
        newX = obs.x - step;
        
        if (obs.type === 'SEAGULL' && obs.isSwooping) {
          // Smoother swoop trajectory using easing function (ease-in-out curve)
          const centerX = window.innerWidth / 2;
          const distFromCenter = Math.abs(newX - centerX);
          const maxDist = centerX;
          const prog = Math.min(distFromCenter / maxDist, 1);
          // Use ease-in-out cubic function for smoother motion
          const easedProg = prog < 0.5 ? 4 * prog * prog * prog : 1 - Math.pow(-2 * prog + 2, 3) / 2;
          // Swoop from high (350) down to low (120) then back up slightly
          const swoopStartY = 350;
          const swoopLowY = 120;
          const swoopEndY = 180;
          if (newX > centerX) {
            // Approaching center - swooping down
            newY = swoopStartY + (swoopLowY - swoopStartY) * easedProg;
          } else {
            // Past center - swooping up
            const upProg = (centerX - newX) / centerX;
            const easedUpProg = upProg < 0.5 ? 4 * upProg * upProg * upProg : 1 - Math.pow(-2 * upProg + 2, 3) / 2;
            newY = swoopLowY + (swoopEndY - swoopLowY) * easedUpProg;
          }
        }
      }
      
      if (!obs.isPassed && (HARMFUL_TYPES.includes(obs.type) || obs.type === 'SANDCASTLE') && newX < kRect.l) {
        obs.isPassed = true; 
        if (obs.type !== 'SANDCASTLE') streakRef.current++;
        if (streakRef.current >= STREAK_REQUIRED) { multiplierRef.current++; streakRef.current = 0; playSound('mult'); setMultFeedback("MULTIPLIER UP!"); setTimeout(() => setMultFeedback(null), 1000); }
      }
      return { ...obs, x: newX, y: newY };
    }).filter(obs => obs.x > -400);

    for (const obs of obstaclesRef.current) {
      if (obs.isCollected) continue;
      const oY = obs.y ?? (obs.type === 'SEAGULL' ? (obs.seagullType === 'poop' ? 350 : 220) : GROUND_Y);
      const hPadding = 10, vPadding = 5;
      const oRect = { l: obs.x + hPadding, r: obs.x + obs.width - hPadding, b: oY + vPadding, t: oY + obs.height - vPadding };
      let overlaps = (kRect.r > oRect.l && kRect.l < oRect.r && kRect.t > oRect.b && kRect.b < oRect.t);
      if (overlaps) {
        if (obs.type === 'SHELL') {
          playSound('coin'); // Use coin sound for shell
          coinsRef.current += 5; // Shells give 5 coins worth
          coinCounterRef.current += 5;
          // Enhanced shell collection effects (even bigger than coin)
          const shellValue = 50 * multiplierRef.current;
          const shellCenterX = obs.x + obs.width/2;
          const shellCenterY = oY + obs.height/2;
          spawnBopParticles(shellCenterX, shellCenterY, '#fbbf24'); // Amber particle burst
          // Spawn additional sparkle particles in ring pattern
          const sparkleCount = 16;
          const baseTime = Date.now();
          for (let i = 0; i < sparkleCount; i++) {
            const angle = (Math.PI * 2 * i) / sparkleCount;
            particlesRef.current.push({
              id: baseTime + i + Math.random(),
              x: shellCenterX,
              y: shellCenterY,
              vx: Math.cos(angle) * 10,
              vy: Math.sin(angle) * 10,
              size: 5 + Math.random() * 5,
              opacity: 1.0,
              life: 1.0,
              color: `rgba(251, 191, 36, 0.9)` // Amber color
            });
          }
          // Add floating score popup (bigger for shell)
          const scoreId = Date.now() + Math.random();
          setFloatingScores(prev => [...prev, { id: scoreId, x: shellCenterX, y: oY, value: shellValue }]);
          setTimeout(() => {
            setFloatingScores(prev => prev.filter(s => s.id !== scoreId));
          }, 1500);
          obs.isCollected = true;
          continue;
        }
        if (obs.type === 'COIN') { 
          playSound('coin'); 
          coinsRef.current++; 
          coinCounterRef.current++; 
          // Enhanced coin collection effects
          const coinValue = 10 * multiplierRef.current;
          const coinCenterX = obs.x + obs.width/2;
          const coinCenterY = oY + obs.height/2;
          spawnBopParticles(coinCenterX, coinCenterY, '#facc15'); // Gold particle burst
          // Spawn additional sparkle particles in ring pattern
          const sparkleCount = 12;
          const baseTime = Date.now();
          for (let i = 0; i < sparkleCount; i++) {
            const angle = (Math.PI * 2 * i) / sparkleCount;
            particlesRef.current.push({
              id: baseTime + i + Math.random(),
              x: coinCenterX,
              y: coinCenterY,
              vx: Math.cos(angle) * 8,
              vy: Math.sin(angle) * 8,
              size: 4 + Math.random() * 4,
              opacity: 1.0,
              life: 1.0,
              color: `rgba(250, 204, 21, 0.9)`
            });
          }
          // Add floating score popup
          const scoreId = Date.now() + Math.random();
          setFloatingScores(prev => [...prev, { id: scoreId, x: obs.x + obs.width/2, y: oY, value: coinValue }]);
          setTimeout(() => {
            setFloatingScores(prev => prev.filter(s => s.id !== scoreId));
          }, 1500);
          obs.isCollected = true; 
          continue; 
        } 
        if (obs.type === 'SPEED' || obs.type === 'MAGNET' || obs.type === 'SUPER_SIZE') { 
          playSound('powerup'); 
          const duration = obs.type === 'SUPER_SIZE' ? 10000 : 10000; // 10 seconds for all
          activePowerUpRef.current = { type: obs.type as PowerUpType, endTime: Date.now() + duration }; 
          setActivePowerUp(activePowerUpRef.current); 
          obs.isCollected = true; 
          continue; 
        }
        const isLanding = playerRef.current.vy < 0 && (kRect.b >= oRect.t - 30);
        if (isLanding) {
          const BOUNCE_POINTS = 10; // Points awarded for stomping enemies
          if (obs.type === 'CRAB') {
            playSound('boing');
            spawnBopParticles(obs.x + obs.width/2, oRect.t, '#ef4444');
            playerRef.current.vy = 8;
            playerRef.current.jumpCount = 0;
            scoreRef.current += BOUNCE_POINTS;
            const scoreId = Date.now() + Math.random();
            setFloatingScores(prev => [...prev, { id: scoreId, x: obs.x + obs.width/2, y: oRect.t, value: BOUNCE_POINTS }]);
            setTimeout(() => setFloatingScores(prev => prev.filter(s => s.id !== scoreId)), 1500);
            obs.isCollected = true;
            continue;
          }
          else if (obs.type === 'BEACHBALL') {
            playSound('boing');
            spawnBopParticles(obs.x + obs.width/2, oRect.t, '#fde047');
            playerRef.current.vy = BOUNCE_FORCE;
            playerRef.current.jumpCount = 0;
            scoreRef.current += BOUNCE_POINTS;
            const scoreId = Date.now() + Math.random();
            setFloatingScores(prev => [...prev, { id: scoreId, x: obs.x + obs.width/2, y: oRect.t, value: BOUNCE_POINTS }]);
            setTimeout(() => setFloatingScores(prev => prev.filter(s => s.id !== scoreId)), 1500);
            obs.isPassed = true;
            continue;
          }
          else if (obs.type === 'SEAGULL' && obs.seagullType === 'dive') {
            playSound('boing');
            spawnBopParticles(obs.x + obs.width/2, oRect.t, '#ffffff');
            playerRef.current.vy = 8;
            playerRef.current.jumpCount = 1;
            scoreRef.current += BOUNCE_POINTS;
            const scoreId = Date.now() + Math.random();
            setFloatingScores(prev => [...prev, { id: scoreId, x: obs.x + obs.width/2, y: oRect.t, value: BOUNCE_POINTS }]);
            setTimeout(() => setFloatingScores(prev => prev.filter(s => s.id !== scoreId)), 1500);
            obs.isCollected = true;
            continue;
          }
          else if (obs.type === 'SAND_PROJECTILE') {
            playSound('boing');
            spawnBopParticles(obs.x + obs.width/2, oRect.t, '#ffffff');
            playerRef.current.vy = 8;
            playerRef.current.jumpCount = 1;
            scoreRef.current += BOUNCE_POINTS;
            const scoreId = Date.now() + Math.random();
            setFloatingScores(prev => [...prev, { id: scoreId, x: obs.x + obs.width/2, y: oRect.t, value: BOUNCE_POINTS }]);
            setTimeout(() => setFloatingScores(prev => prev.filter(s => s.id !== scoreId)), 1500);
            obs.isCollected = true;
            continue;
          }
        } else if (obs.type === 'SANDCASTLE' && !isCurrentlyHurt) {
          // Sand castle slows the player down instead of taking a life
          slowdownUntilRef.current = now + 2000; // Slow down for 2 seconds
          playSound('hit');
          obs.isPassed = true;
          spawnBopParticles(obs.x + obs.width/2, oRect.t, '#fbbf24');
        } else if (obs.type === 'TIDEPOOL' && !isCurrentlyHurt) {
          // Tidepool slows the player down instead of taking a life
          slowdownUntilRef.current = now + 2000; // Slow down for 2 seconds
          playSound('hit');
          obs.isPassed = true;
          spawnBopParticles(obs.x + obs.width/2, oRect.t, '#60a5fa'); // Blue/water-colored particles
        } else if (HARMFUL_TYPES.includes(obs.type) && !isCurrentlyHurt && activePowerUpRef.current?.type !== 'SUPER_SIZE') {
          // Skip damage if SUPER_SIZE power-up is active (invincible)
          livesRef.current--;
          invincibilityUntilRef.current = now + INVINCIBILITY_DURATION;
          playSound('hit');
          streakRef.current = 0;
          triggerFreezeFrame(80); // Brief freeze on hit for dramatic effect
          triggerScreenShake(12); // Add screen shake on player hit
          // Red flash effect
          setHitFlash(true);
          setTimeout(() => setHitFlash(false), 150);
          // Update score immediately when lives change
          onScoreUpdate({ 
            current: Math.floor(scoreRef.current / 10), 
            high: 0, 
            coins: coinsRef.current, 
            multiplier: multiplierRef.current, 
            streak: streakRef.current, 
            lives: livesRef.current
          });
          prevLivesRef.current = livesRef.current;
          if (livesRef.current <= 0) {
            setStatus(GameStatus.GAMEOVER);
            onGameOver(Math.floor(scoreRef.current / 10));
          }
        }
      }
    }
    setObstacles([...obstaclesRef.current]);
  }, [status, onGameOver, onScoreUpdate, onStatusChange, playSound, spawnBackgroundDeco, spawnBopParticles, spawnSandParticles, spawnEntity, triggerBossFight, isPaused, bossDefeating, defeatPoops, triggerScreenShake]);

  useEffect(() => {
    const loop = (time: number) => {
      update(time);
      requestRef.current = requestAnimationFrame(loop);
    };
    requestRef.current = requestAnimationFrame(loop);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [update]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Touch controls for mobile/tablet
  useEffect(() => {
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  return (
    <div 
      className="absolute inset-0 w-full h-full overflow-hidden"
      style={{
        transform: `translate(${screenShake.x}px, ${screenShake.y}px)`,
        transition: 'transform 0.05s linear'
      }}
    >
      {/* HUD - Pause Button */}
      <div
        className="absolute top-6 right-6 z-[60] pointer-events-auto"
        style={{ marginTop: 'env(safe-area-inset-top)', marginRight: 'env(safe-area-inset-right)' }}
      >
        <button 
          onClick={() => setIsPaused(p => !p)}
          className="bg-white/90 hover:bg-white backdrop-blur-md w-14 h-14 rounded-full border-2 border-white shadow-xl flex items-center justify-center transition-transform active:scale-90"
        >
          {isPaused ? (
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-amber-900 fill-current"><path d="M8 5v14l11-7z"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-amber-900 fill-current"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          )}
        </button>
      </div>

      <div className="absolute inset-0 w-full h-full pointer-events-none">
        {/* Speed Lines - appear at high velocities */}
        {speedRef.current > 10 && status === GameStatus.PLAYING && (
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden z-0"
            style={{ opacity: Math.min((speedRef.current - 10) / 10, 0.6) }}
          >
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute h-[2px] bg-gradient-to-r from-white/80 via-white/40 to-transparent"
                style={{
                  top: `${10 + (i * 7) + (Math.sin(i) * 3)}%`,
                  left: '-10%',
                  width: `${30 + Math.random() * 40}%`,
                  animation: `speedLine ${0.2 + Math.random() * 0.15}s linear infinite`,
                  animationDelay: `${i * 0.05}s`
                }}
              />
            ))}
            <style>{`
              @keyframes speedLine {
                0% { transform: translateX(-100%); opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { transform: translateX(400%); opacity: 0; }
              }
            `}</style>
          </div>
        )}

        {/* Background Decor - sorted by depth for proper layering */}
        {backgroundEntities
          .sort((a, b) => {
            const depthOrder = { 'far': 0, 'mid': 1, 'near': 2 };
            const aDepth = depthOrder[a.depth || 'mid'];
            const bDepth = depthOrder[b.depth || 'mid'];
            return aDepth - bDepth;
          })
          .map(b => {
            const zIndexMap: Record<string, number> = {
              'far': 1,
              'mid': 2,
              'near': 3,
            };
            const baseZ = zIndexMap[b.depth || 'mid'] || 2;
            const zIndex = baseZ;
            return (
          <div 
            key={b.id} 
            className="absolute flex items-end" 
            style={{ left: b.x, bottom: b.y, width: b.width, height: b.height, zIndex }}
          >
            {b.type === 'BOAT' && (
              <div className="relative w-full h-full animate-[boatBob_3s_ease-in-out_infinite]">
                <svg viewBox="0 0 240 120" className="w-full h-full drop-shadow-lg">
                  <path d="M10 80 L 230 80 L 210 110 Q 120 120 30 110 Z" fill="#dc2626" />
                  <path d="M10 80 L 230 80 L 225 60 L 40 60 L 15 50 L 10 55 Z" fill="#ffffff" />
                  {[...Array(6)].map((_, i) => (
                    <circle key={i} cx={50 + i * 30} cy={70} r="3" fill="#1e293b" opacity="0.6" />
                  ))}
                  <rect x="50" y="40" width="160" height="20" fill="#ffffff" />
                  <rect x="80" y="25" width="100" height="15" fill="#ffffff" />
                  <rect x="100" y="5" width="15" height="25" fill="#dc2626" />
                  <rect x="100" y="5" width="15" height="6" fill="#1e293b" />
                  <rect x="140" y="5" width="15" height="25" fill="#dc2626" />
                  <rect x="140" y="5" width="15" height="6" fill="#1e293b" />
                  <line x1="50" y1="40" x2="210" y2="40" stroke="#94a3b8" strokeWidth="1" />
                  <line x1="80" y1="25" x2="180" y2="25" stroke="#94a3b8" strokeWidth="1" />
                </svg>
                {/* Wake trail */}
                <div className="absolute bottom-[-15px] left-0 w-full h-6 bg-gradient-to-r from-transparent via-white/30 to-transparent blur-md animate-[wakeFlow_2s_ease-in-out_infinite]" />
                <div className="absolute bottom-[-10px] w-full h-4 bg-white/20 blur-sm rounded-full" />
                <style>{`
                  @keyframes boatBob {
                    0%, 100% { transform: translateY(0) rotate(-1deg); }
                    50% { transform: translateY(-4px) rotate(1deg); }
                  }
                  @keyframes wakeFlow {
                    0%, 100% { opacity: 0.3; transform: scaleX(1); }
                    50% { opacity: 0.5; transform: scaleX(1.1); }
                  }
                `}</style>
              </div>
            )}
            {b.type === 'SURFER' && (
              <div className="relative w-full h-full animate-[surferWave_2s_ease-in-out_infinite]">
                <svg viewBox="0 0 70 50" className="w-full h-full drop-shadow-md">
                  {/* Wave */}
                  <path d="M0 35 Q 17.5 25 35 30 T 70 30 L 70 50 L 0 50 Z" fill="#60a5fa" opacity="0.6" />
                  {/* Surfer body */}
                  <ellipse cx="35" cy="22" rx="8" ry="12" fill="#fbbf24" />
                  {/* Surfboard */}
                  <ellipse cx="35" cy="30" rx="20" ry="4" fill="#facc15" stroke="#eab308" strokeWidth="1" />
                  {/* Arms */}
                  <path d="M25 20 Q 20 15 18 18" stroke="#fbbf24" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M45 20 Q 50 15 52 18" stroke="#fbbf24" strokeWidth="3" fill="none" strokeLinecap="round" />
                  {/* Splash */}
                  <circle cx="15" cy="32" r="2" fill="white" opacity="0.7" />
                  <circle cx="55" cy="32" r="2.5" fill="white" opacity="0.7" />
                </svg>
                <style>{`
                  @keyframes surferWave {
                    0%, 100% { transform: translateY(0) rotate(-2deg); }
                    50% { transform: translateY(-3px) rotate(2deg); }
                  }
                `}</style>
              </div>
            )}
            {b.type === 'AIRPLANE' && (
              <div className="flex items-center relative overflow-visible">
                <div className="relative w-20 h-10">
                  <svg viewBox="0 0 100 60" className="w-full h-full">
                    <path d="M20 30 L 70 15 L 80 30 L 70 45 Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
                    <path d="M10 30 Q 10 20 40 25 L 90 25 Q 95 25 95 30 Q 95 35 90 35 L 40 35 Q 10 40 10 30" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
                    <path d="M80 25 L 95 10 L 95 25 Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
                    <circle cx="5" cy="30" r="4" fill="#1e293b" />
                    <ellipse cx="5" cy="30" rx="2" ry="20" fill="white" opacity="0.4" className="animate-[spin_0.1s_linear_infinite]" />
                  </svg>
                </div>
                {/* Banner with physics-based trailing */}
                <div className="relative">
                  <div className="w-10 h-0.5 bg-slate-400 opacity-60" />
                  <div className="bg-white/95 backdrop-blur-sm border-4 border-red-500 px-6 py-2 rounded-2xl shadow-xl flex items-center h-12 animate-[bannerWave_1.5s_ease-in-out_infinite]">
                    <span className="text-red-600 font-black text-sm uppercase tracking-widest whitespace-nowrap drop-shadow-sm">
                      {b.bannerText}
                    </span>
                  </div>
                </div>
                {/* Optional contrail */}
                <div className="absolute -left-4 top-1/2 w-8 h-1 bg-gradient-to-r from-transparent via-white/40 to-white/20 blur-sm opacity-50" />
                <style>{`
                  @keyframes bannerWave {
                    0%, 100% { transform: translateY(0) rotate(-1deg); }
                    25% { transform: translateY(-2px) rotate(0deg); }
                    50% { transform: translateY(0) rotate(1deg); }
                    75% { transform: translateY(-1px) rotate(0deg); }
                  }
                `}</style>
              </div>
            )}
            {b.type === 'CLOUD' && (
              <svg viewBox="0 0 100 60" className="w-full h-full opacity-70">
                <ellipse cx="30" cy="30" rx="25" ry="15" fill="white" opacity="0.9" />
                <ellipse cx="50" cy="25" rx="30" ry="18" fill="white" opacity="0.9" />
                <ellipse cx="70" cy="30" rx="25" ry="15" fill="white" opacity="0.9" />
                <ellipse cx="50" cy="35" rx="35" ry="12" fill="white" opacity="0.8" />
              </svg>
            )}
            {b.type === 'JETSKI' && (
              <div className="relative w-full h-full animate-[jetskiBob_2s_ease-in-out_infinite]">
                <svg viewBox="0 0 80 60" className="w-full h-full drop-shadow-lg" style={{ transform: 'scaleX(-1)' }}>
                  {/* Jetski body */}
                  <ellipse cx="40" cy="35" rx="30" ry="12" fill="#ef4444" stroke="#dc2626" strokeWidth="2" />
                  <ellipse cx="40" cy="30" rx="25" ry="8" fill="#f87171" />
                  {/* Handlebar */}
                  <rect x="35" y="20" width="10" height="8" rx="2" fill="#1e293b" />
                  <path d="M30 20 Q 25 15 20 18" stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M50 20 Q 55 15 60 18" stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" />
                  {/* Rider */}
                  <circle cx="40" cy="22" r="6" fill="#fbbf24" />
                  <ellipse cx="40" cy="28" rx="8" ry="10" fill="#3b82f6" />
                  {/* Wake spray */}
                  <path d="M10 40 Q 20 30 30 35 T 50 35 T 70 35" stroke="white" strokeWidth="2" fill="none" opacity="0.6" strokeLinecap="round" />
                  <circle cx="15" cy="38" r="2" fill="white" opacity="0.7" />
                  <circle cx="25" cy="36" r="1.5" fill="white" opacity="0.7" />
                  <circle cx="55" cy="36" r="1.5" fill="white" opacity="0.7" />
                  <circle cx="65" cy="38" r="2" fill="white" opacity="0.7" />
                </svg>
                {/* Wake trail behind */}
                <div className="absolute bottom-[-10px] right-0 w-16 h-4 bg-gradient-to-l from-white/40 via-white/20 to-transparent blur-sm rounded-full animate-[wakeSpray_1.5s_ease-in-out_infinite]" />
                <style>{`
                  @keyframes jetskiBob {
                    0%, 100% { transform: translateY(0) rotate(-1deg); }
                    50% { transform: translateY(-3px) rotate(1deg); }
                  }
                  @keyframes wakeSpray {
                    0%, 100% { opacity: 0.4; transform: scaleX(1); }
                    50% { opacity: 0.6; transform: scaleX(1.2); }
                  }
                `}</style>
              </div>
            )}
            {/* CHAOS MODE: Sinking boat during boss fight */}
            {b.type === 'BOAT_SINKING' && (
              <div className="relative w-full h-full animate-[sinkingBob_2s_ease-in-out_infinite]">
                <svg viewBox="0 0 260 140" className="w-full h-full drop-shadow-lg" style={{ transform: 'rotate(18deg)' }}>
                  {/* Water splashes */}
                  <ellipse cx="130" cy="120" rx="120" ry="15" fill="#3b82f6" opacity="0.4" />
                  <ellipse cx="130" cy="125" rx="100" ry="10" fill="#60a5fa" opacity="0.5" />
                  {/* Partially submerged hull */}
                  <path d="M30 90 L 230 70 L 220 110 Q 130 130 50 115 Z" fill="#dc2626" opacity="0.9" />
                  <path d="M40 85 L 220 65 L 215 55 Q 130 45 50 55 Z" fill="#ffffff" opacity="0.8" />
                  {/* Broken mast */}
                  <rect x="110" y="30" width="8" height="35" fill="#78350f" />
                  <rect x="140" y="20" width="6" height="20" fill="#78350f" transform="rotate(25, 143, 30)" />
                  {/* Smoke puffs */}
                  <circle cx="120" cy="25" r="12" fill="#64748b" opacity="0.6" className="animate-[smokePuff_1.5s_ease-out_infinite]" />
                  <circle cx="135" cy="15" r="8" fill="#94a3b8" opacity="0.5" className="animate-[smokePuff_2s_ease-out_infinite]" style={{ animationDelay: '0.3s' }} />
                  {/* Water spray */}
                  <circle cx="60" cy="100" r="5" fill="white" opacity="0.7" className="animate-[splash_1s_ease-out_infinite]" />
                  <circle cx="200" cy="90" r="4" fill="white" opacity="0.6" className="animate-[splash_1.2s_ease-out_infinite]" style={{ animationDelay: '0.2s' }} />
                  <circle cx="90" cy="115" r="6" fill="white" opacity="0.5" className="animate-[splash_0.8s_ease-out_infinite]" style={{ animationDelay: '0.5s' }} />
                </svg>
                <style>{`
                  @keyframes sinkingBob {
                    0%, 100% { transform: translateY(0) rotate(18deg); }
                    50% { transform: translateY(8px) rotate(22deg); }
                  }
                  @keyframes smokePuff {
                    0% { transform: translateY(0) scale(1); opacity: 0.6; }
                    100% { transform: translateY(-30px) scale(1.5); opacity: 0; }
                  }
                  @keyframes splash {
                    0%, 100% { transform: translateY(0) scale(1); opacity: 0.7; }
                    50% { transform: translateY(-8px) scale(1.3); opacity: 0.3; }
                  }
                `}</style>
              </div>
            )}
            {/* CHAOS MODE: Burning airplane during boss fight */}
            {b.type === 'AIRPLANE_FIRE' && (
              <div className="flex items-center relative overflow-visible animate-[planeDive_4s_linear_infinite]">
                <div className="relative w-24 h-12">
                  <svg viewBox="0 0 120 70" className="w-full h-full">
                    {/* Plane body - damaged */}
                    <path d="M25 35 L 80 18 L 95 35 L 80 52 Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
                    <path d="M15 35 Q 15 25 50 30 L 105 30 Q 110 30 110 35 Q 110 40 105 40 L 50 40 Q 15 45 15 35" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
                    <path d="M90 30 L 108 15 L 108 30 Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
                    {/* Damaged/burning wing */}
                    <path d="M50 25 L 85 10 L 88 18 L 55 30 Z" fill="#1e293b" opacity="0.4" />
                    {/* Fire on wing */}
                    <ellipse cx="70" cy="15" rx="8" ry="12" fill="#f97316" opacity="0.9" className="animate-[flicker_0.15s_ease-in-out_infinite]" />
                    <ellipse cx="68" cy="12" rx="5" ry="8" fill="#fbbf24" opacity="0.9" className="animate-[flicker_0.1s_ease-in-out_infinite]" />
                    <ellipse cx="75" cy="18" rx="6" ry="10" fill="#ef4444" opacity="0.8" className="animate-[flicker_0.12s_ease-in-out_infinite]" />
                    {/* Propeller - spinning */}
                    <circle cx="8" cy="35" r="5" fill="#1e293b" />
                    <ellipse cx="8" cy="35" rx="3" ry="22" fill="white" opacity="0.4" className="animate-[spin_0.08s_linear_infinite]" />
                  </svg>
                </div>
                {/* Smoke trail */}
                <div className="absolute -right-20 top-0 flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-600/60 blur-md animate-[smokeTrail_0.5s_ease-out_infinite]" />
                  <div className="w-10 h-10 rounded-full bg-slate-500/50 blur-lg animate-[smokeTrail_0.6s_ease-out_infinite]" style={{ animationDelay: '0.1s' }} />
                  <div className="w-12 h-12 rounded-full bg-slate-400/40 blur-xl animate-[smokeTrail_0.7s_ease-out_infinite]" style={{ animationDelay: '0.2s' }} />
                </div>
                {/* Fire trail */}
                <div className="absolute -right-10 top-1/4 flex gap-1">
                  <div className="w-4 h-6 rounded-full bg-orange-500/70 blur-sm animate-[flicker_0.15s_ease-in-out_infinite]" />
                  <div className="w-3 h-5 rounded-full bg-yellow-400/60 blur-sm animate-[flicker_0.1s_ease-in-out_infinite]" />
                </div>
                {/* HELP banner - tattered */}
                {b.bannerText && (
                  <div className="relative ml-2">
                    <div className="w-6 h-0.5 bg-slate-400 opacity-40" />
                    <div className="bg-white/80 border-2 border-red-600 px-3 py-1 rounded-lg shadow-md animate-[bannerWobble_0.3s_ease-in-out_infinite]" style={{ transform: 'rotate(-5deg)' }}>
                      <span className="text-red-600 font-black text-xs uppercase">{b.bannerText}</span>
                    </div>
                  </div>
                )}
                <style>{`
                  @keyframes planeDive {
                    0% { transform: rotate(-8deg); }
                    50% { transform: rotate(-12deg); }
                    100% { transform: rotate(-8deg); }
                  }
                  @keyframes flicker {
                    0%, 100% { transform: scale(1); opacity: 0.9; }
                    50% { transform: scale(1.15); opacity: 0.7; }
                  }
                  @keyframes smokeTrail {
                    0% { transform: translateX(0) scale(1); opacity: 0.6; }
                    100% { transform: translateX(-40px) scale(1.5); opacity: 0; }
                  }
                  @keyframes bannerWobble {
                    0%, 100% { transform: rotate(-5deg) translateY(0); }
                    50% { transform: rotate(-8deg) translateY(2px); }
                  }
                `}</style>
              </div>
            )}
          </div>
            );
          })}

        {/* Obstacles & Coins */}
        {obstacles.map(obs => (
          <ObstacleComponent key={obs.id} obstacle={obs} groundY={GROUND_Y} />
        ))}

        {/* Particles & Bullets rendered via Canvas for 60fps performance */}
        <GameCanvas
          particlesRef={particlesRef}
          bulletsRef={bulletsRef}
          width={typeof window !== 'undefined' ? window.innerWidth : 1920}
          height={typeof window !== 'undefined' ? window.innerHeight : 1080}
        />

        {/* Boss */}
        {boss && (
          <div className="absolute" style={{ left: boss.x, bottom: boss.y, width: boss.width, height: boss.height, zIndex: 20 }}>
            {/* During defeat animation, clip boss to only show head */}
            <div
              className="relative w-full h-full"
              style={bossDefeating ? {
                clipPath: 'inset(0 0 60% 0)', // Show only top 40% (head area)
                transition: 'clip-path 0.5s ease-out'
              } : {}}
            >
              <SandMonster health={boss.health || 0} maxHealth={boss.maxHealth || 100} facingDirection={bossFacingDirection} isDefeating={bossDefeating} />
            </div>
          </div>
        )}

        {/* Defeat Animation - Poop Pyramid */}
        {bossDefeating && defeatPoops.map(poop => (
          <div
            key={poop.id}
            className="absolute pointer-events-none"
            style={{
              left: poop.x - poop.size / 2,
              bottom: poop.y - poop.size / 2,
              width: poop.size,
              height: poop.size,
              transform: `rotate(${poop.rotation}deg)`,
              transition: poop.landed ? 'none' : 'transform 0.05s linear',
              zIndex: 50
            }}
          >
            {/* Poop ball SVG */}
            <svg viewBox="0 0 60 60" className="w-full h-full drop-shadow-lg">
              {/* Main poop body */}
              <ellipse cx="30" cy="35" rx="22" ry="18" fill="#8B4513" />
              <ellipse cx="30" cy="32" rx="18" ry="14" fill="#A0522D" />
              <ellipse cx="30" cy="28" rx="14" ry="10" fill="#8B4513" />
              <ellipse cx="30" cy="24" rx="10" ry="7" fill="#A0522D" />
              {/* Swirl on top */}
              <ellipse cx="30" cy="18" rx="6" ry="5" fill="#8B4513" />
              <ellipse cx="30" cy="15" rx="3" ry="3" fill="#A0522D" />
              {/* Highlight */}
              <ellipse cx="22" cy="26" rx="4" ry="3" fill="#CD853F" opacity="0.5" />
              {/* Stink lines when landed */}
              {poop.landed && (
                <>
                  <path d="M15 10 Q 12 5 15 0" stroke="#90EE90" strokeWidth="2" fill="none" opacity="0.6" className="animate-[stinkWave_1s_ease-in-out_infinite]" />
                  <path d="M30 8 Q 28 3 30 -2" stroke="#90EE90" strokeWidth="2" fill="none" opacity="0.6" className="animate-[stinkWave_1s_ease-in-out_infinite]" style={{ animationDelay: '0.3s' }} />
                  <path d="M45 10 Q 48 5 45 0" stroke="#90EE90" strokeWidth="2" fill="none" opacity="0.6" className="animate-[stinkWave_1s_ease-in-out_infinite]" style={{ animationDelay: '0.6s' }} />
                </>
              )}
            </svg>
          </div>
        ))}

        {/* Defeat text overlay */}
        {bossDefeating && defeatPoops.length > 10 && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-[100] animate-[bounceIn_0.5s_ease-out]">
            <h2 className="text-7xl font-black text-amber-900 uppercase italic drop-shadow-[0_8px_0_rgba(255,255,255,0.8)] animate-pulse">
              BURIED!
            </h2>
          </div>
        )}

        {/* Player */}
        <div
          className="absolute transition-transform duration-75"
          style={{
            left: activePowerUp?.type === 'SUPER_SIZE' ? '40px' : '100px', // Adjust left for centered scaling
            bottom: `${GROUND_Y + player.y}px`,
            filter: player.isHurt ? 'opacity(0.5) sepia(1) saturate(5) hue-rotate(-50deg)' : 'none',
            transform: activePowerUp?.type === 'SUPER_SIZE' ? 'scale(3)' : 'scale(1)',
            transformOrigin: 'center bottom',
            transition: 'transform 0.3s ease-out, left 0.3s ease-out',
            zIndex: 10 // Ensure player appears in front of background entities (boats, etc.)
          }}
        >
          <Kitty
            isJumping={player.isJumping}
            isDucking={player.isDucking}
            customUrl={customCatUrl}
            velocityY={player.vy}
            isHurt={player.isHurt}
          />
        </div>

        {/* UI Feedbacks */}
        {multFeedback && (
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce">
            <span className="text-6xl font-black text-white italic drop-shadow-[0_5px_0_black] uppercase">{multFeedback}</span>
          </div>
        )}

        {/* Floating Score Popups */}
        {floatingScores.map(score => (
          <div
            key={score.id}
            className="absolute pointer-events-none animate-[floatUp_1.5s_ease-out_forwards]"
            style={{ left: score.x, bottom: score.y }}
          >
            <span className="text-3xl font-black text-yellow-300 italic drop-shadow-[0_3px_0_rgba(0,0,0,0.8)]">
              +{score.value}
            </span>
            <style>{`
              @keyframes floatUp {
                0% {
                  transform: translateY(0) scale(0.5);
                  opacity: 0;
                }
                15% {
                  transform: translateY(-10px) scale(1.4);
                  opacity: 1;
                }
                30% {
                  transform: translateY(-20px) scale(1);
                  opacity: 1;
                }
                100% {
                  transform: translateY(-100px) scale(0.8);
                  opacity: 0;
                }
              }
            `}</style>
          </div>
        ))}

        {activePowerUp && (
          <div className={`absolute top-32 left-1/2 -translate-x-1/2 bg-white/90 px-6 py-2 rounded-full border-4 shadow-xl flex items-center gap-4 ${
            activePowerUp.type === 'SUPER_SIZE' ? 'border-purple-500' : activePowerUp.type === 'SPEED' ? 'border-blue-500' : 'border-yellow-500'
          }`}>
            <span className={`font-black uppercase tracking-widest text-sm ${
              activePowerUp.type === 'SUPER_SIZE' ? 'text-purple-900' : activePowerUp.type === 'SPEED' ? 'text-blue-900' : 'text-amber-900'
            }`}>
              {activePowerUp.type === 'SUPER_SIZE' ? 'SUPER SIZE' : activePowerUp.type} ACTIVE
            </span>
            <div className={`w-32 h-3 rounded-full overflow-hidden border ${
              activePowerUp.type === 'SUPER_SIZE' ? 'bg-purple-100 border-purple-200' : activePowerUp.type === 'SPEED' ? 'bg-blue-100 border-blue-200' : 'bg-amber-100 border-amber-200'
            }`}>
                <div 
                  className={`h-full transition-all duration-100 ${
                    activePowerUp.type === 'SUPER_SIZE' ? 'bg-purple-500' : activePowerUp.type === 'SPEED' ? 'bg-blue-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, ((activePowerUp.endTime - Date.now()) / 10000) * 100))}%` }}
                />
            </div>
          </div>
        )}
      </div>

      {/* Hit Flash Overlay */}
      {hitFlash && (
        <div
          className="absolute inset-0 pointer-events-none z-[90] animate-[flashFade_0.15s_ease-out_forwards]"
          style={{ backgroundColor: 'rgba(255, 0, 0, 0.4)' }}
        />
      )}
      <style>{`
        @keyframes flashFade {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes stinkWave {
          0%, 100% { transform: translateY(0) scaleY(1); opacity: 0.6; }
          50% { transform: translateY(-5px) scaleY(1.2); opacity: 0.3; }
        }
        @keyframes bounceIn {
          0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.05); }
          70% { transform: translate(-50%, -50%) scale(0.9); }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
      `}</style>

      {/* Pause Menu Overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center animate-[fadeIn_0.2s_ease-out]">
          <h2 className="text-8xl font-black text-white italic tracking-tighter uppercase mb-12 drop-shadow-[0_10px_0_rgba(0,0,0,0.5)]">PAUSED</h2>
          
          <div className="flex flex-col gap-6 w-full max-w-sm px-8">
            <button 
              onClick={() => setIsPaused(false)}
              className="w-full bg-white text-amber-900 font-black py-6 rounded-3xl text-3xl shadow-[0_10px_0_#d97706] hover:shadow-[0_6px_0_#d97706] transition-all active:translate-y-1 active:shadow-none"
            >
              RESUME
            </button>
            <button 
              onClick={() => onStatusChange?.(GameStatus.LEVEL_SELECTION)}
              className="w-full bg-red-600 text-white font-black py-6 rounded-3xl text-3xl shadow-[0_10px_0_#7f1d1d] hover:shadow-[0_6px_0_#7f1d1d] transition-all active:translate-y-1 active:shadow-none"
            >
              MAIN MENU
            </button>
          </div>
          
          <p className="mt-12 text-white/50 font-bold tracking-widest text-sm uppercase">Press 'P' or 'ESC' to Resume</p>
        </div>
      )}
    </div>
  );
};

export default GameEngine;
