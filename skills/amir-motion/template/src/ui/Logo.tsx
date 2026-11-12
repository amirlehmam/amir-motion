import React from 'react';
import {staticFile} from 'remotion';
import {serif, stage} from '../theme';

// The product's wordmark. With `src` (a white or black PNG/SVG in public/), a CSS mask lets it
// take any ink. Without it, the product name is set in the display serif.
export const Wordmark: React.FC<{name: string; height: number; color?: string; src?: string; ratio?: number; style?: React.CSSProperties}> = ({
  name, height, color = stage.ink, src, ratio = 4, style,
}) => {
  if (!src) {
    return <div style={{fontFamily: serif, fontSize: height, lineHeight: 1, color, letterSpacing: -height * 0.03, ...style}}>{name}</div>;
  }
  const url = `url(${staticFile(src)})`;
  return (
    <div
      style={{
        width: height * ratio, height, background: color,
        WebkitMaskImage: url, maskImage: url, WebkitMaskSize: 'contain', maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center', ...style,
      }}
    />
  );
};
