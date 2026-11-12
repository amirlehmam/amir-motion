#!/usr/bin/env node
// Start a new product film from the amir-motion template.
//   node <skill-dir>/scripts/new.mjs <target-dir> --name "Product" [--forbid "Old Client,internal-host"] [--install]
// Copies the template, fills the product name, writes motion.config.json (the provenance guard),
// ASSETS.md and BRIEF.md, and wires `npm run audit` to this skill's gate.
import {cpSync, existsSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {npm} from './lib/npm.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const template = path.join(here, '..', 'template');
const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const target = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
const name = flag('name');
if (!target || !name) {
  console.error('Usage: node new.mjs <target-dir> --name "Product" [--forbid "Name A,Name B"] [--install]');
  process.exit(2);
}
const dest = path.resolve(target);
if (existsSync(dest) && readdirSync(dest).length) {
  console.error(`${dest} exists and is not empty. Pick another folder.`);
  process.exit(2);
}
const slug = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

cpSync(template, dest, {recursive: true, filter: (src) => !src.includes('node_modules')});
renameSync(path.join(dest, 'gitignore'), path.join(dest, '.gitignore'));

const audit = path.join(here, 'audit.mjs').replaceAll('\\', '/');
const fill = (dir) => {
  for (const entry of readdirSync(dir)) {
    const p = path.join(dir, entry);
    if (statSync(p).isDirectory()) fill(p);
    else if (/\.(tsx?|mts|mjs|json|md)$/.test(entry)) {
      const text = readFileSync(p, 'utf8');
      const next = text.replaceAll('__PRODUCT__', name).replaceAll('__SLUG__', slug).replaceAll('__AUDIT__', audit);
      if (next !== text) writeFileSync(p, next);
    }
  }
};
fill(dest);

const forbid = (flag('forbid') || '').split(',').map((s) => s.trim()).filter(Boolean);
writeFileSync(
  path.join(dest, 'motion.config.json'),
  `${JSON.stringify({product: name, forbidden: forbid, note: 'Names, hosts and marks that must never appear in the film: former clients, internal tools, third-party brands without written consent. The audit fails on any match in code, copy, file names and text assets.'}, null, 2)}\n`,
);
writeFileSync(
  path.join(dest, 'ASSETS.md'),
  `# Assets and their source

Every file in \`public/\` has a line here: where it comes from and the right to use it. Generated audio
(\`audio/music.wav\`, \`audio/sfx/\`) is synthesized by \`scripts/score.mts\` and needs no line.
The audit fails on any undeclared file.

| File (under public/) | Source | Right to use |
|---|---|---|
`,
);
writeFileSync(
  path.join(dest, 'BRIEF.md'),
  `# ${name} film brief

Fill this before any scene. The skill's references/brief.md explains each line.

- **Goal** (what the viewer does after): [TO FILL]
- **Audience** (who decides, how technical): [TO FILL]
- **Promise** (one line, ≤ 8 words, becomes the end card): [TO FILL]
- **Formats and languages**: 16:9 and 9:16, FR and EN
- **Length**: [30 to 60 s]
- **Brand**: colours, display font, logo file, source of each: [TO FILL]
- **Proof on screen** (real numbers only, with their source): [TO FILL or none]

## Beats (one sentence each, one thing moving at a time)

| # | Scene | Caption (≤ 10 words) | What the product shows | Sound |
|---|---|---|---|---|
| 1 | intro | | wordmark lands | impact |
| 2 | | | | |
| … | end | promise | wordmark returns | impact, final chord |
`,
);

if (args.includes('--install')) {
  npm(['install', '--loglevel=error'], {cwd: dest});
}

console.log(`Film project ready: ${dest}
Next:
  cd "${dest}"
  ${args.includes('--install') ? '' : 'npm install && '}npm run score   # music and sound effects
  npm run dev                       # Studio preview
  npm run audit                     # the gate`);
