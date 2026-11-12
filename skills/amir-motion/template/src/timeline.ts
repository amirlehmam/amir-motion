// One timeline for picture, captions and sound. Pure data, no imports: the audit and the score
// script read it straight from Node.
//
// `dur` is the scene's on-screen length at 30 fps. `authored` is the length its beats were written
// for, so pace = authored / dur. To tighten a scene, lower `dur` and keep `authored`: the action
// plays faster, captions keep their real reading time, and every sound cue follows.
export const XF = 15; // overlap between two scenes, in 30 fps frames
export const FILM_FPS = 60; // authored at 30, rendered at 60 for smoother motion
export const K = FILM_FPS / 30;

export const ORDER = [
  {key: 'intro', dur: 170, authored: 170},
  {key: 'demo', dur: 270, authored: 270},
  {key: 'end', dur: 120, authored: 120},
] as const;

export type SceneKey = (typeof ORDER)[number]['key'];
export type Scene = {key: SceneKey; from: number; dur: number; authored: number; pace: number};

export const SCENES = (() => {
  const out = {} as Record<SceneKey, Scene>;
  let t = 0;
  for (const s of ORDER) {
    out[s.key] = {key: s.key, dur: s.dur, authored: s.authored, from: t, pace: s.authored / s.dur};
    t += s.dur - XF;
  }
  return out;
})();

const last = ORDER[ORDER.length - 1].key;
export const TOTAL = SCENES[last].from + SCENES[last].dur;

// Film frame (30 fps) of a beat written at `local` in a scene's own clock.
export const at = (key: SceneKey, local: number) => Math.round(SCENES[key].from + local / SCENES[key].pace);
