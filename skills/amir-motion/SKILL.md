---
name: amir-motion
description: Use when making a launch film, product video, animated explainer, demo video, teaser or reel for a product (Remotion, React), or when retiming, polishing, re-cutting (9:16, FR/EN) or auditing one. Amir's house rules for product films, built from the Soren launch film, with a ready template and an audit gate. Calls stageshow for the product UI and remotion-best-practices for Remotion. Also when the user says amir-motion, "une vidéo comme celle de Soren", "film de lancement", "vidéo produit", "motion design".
---

# amir-motion

Amir's house rules for product films. The film explains a product to a non-technical decision maker in 30 to 60 seconds: one sentence per step, the product doing the talking, sound locked to the picture, a clean cut in every format and language, and nothing in it that is not ours.

`<skill-dir>` below is the folder of this file (after `npx skills add … -g`: `~/.claude/skills/amir-motion`).

**Three skills, one film.** amir-motion owns the rules, the template, the sound and the gate. It calls two skills at fixed steps:

| Skill | Owns | Called at |
|---|---|---|
| `stageshow` | how the product UI looks: restraint, framing, crop, focal object, cursor story, poster frame | steps 1, 4 |
| `remotion-best-practices` | how Remotion is used: project, markup, Studio, render, captions, upgrade (routes to `remotion-*`) | steps 2, 5, 8 |

