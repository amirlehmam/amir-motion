# amir-motion rules in detail

Numbers come from the Soren launch film (40 s, FR/EN, 60 fps) and from Amir's feedback on it, unless marked
otherwise. Treat them as defaults you leave on purpose, never by accident.

## 1. Less talk
- One step = one sentence = one thing moving. A second line under it (`soft`) is allowed when it completes
  the first ("Un humain relit, puis valide.").
- 10 words max, present tense, no jargon: "La pull request s'ouvre toute seule.", not "Automated PR generation
  with CI gating".
- 30 to 60 s for a launch film. Soren: 8 scenes in 40 s. Beyond 60 s, cut a step, not the holds.
- Filler stays mute: background cards, rows and terminals carry no words, only shapes and bars. Only the hero
  object has a title.

## 2. Time to read
- On screen ≥ 1.5 s + 0.3 s per word (Amir found the Soren intro too fast; this rule fixed it).
- ≤ 17 characters per second.
- Measured in real seconds: a scene can play its action faster (`pace` > 1), its captions never speed up.
- Words rise one by one (3 frames apart, 22 frames each), then the line holds still. Nothing under the
  caption moves into it.
- Final card holds ≥ 2 s after it settles.
- The audit computes all of this from `captions.ts` and `copy.ts`, in every language.

## 3. Show, don't write
| The story says | The film shows |
|---|---|
| "a task arrives" | a card dropping into the first column |
| "it follows the method" | a checklist ticking, one rising note per tick |
| "quality gates" | four checks turning green in sequence |
| "a human approves" | the cursor clicks Approve, a chime |
| "dozens in parallel" | the camera pulls back on a grid of live tiles |
| "works with your tools" | a row of logos, monochrome |
| a number | a counter or a bar, with its source in `BRIEF.md` |

- The product is rebuilt in React from screenshots (`references/faux-ui.md`). Never embed the screenshot.
- Real numbers only. A measurement taken once is shown as a single run, not as a performance.

## 4. Type fits the theme
- Display serif for captions and the wordmark (Soren: Newsreader). Pick by subject, as in rudy-amir:
  tech/industrial → Newsreader, Zilla Slab, Roboto Slab; finance/legal → Source Serif 4, Libre Caslon;
  consumer → Fraunces; bold/sport → Alfa Slab One. Load through `@remotion/google-fonts`.
- UI sans copies the real product (Soren: Mona Sans). Mono only for code, ids, figures.
- Exactly 3 sizes for the film's own text (`size` in `theme.ts`): display 96, caption 56, label 30 on a
  1080 short side. UI texture can be smaller; if the story needs to read it, push the camera in.

## 5. No red, one accent
- Red hues (about H 345° to 15°, saturated) only for errors and destructive actions, or when red is in the
  product's brand chart. Window "traffic lights" are neutral dots.
- One accent, and it means something: the active card, the result, the payoff. Success is green, info blue.
- Light follows state, not time: a glow that pulses because the agent works, not because it is pretty.
- Every hex value lives in `theme.ts`. The audit warns on any hex in a scene and fails on decorative red.

## 6. One clock
- `timeline.ts` lists the scenes: `dur` (on screen) and `authored` (the clock its beats were written in).
- Beats are numbers in the scene's own clock, at 30 fps, even though the film renders at 60.
- `at(scene, local)` maps a beat to the film. Captions, cues and the score all use it. Retiming a scene moves
  its sound with it.
- Pure function of the frame: no CSS `transition`/`animation`, no timers, no `Math.random` (use `rand(seed)`),
  no `Date`. These play in Studio and break in the render. The audit fails them.

## 7. Travel, don't dissolve
- Scene transitions (`Film.tsx`): the outgoing scene accelerates up and out (`sink`, 15 frames, `easeIn`),
  the next decelerates in from below (`rise`, 26 frames, `ease`), both nearly opaque. When two scenes share a
  window, `over` + `hold`: only the panel changes, like real navigation.
- Curves (tokens in `theme.ts`): `ease` for arrivals, `easeIn` for exits, `easeInOut` for moves between two
  states, `overshoot` once per film. Linear only for continuous drift.
- Springs for physical things (cards, badges): `settle`, `pop`, `logo`.
- Exits ≈ half an entrance. Overlap scenes by 15 frames: a gap reads as loading.
- Camera: push in (scale 1 → 1.08 around the hero) to make the viewer look; pull back (scale on a
  perceptual curve, `a * (b / a) ** t`) to reveal scale. One hero moment per film; build to it.
- Nothing dead still: a slow 3 % drift on bookends, a spinner, a breathing glow.

## 8. Sound is half the film
- Original score synthesized by `scripts/score.mts`: no sample, no licence to clear. One key (D major in
  Soren); every tonal effect in it; pitch climbs with progress (each finished step rises a note).
- Layers enter with the story: pad from the start, plucked arpeggio when the product appears, groove when it
  starts working, full arrangement and one riser on the hero moment, resolved chord on the end card.
- Cues: impact on the logo (twice per film max), swish on a window, pop on a card, click on a press, chime on
  a payoff. No sound for drift or idle motion.
- Volumes: hero hits 0.6 to 0.75, clicks 0.65 to 0.75, ticks 0.3 to 0.5, swishes 0.3 to 0.5, music bed 0.85
  before mastering.
- Master: -14 LUFS integrated, peak ≤ -1 dBFS (`finish` aims at -1.5). Measured on the MP4 by the audit.

## 9. Each format is another cut
- 16:9 1920×1080 is the master; 9:16 1080×1920 is recomposed: captions wrap above, the product sits lower,
  inside y 300 to 1620, away from the platform's top and bottom UI.
- FR and EN come from one `copy.ts`; same keys in both, checked by the audit. Longer language decides the
  holds.
- Frame 0 is the thumbnail on every autoplaying feed: the mark or the product is already there.
- Muted autoplay: the captions alone tell the story. Sound adds, never carries.
- 60 fps render, CRF 16, AAC 320 k, `+faststart`.

## 10. Nothing that is not ours
- `motion.config.json` lists the forbidden names (former client, its internal tools and hosts, third-party
  brands without written consent). The audit scans code, copy, file names and text assets.
- Images are not scanned: check every frame of the contact sheet for small marks (a logo in a chip, a name
  in a breadcrumb, a ticket number). The first Soren film shipped with tiny client marks in its UI.
- `ASSETS.md` gives each file in `public/` its source and right to use. Generated audio is exempt.
- No invented customer, logo, quote or figure. Sample data in the faux UI is plainly fictional and neutral.
