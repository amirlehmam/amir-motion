# Formats, render and delivery

## Cuts

| Composition | Size | For |
|---|---|---|
| `Film-<lang>-wide` | 1920 × 1080, 60 fps | landing page, YouTube, LinkedIn feed, decks |
| `Film-<lang>-tall` | 1080 × 1920, 60 fps | Reels, Shorts, TikTok, LinkedIn mobile, stories |

A square cut (1080 × 1080) is one more entry in `FORMATS` and one more branch in each scene's layout.
Add it only when a channel asks for it.

## Render

```bash
npm run finish                       # every cut, mastered, out/Film-<lang>-<cut>.mp4
node scripts/finish.mjs Film-fr-wide # one cut
npm run audit                        # measures each MP4
```

Settings: H.264 CRF 16, JPEG frames (`remotion.config.ts`), AAC 320 k at 48 kHz, `+faststart` so the page
can start playing before the file is loaded. About 2 minutes per 20 s cut on Amir's machine.

## On a web page

- Autoplay muted, loop, `playsinline`, with a poster image rendered from frame 0
  (`node scripts/stills.mjs wide fr 0`).
- Under `prefers-reduced-motion`, show the poster and a play button instead of autoplay.
- A sound toggle, off by default.

## What to hand over

1. The MP4s (`out/`), named by product, language and cut.
2. The contact sheets (`out/sheet-*.png`).
3. The audit output, with every WARN left and why.
4. What was not checked (for example: "the 9:16 EN cut not watched end to end").
5. The source of every asset (`ASSETS.md`).

Nothing is announced as done before the audit passes and the sheets were looked at.
