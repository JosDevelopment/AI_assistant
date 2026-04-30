"use client";

/**
 * Reactive audio analyser. Hooks an AudioContext to either an HTMLAudioElement
 * (TTS playback) or a MediaStream (microphone) and exposes a normalized 0-1
 * loudness value on each animation frame.
 */
export class AudioReactor {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source:
    | MediaElementAudioSourceNode
    | MediaStreamAudioSourceNode
    | null = null;
  private data: Uint8Array<ArrayBuffer> | null = null;
  private raf = 0;
  private listeners = new Set<(level: number) => void>();
  level = 0;

  private ensureCtx() {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new Ctor();
    }
    return this.ctx;
  }

  attachElement(el: HTMLAudioElement): boolean {
    try {
      const ctx = this.ensureCtx();
      this.disconnect();
      this.source = ctx.createMediaElementSource(el);
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.source.connect(this.analyser);
      this.analyser.connect(ctx.destination);
      this.data = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
      this.loop();
      return true;
    } catch (err) {
      console.warn("AudioReactor.attachElement failed", err);
      return false;
    }
  }

  attachStream(stream: MediaStream): boolean {
    try {
      const ctx = this.ensureCtx();
      this.disconnect();
      this.source = ctx.createMediaStreamSource(stream);
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.source.connect(this.analyser);
      this.data = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
      this.loop();
      return true;
    } catch (err) {
      console.warn("AudioReactor.attachStream failed", err);
      return false;
    }
  }

  private loop = () => {
    if (!this.analyser || !this.data) return;
    this.analyser.getByteFrequencyData(this.data);
    let sum = 0;
    for (let i = 0; i < this.data.length; i++) sum += this.data[i];
    const avg = sum / this.data.length / 255;
    this.level = Math.min(1, avg * 1.6);
    this.listeners.forEach((fn) => fn(this.level));
    this.raf = requestAnimationFrame(this.loop);
  };

  subscribe(fn: (level: number) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /**
   * Drive the level with a synthetic waveform — used when TTS isn't available
   * but we still want the orb to feel alive while the assistant "speaks".
   */
  simulate(durationMs: number) {
    this.disconnect();
    const start = performance.now();
    const tick = () => {
      const elapsed = performance.now() - start;
      if (elapsed >= durationMs) {
        this.level = 0;
        this.listeners.forEach((fn) => fn(0));
        this.raf = 0;
        return;
      }
      const t = elapsed / 1000;
      const base =
        0.45 +
        0.25 * Math.sin(t * 5.3) +
        0.15 * Math.sin(t * 11.1 + 0.7) +
        0.1 * Math.sin(t * 2.1 + 1.3);
      this.level = Math.max(0, Math.min(1, base * 0.8));
      this.listeners.forEach((fn) => fn(this.level));
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  disconnect() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    if (this.source) {
      try {
        this.source.disconnect();
      } catch {}
    }
    if (this.analyser) {
      try {
        this.analyser.disconnect();
      } catch {}
    }
    this.source = null;
    this.analyser = null;
    this.data = null;
    this.level = 0;
    this.listeners.forEach((fn) => fn(0));
  }
}
