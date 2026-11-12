// Original score and sound effects for the film, synthesized from scratch (no samples, no licence to clear).
// Reads the same timeline as the picture so every musical section lands on its scene.
// The key (D major) is shared by the music and every tonal effect: pitch climbs with progress.
// Run: node scripts/score.mts   -> public/audio/music.wav + public/audio/sfx/*.wav
import {mkdirSync, writeFileSync} from 'node:fs';
import {at, SCENES, TOTAL, type SceneKey} from '../src/timeline.ts';

const SR = 48000;
const FPS = 30;
const LEN = TOTAL / FPS + 0.5; // a short tail past the last frame
const N = Math.ceil(LEN * SR);
const sec = (frame: number) => frame / FPS;

// ---------- primitives ----------
const mtof = (m: number) => 440 * 2 ** ((m - 69) / 12);
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

type Buf = {l: Float32Array; r: Float32Array};
const buf = (len = N): Buf => ({l: new Float32Array(len), r: new Float32Array(len)});

const env = (t: number, a: number, d: number, s: number, rel: number, dur: number) => {
  if (t < 0) return 0;
  if (t < a) return t / a;
  if (t < a + d) return 1 - (1 - s) * ((t - a) / d);
  if (t < dur) return s;
  const r = t - dur;
  return r < rel ? s * (1 - r / rel) : 0;
};

const add = (b: Buf, i: number, v: number, pan = 0) => {
  if (i < 0 || i >= b.l.length) return;
  b.l[i] += v * Math.cos((pan + 1) * Math.PI / 4);
  b.r[i] += v * Math.sin((pan + 1) * Math.PI / 4);
};

// One-pole lowpass with a time-varying cutoff, in place.
const lowpass = (x: Float32Array, cutoff: (i: number) => number) => {
  let y = 0;
  for (let i = 0; i < x.length; i++) {
    const a = 1 - Math.exp((-2 * Math.PI * cutoff(i)) / SR);
    y += a * (x[i] - y);
    x[i] = y;
  }
};
const highpass = (x: Float32Array, fc: number) => {
  const a = Math.exp((-2 * Math.PI * fc) / SR);
  let px = 0, py = 0;
  for (let i = 0; i < x.length; i++) {
    const y = a * (py + x[i] - px);
    px = x[i];
    py = y;
    x[i] = y;
  }
};

// Schroeder reverb: 4 combs + 2 allpasses per channel, decorrelated by delay lengths.
const reverb = (b: Buf, mix: number, size = 1) => {
  const proc = (x: Float32Array, off: number) => {
    const out = new Float32Array(x.length);
    const combs = [1557, 1617, 1491, 1422].map((d) => Math.round((d + off) * size * (SR / 44100)));
    for (const d of combs) {
      const line = new Float32Array(d);
      let k = 0, lp = 0;
      for (let i = 0; i < x.length; i++) {
        const y = line[k];
        lp = y * 0.7 + lp * 0.3; // damping
        line[k] = x[i] + lp * 0.84;
        out[i] += y * 0.25;
        k = (k + 1) % d;
      }
    }
    for (const d of [225, 556].map((v) => Math.round((v + off / 3) * (SR / 44100)))) {
      const line = new Float32Array(d);
      let k = 0;
      for (let i = 0; i < out.length; i++) {
        const bufv = line[k];
        const y = -out[i] + bufv;
        line[k] = out[i] + bufv * 0.5;
        out[i] = y;
        k = (k + 1) % d;
      }
    }
    for (let i = 0; i < x.length; i++) x[i] = x[i] * (1 - mix) + out[i] * mix;
  };
  proc(b.l, 0);
  proc(b.r, 23);
};

const pingpong = (b: Buf, delaySec: number, fb: number, mix: number) => {
  const d = Math.round(delaySec * SR);
  const L = new Float32Array(b.l), R = new Float32Array(b.r);
  for (let i = d; i < b.l.length; i++) {
    L[i] += R[i - d] * fb;
    R[i] += L[i - d] * fb;
  }
  for (let i = 0; i < b.l.length; i++) {
    b.l[i] += (R[i] - b.r[i]) * mix;
    b.r[i] += (L[i] - b.l[i]) * mix;
  }
};

const mixInto = (dst: Buf, src: Buf, g: number) => {
  for (let i = 0; i < dst.l.length; i++) {
    dst.l[i] += src.l[i] * g;
    dst.r[i] += src.r[i] * g;
  }
};

