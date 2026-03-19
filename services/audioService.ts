
// Procedural beach music using Web Audio API
// Generates a chill, looping soundtrack that responds to game state.
// Timing uses rAF + lookahead scheduling (beats aligned to audio clock, not setInterval drift).

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let isPlaying = false;
let rafId: number | null = null;

// Beach-y chord progression (C major pentatonic vibes)
const NOTES = {
  C3: 130.81, D3: 146.83, E3: 164.81, G3: 196.00, A3: 220.00,
  C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.00, A4: 440.00,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.00
};

const CHORD_PROGRESSION = [
  [NOTES.C3, NOTES.E4, NOTES.G4, NOTES.C5],  // C major
  [NOTES.A3, NOTES.C4, NOTES.E4, NOTES.A4],  // A minor
  [NOTES.G3, NOTES.D4, NOTES.G4, NOTES.D5],  // G major
  [NOTES.C3, NOTES.E4, NOTES.G4, NOTES.C5],  // C major
];

let currentChordIndex = 0;
let currentBeat = 0;
let tempo = 120; // BPM
/** Next beat scheduled on the audio timeline (seconds). */
let nextBeatTime = 0;

/** Pending delayed close from stopMusic — cleared on restart so we never close a new AudioContext. */
let musicCloseTimeoutId: ReturnType<typeof setTimeout> | null = null;

function createOscillatorAt(
  freq: number,
  type: OscillatorType,
  duration: number,
  volume: number,
  start: number
): void {
  if (!audioContext || !masterGain) return;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);

  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.05);
  gain.gain.linearRampToValueAtTime(volume * 0.7, start + duration * 0.5);
  gain.gain.linearRampToValueAtTime(0, start + duration);

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start(start);
  osc.stop(start + duration + 0.1);
}

function playBeatAt(start: number): void {
  if (!audioContext || !isPlaying) return;

  const chord = CHORD_PROGRESSION[currentChordIndex];
  const beatDuration = 60 / tempo;

  if (currentBeat % 2 === 0) {
    createOscillatorAt(chord[0], 'sine', beatDuration * 1.5, 0.08, start);
  }

  const arpeggioNote = chord[1 + (currentBeat % 3)];
  if (arpeggioNote) {
    createOscillatorAt(arpeggioNote, 'triangle', beatDuration * 0.8, 0.04, start);
  }

  if (currentBeat % 2 === 1 && Math.random() > 0.5) {
    const sparkleNote = chord[3] || chord[2];
    createOscillatorAt(sparkleNote * 2, 'sine', beatDuration * 0.3, 0.02, start);
  }

  currentBeat++;
  if (currentBeat >= 4) {
    currentBeat = 0;
    currentChordIndex = (currentChordIndex + 1) % CHORD_PROGRESSION.length;
  }
}

const LOOKAHEAD_SEC = 0.08;

function musicScheduler(): void {
  if (!isPlaying || !audioContext) {
    rafId = null;
    return;
  }

  const secPerBeat = 60 / tempo;
  while (nextBeatTime < audioContext.currentTime + LOOKAHEAD_SEC) {
    playBeatAt(nextBeatTime);
    nextBeatTime += secPerBeat;
  }

  rafId = requestAnimationFrame(musicScheduler);
}

export function startMusic(initialTempo: number = 120): void {
  if (isPlaying) return;

  if (musicCloseTimeoutId !== null) {
    clearTimeout(musicCloseTimeoutId);
    musicCloseTimeoutId = null;
  }

  try {
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    audioContext = new AudioContextClass();
    masterGain = audioContext.createGain();
    masterGain.gain.setValueAtTime(0.3, audioContext.currentTime);
    masterGain.connect(audioContext.destination);

    tempo = initialTempo;
    isPlaying = true;
    currentBeat = 0;
    currentChordIndex = 0;
    nextBeatTime = audioContext.currentTime;

    musicScheduler();
  } catch (e) {
    console.error('Failed to start music:', e);
  }
}

export function stopMusic(): void {
  isPlaying = false;

  if (musicCloseTimeoutId !== null) {
    clearTimeout(musicCloseTimeoutId);
    musicCloseTimeoutId = null;
  }

  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  const ctxToClose = audioContext;
  const gainToFade = masterGain;

  if (gainToFade && ctxToClose) {
    gainToFade.gain.linearRampToValueAtTime(0, ctxToClose.currentTime + 0.5);
  }

  musicCloseTimeoutId = setTimeout(() => {
    musicCloseTimeoutId = null;
    void ctxToClose?.close();
    if (audioContext === ctxToClose) {
      audioContext = null;
      masterGain = null;
    }
  }, 600);
}

export function setMusicTempo(newTempo: number): void {
  if (!isPlaying) return;

  const clamped = Math.max(80, Math.min(180, newTempo));
  if (tempo === clamped) return;

  tempo = clamped;
  if (audioContext) {
    nextBeatTime = audioContext.currentTime;
  }
}

export function setMusicVolume(volume: number): void {
  if (masterGain && audioContext) {
    masterGain.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.1);
  }
}

export function setBossMode(isBoss: boolean): void {
  if (isBoss) {
    setMusicTempo(150);
    setMusicVolume(0.4);
  } else {
    setMusicTempo(120);
    setMusicVolume(0.3);
  }
}
