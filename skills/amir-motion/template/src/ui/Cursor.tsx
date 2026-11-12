import React from 'react';
import {easeInOut, lerp, prog} from '../theme';

// macOS-style arrow; (x, y) is the hotspot.
export const Cursor: React.FC<{x: number; y: number; pressed?: boolean; opacity?: number; size?: number}> = ({x, y, pressed, opacity = 1, size = 34}) => (
  <svg
    width={size} height={size * 1.4} viewBox="0 0 20 28"
    style={{position: 'absolute', left: x - 2, top: y - 1, opacity, transform: `scale(${pressed ? 0.88 : 1})`, transformOrigin: '2px 1px', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.3))', zIndex: 50}}
  >
    <path d="M2 1.5v21.5l5.4-5.2 3.6 8.3 3.6-1.6-3.5-8.1h7.5z" fill="#111" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

// A hand moves in a slight arc and slows before it lands. Keyframes in scene frames.
export type CursorKey = {f: number; x: number; y: number};
export const cursorAt = (frame: number, keys: CursorKey[]) => {
  if (frame <= keys[0].f) return {x: keys[0].x, y: keys[0].y};
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (frame <= b.f) {
      const t = prog(frame, a.f, b.f, easeInOut);
      const arc = Math.sin(Math.PI * t) * Math.min(80, Math.hypot(b.x - a.x, b.y - a.y) * 0.12);
      return {x: lerp(t, a.x, b.x), y: lerp(t, a.y, b.y) - arc};
    }
  }
  const z = keys[keys.length - 1];
  return {x: z.x, y: z.y};
};
