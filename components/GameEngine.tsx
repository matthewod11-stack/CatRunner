
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Obstacle, PlayerState, ObstacleType, Particle, ActivePowerUp, PowerUpType, GameScore, GameStatus, Bullet, EntityType, BackgroundEntity, BackgroundEntityType, LevelId } from '../types';
import Kitty from './Kitty';
import ObstacleComponent from './ObstacleComponent';
import SandMonster from './SandMonster';
import FootballBoss from './FootballBoss';

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
const SPEED_INCREMENT = 0.0015;
const GROUND_Y = 100; 
const POWERUP_THRESHOLD = 20;
const BOSS_THRESHOLD = 75;
const YARDS_GOAL = 100;
const PIXELS_PER_YARD = 300; // 1 yard = 300 pixels
const STREAK_REQUIRED = 5;
const INVINCIBILITY_DURATION = 2000;

interface PatternStep {
  type: EntityType;
  delay: number;
  y?: number;
}

const HARMFUL_TYPES: EntityType[] = ['CRAB', 'BEACHBALL', 'SEAGULL', 'SANDCASTLE', 'SAND_PROJECTILE', 'TIDEPOOL', 'FOOTBALL_PLAYER', 'FLYING_FOOTBALL', 'REFEREE'];

const BEACH_PATTERNS: PatternStep[][] = [
  [{ type: 'BEACHBALL', delay: 800 }, { type: 'COIN', delay: 400, y: 200 }, { type: 'BEACHBALL', delay: 800 }],
  [{ type: 'CRAB', delay: 600 }, { type: 'COIN', delay: 400, y: 220 }, { type: 'SEAGULL', delay: 700 }],
];

const FOOTBALL_PATTERNS: PatternStep[][] = [
  [{ type: 'FOOTBALL_PLAYER', delay: 700 }, { type: 'FLYING_FOOTBALL', delay: 700 }, { type: 'FOOTBALL_PLAYER', delay: 700 }],
  [{ type: 'REFEREE', delay: 800, y: 250 }, { type: 'COIN', delay: 200, y: 150 }, { type: 'REFEREE', delay: 800, y: 250 }],
];

