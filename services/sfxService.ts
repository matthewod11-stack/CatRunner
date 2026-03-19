/**
 * In-game sound effects: MP3 clips under /public/sounds plus Web Audio one-shots.
 * Music lives in `audioService.ts`; this module is the dedicated SFX layer for gameplay.
 */

export const GAME_FILE_SFX_IDS = [
  'meow',
  'hiss',
  'cartoon-jump-6462',
  'boing-boing-bounce-454474',
  'cartoon-splat-310479',
  'fart-4-228244',
] as const;

export type GameFileSfxId = (typeof GAME_FILE_SFX_IDS)[number];

export function isGameFileSfx(type: string): type is GameFileSfxId {
  return (GAME_FILE_SFX_IDS as readonly string[]).includes(type);
}

const FILE_VOLUME: Partial<Record<GameFileSfxId, number>> = {
  meow: 0.4,
};

/** Clone cached element for overlap; ignores play errors (autoplay policies). */
export function playGameFileSfx(cached: HTMLAudioElement | undefined, type: GameFileSfxId): void {
  if (!cached) return;
  const audio = cached.cloneNode(true) as HTMLAudioElement;
  audio.volume = FILE_VOLUME[type] ?? 0.5;
  void audio.play().catch(() => {});
}

/** Procedural SFX using the engine’s dedicated AudioContext (not the music context). */
export function playProceduralGameSfx(
  audioCtx: AudioContext,
  type: string,
  opts: { isBossFight: boolean }
): void {
  const { isBossFight } = opts;
  const t0 = audioCtx.currentTime;
  let duration = 0.2;

  const osc = audioCtx.createOscillator();
  const windowGain = audioCtx.createGain();

  if (type === 'coin') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t0);
    osc.frequency.exponentialRampToValueAtTime(1320, t0 + 0.1);
    windowGain.gain.setValueAtTime(0.05, t0);
  } else if (type === 'mult') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, t0);
    osc.frequency.exponentialRampToValueAtTime(880, t0 + 0.3);
    windowGain.gain.setValueAtTime(0.2, t0);
  } else if (type === 'hit') {
    if (isBossFight) {
      osc.type = 'square';
      osc.frequency.setValueAtTime(80, t0);
      osc.frequency.exponentialRampToValueAtTime(40, t0 + 0.3);
      windowGain.gain.setValueAtTime(0.3, t0);
    } else {
      osc.type = 'square';
      osc.frequency.setValueAtTime(100, t0);
      windowGain.gain.setValueAtTime(0.2, t0);
    }
  } else if (type === 'boing') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t0);
    osc.frequency.exponentialRampToValueAtTime(1000, t0 + 0.2);
    windowGain.gain.setValueAtTime(0.2, t0);
  } else if (type === 'shoot') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t0);
    osc.frequency.exponentialRampToValueAtTime(50, t0 + 0.2);
    windowGain.gain.setValueAtTime(0.1, t0);
  } else if (type === 'boss_alert') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, t0);
    osc.frequency.linearRampToValueAtTime(150, t0 + 0.5);
    windowGain.gain.setValueAtTime(0.2, t0);
  } else if (type === 'poop_launch') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, t0);
    osc.frequency.exponentialRampToValueAtTime(30, t0 + 0.15);
    windowGain.gain.setValueAtTime(0.25, t0);
    duration = 0.3;
  } else if (type === 'boss_hit') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(50, t0);
    osc.frequency.exponentialRampToValueAtTime(25, t0 + 0.4);
    windowGain.gain.setValueAtTime(0.4, t0);
    duration = 0.5;
  } else if (type === 'boss_rumble') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(45, t0);
    windowGain.gain.setValueAtTime(0.08, t0);
  } else if (type === 'powerup') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t0);
    osc.frequency.exponentialRampToValueAtTime(880, t0 + 0.15);
    windowGain.gain.setValueAtTime(0.15, t0);
  } else {
    osc.disconnect();
    windowGain.disconnect();
    return;
  }

  windowGain.gain.exponentialRampToValueAtTime(0.01, t0 + duration);
  osc.connect(windowGain);
  windowGain.connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.1);
}

export function preloadGameFileSfx(): Record<string, HTMLAudioElement> {
  const cache: Record<string, HTMLAudioElement> = {};
  for (const id of GAME_FILE_SFX_IDS) {
    const audio = new Audio(`/sounds/${id}.mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    cache[id] = audio;
  }
  return cache;
}