// ---------- instruments ----------
const pad = (b: Buf, notes: number[], t0: number, dur: number, gain: number) => {
  for (const m of notes) {
    for (const det of [-0.09, 0, 0.08]) {
      const f = mtof(m + det);
      const pan = det * 6;
      const s0 = Math.floor(t0 * SR), s1 = Math.floor((t0 + dur + 1.6) * SR);
      let ph = Math.random();
      for (let i = s0; i < s1; i++) {
        const t = (i - s0) / SR;
        ph += f / SR;
        const saw = 2 * (ph - Math.floor(ph)) - 1;
        add(b, i, saw * env(t, 0.9, 0.5, 0.8, 1.5, dur) * gain, pan);
      }
    }
  }
};

const pluck = (b: Buf, m: number, t0: number, gain: number, pan: number) => {
  const f = mtof(m), s0 = Math.floor(t0 * SR), len = Math.floor(0.9 * SR);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const mod = Math.sin(2 * Math.PI * f * 2 * t) * 1.2 * Math.exp(-t * 18);
    const v = Math.sin(2 * Math.PI * f * t + mod) * Math.exp(-t * 6.5) * Math.min(1, t * 400);
    add(b, s0 + i, v * gain, pan);
  }
};

const bell = (b: Buf, m: number, t0: number, gain: number, pan = 0, decay = 2.4) => {
  const f = mtof(m), s0 = Math.floor(t0 * SR), len = Math.floor(decay * 2 * SR);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const mod = Math.sin(2 * Math.PI * f * 3.5 * t) * 2.2 * Math.exp(-t * 3);
    const v = (Math.sin(2 * Math.PI * f * t + mod) * 0.8 + Math.sin(2 * Math.PI * f * 2 * t) * 0.15) * Math.exp(-t * (2.6 / decay)) * Math.min(1, t * 600);
    add(b, s0 + i, v * gain, pan);
  }
};

const bass = (b: Buf, m: number, t0: number, dur: number, gain: number) => {
  const f = mtof(m), s0 = Math.floor(t0 * SR), len = Math.floor((dur + 0.2) * SR);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const v = Math.tanh(Math.sin(2 * Math.PI * f * t) * 1.6) * env(t, 0.01, 0.2, 0.7, 0.15, dur);
    add(b, s0 + i, v * gain, 0);
  }
};

const kick = (b: Buf, t0: number, gain: number) => {
  const s0 = Math.floor(t0 * SR), len = Math.floor(0.45 * SR);
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    ph += (45 + 85 * Math.exp(-t * 30)) / SR;
    add(b, s0 + i, Math.sin(2 * Math.PI * ph) * Math.exp(-t * 7) * gain, 0);
  }
};

const shaker = (b: Buf, t0: number, gain: number, pan: number) => {
  const s0 = Math.floor(t0 * SR), len = Math.floor(0.08 * SR);
  let p = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const n = rand();
    const hp = n - p; // crude highpass for air
    p = n;
    add(b, s0 + i, hp * Math.exp(-t * 55) * Math.min(1, t * 2000) * gain, pan);
  }
};

const noiseSweep = (b: Buf, t0: number, dur: number, f0: number, f1: number, gain: number, shape: (x: number) => number) => {
  const s0 = Math.floor(t0 * SR), len = Math.floor(dur * SR);
  const x = new Float32Array(len);
  for (let i = 0; i < len; i++) x[i] = rand();
  lowpass(x, (i) => f0 * (f1 / f0) ** (i / len));
  highpass(x, 120);
  for (let i = 0; i < len; i++) {
    const u = i / len;
    add(b, s0 + i, x[i] * shape(u) * gain, Math.sin(u * Math.PI) * 0.4 - 0.2);
  }
};

// ---------- music ----------
const BPM = 96;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;

// D major, warm voicings: Dmaj9, Bm11, Gmaj9, A6sus. One chord per bar.
const CHORDS = [
  {root: 38, pad: [50, 54, 57, 61, 64], arp: [74, 76, 78, 81, 85]},
  {root: 35, pad: [47, 50, 54, 57, 64], arp: [71, 74, 76, 78, 83]},
  {root: 31, pad: [43, 47, 50, 54, 57], arp: [67, 71, 74, 76, 78]},
  {root: 33, pad: [45, 50, 52, 54, 57], arp: [69, 74, 76, 78, 81]},
];

const SECT = Object.fromEntries(Object.values(SCENES).map((s) => [s.key, sec(s.from)])) as Record<SceneKey, number>;

