/**
 * PhaserAudio — Procedural SFX and music for the Phaser 3 port.
 *
 * Wraps Phaser's WebAudioSoundManager.context so all audio shares a
 * single AudioContext (no dual-context issues).  Replaces the legacy
 * audioService.ts (music) and sfxService.ts (SFX).
 *
 * Usage:
 *   const audio = new PhaserAudio(scene);
 *   audio.playSfx('coin');
 *   audio.startMusic();
 *   audio.setBossMode(true);
 *   // in scene shutdown:
 *   audio.destroy();
 */
import Phaser from 'phaser';

// ---------------------------------------------------------------------------
// SFX type union
// ---------------------------------------------------------------------------

export type ProceduralSfxType =
  | 'coin'
  | 'jump'
  | 'hit'
  | 'meow'
  | 'boing'
  | 'boss_hit'
  | 'boss_alert'
  | 'boss_rumble'
  | 'mult'
  | 'poop_launch'
  | 'shoot'
  | 'powerup'
  | 'brick_hit'
  | 'brick_break'
  | 'paddle_hit'
  | 'ball_lost';

// ---------------------------------------------------------------------------
// Music note table (C-major pentatonic)
// ---------------------------------------------------------------------------

const NOTES = {
  C3: 130.81, D3: 146.83, E3: 164.81, G3: 196.0,  A3: 220.0,
  C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.0,  A4: 440.0,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0,
} as const;

/** Normal gameplay chord progression. */
const NORMAL_CHORDS: number[][] = [
  [NOTES.C3, NOTES.E4, NOTES.G4, NOTES.C5],
  [NOTES.A3, NOTES.C4, NOTES.E4, NOTES.A4],
  [NOTES.G3, NOTES.D4, NOTES.G4, NOTES.D5],
  [NOTES.C3, NOTES.E4, NOTES.G4, NOTES.C5],
];

/** Boss-fight chord progression — darker, more intense. */
const BOSS_CHORDS: number[][] = [
  [NOTES.A3, NOTES.C4, NOTES.E4, NOTES.A4],
  [NOTES.G3, NOTES.D4, NOTES.G4, NOTES.D5],
  [NOTES.E3, NOTES.G4, NOTES.C5, NOTES.E5],
  [NOTES.A3, NOTES.C4, NOTES.E4, NOTES.A4],
];

// ---------------------------------------------------------------------------
// PhaserAudio class
// ---------------------------------------------------------------------------

