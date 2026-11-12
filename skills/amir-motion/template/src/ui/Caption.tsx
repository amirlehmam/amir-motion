import React from 'react';
import {CAPTIONS} from '../captions';
import {Copy} from '../copy';
import {useLayout} from '../format';
import {usePace} from '../pace';
import {prog, serif, size as sizes, stage} from '../theme';
import {SceneKey} from '../timeline';

// A serif line that rises word by word, then holds still while it is read.
export const Caption: React.FC<{text: string; frame: number; at: number; out?: number; size?: number; color?: string; delay?: number; wrap?: boolean}> = ({
  text, frame, at, out, size = sizes.caption, color = stage.ink, delay = 3, wrap = false,
}) => {
  // Word timing in real frames: scale by the scene's pace so a faster scene never rushes its text.
  const k = usePace();
  const words = text.split(' ');
  const fadeOut = out === undefined ? 1 : 1 - prog(frame, out, out + 12 * k);
  return (
    <div style={{fontFamily: serif, fontSize: size, color, letterSpacing: -0.6, lineHeight: 1.14, opacity: fadeOut, whiteSpace: wrap ? 'normal' : 'nowrap', textAlign: 'center'}}>
      {words.map((w, i) => {
        const t = prog(frame, at + i * delay * k, at + (i * delay + 22) * k);
        return (
          <span key={i} style={{display: 'inline-block', opacity: t, transform: `translateY(${(1 - t) * 18}px)`, filter: `blur(${(1 - t) * 6}px)`, marginRight: size * 0.25}}>
            {w}
          </span>
        );
      })}
    </div>
  );
};

// All captions of a scene, from captions.ts. `band` pins them in the paper band above the product;
// `stack` lets them flow inside the parent (intro, end).
export const SceneCaptions: React.FC<{scene: SceneKey; c: Copy; frame: number; variant?: 'band' | 'stack'}> = ({scene, c, frame, variant = 'band'}) => {
  const {tall, captionTop, captionWidth} = useLayout();
  const lines = CAPTIONS.filter((l) => l.scene === scene).map((l, i) => (
    <Caption key={i} text={c[l.line]} frame={frame} at={l.at} out={l.out} color={l.soft ? stage.inkSoft : stage.ink} wrap={tall} />
  ));
  if (variant === 'stack') return <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, maxWidth: captionWidth}}>{lines}</div>;
  // Band captions that follow each other share one slot: stack them in the same grid cell.
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: captionTop, display: 'grid', justifyItems: 'center'}}>
      {lines.map((l, i) => (
        <div key={i} style={{gridArea: '1 / 1', maxWidth: captionWidth}}>{l}</div>
      ))}
    </div>
  );
};
