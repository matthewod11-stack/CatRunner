
// Procedural beach music using Web Audio API
// Generates a chill, looping soundtrack that responds to game state

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let isPlaying = false;
let loopInterval: number | null = null;

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

function createOscillator(freq: number, type: OscillatorType, duration: number, volume: number = 0.1): void {
  if (!audioContext || !masterGain) return;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioContext.currentTime);

  // Soft attack/release for dreamy sound
  gain.gain.setValueAtTime(0, audioContext.currentTime);
  gain.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.05);
  gain.gain.linearRampToValueAtTime(volume * 0.7, audioContext.currentTime + duration * 0.5);
  gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start();
  osc.stop(audioContext.currentTime + duration + 0.1);
}

function playBeat(): void {
  if (!audioContext || !isPlaying) return;

  const chord = CHORD_PROGRESSION[currentChordIndex];
  const beatDuration = 60 / tempo;

  // Bass note on beat 1 and 3
  if (currentBeat % 2 === 0) {
    createOscillator(chord[0], 'sine', beatDuration * 1.5, 0.08);
  }

  // Arpeggio pattern
  const arpeggioNote = chord[1 + (currentBeat % 3)];
  if (arpeggioNote) {
    createOscillator(arpeggioNote, 'triangle', beatDuration * 0.8, 0.04);
  }

  // High sparkle on off-beats
  if (currentBeat % 2 === 1 && Math.random() > 0.5) {
    const sparkleNote = chord[3] || chord[2];
    createOscillator(sparkleNote * 2, 'sine', beatDuration * 0.3, 0.02);
  }

  currentBeat++;
  if (currentBeat >= 4) {
    currentBeat = 0;
    currentChordIndex = (currentChordIndex + 1) % CHORD_PROGRESSION.length;
  }
}

export function startMusic(initialTempo: number = 120): void {
  if (isPlaying) return;

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

    // Start the beat loop
    const beatInterval = (60 / tempo) * 1000;
    playBeat();
    loopInterval = window.setInterval(playBeat, beatInterval);
  } catch (e) {
    console.error('Failed to start music:', e);
  }
}

export function stopMusic(): void {
  isPlaying = false;

  if (loopInterval) {
    clearInterval(loopInterval);
    loopInterval = null;
  }

  if (masterGain && audioContext) {
    masterGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
  }

  setTimeout(() => {
    if (audioContext) {
      audioContext.close();
      audioContext = null;
      masterGain = null;
    }
  }, 600);
}

export function setMusicTempo(newTempo: number): void {
  if (!isPlaying || tempo === newTempo) return;

  tempo = Math.max(80, Math.min(180, newTempo)); // Clamp between 80-180 BPM

  // Restart the loop with new tempo
  if (loopInterval) {
    clearInterval(loopInterval);
    const beatInterval = (60 / tempo) * 1000;
    loopInterval = window.setInterval(playBeat, beatInterval);
  }
}

export function setMusicVolume(volume: number): void {
  if (masterGain && audioContext) {
    masterGain.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.1);
  }
}

// Boss mode - switch to more intense music
export function setBossMode(isBoss: boolean): void {
  if (isBoss) {
    setMusicTempo(150);
    setMusicVolume(0.4);
  } else {
    setMusicTempo(120);
    setMusicVolume(0.3);
  }
}
