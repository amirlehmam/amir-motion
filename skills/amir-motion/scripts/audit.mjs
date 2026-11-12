#!/usr/bin/env node
// amir-motion gate. Run from the film's project folder (Node >= 22.18, it imports the project's .ts data):
//   node <skill-dir>/scripts/audit.mjs            code, data, provenance, and any out/*.mp4
//   node <skill-dir>/scripts/audit.mjs --no-media skip the rendered files
// Exit code 1 when any FAIL remains. Rules 1, 3, 4 and 7 also need a human eye: references/checklist.md.
// Rule numbers match SKILL.md.
import {execFileSync} from 'node:child_process';
import {existsSync, readdirSync, readFileSync, rmSync, statSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const root = process.cwd();
const noMedia = process.argv.includes('--no-media');
const results = [];
const report = (level, rule, msg) => results.push({level, rule, msg});
const rel = (p) => path.relative(root, p).replaceAll('\\', '/');

if (!existsSync(path.join(root, 'src/timeline.ts'))) {
  console.error('No src/timeline.ts here. Run the audit from a film made with amir-motion (scripts/new.mjs).');
  process.exit(2);
}

const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};

// ---------- 1. Code: everything is a pure function of the frame (rule 6) ----------
const srcFiles = walk(path.join(root, 'src')).filter((p) => /\.(tsx?|jsx?|css)$/.test(p));
const IMPURE = [
  [/Math\.random\s*\(/, 'Math.random(): use rand(seed) from theme.ts'],
  [/Date\.now\s*\(|new Date\s*\(/, 'Date: the frame is the only clock'],
  [/set(Timeout|Interval)\s*\(|requestAnimationFrame\s*\(/, 'timers: the render does not wait for them'],
  [/\b(transition|animation)\s*:\s*['"`]/, 'CSS transition/animation: it plays in preview, not in the render'],
  [/@keyframes/, 'CSS keyframes: derive the state from the frame'],
  [/className=["'`][^"'`]*animate-/, 'animate-* class: derive the state from the frame'],
  [/\buseFrame\s*\(/, "React Three Fiber useFrame(): use Remotion's frame"],
];
let impure = 0;
for (const file of srcFiles) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (/^\s*\/\//.test(line)) return;
    for (const [re, why] of IMPURE) {
      if (re.test(line)) {
        report('FAIL', 6, `${rel(file)}:${i + 1} ${why}`);
        impure++;
      }
    }
  });
}
if (!impure) report('PASS', 6, `${srcFiles.length} source files, no timer, random, Date or CSS animation`);

// Linear tweens on things that start or stop.
const sceneFiles = srcFiles.filter((p) => /[\\/](scenes|ui)[\\/]/.test(p));
for (const file of sceneFiles) {
  const text = readFileSync(file, 'utf8');
  const raw = (text.match(/\binterpolate\s*\(/g) || []).length;
  const eased = (text.match(/\binterpolate\s*\([^;]*easing/gs) || []).length;
  if (raw > eased) report('WARN', 7, `${rel(file)}: ${raw - eased} interpolate() without easing is linear; use prog() unless it is continuous drift`);
}

// ---------- 2. Colour: tokens only, no decorative red (rule 5) ----------
const hexToHsl = (hex) => {
  let h = hex.replace('#', '');
  if (h.length === 3 || h.length === 4) h = [...h.slice(0, 3)].map((c) => c + c).join('');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return {h: 0, s: 0, l};
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let hue;
  if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) hue = ((b - r) / d + 2) * 60;
  else hue = ((r - g) / d + 4) * 60;
  return {h: hue, s, l};
};
const isRed = (hex) => {
  const {h, s, l} = hexToHsl(hex);
  return (h >= 345 || h <= 15) && s >= 0.45 && l >= 0.25 && l <= 0.75;
};
const DANGER_NAME = /danger|error|alert|destructive|recording|live|brand/i;
let redFail = 0;
for (const file of srcFiles) {
  const lines = readFileSync(file, 'utf8').split('\n');
  const isTheme = /theme\.ts$/.test(file);
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
      const hex = m[0];
      if (![4, 5, 7, 9].includes(hex.length)) continue;
      if (isRed(hex.slice(0, 7)) && !(isTheme && DANGER_NAME.test(line))) {
        report('FAIL', 5, `${rel(file)}:${i + 1} red ${hex} outside a danger/brand token`);
        redFail++;
      }
      if (!isTheme && /[\\/]scenes[\\/]/.test(file)) report('WARN', 5, `${rel(file)}:${i + 1} raw ${hex} in a scene: move it to theme.ts`);
    }
    if (!isTheme && /\bui\.danger\b/.test(line)) report('WARN', 5, `${rel(file)}:${i + 1} ui.danger used: only for an error or a destructive action`);
  });
}
if (!redFail) report('PASS', 5, 'no decorative red');

// ---------- 3. Type: 3 families max, nothing tiny that the story needs (rule 4) ----------
const themeText = existsSync(path.join(root, 'src/theme.ts')) ? readFileSync(path.join(root, 'src/theme.ts'), 'utf8') : '';
const families = (themeText.match(/loadFont as \w+\s*\}\s*from\s*'@remotion\/google-fonts\/(\w+)'/g) || []).length
  + (themeText.match(/loadFont\(/g) && !themeText.includes('@remotion/google-fonts') ? 1 : 0);
if (families > 3) report('FAIL', 4, `${families} font families loaded in theme.ts (max 3: display serif, UI sans, mono)`);
else report('PASS', 4, `${families} font families`);
for (const file of sceneFiles) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/fontSize:\s*(\d+(?:\.\d+)?)/g)) {
      if (Number(m[1]) < 20) report('WARN', 4, `${rel(file)}:${i + 1} fontSize ${m[1]}: texture only, unreadable on a phone. If the story needs it, use size.label or push the camera in`);
    }
  });
}

// ---------- 4. Data: reading time, captions, cues (rules 1, 2, 8) ----------
const load = async (p) => import(pathToFileURL(path.join(root, p)).href);
let timeline, copy, captions, cues;
try {
  timeline = await load('src/timeline.ts');
  copy = (await load('src/copy.ts')).copy;
  captions = (await load('src/captions.ts')).CAPTIONS;
  cues = await load('src/cues.ts');
} catch (e) {
  report('FAIL', 2, `cannot import the film data (timeline, copy, captions, cues): ${e.message.split('\n')[0]}. Keep them free of value imports and React.`);
}

if (timeline && copy && captions) {
  const {SCENES, ORDER, XF, TOTAL} = timeline;
  const lastKey = ORDER[ORDER.length - 1].key;
  const seconds = TOTAL / 30;
  if (seconds > 90) report('WARN', 1, `film is ${seconds.toFixed(1)} s: a launch film holds attention best between 30 and 60 s`);
  else report('PASS', 1, `film length ${seconds.toFixed(1)} s, ${ORDER.length} scenes`);

  let readFail = 0;
  for (const lang of Object.keys(copy)) {
    for (const cap of captions) {
      const s = SCENES[cap.scene];
      if (!s) {
        report('FAIL', 2, `caption "${cap.line}" points at unknown scene "${cap.scene}"`);
        continue;
      }
      const text = copy[lang][cap.line];
      if (typeof text !== 'string') {
        report('FAIL', 2, `[${lang}] caption line "${cap.line}" is missing from copy.ts`);
        continue;
      }
      if (/__\w+__/.test(text)) report('FAIL', 10, `[${lang}] "${text}": placeholder left in copy.ts`);
      const words = text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
      const visibleEnd = cap.out ?? (cap.scene === lastKey ? s.authored : s.authored - XF * s.pace);
      const real = (visibleEnd - cap.at) / s.pace / 30;
      const need = 1.5 + 0.3 * words;
      if (real + 1e-6 < need) {
        report('FAIL', 2, `[${lang}] ${cap.scene} "${text}": ${real.toFixed(2)} s on screen, needs ${need.toFixed(2)} s (1.5 + 0.3 x ${words} words)`);
        readFail++;
      }
      if (words > 10) report('WARN', 1, `[${lang}] "${text}": ${words} words, one step should say it in 10`);
      const cps = text.length / real;
      if (cps > 17) report('WARN', 2, `[${lang}] "${text}": ${cps.toFixed(1)} characters per second (max 17)`);
      if (cap.at < 0 || cap.at >= s.authored) report('FAIL', 2, `${cap.scene} "${cap.line}" starts at ${cap.at}, outside the scene (0 to ${s.authored})`);
    }
  }
  if (!readFail) report('PASS', 2, `${captions.length} captions x ${Object.keys(copy).length} languages hold long enough to read`);

  // Every language has the same keys (the cuts stay in step).
  const langs = Object.keys(copy);
  for (const k of Object.keys(copy[langs[0]])) {
    for (const l of langs.slice(1)) if (!(k in copy[l])) report('FAIL', 9, `copy.${l} is missing "${k}"`);
  }
}

if (timeline && cues) {
  const {SCENES} = timeline;
  const sfxDir = path.join(root, 'public/audio/sfx');
  const missing = new Set();
  for (const c of cues.CUES) {
    const s = SCENES[c.scene];
    if (!s) report('FAIL', 8, `cue ${c.sfx} points at unknown scene "${c.scene}"`);
    else if (c.local < 0 || c.local > s.authored) report('FAIL', 8, `cue ${c.sfx} at ${c.scene}:${c.local} is outside its scene (0 to ${s.authored})`);
    if (!existsSync(path.join(sfxDir, `${c.sfx}.wav`))) missing.add(c.sfx);
    if (c.vol > 1) report('WARN', 8, `cue ${c.sfx} volume ${c.vol} > 1 clips before the master`);
  }
  if (missing.size) report('FAIL', 8, `missing sfx files: ${[...missing].join(', ')}. Run npm run score, or add a generator`);
  if (cues.MUSIC && !existsSync(path.join(root, 'public', cues.MUSIC.file))) report('FAIL', 8, `missing ${cues.MUSIC.file}: run npm run score`);
  if (!missing.size) report('PASS', 8, `${cues.CUES.length} sound cues on the scene clock, all files present`);
}

// ---------- 5. Provenance: nothing that is not ours (rule 10) ----------
const cfgPath = path.join(root, 'motion.config.json');
const cfg = existsSync(cfgPath) ? JSON.parse(readFileSync(cfgPath, 'utf8')) : {};
const forbidden = (cfg.forbidden || []).filter(Boolean);
if (!existsSync(cfgPath)) report('WARN', 10, 'no motion.config.json: no forbidden names to guard');
const scanFiles = [...srcFiles, ...walk(path.join(root, 'public')), path.join(root, 'package.json')].filter((p) => existsSync(p));
let leak = 0;
for (const file of scanFiles) {
  const name = rel(file);
  const textual = /\.(tsx?|jsx?|json|md|css|svg|txt|html)$/.test(file);
  const body = textual ? readFileSync(file, 'utf8') : '';
  for (const term of forbidden) {
    const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (re.test(name) || (textual && re.test(body))) {
      report('FAIL', 10, `"${term}" found in ${name}`);
      leak++;
    }
  }
}
if (forbidden.length && !leak) report('PASS', 10, `${forbidden.length} forbidden names absent from code, copy, assets and file names`);

const assetsMd = existsSync(path.join(root, 'ASSETS.md')) ? readFileSync(path.join(root, 'ASSETS.md'), 'utf8') : '';
const generated = /^public\/audio\/(music\.wav|sfx\/)/;
const undeclared = walk(path.join(root, 'public')).map(rel).filter((p) => !generated.test(p) && !assetsMd.includes(p.replace(/^public\//, '')));
if (undeclared.length) report('FAIL', 10, `assets without a source in ASSETS.md: ${undeclared.join(', ')}`);
else report('PASS', 10, 'every asset in public/ has its source in ASSETS.md');

// ---------- 6. Rendered files: loudness, peak, size, fps (rules 8, 9) ----------
const CLI = path.join(root, 'node_modules/@remotion/cli/remotion-cli.js');
const ffmpeg = (args) => execFileSync(process.execPath, [CLI, 'ffmpeg', ...args], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']});
// ITU-R BS.1770 integrated loudness (K-weighting, 400 ms blocks, absolute and relative gates) and sample peak.
const K_WEIGHT = [
  [1.53512485958697, -2.69169618940638, 1.19839281085285, -1.69065929318241, 0.73248077421585],
  [1, -2, 1, -1.99004745483398, 0.99007225036621],
];
const biquad = (x, [b0, b1, b2, a1, a2]) => {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const y = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = x[i];
    y2 = y1;
    y1 = y;
    x[i] = y;
  }
};
const loudness = (wavPath) => {
  const b = readFileSync(wavPath);
  let o = 12;
  while (b.toString('ascii', o, o + 4) !== 'data') o += 8 + b.readUInt32LE(o + 4);
  const n = b.readUInt32LE(o + 4) / 4, d = o + 8, SR = 48000;
  const ch = [new Float64Array(n), new Float64Array(n)];
  let peak = 0;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < 2; c++) {
      const v = b.readInt16LE(d + i * 4 + c * 2) / 32768;
      ch[c][i] = v;
      peak = Math.max(peak, Math.abs(v));
    }
  }
  for (const x of ch) {
    for (const coeffs of K_WEIGHT) biquad(x, coeffs);
  }
  const blk = 0.4 * SR, hop = 0.1 * SR, L = [];
  for (let s = 0; s + blk <= n; s += hop) {
    let z = 0;
    for (const x of ch) {
      let a = 0;
      for (let i = s; i < s + blk; i++) a += x[i] * x[i];
      z += a / blk;
    }
    L.push(z);
  }
  const lu = (z) => -0.691 + 10 * Math.log10(z);
  const peakDb = 20 * Math.log10(peak || 1e-9);
  const g1 = L.filter((z) => lu(z) > -70);
  if (!g1.length) return {lufs: -Infinity, peak: peakDb};
  const relGate = lu(g1.reduce((a, c) => a + c, 0) / g1.length) - 10;
  const g2 = g1.filter((z) => lu(z) > relGate);
  return {lufs: lu(g2.reduce((a, c) => a + c, 0) / g2.length), peak: peakDb};
};

const expectedSize = (name) => {
  if (name.includes('tall')) return [1080, 1920];
  if (name.includes('wide')) return [1920, 1080];
  return null;
};

const outDir = path.join(root, 'out');
const videos = !noMedia && existsSync(outDir) ? readdirSync(outDir).filter((f) => /\.mp4$/.test(f) && !f.startsWith('_')) : [];
if (!noMedia && !videos.length) report('WARN', 8, 'no out/*.mp4 yet: run npm run finish, then audit again for loudness and format');
if (videos.length && !existsSync(CLI)) report('WARN', 8, 'node_modules missing: cannot measure the renders');
for (const v of existsSync(CLI) ? videos : []) {
  const file = path.join(outDir, v);
  let info = '';
  try {
    ffmpeg(['-hide_banner', '-i', file]);
  } catch (e) {
    info = String(e.stderr || '');
  }
  const videoLine = info.split(/\r?\n/).find((l) => l.includes('Video:')) || '';
  const dim = /\b(\d{3,5})x(\d{3,5})\b/.exec(videoLine);
  const fps = /\b(\d{1,3}(?:\.\d{1,3})?) fps\b/.exec(videoLine);
  if (dim) {
    const [w, h] = [Number(dim[1]), Number(dim[2])];
    const expect = expectedSize(v);
    if (expect && (w !== expect[0] || h !== expect[1])) report('FAIL', 9, `${v}: ${w}x${h}, expected ${expect.join('x')}`);
    if (Math.min(w, h) < 1080) report('FAIL', 9, `${v}: ${w}x${h}, below 1080 on the short side`);
  }
  if (fps && Number(fps[1]) < 30) report('FAIL', 9, `${v}: ${fps[1]} fps`);
  if (!/Audio:/.test(info)) {
    report('FAIL', 8, `${v}: no audio stream`);
    continue;
  }
  const tmp = path.join(outDir, `_audit_${v}.wav`);
  try {
    ffmpeg(['-hide_banner', '-loglevel', 'error', '-i', file, '-vn', '-ac', '2', '-ar', '48000', '-c:a', 'pcm_s16le', '-y', tmp]);
    const {lufs, peak} = loudness(tmp);
    const ok = Math.abs(lufs + 14) <= 1 && peak <= -1;
    const size = dim ? ', ' + dim[1] + 'x' + dim[2] : '';
    const rate = fps ? ' @ ' + fps[1] + ' fps' : '';
    report(ok ? 'PASS' : 'FAIL', 8, `${v}: ${lufs.toFixed(1)} LUFS integrated, peak ${peak.toFixed(1)} dBFS (target -14 +/- 1, peak <= -1)${size}${rate}`);
  } finally {
    rmSync(tmp, {force: true});
  }
}

// ---------- Report ----------
const order = {FAIL: 0, WARN: 1, PASS: 2};
results.sort((a, b) => order[a.level] - order[b.level] || a.rule - b.rule);
for (const r of results) console.log(`${r.level.padEnd(4)}  rule ${String(r.rule).padStart(2)}  ${r.msg}`);
const fails = results.filter((r) => r.level === 'FAIL').length;
const warns = results.filter((r) => r.level === 'WARN').length;
console.log(`\n${fails} FAIL, ${warns} WARN. Human-eye rules (1, 3, 4, 7): references/checklist.md`);
process.exit(fails ? 1 : 0);
