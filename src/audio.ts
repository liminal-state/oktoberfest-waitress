// Tiny WebAudio synth: oompah band loop, crowd murmur, and one-shot SFX.
export class AudioSys {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private schedulerId: number | null = null;
  private nextBeat = 0;
  private beatIndex = 0;

  /** Must be called from a user gesture. */
  start() {
    if (this.ctx) {
      this.ctx.resume();
      return;
    }
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    this.startCrowd();
    this.nextBeat = this.ctx.currentTime + 0.1;
    this.schedulerId = window.setInterval(() => this.schedule(), 120);
  }

  stopMusic() {
    if (this.schedulerId !== null) {
      clearInterval(this.schedulerId);
      this.schedulerId = null;
    }
  }

  private schedule() {
    if (!this.ctx) return;
    const beatLen = 60 / 138; // brisk polka
    while (this.nextBeat < this.ctx.currentTime + 0.35) {
      this.oompahBeat(this.nextBeat, this.beatIndex);
      this.nextBeat += beatLen;
      this.beatIndex++;
    }
  }

  private oompahBeat(t: number, i: number) {
    if (!this.ctx || !this.master) return;
    const bar = i % 4;
    if (bar === 0 || bar === 2) {
      // OOM: tuba root note (alternate C2 / G1)
      this.blip(t, bar === 0 ? 65.4 : 49, 'triangle', 0.22, 0.25);
    } else {
      // PAH: offbeat chord stab
      this.blip(t, 261.6, 'square', 0.05, 0.08);
      this.blip(t, 329.6, 'square', 0.04, 0.08);
      this.blip(t, 392, 'square', 0.04, 0.08);
    }
    // every 8 bars a little clarinet noodle note
    if (i % 32 === 16) this.blip(t, 523 + Math.random() * 200, 'sawtooth', 0.03, 0.3);
  }

  private blip(t: number, freq: number, type: OscillatorType, gain: number, dur: number) {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private startCrowd() {
    if (!this.ctx || !this.master) return;
    const len = 2 * this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 500;
    filter.Q.value = 0.5;
    const g = this.ctx.createGain();
    g.gain.value = 0.06;
    src.connect(filter).connect(g).connect(this.master);
    src.start();
    // slow warble so it sounds like chatter swells
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.13;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.025;
    lfo.connect(lfoGain).connect(g.gain);
    lfo.start();
  }

  splash() {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const len = 0.25 * this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1200;
    const g = this.ctx.createGain();
    g.gain.value = 0.5;
    src.connect(filter).connect(g).connect(this.master);
    src.start(t);
  }

  clink() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.blip(t, 1800, 'sine', 0.15, 0.12);
    this.blip(t + 0.02, 2400, 'sine', 0.08, 0.1);
  }

  cash(big = false) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.blip(t, 880, 'sine', 0.18, 0.1);
    this.blip(t + 0.09, 1320, 'sine', 0.18, 0.14);
    if (big) this.blip(t + 0.18, 1760, 'sine', 0.16, 0.2);
  }

  reject() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.blip(t, 220, 'sawtooth', 0.15, 0.18);
    this.blip(t + 0.15, 165, 'sawtooth', 0.15, 0.28);
  }

  cheer() {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    // noise swell
    const len = 1.4 * this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const env = Math.sin((i / len) * Math.PI);
      d[i] = (Math.random() * 2 - 1) * env;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.7;
    const g = this.ctx.createGain();
    g.gain.value = 0.25;
    src.connect(filter).connect(g).connect(this.master);
    src.start(t);
    this.clink();
  }
}
