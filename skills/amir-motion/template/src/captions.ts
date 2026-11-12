import type {Line} from './copy';
import type {SceneKey} from './timeline';

// Every sentence the viewer must read, with its beats in the scene's own clock (30 fps, authored).
// `out` is when it starts leaving; leave it out to hold until the scene ends.
// The audit checks each one, in each language, against the reading rule:
// on screen at least 1.5 s + 0.3 s per word, in real seconds after pacing.
export type CaptionCue = {scene: SceneKey; line: Line; at: number; out?: number; soft?: boolean};

export const CAPTIONS: CaptionCue[] = [
  {scene: 'intro', line: 'tagline', at: 30},
  {scene: 'intro', line: 'tagline2', at: 54, soft: true},
  {scene: 'demo', line: 'step1', at: 10, out: 112},
  {scene: 'demo', line: 'step2', at: 124},
  {scene: 'end', line: 'endSub', at: 10},
];
