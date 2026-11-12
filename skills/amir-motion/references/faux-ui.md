# Faux UI, cursor and camera

The product is the actor. It is rebuilt in React, not filmed: crisp at any zoom, every state animatable, no
real data or mark that can leak.

## stageshow decides the look, amir-motion moves it

`stageshow` is the design authority for the product on screen: its gold examples are the quality bar, its
`craft.md`, `framing.md` and `motion.md` are the rules for restraint, crop and cursor story. Its runtime is not
used: stageshow plays scenes in real time (`Act`), a film must be a pure function of the frame. Translate:

| stageshow | In the film |
|---|---|
| plan: focal object, action, payoff, what to leave out | one row of the beat sheet per scene |
| a gold example (`hero-demo`, `payout-flow`…) | copied structure: stage size, crop, row and type sizes, beats |
| fidelity `standard`: real words where they carry meaning, bars elsewhere | hero object has words, filler rows have bars or neutral labels |
| `Text filler`, `Bar`, `Row` | plain divs styled from `ui` tokens in `theme.ts` |
| `data-target` + `rect()` to aim the cursor | the target's position in window pixels, through `toStage(point, win, cam)` |
| `a.click()` | a beat `B.press`: `cursorAt` lands at `B.press - 2`, 6-frame press, `click` cue at `B.press` |
| `a.set()` (change the scene) | a state derived from a beat: `prog(f, B.x, B.x + n)`, or `f >= B.x` for a discrete flip |
| result after press feedback | the press shows first, the result starts ≥ 6 frames later |
| things appear, travel, leave (kept mounted) | always rendered, opacity and position from `prog`; others make room |
| values that change in place (roll, not swap) | a counter interpolated between beats, digits rolling, never a cut |
| `poster` frame | frame 0 and the end card: each tells the story alone |
| loop that ends where it began | not needed: a film ends on its promise; loops only for a page hero |
| camera, scroll | the camera layer (push in, pull back) in the scene, captions outside it |
| `--gate` rehearsal and contact sheet | `npm run stills` + `npm run audit` |
| `references/review.md` fresh-eye pass | step 7 of the workflow, on the contact sheets |

When the same product also needs a live demo on its landing page, build that one with stageshow itself
(`Act` runtime, React), from the same tokens: the page and the film then show one product.

## Rebuild the product

1. **References.** Put 3 to 6 screenshots of the real product in `ref/` (outside `public/`, never rendered).
   Real product of the client being filmed, or its public site. Never a former client's screens.
2. **Tokens first.** Copy the product's palette, radius, border alpha and UI font into `ui` and `sans` in
   `theme.ts`. Soren kept the product's dark greys (zero chroma) and placed it on warm paper: a dark product
   on a light stage reads as "the product" at a glance.
3. **Shell, then panel, then the hero.** `AppWindow` (rounded, deep soft shadow on paper), a sidebar if the
   product has one, the main panel. Then only the parts the story touches.
4. **Filler is shape, hero is words.** Background cards and rows get bars or neutral fictional labels; only
   the hero object carries a real-looking title. Fewer words on screen, one focal point.
5. **Fictional, neutral data.** Generic tasks ("Export alarms to CSV"), fictional ids, no customer name, no
   real ticket number, no internal URL. Third-party logos (a forge, a cloud) only as monochrome marks with
   their source in `ASSETS.md`.
6. **Sizes.** Rebuild at a size where the story's words reach `size.label` (30 px) on the 1080 short side,
   or push the camera in on them.

## States, not keyframes

Each object derives its state from beats:

```ts
const arrive = prog(f, 14, 40);                       // 0 -> 1
const toPlanning = prog(f, 92, 122, easeInOut);       // a move between two states
const x = lerp(toPlanning, COL_X.intake, COL_X.planning);
const lift = Math.sin(Math.PI * toPlanning) * 14;     // lifts while it travels, lands flat
const mode = toPlanning > 0.5 ? 'working' : 'idle';  // discrete state flips at mid-move
```

- Others make room: when the hero enters a column, the cards below slide by one slot, then close the gap.
- Counters follow the hero (a column count goes 3 → 4 as it lands).
- Status chips and spinners carry the "it is working" feeling without words.

## Cursor

- `cursorAt(frame, keys)`: eased, slight arc, slows before landing. Appears 8 frames before it moves,
  disappears 10 to 18 frames after the click.
- Press = 6 frames: cursor scales to 0.88, the button to 0.95, a `click` cue on the first press frame.
- Target in stage pixels through the camera: `toStage(pointInWindow, win, cam)`. Never hand-place the cursor
  on a zoomed window.
- One click per step. The viewer's eye follows the cursor: do not move anything else while it travels.

## Camera

- **Push in** to make the viewer look: scale 1 → 1.08 around the hero, `easeInOut`, 40 to 60 frames, before
  the important beat, not during the reading of a caption that sits on the product.
- **Dive** into a detail: click, then the next scene opens on the same window (`hold` + `over`) as if the
  camera followed.
- **Pull back** to reveal scale: scale from 2.1 to 0.78 on a perceptual curve (`a * (b / a) ** t`), which
  feels even, unlike a linear scale.
- **Drift**: 3 % over a whole bookend, linear. Nothing is dead still.
- Text the viewer reads never moves with the camera: captions live outside the camera layer.

## Recompose for 9:16

- Read `useLayout()`: `tall`, `captionTop`, `captionWidth`.
- Captions wrap (`wrap`) above the product, from y 300.
- The window becomes narrower and lower (Demo: 1000 × 980 at y 640); keep the hero row and its button inside
  90 % of the width after the camera push.
- Check both sheets: the tall one is a separate composition, not a crop of the wide one.
