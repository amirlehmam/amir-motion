import type {SceneKey} from './timeline';

// The sound design, written in each scene's own clock: the same numbers the picture uses.
// Soundtrack.tsx maps them to the film with `at`, so sound and image cannot drift when a scene
// is retimed. Every `sfx` is a file in public/audio/sfx, made by `npm run score`.
// Accent, don't narrate: a cue for each arrival, click and payoff, none for drift or idle motion.
export type Cue = {scene: SceneKey; local: number; sfx: string; vol: number};

const cue = (scene: SceneKey, local: number, sfx: string, vol: number): Cue => ({scene, local, sfx, vol});

// Humanised typing: one key per character pair, small gain variation.
export const keys = (scene: SceneKey, from: number, count: number, step: number, vol: number) =>
  Array.from({length: count}, (_, i) => cue(scene, from + i * step, 'key', vol * (0.75 + (0.25 * ((i * 7) % 3)) / 2)));

export const MUSIC = {file: 'audio/music.wav', vol: 0.85};

export const CUES: Cue[] = [
  // Intro: the mark lands
  cue('intro', 4, 'impact', 0.7),

  // Demo: window rises, the new row pops in, the cursor clicks, the row resolves
  cue('demo', 2, 'swish', 0.35),
  cue('demo', 40, 'pop', 0.45),
  cue('demo', 150, 'click', 0.7),
  ...[176, 190, 204].map((l, i) => cue('demo', l, `step${i}`, 0.5)),
  cue('demo', 214, 'chime', 0.55),

  // End: the mark returns
  cue('end', 1, 'impact', 0.55),
];
