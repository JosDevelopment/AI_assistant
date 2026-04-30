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
  private data: Uint8Array | null = null;
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

  attachElement(el: HTMLAudioElement) {
    const ctx = this.ensureCtx();
    this.disconnect();
    this.source = ctx.createMediaElementSource(el);
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.source.connect(this.analyser);
    this.analyser.connect(ctx.destination);
    this.data = new Uint8Array(this.analyser.frequencyBinCount);
    this.loop();
  }

  attachStream(stream: MediaStream) {
    const ctx = this.ensureCtx();
    this.disconnect();
    this.source = ctx.createMediaStreamSource(stream);
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.source.connect(this.analyser);
    this.data = new Uint8Array(this.analyser.frequencyBinCount);
    this.loop();
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
