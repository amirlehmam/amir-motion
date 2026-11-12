import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {copy, Copy, Lang} from './copy';
import {Cut, Format} from './format';
import {ease, easeIn, prog, stage} from './theme';
import {Pace, useFrame30} from './pace';
import {K, SCENES, SceneKey} from './timeline';
import {Demo} from './scenes/Demo';
import {End, Intro} from './scenes/Bookends';
import {Soundtrack} from './Soundtrack';

// How a scene arrives and leaves. A dark window fading over paper reads as grey fog, so scenes
// do not dissolve: they travel. The outgoing scene accelerates up and out while the next one
// decelerates in from below, both nearly opaque, like one continuous vertical camera move.
// 'over' and 'hold' pair up when two scenes share the same window: the new content lands on top
// of the old, which stays opaque underneath, so only the panel changes (like real navigation).
type In = 'none' | 'rise' | 'over';
type Out = 'none' | 'sink' | 'hold';

const TRAVEL = 280;

const Transit: React.FC<{dur: number; enter: In; exit: Out; children: React.ReactNode}> = ({dur, enter, exit, children}) => {
  const f = useFrame30();
  let o = 1;
  let y = 0;
  if (enter === 'rise') {
    o *= prog(f, 1, 6);
    y += (1 - prog(f, 0, 26, ease)) * TRAVEL;
  } else if (enter === 'over') {
    o *= prog(f, 0, 9);
  }
  if (exit === 'sink') {
    o *= 1 - prog(f, dur - 7, dur - 1);
    y -= prog(f, dur - 15, dur, easeIn) * TRAVEL;
  }
  return <AbsoluteFill style={{opacity: o, transform: `translateY(${y}px)`}}>{children}</AbsoluteFill>;
};

// One entry per scene of timeline.ts, in any order: the timeline decides when, this decides how it moves.
const PARTS: Record<SceneKey, {name: string; C: React.FC<{c: Copy; dur: number}>; enter: In; exit: Out}> = {
  intro: {name: 'Intro', C: Intro, enter: 'none', exit: 'sink'},
  demo: {name: 'Demo', C: Demo, enter: 'rise', exit: 'sink'},
  end: {name: 'End', C: End, enter: 'rise', exit: 'none'},
};

export type FilmProps = {lang: Lang; cut: Format; sound: boolean};

export const Film: React.FC<FilmProps> = ({lang, cut, sound}) => {
  const c = copy[lang];
  return (
    <Cut.Provider value={cut}>
      <AbsoluteFill style={{background: `radial-gradient(120% 90% at 50% 0%, ${stage.paper} 0%, ${stage.paper} 55%, ${stage.paperDeep} 100%)`, overflow: 'hidden'}}>
        {(Object.keys(PARTS) as SceneKey[]).map((key) => {
          const s = SCENES[key];
          const {name, C, enter, exit} = PARTS[key];
          return (
            <Sequence key={key} name={name} from={s.from * K} durationInFrames={s.dur * K}>
              <Pace.Provider value={s.pace}>
                <Transit dur={s.dur} enter={enter} exit={exit}>
                  <C c={c} dur={s.authored} />
                </Transit>
              </Pace.Provider>
            </Sequence>
          );
        })}
        {sound ? <Soundtrack /> : null}
      </AbsoluteFill>
    </Cut.Provider>
  );
};
