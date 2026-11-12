# amir-motion

Un skill Claude Code pour faire des films de lancement produit en Remotion, comme le film de Soren : une phrase
par étape, le produit qui montre au lieu d'expliquer, un son calé sur l'image, des versions FR/EN en 16:9 et
9:16. Il vient avec un modèle de projet prêt et un audit qui bloque le film tant que les règles ne sont pas
tenues.

Il s'appuie sur deux skills existants, installés depuis leurs sources officielles :

- [`stageshow`](https://github.com/benjitaylor/skills) pour l'interface produit à l'écran (cadrage, sobriété,
  curseur) ;
- [`remotion-best-practices`](https://github.com/remotion-dev/skills) pour l'usage de Remotion (projet, Studio,
  rendu).

## Installer

Prérequis : Node 22.18 ou plus récent (Node 24 LTS conseillé), Claude Code.

Tout en une ligne (amir-motion, stageshow et les skills Remotion) :

```bash
npx skills add amirlehmam/amir-motion -g -a claude-code -y && npx skills add benjitaylor/skills --skill stageshow -g -a claude-code -y && npx skills add remotion-dev/skills --skill '*' -g -a claude-code -y
```

Ou seulement amir-motion : au premier usage, le skill lance `scripts/doctor.mjs`, qui installe stageshow et
les skills Remotion s'ils manquent.

```bash
npx skills add amirlehmam/amir-motion -g -a claude-code -y
```

Vérifier l'installation à tout moment :

```bash
node ~/.claude/skills/amir-motion/scripts/doctor.mjs --check
```

Relancez Claude Code après l'installation pour que les skills se chargent.

## Utiliser

Dans Claude Code : `/amir-motion`, ou simplement « fais-moi un film de lancement pour <produit> ».

Le skill déroule :

1. Doctor : vérification de la machine et des skills appelés.
2. Brief et découpage : une ligne par étape, à valider avant toute scène.
3. Projet généré par `scripts/new.mjs` : Remotion, FR/EN, 16:9 et 9:16, partition synthétisée.
4. Scènes produit construites avec les règles de stageshow.
5. Planches contact, audit, rendu masterisé à -14 LUFS.

À la main :

```bash
node ~/.claude/skills/amir-motion/scripts/new.mjs C:/Users/moi/acme-motion --name "Acme" --forbid "Ancien Client" --install
cd C:/Users/moi/acme-motion
npm run score    # musique et effets, générés depuis la timeline
npm run dev      # Remotion Studio
npm run stills   # planches contact 16:9 et 9:16
npm run audit    # le gate
npm run finish   # rendu de toutes les versions, son masterisé
```

Sous Windows, gardez un chemin de projet court : Chrome headless ne démarre pas au-delà de 260 caractères.

## Ce qu'il y a dedans

| Dossier | Contenu |
|---|---|
| `skills/amir-motion/SKILL.md` | Les 10 règles, le workflow, les signaux d'alerte |
| `skills/amir-motion/references/` | Règles détaillées, brief, architecture, interface produit, son, livraison, checklist |
| `skills/amir-motion/template/` | Le projet Remotion de départ, sans aucune marque |
| `skills/amir-motion/scripts/` | `doctor.mjs`, `new.mjs`, `audit.mjs` |

Remotion est gratuit pour les particuliers et les sociétés jusqu'à 3 personnes ; au-delà, il faut une
[licence Company](https://www.remotion.dev/license).