const GameEngine: React.FC<GameEngineProps> = ({ initialLives, levelId, startAtBoss = false, onGameOver, onScoreUpdate, onStatusChange }) => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.PLAYING);
  const [isPaused, setIsPaused] = useState(false);
  const [player, setPlayer] = useState<PlayerState>({
    y: 0, vy: 0, isJumping: false, isDucking: false, jumpCount: 0, isHurt: false
  });
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [backgroundEntities, setBackgroundEntities] = useState<BackgroundEntity[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [activePowerUp, setActivePowerUp] = useState<ActivePowerUp | null>(null);
  const [boss, setBoss] = useState<Obstacle | null>(null);
  const [multFeedback, setMultFeedback] = useState<string | null>(null);
  const [customCatUrl, setCustomCatUrl] = useState<string | null>(null);
  
  const requestRef = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const distanceRef = useRef(0);
  const yardRef = useRef(0);
  const coinsRef = useRef(startAtBoss ? BOSS_THRESHOLD : 0);
  const livesRef = useRef(initialLives);
  const speedRef = useRef(INITIAL_SPEED);
  const streakRef = useRef(0);
  const multiplierRef = useRef(1);
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

  useEffect(() => {
    const savedLook = localStorage.getItem('beach-cat-look');
    setCustomCatUrl(savedLook);
  }, []);

  const playSound = useCallback((type: string) => {
    try {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const audioCtx = new AudioContext();
      const osc = audioCtx.createOscillator();
      const windowGain = audioCtx.createGain();
      if (type === 'fart') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(110, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.2); windowGain.gain.setValueAtTime(0.1, audioCtx.currentTime); }
      else if (type === 'coin') { osc.type = 'sine'; osc.frequency.setValueAtTime(880, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.1); windowGain.gain.setValueAtTime(0.05, audioCtx.currentTime); }
      else if (type === 'mult') { osc.type = 'triangle'; osc.frequency.setValueAtTime(440, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); windowGain.gain.setValueAtTime(0.2, audioCtx.currentTime); }
      else if (type === 'hit') { osc.type = 'square'; osc.frequency.setValueAtTime(100, audioCtx.currentTime); windowGain.gain.setValueAtTime(0.2, audioCtx.currentTime); }
      else if (type === 'boing') { osc.type = 'sine'; osc.frequency.setValueAtTime(400, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.2); windowGain.gain.setValueAtTime(0.2, audioCtx.currentTime); }
      else if (type === 'shoot') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.2); windowGain.gain.setValueAtTime(0.1, audioCtx.currentTime); }
      else if (type === 'boss_alert') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(300, audioCtx.currentTime); osc.frequency.linearRampToValueAtTime(150, audioCtx.currentTime + 0.5); windowGain.gain.setValueAtTime(0.2, audioCtx.currentTime); }
      windowGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      osc.connect(windowGain); windowGain.connect(audioCtx.destination);
      osc.start(); osc.stop(audioCtx.currentTime + 0.5);
    } catch (error) {}
  }, []);

  const spawnBopParticles = useCallback((x: number, y: number, color: string = '#ffffff') => {
    const numParticles = 8;
    const newParticles: Particle[] = [];
    for (let i = 0; i < numParticles; i++) {
      newParticles.push({ id: Math.random() + Date.now(), x, y, vx: (Math.random() - 0.5) * 10, vy: Math.random() * 8, size: 5 + Math.random() * 8, opacity: 0.8, life: 1.0, color });
    }
    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, []);

  const spawnFartTrail = useCallback(() => {
    const numParticles = 6;
    const catCenterX = 100 + 64; 
    const catBottomY = GROUND_Y + playerRef.current.y + 10;
    const newParticles: Particle[] = [];
    for (let i = 0; i < numParticles; i++) {
      newParticles.push({ id: Math.random() + Date.now(), x: catCenterX + (Math.random() - 0.5) * 30, y: catBottomY + (Math.random() - 0.5) * 15, vx: -speedRef.current - (Math.random() * 3), vy: (status === GameStatus.PLAYING ? (Math.random() - 0.5) * 4 : 0), size: 15 + Math.random() * 20, opacity: 0.7, life: 1.0, color: levelId === 'FOOTBALL' ? 'rgba(255,255,255,0.4)' : 'rgba(120, 53, 15, 0.4)' });
    }
    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, [status, levelId]);

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
      playerRef.current = { ...playerRef.current, vy: JUMP_FORCE, jumpCount: playerRef.current.jumpCount + 1, isJumping: true, isDucking: false };
    }
  }, [playSound, spawnFartTrail]);

  const performDuck = useCallback((isDucking: boolean) => {
    if (status === GameStatus.BOSS_FIGHT) { if (isDucking) shootPoop(); return; }
    playerRef.current = { ...playerRef.current, isDucking: isDucking };
  }, [status, shootPoop]);

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

  const spawnEntity = useCallback((typeOverride?: EntityType, yOverride?: number) => {
    if (status !== GameStatus.PLAYING && !typeOverride) {
      if (status === GameStatus.BOSS_FIGHT && Math.random() < 0.4) {
        obstaclesRef.current.push({ id: Date.now() + Math.random(), type: 'SAND_PROJECTILE', x: window.innerWidth + 100, y: GROUND_Y + Math.random() * 300, width: 80, height: 80, speed: 14, isPassed: false });
      }
      return;
    }

    const beachTypes: ObstacleType[] = ['CRAB', 'CRAB', 'CRAB', 'BEACHBALL', 'SEAGULL', 'SANDCASTLE'];
    const footballTypes: ObstacleType[] = ['FOOTBALL_PLAYER', 'FLYING_FOOTBALL', 'REFEREE', 'WATER_COOLER'];
    
    const types = levelId === 'FOOTBALL' ? footballTypes : beachTypes;
    
    let isCoin = levelId === 'FOOTBALL' ? false : Math.random() < 0.8; 
    if (levelId !== 'FOOTBALL' && consecutiveHarmfulRef.current >= 2) isCoin = true;
    
    if (levelId === 'FOOTBALL' && !typeOverride && Math.random() < 0.8) {
        return;
    }

    const selectedType = typeOverride || (isCoin ? 'COIN' : types[Math.floor(Math.random() * types.length)]);
    
    if (HARMFUL_TYPES.includes(selectedType)) consecutiveHarmfulRef.current++; else consecutiveHarmfulRef.current = 0;
    
    let height = 120, width = 120, y = yOverride ?? GROUND_Y, isSwooping = false;
    
    if (selectedType === 'COIN' || selectedType === 'SPEED' || selectedType === 'MAGNET') { width = 60; height = 60; if (yOverride === undefined) y = GROUND_Y + Math.random() * 250; }
    else if (selectedType === 'SEAGULL' || selectedType === 'REFEREE') { height = 90; width = 110; isSwooping = Math.random() < 0.6; if (yOverride === undefined) y = isSwooping ? 350 : 220; }
    else if (selectedType === 'BEACHBALL' || selectedType === 'FLYING_FOOTBALL') width = 140; 
    else if (selectedType === 'CRAB' || selectedType === 'FOOTBALL_PLAYER') { width = 130; height = 110; }
    else if (selectedType === 'SANDCASTLE' || selectedType === 'WATER_COOLER') { width = 160; height = 130; } 
    else if (selectedType === 'TIDEPOOL') { width = 220; height = 50; }
    
    obstaclesRef.current.push({ id: Date.now() + Math.random(), type: selectedType as any, x: window.innerWidth + 200, y, isSwooping, width, height, speed: speedRef.current, isPassed: false });
  }, [status, levelId]);

  const spawnBackgroundDeco = useCallback(() => {
    if (levelId === 'FOOTBALL') {
        const types: BackgroundEntityType[] = ['STADIUM_LIGHT', 'GOAL_POST'];
        const type = types[Math.floor(Math.random() * types.length)];
        let x = window.innerWidth + 300, y = 0, speed = speedRef.current * 0.4, width = 150, height = 300;
        if (type === 'STADIUM_LIGHT') { y = window.innerHeight * 0.55; width = 200; height = 120; }
        else if (type === 'GOAL_POST') { y = GROUND_Y; width = 180; height = 250; speed = speedRef.current; }
        backgroundRef.current.push({ id: Date.now(), type, x, y, speed, width, height });
    } else {
        const types: BackgroundEntityType[] = ['BOAT', 'SURFER', 'AIRPLANE'];
        const type = types[Math.floor(Math.random() * types.length)];
        let y = 0, x = window.innerWidth + 500, speed = 2, width = 100, height = 100, bannerText = "";
        if (type === 'BOAT') { 
          y = window.innerHeight * 0.35 + Math.random() * (window.innerHeight * 0.1); 
          width = 240; 
          height = 120; 
          speed = speedRef.current * 0.15; 
        }
        else if (type === 'SURFER') { 
          y = window.innerHeight * 0.28 + Math.random() * (window.innerHeight * 0.05); 
          width = 70; 
          height = 50; 
          speed = speedRef.current * 0.2; 
        }
        else if (type === 'AIRPLANE') { 
          y = window.innerHeight * 0.55 + Math.random() * (window.innerHeight * 0.15); 
          width = 160; 
          height = 60; 
          speed = speedRef.current * 0.45; 
          bannerText = "WHO FARTED?"; 
        }
        backgroundRef.current.push({ id: Date.now(), type, x, y, speed, width, height, bannerText });
    }
  }, [levelId]);

  const triggerBossFight = useCallback(() => {
    setStatus(GameStatus.BOSS_FIGHT);
    onStatusChange?.(GameStatus.BOSS_FIGHT);
    obstaclesRef.current = [];
    setObstacles([]);
    playSound('boss_alert');
    bossHealthRef.current = 100;
    setBoss({ id: 999, type: 'BOSS', x: window.innerWidth - 450, y: GROUND_Y + 100, width: 320, height: 320, speed: 0, isPassed: false, health: 100, maxHealth: 100 });
  }, [onStatusChange, playSound]);

  const update = useCallback((time: number) => {
    if (isPaused) return;

    const now = Date.now();
    const speedMultiplier = activePowerUpRef.current?.type === 'SPEED' ? 1.7 : 1.0;
    
    if (status === GameStatus.PLAYING) {
        scoreRef.current += 1 * multiplierRef.current;
        distanceRef.current += speedRef.current * speedMultiplier;
        
        if (levelId === 'FOOTBALL') {
            yardRef.current = Math.min(YARDS_GOAL, Math.floor(distanceRef.current / PIXELS_PER_YARD));
        }
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
        lives: livesRef.current,
        yards: yardRef.current 
      });
    }

    if (status === GameStatus.PLAYING) {
        speedRef.current += SPEED_INCREMENT * speedMultiplier;
    } else {
        speedRef.current = Math.max(0, speedRef.current * 0.95);
    }

    const p = playerRef.current;
    let newY = p.y + p.vy;
    let newVy = p.vy - GRAVITY;
    if (newY <= 0) { newY = 0; newVy = 0; p.isJumping = false; p.jumpCount = 0; }
    playerRef.current = { ...p, y: newY, vy: newVy, isHurt: isCurrentlyHurt };
    setPlayer({ ...playerRef.current });

    if (status === GameStatus.PLAYING && time - lastBackgroundTime.current > (levelId === 'FOOTBALL' ? 3000 : 7000)) {
      spawnBackgroundDeco();
      lastBackgroundTime.current = time;
    }
    backgroundRef.current = backgroundRef.current.map(b => ({ ...b, x: b.x - (status === GameStatus.PLAYING ? b.speed : b.speed * 0.1) })).filter(b => b.x > -1500);
    setBackgroundEntities([...backgroundRef.current]);

    particlesRef.current = particlesRef.current.map(part => ({ ...part, x: part.x + part.vx, y: part.y + part.vy, life: part.life - 0.02, opacity: part.life * 0.6, size: part.size + 0.4 })).filter(part => part.life > 0);
    setParticles([...particlesRef.current]);

    bulletsRef.current = bulletsRef.current.map(b => b.x < window.innerWidth + 100 ? { ...b, x: b.x + b.speed } : b).filter(b => b.x < window.innerWidth + 100);

    if (activePowerUpRef.current?.type === 'MAGNET') {
      const catX = 100 + 64, catY = GROUND_Y + playerRef.current.y + 40;
      obstaclesRef.current.forEach(obs => { if (obs.type === 'COIN') { const dx = catX - obs.x, dy = catY - (obs.y || GROUND_Y); const dist = Math.sqrt(dx * dx + dy * dy); if (dist < 450) { obs.x += dx * 0.2; obs.y = (obs.y || GROUND_Y) + dy * 0.2; } } });
    }

    if (status === GameStatus.PLAYING && (
        (levelId === 'FOOTBALL' && yardRef.current >= YARDS_GOAL) || 
        (levelId !== 'FOOTBALL' && coinsRef.current >= BOSS_THRESHOLD)
    )) {
        triggerBossFight();
    }

    if (status === GameStatus.PLAYING) {
      if (now > nextSpawnTime.current) {
        if (patternQueue.current.length === 0) {
          const patternChance = Math.min(0.15 + (scoreRef.current / 12000), 0.7);
          if (Math.random() < patternChance) { 
            patternQueue.current = levelId === 'FOOTBALL' 
                ? [...FOOTBALL_PATTERNS[Math.floor(Math.random() * FOOTBALL_PATTERNS.length)]]
                : [...BEACH_PATTERNS[Math.floor(Math.random() * BEACH_PATTERNS.length)]]; 
          }
          else {
            if (coinCounterRef.current >= POWERUP_THRESHOLD) { spawnEntity(Math.random() > 0.5 ? 'SPEED' : 'MAGNET'); coinCounterRef.current = 0; }
            else { spawnEntity(); }
            nextSpawnTime.current = now + (1200 - Math.min(speedRef.current * 45, 800) + (Math.random() - 0.5) * 400) / speedMultiplier;
          }
        }
        if (patternQueue.current.length > 0) { const step = patternQueue.current.shift()!; spawnEntity(step.type, step.y); nextSpawnTime.current = now + (step.delay / speedMultiplier); }
      }
    } else if (status === GameStatus.BOSS_FIGHT) {
      if (time - lastObstacleTime.current > 1100) { spawnEntity(); lastObstacleTime.current = time; }
    }

    if (status === GameStatus.BOSS_FIGHT && boss) {
        const updatedBoss = { 
          ...boss, 
          x: Math.max(window.innerWidth - 450, boss.x - 3), 
          y: GROUND_Y + Math.sin(time / 500) * 50 + 50, 
          health: bossHealthRef.current 
        };
        setBoss(updatedBoss);
        
        bulletsRef.current = bulletsRef.current.filter(b => {
            const hit = b.x > updatedBoss.x && 
                        b.x < updatedBoss.x + updatedBoss.width &&
                        b.y > updatedBoss.y && 
                        b.y < updatedBoss.y + updatedBoss.height;
            if (hit) {
                bossHealthRef.current -= 4;
                if (bossHealthRef.current <= 0) {
                    playSound('mult'); coinsRef.current = 0; setStatus(GameStatus.PLAYING);
                    onStatusChange?.(GameStatus.PLAYING); setBoss(null); multiplierRef.current += 3;
                    setMultFeedback(levelId === 'FOOTBALL' ? "TOUCHDOWN!" : "+3 MULTIPLIER!"); 
                    setTimeout(() => setMultFeedback(null), 2000);
                }
                return false;
            }
            return true;
        });
    }

    setBullets([...bulletsRef.current]);

    const kittyW = 80, kittyH = playerRef.current.isDucking ? 45 : 100, kittyL = 100 + 24, kittyR = 100 + 24 + kittyW, kittyB = GROUND_Y + playerRef.current.y, kittyT = GROUND_Y + playerRef.current.y + kittyH;
    const kRect = { l: kittyL, r: kittyR, b: kittyB, t: kittyT };
    
    obstaclesRef.current = obstaclesRef.current.map(obs => {
      const step = (obs.type === 'SAND_PROJECTILE' ? 14 : speedRef.current * speedMultiplier);
      const newX = obs.x - step;
      let newY = obs.y ?? GROUND_Y;
      if ((obs.type === 'SEAGULL' || obs.type === 'REFEREE') && obs.isSwooping) { const prog = Math.abs(newX - window.innerWidth/2) / (window.innerWidth/2); newY = 120 + (prog * 230); }
      if (!obs.isPassed && HARMFUL_TYPES.includes(obs.type) && newX < kRect.l) {
        obs.isPassed = true; streakRef.current++;
        if (streakRef.current >= STREAK_REQUIRED) { multiplierRef.current++; streakRef.current = 0; playSound('mult'); setMultFeedback("MULTIPLIER UP!"); setTimeout(() => setMultFeedback(null), 1000); }
      }
      return { ...obs, x: newX, y: newY };
    }).filter(obs => obs.x > -400);

    for (const obs of obstaclesRef.current) {
      if (obs.isCollected) continue;
      const oY = obs.y ?? (obs.type === 'SEAGULL' || obs.type === 'REFEREE' ? 220 : GROUND_Y);
      const hPadding = 10, vPadding = 5;
      const oRect = { l: obs.x + hPadding, r: obs.x + obs.width - hPadding, b: oY + vPadding, t: oY + obs.height - vPadding };
      let overlaps = (kRect.r > oRect.l && kRect.l < oRect.r && kRect.t > oRect.b && kRect.b < oRect.t);
      if (overlaps) {
        if (obs.type === 'COIN') { playSound('coin'); coinsRef.current++; coinCounterRef.current++; obs.isCollected = true; continue; } 
        if (obs.type === 'SPEED' || obs.type === 'MAGNET') { playSound('powerup'); activePowerUpRef.current = { type: obs.type as PowerUpType, endTime: Date.now() + 10000 }; setActivePowerUp(activePowerUpRef.current); obs.isCollected = true; continue; }
        const isLanding = playerRef.current.vy < 0 && (kRect.b >= oRect.t - 30);
        if (isLanding) {
          if (obs.type === 'CRAB' || obs.type === 'FOOTBALL_PLAYER') { playSound('boing'); spawnBopParticles(obs.x + obs.width/2, oRect.t, '#ef4444'); playerRef.current.vy = 8; playerRef.current.jumpCount = 1; obs.isCollected = true; continue; }
          else if (obs.type === 'BEACHBALL' || obs.type === 'FLYING_FOOTBALL') { playSound('boing'); spawnBopParticles(obs.x + obs.width/2, oRect.t, '#fde047'); playerRef.current.vy = BOUNCE_FORCE; playerRef.current.jumpCount = 1; obs.isPassed = true; continue; }
          else if (obs.type === 'SEAGULL' || obs.type === 'REFEREE' || obs.type === 'SAND_PROJECTILE') { playSound('boing'); spawnBopParticles(obs.x + obs.width/2, oRect.t, '#ffffff'); playerRef.current.vy = 8; playerRef.current.jumpCount = 1; obs.isCollected = true; continue; }
        } else if (HARMFUL_TYPES.includes(obs.type) && !isCurrentlyHurt) {
          livesRef.current--;
          invincibilityUntilRef.current = now + INVINCIBILITY_DURATION;
          playSound('hit');
          streakRef.current = 0;
          if (livesRef.current <= 0) {
            setStatus(GameStatus.GAMEOVER);
            onGameOver(Math.floor(scoreRef.current / 10));
          }
        }
      }
    }
    setObstacles([...obstaclesRef.current]);
  }, [status, levelId, onGameOver, onScoreUpdate, onStatusChange, playSound, spawnBackgroundDeco, spawnBopParticles, spawnEntity, triggerBossFight, isPaused]);

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

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      {/* HUD - Pause Button */}
      <div className="absolute top-6 right-6 z-[60] pointer-events-auto">
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
        {/* Background Decor */}
        {backgroundEntities.map(b => (
          <div 
            key={b.id} 
            className="absolute flex items-end" 
            style={{ left: b.x, bottom: b.y, width: b.width, height: b.height, zIndex: b.type === 'GOAL_POST' ? 10 : 0 }}
          >
            {b.type === 'BOAT' && (
              <div className="relative w-full h-full">
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
                <div className="absolute bottom-[-10px] w-full h-4 bg-white/20 blur-sm rounded-full" />
              </div>
            )}
            {b.type === 'SURFER' && <span className="text-4xl">🏄</span>}
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
                <div className="w-10 h-0.5 bg-slate-400 opacity-60" />
                <div className="bg-white/95 backdrop-blur-sm border-4 border-red-500 px-6 py-2 rounded-2xl shadow-xl flex items-center h-12">
                  <span className="text-red-600 font-black text-sm uppercase tracking-widest whitespace-nowrap drop-shadow-sm">
                    {b.bannerText}
                  </span>
                </div>
              </div>
            )}
            {b.type === 'STADIUM_LIGHT' && (
              <div className="relative w-full h-full">
                <div className="w-2 h-full bg-slate-700 mx-auto" />
                <div className="absolute top-0 w-full h-12 bg-slate-800 rounded-lg flex justify-around p-1">
                  {[...Array(4)].map((_, i) => <div key={i} className="w-4 h-4 bg-yellow-100 rounded-full shadow-[0_0_10px_white]" />)}
                </div>
              </div>
            )}
            {b.type === 'GOAL_POST' && (
              <svg viewBox="0 0 100 150" className="w-full h-full">
                <path d="M20 0 L 20 80 L 80 80 L 80 0 M 50 80 L 50 150" fill="none" stroke="#facc15" strokeWidth="8" />
              </svg>
            )}
          </div>
        ))}

        {/* Obstacles & Coins */}
        {obstacles.map(obs => (
          <ObstacleComponent key={obs.id} obstacle={obs} groundY={GROUND_Y} />
        ))}

        {/* Particles */}
        {particles.map(p => (
          <div 
            key={p.id} 
            className="absolute rounded-full" 
            style={{ 
              left: p.x, 
              bottom: p.y, 
              width: p.size, 
              height: p.size, 
              backgroundColor: p.color || 'white', 
              opacity: p.opacity,
              transform: 'translate(-50%, 50%)'
            }} 
          />
        ))}

        {/* Bullets */}
        {bullets.map(b => (
          <div 
            key={b.id} 
            className="absolute flex items-center justify-center text-3xl" 
            style={{ left: b.x, bottom: b.y, width: b.size, height: b.size }}
          >
            💩
          </div>
        ))}

        {/* Boss */}
        {boss && (
          <div className="absolute" style={{ left: boss.x, bottom: boss.y, width: boss.width, height: boss.height }}>
            {levelId === 'FOOTBALL' ? (
              <FootballBoss health={boss.health || 0} maxHealth={boss.maxHealth || 100} />
            ) : (
              <SandMonster health={boss.health || 0} maxHealth={boss.maxHealth || 100} />
            )}
          </div>
        )}

        {/* Player */}
        <div 
          className="absolute transition-transform duration-75"
          style={{ 
            left: '100px', 
            bottom: `${GROUND_Y + player.y}px`,
            filter: player.isHurt ? 'opacity(0.5) sepia(1) saturate(5) hue-rotate(-50deg)' : 'none'
          }}
        >
          <Kitty isJumping={player.isJumping} isDucking={player.isDucking} customUrl={customCatUrl} />
        </div>

        {/* UI Feedbacks */}
        {multFeedback && (
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce">
            <span className="text-6xl font-black text-white italic drop-shadow-[0_5px_0_black] uppercase">{multFeedback}</span>
          </div>
        )}

        {activePowerUp && (
          <div className="absolute top-32 left-1/2 -translate-x-1/2 bg-white/90 px-6 py-2 rounded-full border-4 border-amber-400 shadow-xl flex items-center gap-4">
            <span className="font-black text-amber-900 uppercase tracking-widest text-sm">
              {activePowerUp.type} ACTIVE
            </span>
            <div className="w-32 h-3 bg-amber-100 rounded-full overflow-hidden border border-amber-200">
                <div 
                  className="h-full bg-amber-500 transition-all duration-100" 
                  style={{ width: `${((activePowerUp.endTime - Date.now()) / 10000) * 100}%` }}
                />
            </div>
          </div>
        )}
      </div>

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
