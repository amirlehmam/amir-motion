import React from 'react';
import {Composition} from 'remotion';
import {Film} from './Film';
import {Lang} from './copy';
import {Format, FORMATS} from './format';
import {Sheet, sheetSize} from './Sheet';
import {FILM_FPS, K, TOTAL} from './timeline';

// One composition per language and format: Film-fr-wide, Film-en-tall…
// Plus one contact sheet per language and cut: Sheet-fr-wide… (npm run stills).
const LANGS: Lang[] = ['fr', 'en'];
const CUTS = Object.keys(FORMATS) as Format[];

export const RemotionRoot: React.FC = () => (
  <>
    {LANGS.flatMap((lang) =>
      CUTS.map((cut) => (
        <Composition
          key={`film-${lang}-${cut}`}
          id={`Film-${lang}-${cut}`}
          component={Film}
          durationInFrames={TOTAL * K}
          fps={FILM_FPS}
          width={FORMATS[cut].width}
          height={FORMATS[cut].height}
          defaultProps={{lang, cut, sound: true}}
        />
      )),
    )}
    {LANGS.flatMap((lang) =>
      // As long as the film: <Freeze> cannot reach a frame past its composition's end.
      CUTS.map((cut) => (
        <Composition key={`sheet-${lang}-${cut}`} id={`Sheet-${lang}-${cut}`} component={Sheet} durationInFrames={TOTAL * K} fps={FILM_FPS} {...sheetSize(cut)} defaultProps={{lang, cut}} />
      )),
    )}
  </>
);
