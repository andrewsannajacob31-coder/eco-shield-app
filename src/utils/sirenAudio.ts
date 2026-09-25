// Emergency Siren Audio Synthesizer via Web Audio API
class SirenSynthesizer {
  private ctx: AudioContext | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private isMuted: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public start() {
    if (this.isPlaying) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Master Gain
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(this.isMuted ? 0 : 0.45, now);
      this.gainNode.connect(this.ctx.destination);

      // Primary Siren Oscillator (sawtooth for penetrating emergency tone)
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = 'sawtooth';
      this.osc1.frequency.setValueAtTime(800, now);

      // Secondary Harmonizing Oscillator for multi-frequency piercing civil defense sound
      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = 'sine';
      this.osc2.frequency.setValueAtTime(808, now);

      // LFO for the characteristic wailing siren sweep (sweeps pitch up and down between 700Hz and 1300Hz every 1.5s)
      this.lfo = this.ctx.createOscillator();
      this.lfo.type = 'triangle';
      this.lfo.frequency.setValueAtTime(0.75, now); // ~1.3 second cycle

      this.lfoGain = this.ctx.createGain();
      this.lfoGain.gain.setValueAtTime(350, now); // Frequency swing ±350Hz

      this.lfo.connect(this.lfoGain);
      this.lfoGain.connect(this.osc1.frequency);
      this.lfoGain.connect(this.osc2.frequency);

      this.osc1.connect(this.gainNode);
      this.osc2.connect(this.gainNode);

      this.lfo.start(now);
      this.osc1.start(now);
      this.osc2.start(now);

      this.isPlaying = true;
    } catch (e) {
      console.warn('AudioContext autoplay or init issue:', e);
    }
  }

  public stop() {
    if (!this.isPlaying) return;
    try {
      if (this.gainNode && this.ctx) {
        this.gainNode.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
      }
      setTimeout(() => {
        try {
          this.osc1?.stop();
          this.osc2?.stop();
          this.lfo?.stop();
          this.osc1?.disconnect();
          this.osc2?.disconnect();
          this.lfo?.disconnect();
          this.lfoGain?.disconnect();
          this.gainNode?.disconnect();
        } catch {
          // ignore cleanup errors
        }
        this.osc1 = null;
        this.osc2 = null;
        this.lfo = null;
        this.lfoGain = null;
        this.gainNode = null;
        this.isPlaying = false;
      }, 120);
    } catch (e) {
      console.warn('Error stopping siren:', e);
      this.isPlaying = false;
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.isMuted ? 0 : 0.45, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(muted ? 0 : 0.45, this.ctx.currentTime);
    }
  }

  public getIsPlaying() {
    return this.isPlaying;
  }

  public getIsMuted() {
    return this.isMuted;
  }
}

export const sirenPlayer = new SirenSynthesizer();
