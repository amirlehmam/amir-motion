# The template, file by file

The architecture of the Soren film, emptied of its brand. Data files (`timeline`, `copy`, `captions`, `cues`)
have no value imports and no React, so Node reads them directly: the audit and the score script use the same
numbers as the picture.

| File | Role | You edit it to… |
|---|---|---|
| `src/timeline.ts` | Scene order, `dur` (on screen) and `authored` (beat clock), overlap `XF`, `at()` | add, remove, reorder, retime scenes |
| `src/copy.ts` | Every visible word, FR and EN, plus `PRODUCT` | write the captions and the UI words |
| `src/captions.ts` | Which line shows in which scene, from which beat to which beat | place sentences |
| `src/cues.ts` | Sound cues on scene beats, music file | place sounds |
| `src/theme.ts` | Fonts, 3 sizes, stage and product colours, easing, springs, `prog`, `rand` | apply the brand |
| `src/format.ts` | Cuts (wide, tall) and `useLayout()` | add a cut (square), move safe bands |
| `src/pace.ts` | `useSceneFrame()` (scene clock), `usePace()` | nothing |
| `src/Film.tsx` | Sequences, transitions between scenes (`rise`, `sink`, `over`, `hold`) | register a scene and its transition |
| `src/Soundtrack.tsx` | Music bed and cue sequences | nothing |
| `src/Sheet.tsx` | Contact sheet: the film frozen at key frames | the frames to review |
| `src/Root.tsx` | `Film-<lang>-<cut>` and `Sheet-<lang>-<cut>` compositions | add a language |
| `src/ui/` | `Caption`, `SceneCaptions`, `AppWindow`, `toStage`, `Cursor`, `cursorAt`, `Wordmark` | add shared product parts |
| `src/scenes/` | `Bookends` (intro, end), `Demo` (example) | build the film |
| `scripts/score.mts` | Synth score and sfx, arrangement on the timeline | shape the music |
| `scripts/stills.mjs` | Contact sheet per cut, plus named frames | nothing |
| `scripts/finish.mjs` | Render every cut, master to -14 LUFS, remux | nothing |
| `motion.config.json` | Forbidden names | list what must never appear |
| `ASSETS.md` | Source of every file in `public/` | declare each asset |
| `BRIEF.md` | Brief and beat sheet | step 1 |

## Commands

```bash
npm run dev       # Studio
npm run score     # public/audio/music.wav + public/audio/sfx/*.wav from the timeline
npm run stills    # out/sheet-fr-wide.png, out/sheet-fr-tall.png
node scripts/stills.mjs tall en 120 214   # a sheet plus frames 120 and 214 (30 fps clock)
npm run lint      # eslint + tsc
npm run audit     # the gate
npm run finish    # out/Film-<lang>-<cut>.mp4, mastered
```

## Add a scene

1. `timeline.ts`: add `{key: 'result', dur: 180, authored: 180}` where it plays in `ORDER`.
2. `src/scenes/Result.tsx`:
   ```tsx
   const B = {arrive: 12, check: 60, done: 96}; // beats, scene clock, 30 fps
   export const Result: React.FC<{c: Copy; dur: number}> = ({c}) => {
     const f = useSceneFrame();
     const arrive = prog(f, B.arrive, B.arrive + 26);
     return (
       <AbsoluteFill>
         <SceneCaptions scene="result" c={c} frame={f} />
         {/* product, positioned from useLayout() */}
       </AbsoluteFill>
     );
   };
   ```
3. `Film.tsx`: `result: {name: 'Result', C: Result, enter: 'rise', exit: 'sink'}` in `PARTS`.
4. `copy.ts`: the sentence in FR and EN. `captions.ts`: `{scene: 'result', line: 'step3', at: 10}`.
5. `cues.ts`: one cue per beat that deserves a sound, same numbers as `B`.
6. `npm run score`, `npm run stills`, `npm run audit`.

## Retime

- Too slow: lower `dur`, keep `authored`. The action speeds up, captions and sound follow.
- Text too fast: move `at` earlier, `out` later, or lengthen `dur`. Never shorten the word reveal.
- After any timeline change: `npm run score` (music sections follow the scenes).

## Pitfalls met on this machine

- Windows: keep the project path short. Headless Chrome fails to start past the 260-character limit.
- A fresh project downloads headless Chrome on its first still (`ensureBrowser()` in `stills.mjs`).
- Remotion's bundled ffmpeg has no `tile` filter: the contact sheet is a Remotion composition, not ffmpeg.
- `<Freeze>` cannot reach a frame past the end of its composition: the sheet lasts as long as the film.
- Amir's Windows runs with reduced motion: judge motion on renders and sheets, not in a browser preview.