// ---------- arrangement: which scene each layer enters and leaves on ----------
// Write it to the story: the bed builds as the product does more, peaks on the one hero moment,
// and resolves on the end card. `beat(scene, local)` is a beat in that scene's clock, the same
// number the picture and cues.ts use.
const beat = (key: SceneKey, local: number) => sec(at(key, local));
const ARRANGE = {
  arpIn: SECT.demo - 0.5, // plucked arpeggio: the product is on screen
  drumsIn: beat('demo', 150), // kick, shaker, bass: from the click, the product is working
  drumsOut: SECT.end, // groove leaves before the end card
  fullIn: beat('demo', 214), // fuller pad and double kick: the hero moment (the result)
  fullOut: SECT.end - 0.4,
  riser: beat('demo', 214), // one riser per film, ending on the hero moment
  end: SECT.end, // final chord
};

// Energy curves per layer, as functions of time in seconds.
const ramp = (x: number, a: number, b: number) => Math.max(0, Math.min(1, (x - a) / (b - a)));
const arpLevel = (s: number) => ramp(s, ARRANGE.arpIn, ARRANGE.arpIn + 2) * (1 - 0.5 * ramp(s, ARRANGE.end - 1, ARRANGE.end + 0.5));
const drumLevel = (s: number) => ramp(s, ARRANGE.drumsIn - 0.3, ARRANGE.drumsIn + 0.3) * (1 - ramp(s, ARRANGE.drumsOut - 1.2, ARRANGE.drumsOut));
const fullLevel = (s: number) => ramp(s, ARRANGE.fullIn - 0.2, ARRANGE.fullIn + 0.6) * (1 - 0.6 * ramp(s, ARRANGE.fullOut, ARRANGE.fullOut + 1));

const music = buf();
const padBus = buf();
const arpBus = buf();
const drumBus = buf();
const bellBus = buf();

const bars = Math.ceil(LEN / BAR);
for (let bi = 0; bi < bars; bi++) {
  const t0 = bi * BAR;
  const last = t0 + BAR >= ARRANGE.end;
  const ch = last ? CHORDS[0] : CHORDS[bi % 4];
  const padDur = last ? LEN - t0 - 1.4 : BAR;
  pad(padBus, ch.pad, t0, padDur, 0.024 * (1 + 0.5 * fullLevel(t0)));
  // Bass: root on 1 and on the "and" of 2, from the run onward.
  const bl = drumLevel(t0 + 0.1) * 0.9 + fullLevel(t0) * 0.2;
  if (bl > 0.02) {
    bass(drumBus, ch.root, t0, BEAT * 1.4, 0.22 * bl);
    bass(drumBus, ch.root, t0 + BEAT * 2.5, BEAT * 1.2, 0.17 * bl);
  }
  for (let k = 0; k < 8; k++) {
    const tk = t0 + k * (BEAT / 2);
    const al = arpLevel(tk);
    if (al > 0.02 && !last) pluck(arpBus, ch.arp[[0, 2, 1, 3, 2, 4, 3, 1][k]], tk, 0.11 * al, k % 2 ? 0.35 : -0.35);
    const dl = drumLevel(tk);
    if (dl > 0.02) {
      if (k % 4 === 0 || (fullLevel(tk) > 0.5 && k % 2 === 0)) kick(drumBus, tk, 0.5 * dl);
      shaker(drumBus, tk + (k % 2 ? 0.012 : 0), (k % 2 ? 0.05 : 0.03) * dl, k % 2 ? 0.25 : -0.25);
    }
  }
}

// Bell motif: the opening, then the final chord.
const motif = [74, 78, 81, 76];
motif.forEach((m, i) => bell(bellBus, m, 0.35 + i * BEAT * 0.75, 0.12, (i - 1.5) * 0.25));
bell(bellBus, 86, ARRANGE.end + 0.15, 0.13, 0, 3.2);
bell(bellBus, 81, ARRANGE.end + 0.3, 0.09, 0.3, 3.2);
bell(bellBus, 74, ARRANGE.end + 0.45, 0.08, -0.3, 3.2);

// Pad filter opens with the film's energy.
lowpass(padBus.l, (i) => 700 + 2600 * fullLevel(i / SR) + 900 * drumLevel(i / SR));
lowpass(padBus.r, (i) => 700 + 2600 * fullLevel(i / SR) + 900 * drumLevel(i / SR));

pingpong(arpBus, BEAT * 0.75, 0.35, 0.35);
reverb(padBus, 0.35, 1.2);
reverb(arpBus, 0.3, 1);
reverb(bellBus, 0.45, 1.3);

