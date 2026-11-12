// Integrated loudness (ITU-R BS.1770: K-weighting, 400 ms blocks, absolute + relative gates) and true-ish peak.
import {readFileSync} from 'node:fs';
const b = readFileSync(process.argv[2]);
let o = 12; while (b.toString('ascii', o, o + 4) !== 'data') o += 8 + b.readUInt32LE(o + 4);
const n = b.readUInt32LE(o + 4) / 4, d = o + 8, SR = 48000;
const ch = [new Float64Array(n), new Float64Array(n)];
let peak = 0;
for (let i = 0; i < n; i++) for (let c = 0; c < 2; c++) { const v = b.readInt16LE(d + i * 4 + c * 2) / 32768; ch[c][i] = v; peak = Math.max(peak, Math.abs(v)); }
const biquad = (x, [b0, b1, b2, a1, a2]) => { let x1 = 0, x2 = 0, y1 = 0, y2 = 0; for (let i = 0; i < x.length; i++) { const y = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = y; x[i] = y; } };
for (const x of ch) { biquad(x, [1.53512485958697, -2.69169618940638, 1.19839281085285, -1.69065929318241, 0.73248077421585]); biquad(x, [1, -2, 1, -1.99004745483398, 0.99007225036621]); }
const blk = 0.4 * SR, hop = 0.1 * SR, L = [];
for (let s = 0; s + blk <= n; s += hop) { let z = 0; for (const x of ch) { let a = 0; for (let i = s; i < s + blk; i++) a += x[i] * x[i]; z += a / blk; } L.push(z); }
const lufs = (z) => -0.691 + 10 * Math.log10(z);
const g1 = L.filter((z) => lufs(z) > -70);
const rel = lufs(g1.reduce((a, b) => a + b, 0) / g1.length) - 10;
const g2 = g1.filter((z) => lufs(z) > rel);
console.log('integrated', lufs(g2.reduce((a, b) => a + b, 0) / g2.length).toFixed(1), 'LUFS · sample peak', (20 * Math.log10(peak)).toFixed(1), 'dBFS');
