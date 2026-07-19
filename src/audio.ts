// Tiny WebAudio synth: Bavarian polka band loop, crowd murmur, and one-shot SFX.

const st = (semi: number, base: number) => base * Math.pow(2, semi / 12);
const C2 = 65.41, C4 = 261.63, C5 = 523.25;

// 8-bar polka in C, 2/4 time, one entry per bar
interface Bar {
  bassRoot: number;   // tuba beat 1
  bassFifth: number;  // tuba beat 2
  chord: number[];    // horn offbeat stab
}
const barC: Bar = { bassRoot: C2, bassFifth: st(7, C2), chord: [C4, st(4, C4), st(7, C4)] };
const barF: Bar = { bassRoot: st(5, C2), bassFifth: C2, chord: [C4, st(5, C4), st(9, C4)] };
const barG7: Bar = { bassRoot: st(-5, C2), bassFifth: st(2, C2), chord: [st(-1, C4), st(2, C4), st(5, C4), st(7, C4)] };
const PROGRESSION: Bar[] = [barC, barC, barG7, barC, barF, barC, barG7, barC];

// Clarinet melody: 8 bars x 4 eighth-notes. Semitones above C5, 'h' = hold, null = rest.
// Original jaunty folk-polka phrase (arpeggio up, step down, cadence).
const MELODY: (number | 'h' | null)[] = [
  4, 7, 12, 7,      // E G C' G   (C)
  4, 7, 4, 0,       // E G E C    (C)
  2, 5, 5, 2,       // D F F D    (G7)
  4, 'h', 0, null,  // E—  C      (C)
  5, 9, 12, 9,      // F A C' A   (F)
  7, 12, 7, 4,      // G C' G E   (C)
  2, 7, 11, 14,     // D G B D'   (G7)
  12, 'h', 'h', null, // C'———     (C)
];

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
    const eighthLen = 60 / 126 / 2; // 126 BPM polka, eighth-note grid
    while (this.nextBeat < this.ctx.currentTime + 0.4) {
      this.polkaEighth(this.nextBeat, this.beatIndex, eighthLen);
      this.nextBeat += eighthLen;
      this.beatIndex++;
    }
  }

  private polkaEighth(t: number, i: number, eighthLen: number) {
    if (!this.ctx || !this.master) return;
    const slot = i % 4;               // eighth within the 2/4 bar
    const barIdx = Math.floor(i / 4) % PROGRESSION.length;
    const bar = PROGRESSION[barIdx];

    if (slot === 0) this.tuba(t, bar.bassRoot);
    if (slot === 2) this.tuba(t, bar.bassFifth);
    if (slot === 1 || slot === 3) {
      // PAH: horn section stab on the offbeat
      for (const f of bar.chord) this.horn(t, f);
    }

    // clarinet melody on every slot that has a note
    const mi = i % MELODY.length;
    const note = MELODY[mi];
    if (typeof note === 'number') {
      let slots = 1;
      while (MELODY[(mi + slots) % MELODY.length] === 'h') slots++;
      this.clarinet(t, st(note, C5), eighthLen * slots);
    }
  }

  private tuba(t: number, freq: number) {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(0.3, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 350;
    osc.connect(lp).connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  private horn(t: number, freq: number) {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(0.035, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1800;
    osc.connect(lp).connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  private clarinet(t: number, freq: number, dur: number) {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    // gentle vibrato
    const vib = this.ctx.createOscillator();
    vib.frequency.value = 5.5;
    const vibGain = this.ctx.createGain();
    vibGain.gain.value = freq * 0.006;
    vib.connect(vibGain).connect(osc.frequency);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(0.085, t + 0.02);
    g.gain.setValueAtTime(0.085, t + Math.max(0.02, dur - 0.05));
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t);
    vib.start(t);
    osc.stop(t + dur + 0.02);
    vib.stop(t + dur + 0.02);
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