// Kick sidechain on the pad: the bed breathes with the groove.
const duck = new Float32Array(N).fill(1);
for (let bi = 0; bi < bars; bi++) {
  for (let k = 0; k < 4; k++) {
    const tk = bi * BAR + k * BEAT;
    const dl = drumLevel(tk);
    if (dl < 0.02) continue;
    const s0 = Math.floor(tk * SR);
    for (let i = 0; i < 0.3 * SR; i++) if (s0 + i < N) duck[s0 + i] = Math.min(duck[s0 + i], 1 - 0.35 * dl * Math.exp(-i / SR / 0.12));
  }
}
for (let i = 0; i < N; i++) {
  padBus.l[i] *= duck[i];
  padBus.r[i] *= duck[i];
}

mixInto(music, padBus, 1);
mixInto(music, arpBus, 1);
mixInto(music, drumBus, 1);
mixInto(music, bellBus, 1);

// Riser into the hero moment (part of the score, timed to the scene).
noiseSweep(music, ARRANGE.riser - 1.6, 1.8, 300, 6000, 0.09, (u) => u ** 2 * (u < 0.95 ? 1 : (1 - u) * 20));

// Fades: in over 0.3 s, out over the last 1.5 s.
for (let i = 0; i < N; i++) {
  const s = i / SR;
  const g = Math.min(1, s / 0.3) * Math.min(1, (LEN - s) / 1.5);
  music.l[i] *= g;
  music.r[i] *= g;
}

// ---------- master: gentle glue, then normalise to a fixed RMS with a soft ceiling ----------
const master = (b: Buf, targetRmsDb: number, ceilingDb: number) => {
  let sum = 0;
  for (let i = 0; i < b.l.length; i++) sum += b.l[i] ** 2 + b.r[i] ** 2;
  const rms = Math.sqrt(sum / (2 * b.l.length)) || 1e-9;
  const g = 10 ** (targetRmsDb / 20) / rms;
  const ceil = 10 ** (ceilingDb / 20);
  for (let i = 0; i < b.l.length; i++) {
    b.l[i] = Math.tanh((b.l[i] * g) / ceil) * ceil;
    b.r[i] = Math.tanh((b.r[i] * g) / ceil) * ceil;
  }
};

const wav = (b: Buf, path: string) => {
  const n = b.l.length;
  const out = Buffer.alloc(44 + n * 4);
  out.write('RIFF', 0);
  out.writeUInt32LE(36 + n * 4, 4);
  out.write('WAVEfmt ', 8);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(2, 22);
  out.writeUInt32LE(SR, 24);
  out.writeUInt32LE(SR * 4, 28);
  out.writeUInt16LE(4, 32);
  out.writeUInt16LE(16, 34);
  out.write('data', 36);
  out.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, b.l[i])) * 32767), 44 + i * 4);
    out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, b.r[i])) * 32767), 46 + i * 4);
  }
  writeFileSync(path, out);
};

mkdirSync('public/audio/sfx', {recursive: true});
master(music, -19, -1.5);
wav(music, 'public/audio/music.wav');

// ---------- sound effects, one file each, trimmed to their own length ----------
const fx = (name: string, len: number, draw: (b: Buf) => void, peakDb = -3, verb = 0) => {
  const b = buf(Math.floor(len * SR));
  draw(b);
  if (verb) reverb(b, verb, 0.7);
  let peak = 1e-9;
  for (let i = 0; i < b.l.length; i++) peak = Math.max(peak, Math.abs(b.l[i]), Math.abs(b.r[i]));
  const g = 10 ** (peakDb / 20) / peak;
  for (let i = 0; i < b.l.length; i++) {
    b.l[i] *= g;
    b.r[i] *= g;
  }
  // 5 ms fade out to avoid a click at the cut
  const f = Math.floor(0.005 * SR);
  for (let i = 0; i < f; i++) {
    const k = i / f;
    b.l[b.l.length - 1 - i] *= k;
    b.r[b.r.length - 1 - i] *= k;
  }
  wav(b, `public/audio/sfx/${name}.wav`);
};

// UI tick: a short sine blip with a click transient. Pitched by step.
const blip = (b: Buf, m: number, t0: number, g: number, pan = 0) => {
  const f = mtof(m), s0 = Math.floor(t0 * SR);
  for (let i = 0; i < 0.18 * SR; i++) {
    const t = i / SR;
    add(b, s0 + i, (Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 28) + rand() * 0.15 * Math.exp(-t * 400)) * g, pan);
  }
};

