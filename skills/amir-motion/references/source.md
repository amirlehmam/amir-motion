# Where the rules come from

Do not ship this wording anywhere; it is the brief.

## Amir's request (verbatim, 2026-11-12)

> créer moi un skill uniquement pour le motion design mtn en te basant sur la logique du skill rudy-amir tu
> capte? faut aussi tu vois les meilleur bonne pratique etc pour faire un super skill mec le but c que je
> veuille reproduire des vidéo comme j'ai fais pour la vidéo de soren la (avec remotion) mais pour d'uatre
> produits etc tu capte

## The reference film

The Soren launch film: 40 s, FR and EN, 60 fps, 8 scenes, synthesized score,
mastered at -14 LUFS. Its architecture (scene clock, pace, captions in real seconds, cues on the scene clock,
travel transitions, faux UI on paper) is the template of this skill.

## Lessons it taught (from the Soren folder's memory, 2026-11-11)

- **Readable for a non-technical viewer.** The film worked because it is explicit: one sentence per step and
  one thing happening at a time. Amir found the opening text too fast. → rules 1 and 2, with the
  1.5 s + 0.3 s per word hold.
- **Remove every trace of a former client.** The first film's UI carried small marks of the client of the
  time; it cannot be shown outside until redone. → rule 10, `motion.config.json`, `ASSETS.md`.
- **Amir's machine hides animations.** Windows reduced motion makes previews look frozen. → judge on renders
  and contact sheets.
- **A full-screen grid looks AI-made.** → no repeating background pattern; paper stage, colour fields.

## Inherited from rudy-amir

Less talk, show don't write, typography fitting the theme with serif display, three text sizes, no
decorative red, mobile as another form (here: 9:16 as another cut), and a gate that fails until the rules hold.

## Borrowed best practice

From the `motion-design` and `extreme-motion-design` skills on this machine: everything derived from the frame,
easing tokens, exits shorter than entrances, one hero moment, safe areas, independent review before delivery.
