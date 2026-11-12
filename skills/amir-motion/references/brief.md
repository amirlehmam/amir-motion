# Brief and beat sheet

Nothing is animated before the beat sheet is approved. A film is cheap to rewrite as a table and expensive to
rewrite as code.

## The brief (BRIEF.md)

| Line | Question | Bad | Good |
|---|---|---|---|
| Goal | What does the viewer do after? | "Present the product" | "Book a demo from the landing page" |
| Audience | Who decides, how technical? | "Everyone" | "CTO and engineering managers, not hands-on" |
| Promise | The end card, ≤ 8 words | "The future of dev" | "Du ticket à la pull request, sous contrôle." |
| Formats | Where it plays | | 16:9 site and LinkedIn, 9:16 Reels |
| Length | | 90 s | 30 to 60 s |
| Brand | Colours, display font, logo, with sources | guessed from memory | taken from the site's CSS, file from the brand kit |
| Proof | Real numbers on screen, with source | "10x faster" | a measured figure and where it comes from, or none |

Missing information is written `[À COMPLÉTER : ...]` and asked, never invented.

## The arc of a product film

The Soren arc, reusable for most products:

1. **Promise** (bookend, 4 to 6 s). Wordmark lands, tagline in two lines: what it does, why you keep control.
2. **The trigger** (1 scene). Where the work comes from, in the customer's own tool: a ticket, an email, a form.
3. **The product works** (1 to 2 scenes). The core loop, step by step, each step visible and audible.
4. **The result** (1 scene). The thing the buyer pays for appears: the PR, the report, the paid invoice.
   This is usually the hero moment.
5. **Scale** (1 scene). Pull back: many at once, all visible, all controllable.
6. **Control** (1 scene). Settings, rights, approval: the objection "can I trust it" answered by showing.
7. **Fit** (optional, 1 scene). Works with what they have: logos, the same tool on both sides.
8. **Promise again** (bookend, 3 to 4 s). Wordmark, the one-line promise, the integrations row.

Short versions: 15 s = 1, 3, 4, 8. 30 s = 1, 2, 3, 4, 8.

## The beat sheet

One row per step. Write it with the user, then copy it into `timeline.ts`, `copy.ts`, `captions.ts` and
`cues.ts`.

| # | Scene | Caption (≤ 10 words) | What the product shows | Hero? | Sound |
|---|---|---|---|---|---|
| 1 | intro | Des développeurs IA qui travaillent dans le cloud, / pendant que votre équipe garde la main. | wordmark lands | | impact |
| 2 | board | Une tâche arrive sur le board. | card drops in Intake, slides to Building | | swish, pop, swish |
| 3 | run | L'agent suit la méthode de l'équipe, étape par étape. | checklist ticks, commit, 4 gates | | rising steps, gates |
| 4 | pr | La pull request s'ouvre toute seule. / Un humain relit, puis valide. | PR opens, checks green, cursor approves | yes | pop, click, chime |
| 5 | fleet | Des dizaines d'agents en parallèle. | camera pulls back on a grid | | whoosh-out, sparkle |
| … | end | Du ticket à la pull request, sous contrôle. | wordmark, forge logos | | impact, final chord |

Check before saying yes:
- Read the captions alone, in order: they tell the whole story without the picture (muted autoplay).
- Each caption passes rule 2 at the planned scene length (the audit will check it again).
- One hero moment, placed in the second half.