// Step checks climb a D major pentatonic: progress you can hear.
[74, 76, 78, 81, 83, 86, 88].forEach((m, i) => fx(`step${i}`, 0.35, (b) => {
  blip(b, m, 0, 0.8);
  blip(b, m + 12, 0.004, 0.2);
}, -6, 0.2));
// Gate checks: a glassier double tick.
[81, 83, 85, 86].forEach((m, i) => fx(`gate${i}`, 0.4, (b) => {
  blip(b, m + 12, 0, 0.6, -0.2);
  blip(b, m + 7, 0.045, 0.5, 0.2);
}, -8, 0.25));

fx('pop', 0.35, (b) => {
  for (let i = 0; i < 0.3 * SR; i++) {
    const t = i / SR;
    add(b, i, Math.sin(2 * Math.PI * (260 + 500 * Math.exp(-t * 40)) * t) * Math.exp(-t * 16), 0);
  }
}, -4, 0.15);

fx('tock', 0.25, (b) => {
  for (let i = 0; i < 0.2 * SR; i++) {
    const t = i / SR;
    add(b, i, (Math.sin(2 * Math.PI * 620 * t) * 0.7 + rand() * 0.2 * Math.exp(-t * 300)) * Math.exp(-t * 35), 0);
  }
}, -8);

// Mouse click: a bright transient over a short body, so it reads on laptop speakers.
fx('click', 0.12, (b) => {
  const x = new Float32Array(Math.floor(0.03 * SR));
  for (let i = 0; i < x.length; i++) x[i] = rand();
  highpass(x, 2500);
  for (let i = 0; i < x.length; i++) add(b, i, x[i] * Math.exp(-(i / SR) * 260) * 0.8, 0);
  for (let i = 0; i < 0.08 * SR; i++) {
    const t = i / SR;
    add(b, i, Math.sin(2 * Math.PI * 1900 * t) * Math.exp(-t * 70) * 0.5, 0);
  }
}, -6);

// Toggle switch: two soft clicks, the second lower, 35 ms apart.
fx('switch', 0.15, (b) => {
  [0, 0.035].forEach((t0, k) => {
    const s0 = Math.floor(t0 * SR);
    for (let i = 0; i < 0.06 * SR; i++) {
      const t = i / SR;
      add(b, s0 + i, Math.sin(2 * Math.PI * (k ? 900 : 1400) * t) * Math.exp(-t * 90), 0);
    }
  });
}, -10);

fx('key', 0.08, (b) => {
  const x = new Float32Array(Math.floor(0.06 * SR));
  for (let i = 0; i < x.length; i++) x[i] = rand();
  highpass(x, 1800);
  for (let i = 0; i < x.length; i++) add(b, i, x[i] * Math.exp(-(i / SR) * 90), 0);
}, -10);

fx('whoosh-in', 1.0, (b) => noiseSweep(b, 0, 0.95, 400, 5200, 1, (u) => Math.sin(Math.PI * u) ** 1.5), -7, 0.2);
fx('whoosh-out', 1.2, (b) => noiseSweep(b, 0, 1.15, 5000, 300, 1, (u) => Math.sin(Math.PI * u ** 0.7) ** 1.4), -8, 0.25);
fx('swish', 0.5, (b) => noiseSweep(b, 0, 0.45, 900, 3500, 1, (u) => Math.sin(Math.PI * u) ** 2), -14);

fx('chime', 2.6, (b) => {
  bell(b, 81, 0, 0.6, -0.2, 1.6);
  bell(b, 86, 0.11, 0.6, 0.2, 1.8);
}, -5, 0.35);

fx('impact', 3.2, (b) => {
  for (let i = 0; i < 2.5 * SR; i++) {
    const t = i / SR;
    add(b, i, Math.sin(2 * Math.PI * (48 + 40 * Math.exp(-t * 12)) * t) * Math.exp(-t * 2.2) * 0.9, 0);
  }
  noiseSweep(b, 0, 0.6, 3000, 200, 0.25, (u) => (1 - u) ** 3);
  bell(b, 74, 0.02, 0.35, 0, 2.4);
}, -4, 0.4);

fx('sparkle', 1.6, (b) => {
  for (let k = 0; k < 26; k++) {
    const tk = (k / 26) * 1.3 + Math.abs(rand()) * 0.04;
    blip(b, [86, 88, 90, 93, 95, 98][k % 6], tk, 0.25 + 0.2 * Math.abs(rand()), rand() * 0.8);
  }
}, -10, 0.35);

console.log(`music ${LEN.toFixed(2)} s, sections`, Object.fromEntries(Object.entries(SECT).map(([k, v]) => [k, +v.toFixed(2)])));
