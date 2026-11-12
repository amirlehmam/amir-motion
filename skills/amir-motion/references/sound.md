# Sound

Silent motion looks generated. The Soren film's sound is entirely synthesized from code (`scripts/score.mts`):
nothing to license, identical on every run, and built on the same timeline as the picture. For a more general
cue-sheet approach, see the `sound-design` skill; this file is how amir-motion films do it.

## Two layers

| Layer | Where | Placed by |
|---|---|---|
| Music bed (`public/audio/music.wav`) | `scripts/score.mts`, `ARRANGE` block | scene starts and `beat(scene, local)` |
| Effects (`public/audio/sfx/*.wav`) | `scripts/score.mts`, `fx(...)` calls | `src/cues.ts`, mapped by `at()` |

After any timeline or arrangement change: `npm run score`. The music is as long as the film plus a 0.5 s tail.

## Arrangement

Write `ARRANGE` from the beat sheet:

| Layer | Enters | Meaning |
|---|---|---|
| Pad (warm chords, 1 per bar) | from 0 | the bed, filter opens with energy |
| Arpeggio (plucks, ping-pong delay) | when the product appears | something is happening |
| Groove (kick, shaker, bass) | when the product starts working | momentum |
| Full (fuller pad, double kick) | on the hero moment | the payoff |
| Riser (noise sweep) | ending exactly on the hero moment | once per film |
| Bells | opening motif, final chord | identity |

Groove leaves before the end card; the final chord rings out alone.

Key: D major, 96 BPM by default (`BPM`, `CHORDS`). Change both for another mood; keep every tonal effect in
the same key.

## Effects library (from `npm run score`)

| File | On screen | Volume |
|---|---|---|
| `impact` | logo lands (intro, end): twice per film max | 0.55 to 0.75 |
| `swish` | a window or panel arrives | 0.3 to 0.5 |
| `whoosh-in`, `whoosh-out` | camera dives in, pulls back | 0.5 to 0.55 |
| `pop` | a card, badge or PR appears | 0.4 to 0.45 |
| `click` | cursor press | 0.65 to 0.75 |
| `switch` | a toggle | 0.3 to 0.35 |
| `tock` | a small state change (selected, committed) | 0.3 to 0.4 |
| `step0`…`step6` | a step done: rising pentatonic, progress you can hear | 0.3 to 0.5 |
| `gate0`…`gate3` | a check turns green | 0.3 to 0.45 |
| `chime` | the payoff (approved, done) | 0.55 to 0.6 |
| `sparkle` | many things light up at once | 0.35 to 0.4 |
| `key` | typing, through `keys(scene, from, count, step, vol)` | 0.24 to 0.3 |

New sound: add an `fx('name', seconds, draw, peakDb, reverb)` call in `score.mts` built from the primitives
(`blip`, `bell`, `noiseSweep`, `pluck`, `kick`). The audit fails a cue whose file does not exist.

## Rules of placement

- A cue's `local` is the same number as the beat in the scene file. Never a film frame.
- Sound lands on the first frame of the visual event (the press frame, the arrival frame), or 1 to 2 frames
  before for a whoosh.
- Accent, don't narrate: idle motion, drift and spinners stay silent.
- Sequences of ticks rise in pitch; never the same note five times.

## Master

`npm run finish` renders, extracts the mix, runs `scripts/master.mjs` (gain to -14 LUFS, look-ahead limiter at
-1.5 dBFS), and remuxes without re-encoding the picture. The audit then measures each MP4: -14 ± 1 LUFS,
peak ≤ -1 dBFS. `node scripts/loudness.mjs file.wav` measures any WAV.

## Voice-over (optional)

Not used in the Soren film: the captions carry the story. If a product needs a voice, generate it, place it
in `public/audio/`, declare it in `ASSETS.md`, and make the voice the clock (scene lengths follow the
sentences). `extreme-motion-design` covers voice generation and alignment.
