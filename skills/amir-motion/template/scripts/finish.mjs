// Render one cut, master its audio to -14 LUFS / -1.5 dBFS, remux without touching the picture.
// node scripts/finish.mjs [compositionId…]   (default: every Film-* composition)
//   -> out/<id>.mp4
import {execFileSync} from 'node:child_process';
import {mkdirSync, rmSync} from 'node:fs';
import path from 'node:path';

// The project's own Remotion CLI and the running Node binary: no lookup through PATH.
const CLI = path.resolve('node_modules/@remotion/cli/remotion-cli.js');
const run = (args) => execFileSync(process.execPath, [CLI, ...args], {stdio: 'inherit'});
const ids = process.argv.slice(2);
const all = ids.length ? ids : ['Film-fr-wide', 'Film-en-wide', 'Film-fr-tall', 'Film-en-tall'];
mkdirSync('out', {recursive: true});

for (const id of all) {
  const tmp = `out/_${id}`;
  run(['render', id, `${tmp}.mp4`, '--crf=16', '--audio-bitrate=320k', '--log=error']);
  run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-i', `${tmp}.mp4`, '-vn', '-ac', '2', '-ar', '48000', '-c:a', 'pcm_s16le', '-y', `${tmp}.wav`]);
  execFileSync(process.execPath, ['scripts/master.mjs', `${tmp}.wav`, `${tmp}.master.wav`], {stdio: 'inherit'});
  run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-i', `${tmp}.mp4`, '-i', `${tmp}.master.wav`, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', '-y', `out/${id}.mp4`]);
  for (const ext of ['.mp4', '.wav', '.master.wav']) rmSync(`${tmp}${ext}`, {force: true});
  console.log(`out/${id}.mp4`);
}
