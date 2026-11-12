// Find npm's own CLI files next to the running Node, so scripts never look commands up through PATH.
// Windows: <node dir>/node_modules/npm/bin. macOS, Linux, nvm, Homebrew: <node dir>/../lib/node_modules/npm/bin.
import {execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import path from 'node:path';

export const npmBin = (name) => {
  const dir = path.dirname(process.execPath);
  const candidates = [
    path.join(dir, 'node_modules', 'npm', 'bin', name),
    path.join(dir, '..', 'lib', 'node_modules', 'npm', 'bin', name),
  ];
  const found = candidates.find((p) => existsSync(p));
  if (!found) throw new Error(`Cannot find npm's ${name} next to ${process.execPath}. Is npm installed with this Node?`);
  return found;
};

// Run `npm …` or `npx …` with the running Node binary.
export const npm = (args, opts = {}) => execFileSync(process.execPath, [npmBin('npm-cli.js'), ...args], {stdio: 'inherit', ...opts});
export const npx = (args, opts = {}) => execFileSync(process.execPath, [npmBin('npx-cli.js'), ...args], {stdio: 'inherit', ...opts});
