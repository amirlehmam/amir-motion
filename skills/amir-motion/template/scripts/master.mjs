// Final master: bring the rendered mix to a target integrated loudness, then a look-ahead peak limiter.
// node scripts/master.mjs in.wav out.wav [-14] [-1.5]
import {readFileSync, writeFileSync} from 'node:fs';
const [, , inp, outp, tgt = '-14', ceilDb = '-1.5'] = process.argv;
const b = readFileSync(inp);
let o = 12; while (b.toString('ascii', o, o + 4) !== 'data') o += 8 + b.readUInt32LE(o + 4);
const n = b.readUInt32LE(o + 4) / 4, d = o + 8, SR = 48000;
const ch = [new Float64Array(n), new Float64Array(n)];
for (let i = 0; i < n; i++) for (let c = 0; c < 2; c++) ch[c][i] = b.readInt16LE(d + i * 4 + c * 2) / 32768;

const measure = (chs) => {
  const k = chs.map((x) => Float64Array.from(x));
  const bq = (x, [b0, b1, b2, a1, a2]) => { let x1 = 0, x2 = 0, y1 = 0, y2 = 0; for (let i = 0; i < x.length; i++) { const y = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = y; x[i] = y; } };
  for (const x of k) { bq(x, [1.53512485958697, -2.69169618940638, 1.19839281085285, -1.69065929318241, 0.73248077421585]); bq(x, [1, -2, 1, -1.99004745483398, 0.99007225036621]); }
  const blk = 0.4 * SR, hop = 0.1 * SR, L = [];
  for (let s = 0; s + blk <= n; s += hop) { let z = 0; for (const x of k) { let a = 0; for (let i = s; i < s + blk; i++) a += x[i] * x[i]; z += a / blk; } L.push(z); }
  const lu = (z) => -0.691 + 10 * Math.log10(z);
  const g1 = L.filter((z) => lu(z) > -70);
  const rel = lu(g1.reduce((a, c) => a + c, 0) / g1.length) - 10;
  const g2 = g1.filter((z) => lu(z) > rel);
  return lu(g2.reduce((a, c) => a + c, 0) / g2.length);
};

const ceil = 10 ** (+ceilDb / 20);
// Iterate: the limiter eats a little loudness, so re-aim twice.
let gainDb = +tgt - measure(ch);
let out;
for (let pass = 0; pass < 3; pass++) {
  const g = 10 ** (gainDb / 20);
  const la = Math.round(0.005 * SR), rel = Math.exp(-1 / (0.08 * SR));
  // Gain envelope from the look-ahead window's peak, smoothed: instant attack ahead of the peak, slow release.
  const need = new Float64Array(n);
  for (let i = 0; i < n; i++) { const p = Math.max(Math.abs(ch[0][i]), Math.abs(ch[1][i])) * g; need[i] = p > ceil ? ceil / p : 1; }
  const env = new Float64Array(n);
  let e = 1;
  const dq = []; // sliding-window minimum over [i, i+la]
  for (let i = n - 1 + la; i >= 0; i--) {
    if (i < n) { while (dq.length && need[dq[dq.length - 1]] >= need[i]) dq.pop(); dq.push(i); }
    while (dq.length && dq[0] > i + la) dq.shift();
    if (i < n) env[i] = dq.length ? need[dq[0]] : 1;
  }
  out = ch.map(() => new Float64Array(n));
  for (let i = 0; i < n; i++) {
    e = env[i] < e ? env[i] : 1 - (1 - e) * rel;
    if (e > env[i]) e = env[i];
    for (let c = 0; c < 2; c++) out[c][i] = Math.max(-ceil, Math.min(ceil, ch[c][i] * g * e));
  }
  const got = measure(out);
  if (Math.abs(got - +tgt) < 0.2) break;
  gainDb += +tgt - got;
}
const w = Buffer.alloc(44 + n * 4);
w.write('RIFF', 0); w.writeUInt32LE(36 + n * 4, 4); w.write('WAVEfmt ', 8); w.writeUInt32LE(16, 16); w.writeUInt16LE(1, 20); w.writeUInt16LE(2, 22);
w.writeUInt32LE(SR, 24); w.writeUInt32LE(SR * 4, 28); w.writeUInt16LE(4, 32); w.writeUInt16LE(16, 34); w.write('data', 36); w.writeUInt32LE(n * 4, 40);
let pk = 0;
for (let i = 0; i < n; i++) for (let c = 0; c < 2; c++) { pk = Math.max(pk, Math.abs(out[c][i])); w.writeInt16LE(Math.round(out[c][i] * 32767), 44 + i * 4 + c * 2); }
writeFileSync(outp, w);
console.log(`${outp}: ${measure(out).toFixed(1)} LUFS, peak ${(20 * Math.log10(pk)).toFixed(1)} dBFS, gain ${gainDb.toFixed(1)} dB`);
