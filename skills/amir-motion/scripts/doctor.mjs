#!/usr/bin/env node
// Step 0 of amir-motion: check the machine, install the skills it calls if they are missing.
//   node <skill-dir>/scripts/doctor.mjs            check, then install what is missing
//   node <skill-dir>/scripts/doctor.mjs --check    check only, exit 1 if something is missing
//   node <skill-dir>/scripts/doctor.mjs --agent cursor   install for another agent (default: claude-code)
// The two skills come from their official sources, never from a copy: they stay up to date and
// their licences stay with their authors.
import {existsSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {npx} from './lib/npm.mjs';

const DEPENDENCIES = [
  {name: 'stageshow', source: 'benjitaylor/skills', skills: ['stageshow'], why: 'faux product UI, framing, cursor choreography'},
  {name: 'remotion-best-practices', source: 'remotion-dev/skills', skills: ['*'], why: 'Remotion API, Studio, markup, render (router to remotion-*)'},
];

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const agentIndex = args.indexOf('--agent');
const agent = agentIndex >= 0 ? args[agentIndex + 1] : 'claude-code';

const home = os.homedir();
const roots = [
  path.join(home, '.claude', 'skills'),
  path.join(home, '.agents', 'skills'),
  path.join(process.cwd(), '.claude', 'skills'),
  path.join(process.cwd(), '.agents', 'skills'),
];
const installed = (name) => roots.some((r) => existsSync(path.join(r, name, 'SKILL.md')));

let problems = 0;
const [major, minor] = process.versions.node.split('.').map(Number);
if (major > 22 || (major === 22 && minor >= 18)) console.log(`ok    node ${process.versions.node}`);
else {
  console.log(`FAIL  node ${process.versions.node}: amir-motion needs Node 22.18+ (it reads the film's .ts data directly). Install Node 24 LTS.`);
  problems++;
}

for (const dep of DEPENDENCIES) {
  if (installed(dep.name)) {
    console.log(`ok    ${dep.name} (${dep.why})`);
    continue;
  }
  if (checkOnly) {
    console.log(`MISS  ${dep.name}: npx skills add ${dep.source} --skill ${dep.skills.join(' ')} -g -a ${agent} -y`);
    problems++;
    continue;
  }
  console.log(`get   ${dep.name} from ${dep.source}…`);
  try {
    npx(['-y', 'skills', 'add', dep.source, '--skill', ...dep.skills, '-g', '-a', agent, '-y']);
  } catch {
    // The install command printed its own error above.
  }
  if (installed(dep.name)) console.log(`ok    ${dep.name} installed`);
  else {
    console.log(`FAIL  ${dep.name} still missing. Run: npx skills add ${dep.source} --skill ${dep.skills.join(' ')} -g -y`);
    problems++;
  }
}

if (problems) {
  console.log(`\n${problems} problem(s). Fix them, then start a new Claude Code session so the new skills load.`);
  process.exit(1);
}
console.log('\namir-motion is ready. If a skill was just installed, start a new session so it loads.');
