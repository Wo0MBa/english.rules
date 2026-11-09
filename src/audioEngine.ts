// Synthesized Web Audio API Mechanical Keyboard & Studio Sound Engine
// Zero external audio dependencies; safe fallback if AudioContext is unavailable.

class StudioAudioEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  private getContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  /**
   * Realistic mechanical switch click (tactile downstroke click + hollow bottom-out thud)
   */
  public playKeystroke(variant: 'type' | 'backspace' | 'correct' = 'type'): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const pitchJitter = 0.92 + Math.random() * 0.16;

      // 1. White noise burst through a bandpass filter (switch tactile leaf click)
      const bufferSize = Math.floor(ctx.sampleRate * 0.024);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // Exponentially decaying noise burst inside the buffer itself
        const env = Math.pow(1 - i / bufferSize, 2.2);
        output[i] = (Math.random() * 2 - 1) * env;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      const baseFreq = variant === 'backspace' ? 2150 : variant === 'correct' ? 3100 : 2750;
      filter.frequency.setValueAtTime(baseFreq * pitchJitter, now);
      filter.Q.setValueAtTime(3.2, now);

      const clickGain = ctx.createGain();
      const peakGain = variant === 'backspace' ? 0.34 : 0.28;
      clickGain.gain.setValueAtTime(0.001, now);
      clickGain.gain.linearRampToValueAtTime(peakGain, now + 0.0015);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);

      noise.connect(filter);
      filter.connect(clickGain);
      clickGain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.024);

      // 2. Low-frequency resonant switch housing "thock" (hollow keycap bottom-out)
      const osc = ctx.createOscillator();
      const thudGain = ctx.createGain();
      osc.type = 'triangle';

      const startThud = (variant === 'backspace' ? 145 : 175) * pitchJitter;
      const endThud = (variant === 'backspace' ? 52 : 68) * pitchJitter;
      osc.frequency.setValueAtTime(startThud, now);
      osc.frequency.exponentialRampToValueAtTime(endThud, now + 0.038);

      thudGain.gain.setValueAtTime(0.001, now);
      thudGain.gain.linearRampToValueAtTime(variant === 'backspace' ? 0.24 : 0.18, now + 0.002);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.042);

      osc.connect(thudGain);
      thudGain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.044);
    } catch {
      // Ignore audio errors on restricted devices
    }
  }

  /**
   * Subtle highlighter marker focus sound for Step 3 (Clue Focus)
   */
  public playClueHighlight(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.11);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.11, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.17);
    } catch {
      // Safe fallback
    }
  }

  /**
   * Subtle success harmonic when Step 5 (Correct Answer) finishes typing
   */
  public playSuccessBadge(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [587.33, 880]; // D5 -> A5 crisp fifth
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.055;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.09, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.24);
      });
    } catch {
      // Safe fallback
    }
  }

  /**
   * Soft tactile card slide-in sound for Step 6 (Rule Card)
   */
  public playCardSlide(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(360, now + 0.09);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {
      // Safe fallback
    }
  }
}

export const soundEngine = new StudioAudioEngine();
