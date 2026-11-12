import {loadFont as loadSans} from '@remotion/google-fonts/MonaSans';
import {loadFont as loadSerif} from '@remotion/google-fonts/Newsreader';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';
import {Easing, interpolate, spring} from 'remotion';

// Every colour, font, size and curve of the film lives here. Scenes never write a hex value.

// ---------- Type: 3 families, 3 sizes for the film's own text ----------
// Pick the display face for the product's theme (references/rules.md, rule 4). Newsreader suits
// tech and institutional subjects; swap it for Fraunces, Zilla Slab, Source Serif 4…
export const serif = loadSerif('normal', {weights: ['400', '500'], subsets: ['latin']}).fontFamily;
export const sans = loadSans('normal', {weights: ['400', '500', '600', '700'], subsets: ['latin']}).fontFamily;
export const mono = loadMono('normal', {weights: ['400', '500'], subsets: ['latin']}).fontFamily;

// On a 1080 px short side. Display = wordmark and end line, caption = the one sentence per step,
// label = any product word the story depends on (the card title, the button that gets clicked).
export const size = {display: 96, caption: 56, label: 30} as const;

// ---------- Stage: the ground around the product ----------
export const stage = {
  paper: '#F3F1EA',
  paperDeep: '#E9E6DC',
  ink: '#17171A',
  inkSoft: '#5E5C57',
};

// One accent, and it means something: the thing that changed, the result, the payoff.
// Replace with the product's brand colour. Never a red unless red is in the brand chart.
export const accent = '#2F5BEA';

// ---------- Product UI tokens (rebuild the real product's palette here) ----------
export const ui = {
  bg1: '#0E0E0E',
  bg2: '#141414',
  panel: '#1C1C1C',
  card: '#1E1E1E',
  border: 'rgba(255,255,255,0.09)',
  alpha1: '#ffffff0a',
  alpha2: '#ffffff12',
  text: '#F8F8F8',
  text2: '#A3A3A3',
  text3: '#6B6B6B',
  success: '#4ADE80',
  info: '#6CCDFB',
  warning: '#FDAC53',
  danger: '#FF4758', // errors and destructive actions only
  onAccent: '#FFFFFF', // text on an accent fill
  onSuccess: '#0B2416', // ink on a success fill
};

// ---------- Motion ----------
export const ease = Easing.bezier(0.16, 1, 0.3, 1); // entrances: long, soft settle
export const easeIn = Easing.bezier(0.55, 0, 0.9, 0.4); // exits: leave fast, never linger
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1); // moves between two states
export const overshoot = Easing.bezier(0.55, 0, 0.2, 1.12); // one value that lands, once per film

// 0 -> 1 between two frames. The only tween scenes should need.
export const prog = (f: number, a: number, b: number, e = ease) =>
  interpolate(f, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});

export const lerp = (t: number, a: number, b: number) => a + (b - a) * t;

// Springs for physical things (UI, objects). Bezier tweens for type and camera.
export const springs = {
  settle: {damping: 200, mass: 0.6},
  logo: {damping: 14, mass: 0.9, stiffness: 90},
  pop: {damping: 11, mass: 0.7, stiffness: 220},
} as const;

export const pop = (f: number, at: number, config: (typeof springs)[keyof typeof springs] = springs.settle) =>
  spring({frame: f - at, fps: 30, config});

// Deterministic noise: never Math.random() in a scene.
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
