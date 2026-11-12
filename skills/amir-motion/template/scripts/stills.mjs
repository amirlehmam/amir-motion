// Dailies: the contact sheet of a cut (the film frozen at its key frames, in one still), plus any frame you name.
// node scripts/stills.mjs [wide|tall] [fr|en] [extra frames at 30 fps…]
//   -> out/sheet-<lang>-<cut>.png and out/stills/<lang>-<cut>-<frame>.png
import {bundle} from '@remotion/bundler';
import {ensureBrowser, renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';

const cut = process.argv[2] || 'wide';
const lang = process.argv[3] || 'fr';
const extra = process.argv.slice(4).map(Number);

await ensureBrowser(); // a fresh project has no headless Chrome yet
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});

const sheet = await selectComposition({serveUrl, id: `Sheet-${lang}-${cut}`});
const sheetOut = `out/sheet-${lang}-${cut}.png`;
await renderStill({composition: sheet, serveUrl, output: sheetOut, frame: 0});
console.log(sheetOut);

if (extra.length) {
  const film = await selectComposition({serveUrl, id: `Film-${lang}-${cut}`});
  const k = film.fps / 30;
  for (const f of extra) {
    const output = `out/stills/${lang}-${cut}-${String(f).padStart(4, '0')}.png`;
    await renderStill({composition: film, serveUrl, output, frame: Math.round(f * k), scale: Number(process.env.SCALE || 0.5)});
    console.log(output);
  }
}