When one of them contradicts a rule below, the rule wins (for example stageshow's time-based `Act` API never enters a film: rule 6).

## The 10 rules (binding)

| # | Rule | Hard limit |
|---|------|-----------|
| 1 | Less talk | One sentence per step, 10 words max, plain words for a decision maker. One thing moves at a time. 30 to 60 s total. |
| 2 | Time to read | Every sentence stays on screen ≥ 1.5 s + 0.3 s per word, ≤ 17 characters per second, in real seconds after pacing. Text never moves while it is read. |
| 3 | Show, don't write | The product explains; the caption only names the step. Rebuild the product UI in React (never a screenshot). Integrations = logos. Numbers = counters or charts, real ones only. |
| 4 | Type fits the theme | 3 families max (display serif, UI sans, mono). 3 text sizes (display, caption, label) from `theme.ts`. Caption ≥ 48 px, any UI word the story points at ≥ 30 px or brought close by the camera. |
| 5 | No red, one accent | Red only for an error or a destructive action, unless it is in the brand chart. One accent colour, and it means something (the result, the change). Colours live in `theme.ts` only. |
| 6 | One clock | Every beat is a number in its scene's own clock. Picture, captions and sound read the same numbers. Everything derives from the frame: no CSS animation, timer, `Math.random`, `Date`, no stageshow `Act` runtime. |
| 7 | Travel, don't dissolve | Scenes move like one camera (rise, sink, push in, pull back), never a grey cross-fade. Eased starts and stops (tokens only), exits ≈ half an entrance, one hero moment per film. |
| 8 | Sound is half the film | Original synthesized score in one key, built on the timeline; a cue for each arrival, click and payoff, none for idle motion. Master at -14 LUFS integrated, peak ≤ -1 dBFS. |
| 9 | Each format is another cut | 16:9 master plus a recomposed 9:16 (not a crop), FR and EN from one copy file. Frame 0 is a real thumbnail. Readable muted. Text inside 80 % of the frame. |
| 10 | Nothing that is not ours | No former client, internal tool or third-party brand anywhere (code, copy, file names, images, metadata). Every asset has a source in `ASSETS.md`. No invented number, logo or testimonial. |

Full detail and numbers: `references/rules.md`. Where they come from: `references/source.md`.

## Workflow

0. **Doctor.** `node <skill-dir>/scripts/doctor.mjs`. It checks Node (22.18+) and installs `stageshow` and the Remotion skills from their official sources if they are missing. If it installed something, say so: the new skills load in the next session; meanwhile read their `SKILL.md` files directly.
1. **Brief.** Fill `BRIEF.md` with the user: goal, audience, promise (≤ 8 words), formats, length, brand and its sources, proof. Then the beat sheet: one row per step (caption, what the product shows, sound). Story arc and examples: `references/brief.md`. For each product scene, plan it the stageshow way: **invoke `stageshow`** and write, per scene, the focal object, the action, the payoff, what is left out, and the closest gold example (`hero-demo`, `payout-flow`, `choreography`, `table-edit`, `loading`…). Show the beat sheet and get a yes before any scene (Amir decides the substance).
2. **Scaffold.** **Invoke `remotion-best-practices`** and keep its router open for the whole build. Then:
   ```bash
   node <skill-dir>/scripts/new.mjs <folder> --name "Product" --forbid "Former Client,internal.host" --install
   cd <folder> && npm run score && npm run dev
   ```
   The template replaces the router's "create a new project" step; follow its "open the preview" step (`remotion-studio`) so the user watches the build. Use a short path on Windows (`C:/Users/<me>/<name>-motion`): headless Chrome fails past 260 characters. Map of the template: `references/architecture.md`.
3. **Brand.** Put the product's palette, display font and logo into `theme.ts` and `public/`, each with its source line in `ASSETS.md`. Map the product's own tokens the way stageshow's `references/looks.md` does. No brand source? Ask. Never invent one.
4. **Product scenes (stageshow).** For every scene that shows the product: open the gold example you named in step 1 (`<stageshow>/examples/<gold>/`) and read stageshow's `references/craft.md` (restraint, type, spacing, icons), `references/framing.md` (crop, gutters, layouts) and `references/motion.md` (story, cursor, values that change). Build it in Remotion with `theme.ts`, `AppWindow`, `cursorAt` and `toStage`, translating every stageshow move with the table in `references/faux-ui.md`. Copy the gold's structure and proportions, never its product identity.
5. **Remotion markup.** Before writing scene code, load `remotion-markup` through the router; use `remotion-captions` for word-level subtitles, `remotion-multimedia` for real footage, `remotion-maps` for maps, `remotion-interactivity` to expose props in Studio. Under these rules.
6. **Sound.** Write cues in `cues.ts` on the same beat numbers, set the arrangement in `scripts/score.mts`, run `npm run score`. Detail: `references/sound.md`.
7. **Dailies.** `npm run stills` renders one contact sheet per cut (each scene after it lands, its middle, before it leaves, plus frame 0). Open the PNGs and look at them, with stageshow's review eye (`references/review.md` there): what does the eye land on first, is it the result, is anything boxed, flat or empty? Fix and repeat. Never judge motion in a browser on a machine with reduced motion on.
8. **Gate and render.** `npm run lint`, then `npm run audit`. Fix every FAIL, weigh every WARN. Then `npm run finish` (render options: `remotion-render` through the router) and `npm run audit` again: it measures loudness, size and fps of each MP4. Rules 1, 3, 4 and 7 need a human eye: `references/checklist.md`.
9. **Review and deliver.** Hand the sheets and the brief to a clean-context reviewer before anything leaves. Deliver the MP4s, the sheets, the WARNs left and what was not checked. Formats and naming: `references/delivery.md`.

## Red flags, stop and fix

- A caption over 10 words, or two captions on screen that the viewer must read at once.
- A sentence that explains what the product could show by doing it.
- A screenshot of the product, a real customer name, a real ticket number, a logo that is not ours.
- A stageshow `Act`, `a.click()` or `setTimeout` pasted into a scene instead of translated to beats.
- A product scene built without a named stageshow gold example.
- A hex value or a font size typed inside a scene.
- `interpolate()` with no easing on something that starts or stops; everything fading in together.
- A frame number typed in `Soundtrack.tsx`, or a sound that lands between two beats.
- A cross-fade between two dark windows (grey fog).
- The 9:16 cut made by cropping the 16:9.
- A blank or half-drawn frame 0.
- "It looks fine in Studio": nothing is done before the contact sheet and the audit.
