import React from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import {useSceneFrame} from '../pace';
import {Copy, PRODUCT} from '../copy';
import {pop, prog, size, springs, stage} from '../theme';
import {SceneCaptions} from '../ui/Caption';
import {Wordmark} from '../ui/Logo';

// Frame 0 is the thumbnail on every autoplaying feed: the whole mark is already there, never a blank.
export const Intro: React.FC<{c: Copy; dur: number}> = ({c, dur}) => {
  const f = useSceneFrame();
  const s = pop(f, -6, springs.logo);
  const drift = 1 + 0.035 * prog(f, 0, dur, Easing.linear); // nothing is dead still
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', transform: `scale(${drift})`}}>
      <div style={{marginBottom: 56, transform: `scale(${0.85 + 0.15 * s})`, opacity: Math.min(1, 0.6 + s)}}>
        <Wordmark name={PRODUCT} height={size.display} />
      </div>
      <SceneCaptions scene="intro" c={c} frame={f} variant="stack" />
    </AbsoluteFill>
  );
};

export const End: React.FC<{c: Copy; dur: number}> = ({c, dur}) => {
  const f = useSceneFrame();
  const s = pop(f, 2, springs.logo);
  const drift = 1 + 0.03 * prog(f, 0, dur, Easing.linear);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', transform: `scale(${drift})`}}>
      <div style={{marginBottom: 40, transform: `scale(${0.9 + 0.1 * s})`, opacity: s}}>
        <Wordmark name={PRODUCT} height={size.display} color={stage.ink} />
      </div>
      <SceneCaptions scene="end" c={c} frame={f} variant="stack" />
    </AbsoluteFill>
  );
};