export class PhaserAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  /** Phaser timer used for the beat scheduler. */
  private beatTimer: Phaser.Time.TimerEvent | null = null;
  private scene: Phaser.Scene;

  // Music state
  private musicPlaying = false;
  private bossMode = false;
  private tempo = 120;
  private currentBeat = 0;
  private currentChordIndex = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initContext();
  }

  // -----------------------------------------------------------------------
  // Context helpers
  // -----------------------------------------------------------------------

  private initContext(): void {
    const soundManager = this.scene.sound;

    // Phaser's WebAudioSoundManager exposes `context`
    if (
      soundManager &&
      'context' in soundManager &&
      (soundManager as Phaser.Sound.WebAudioSoundManager).context
    ) {
      this.ctx = (soundManager as Phaser.Sound.WebAudioSoundManager).context;
    } else {
      // Fallback: create our own context (e.g. NoAudioSoundManager scenarios)
      try {
        this.ctx = new AudioContext();
      } catch {
        this.ctx = null;
      }
    }

    if (this.ctx) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
  }

  /** Ensure the AudioContext is running (autoplay policies). */
  private resumeContext(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  // -----------------------------------------------------------------------
  // Procedural SFX
  // -----------------------------------------------------------------------

  playSfx(type: ProceduralSfxType, opts?: { isBossFight?: boolean }): void {
    if (!this.ctx || !this.masterGain) return;
    this.resumeContext();

    const isBoss = opts?.isBossFight ?? this.bossMode;
    const t0 = this.ctx.currentTime;
    let duration = 0.2;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    switch (type) {
      // -- Coin: ascending sine chirp -----------------------------------------
      case 'coin':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t0);
        osc.frequency.exponentialRampToValueAtTime(1320, t0 + 0.1);
        gain.gain.setValueAtTime(0.05, t0);
        duration = 0.2;
        break;

      // -- Jump: ascending sine sweep ----------------------------------------
      case 'jump':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, t0);
        osc.frequency.exponentialRampToValueAtTime(660, t0 + 0.1);
        gain.gain.setValueAtTime(0.08, t0);
        duration = 0.15;
        break;

      // -- Hit: descending square (normal) or lower boss variant --------------
      case 'hit':
        if (isBoss) {
          osc.type = 'square';
          osc.frequency.setValueAtTime(80, t0);
          osc.frequency.exponentialRampToValueAtTime(40, t0 + 0.3);
          gain.gain.setValueAtTime(0.3, t0);
        } else {
          osc.type = 'square';
          osc.frequency.setValueAtTime(100, t0);
          gain.gain.setValueAtTime(0.2, t0);
        }
        duration = 0.3;
        break;

      // -- Meow: sawtooth sweep -----------------------------------------------
      case 'meow':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(700, t0);
        osc.frequency.exponentialRampToValueAtTime(400, t0 + 0.15);
        osc.frequency.exponentialRampToValueAtTime(900, t0 + 0.3);
        gain.gain.setValueAtTime(0.12, t0);
        duration = 0.4;
        break;

      // -- Boing: sine bounce upward ------------------------------------------
      case 'boing':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, t0);
        osc.frequency.exponentialRampToValueAtTime(1000, t0 + 0.2);
        gain.gain.setValueAtTime(0.2, t0);
        duration = 0.2;
        break;

      // -- Boss hit: deep square punch ----------------------------------------
      case 'boss_hit':
        osc.type = 'square';
        osc.frequency.setValueAtTime(50, t0);
        osc.frequency.exponentialRampToValueAtTime(25, t0 + 0.4);
        gain.gain.setValueAtTime(0.4, t0);
        duration = 0.5;
        break;

      // -- Boss alert: descending sawtooth ------------------------------------
      case 'boss_alert':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, t0);
        osc.frequency.linearRampToValueAtTime(150, t0 + 0.5);
        gain.gain.setValueAtTime(0.2, t0);
        duration = 0.5;
        break;

      // -- Boss rumble: low sawtooth drone ------------------------------------
      case 'boss_rumble':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(45, t0);
        gain.gain.setValueAtTime(0.08, t0);
        duration = 0.4;
        break;

      // -- Multiplier: ascending triangle arpeggio ----------------------------
      case 'mult':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, t0);
        osc.frequency.exponentialRampToValueAtTime(880, t0 + 0.3);
        gain.gain.setValueAtTime(0.2, t0);
        duration = 0.4;
        break;

      // -- Poop launch: low sawtooth splat ------------------------------------
      case 'poop_launch':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(60, t0);
        osc.frequency.exponentialRampToValueAtTime(30, t0 + 0.15);
        gain.gain.setValueAtTime(0.25, t0);
        duration = 0.3;
        break;

      // -- Shoot: descending sawtooth -----------------------------------------
      case 'shoot':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, t0);
        osc.frequency.exponentialRampToValueAtTime(50, t0 + 0.2);
        gain.gain.setValueAtTime(0.1, t0);
        duration = 0.2;
        break;

      // -- Powerup: ascending sine sweep --------------------------------------
      case 'powerup':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, t0);
        osc.frequency.exponentialRampToValueAtTime(880, t0 + 0.15);
        gain.gain.setValueAtTime(0.15, t0);
        duration = 0.2;
        break;

      // -- Breakout: brick tap ------------------------------------------------
      case 'brick_hit':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, t0);
        osc.frequency.exponentialRampToValueAtTime(180, t0 + 0.06);
        gain.gain.setValueAtTime(0.12, t0);
        duration = 0.08;
        break;

      // -- Breakout: brick destroyed ------------------------------------------
      case 'brick_break':
        osc.type = 'square';
        osc.frequency.setValueAtTime(520, t0);
        osc.frequency.exponentialRampToValueAtTime(220, t0 + 0.12);
        gain.gain.setValueAtTime(0.14, t0);
        duration = 0.14;
        break;

      // -- Breakout: paddle ----------------------------------------------------
      case 'paddle_hit':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(240, t0);
        osc.frequency.exponentialRampToValueAtTime(360, t0 + 0.08);
        gain.gain.setValueAtTime(0.1, t0);
        duration = 0.1;
        break;

      // -- Breakout: ball lost -------------------------------------------------
      case 'ball_lost':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, t0);
        osc.frequency.exponentialRampToValueAtTime(60, t0 + 0.25);
        gain.gain.setValueAtTime(0.12, t0);
        duration = 0.28;
        break;

      default: {
        // Exhaustive check — if we reach here, a new type was added without
        // a case branch.
        const _never: never = type;
        void _never;
        osc.disconnect();
        gain.disconnect();
        return;
      }
    }

    // Envelope tail: fade to near-silence, then stop
    gain.gain.exponentialRampToValueAtTime(0.01, t0 + duration);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(t0);
    osc.stop(t0 + duration + 0.1);
  }

  // -----------------------------------------------------------------------
  // Procedural music
  // -----------------------------------------------------------------------

  startMusic(initialTempo = 120): void {
    if (this.musicPlaying) return;
    if (!this.ctx || !this.masterGain) return;
    this.resumeContext();

    this.tempo = initialTempo;
    this.musicPlaying = true;
    this.currentBeat = 0;
    this.currentChordIndex = 0;

    this.scheduleBeatTimer();
  }

  stopMusic(): void {
    if (!this.musicPlaying) return;
    this.musicPlaying = false;

    if (this.beatTimer) {
      this.beatTimer.destroy();
      this.beatTimer = null;
    }

    // Fade out master
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
      // Restore gain after fade for SFX that may still play
      const ctx = this.ctx;
      const mg = this.masterGain;
      this.scene.time.delayedCall(600, () => {
        mg.gain.setValueAtTime(0.3, ctx.currentTime);
      });
    }
  }

  setTempo(bpm: number): void {
    this.tempo = Math.max(80, Math.min(200, bpm));
    // Restart the timer loop with the new interval
    if (this.musicPlaying) {
      if (this.beatTimer) {
        this.beatTimer.destroy();
        this.beatTimer = null;
      }
      this.scheduleBeatTimer();
    }
  }

  setMusicVolume(volume: number): void {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(
        Math.max(0, Math.min(1, volume)),
        this.ctx.currentTime + 0.1,
      );
    }
  }

  setBossMode(isBoss: boolean): void {
    this.bossMode = isBoss;
    if (isBoss) {
      this.setTempo(150);
      this.setMusicVolume(0.4);
    } else {
      this.setTempo(120);
      this.setMusicVolume(0.3);
    }
    // Reset chord index so the new progression starts from the top
    this.currentChordIndex = 0;
    this.currentBeat = 0;
  }

  // -----------------------------------------------------------------------
  // Internal: beat scheduling via Phaser timer
  // -----------------------------------------------------------------------

  private scheduleBeatTimer(): void {
    const delayMs = (60 / this.tempo) * 1000;

    this.beatTimer = this.scene.time.addEvent({
      delay: delayMs,
      loop: true,
      callback: this.onBeat,
      callbackScope: this,
    });

    // Fire the first beat immediately
    this.onBeat();
  }

  private onBeat(): void {
    if (!this.ctx || !this.masterGain || !this.musicPlaying) return;

    const chords = this.bossMode ? BOSS_CHORDS : NORMAL_CHORDS;
    const chord = chords[this.currentChordIndex];
    const beatDuration = 60 / this.tempo;
    const t0 = this.ctx.currentTime;

    // Bass note on every other beat
    if (this.currentBeat % 2 === 0) {
      this.playNoteAt(chord[0], 'sine', beatDuration * 1.5, 0.08, t0);
    }

    // Arpeggio note
    const arpeggioNote = chord[1 + (this.currentBeat % 3)];
    if (arpeggioNote) {
      this.playNoteAt(
        arpeggioNote,
        this.bossMode ? 'square' : 'triangle',
        beatDuration * 0.8,
        this.bossMode ? 0.06 : 0.04,
        t0,
      );
    }

    // Sparkle on off-beats (normal) or percussive hit (boss)
    if (this.currentBeat % 2 === 1) {
      if (this.bossMode) {
        // Boss: low percussive thud
        this.playNoteAt(55, 'square', beatDuration * 0.3, 0.05, t0);
      } else if (Math.random() > 0.5) {
        const sparkleNote = chord[3] ?? chord[2];
        this.playNoteAt(sparkleNote * 2, 'sine', beatDuration * 0.3, 0.02, t0);
      }
    }

    // Advance beat / chord
    this.currentBeat++;
    if (this.currentBeat >= 4) {
      this.currentBeat = 0;
      this.currentChordIndex = (this.currentChordIndex + 1) % chords.length;
    }
  }

  /** Schedule a single oscillator note on the Web Audio timeline. */
  private playNoteAt(
    freq: number,
    type: OscillatorType,
    duration: number,
    volume: number,
    start: number,
  ): void {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.05);
    gain.gain.linearRampToValueAtTime(volume * 0.7, start + duration * 0.5);
    gain.gain.linearRampToValueAtTime(0, start + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(start);
    osc.stop(start + duration + 0.1);
  }

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  destroy(): void {
    this.stopMusic();
    // Don't close the AudioContext — it belongs to Phaser's SoundManager.
    this.ctx = null;
    this.masterGain = null;
  }
}
