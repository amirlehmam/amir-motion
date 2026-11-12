import React from 'react';
import {sans, ui} from '../theme';

// A dark product window floating on paper, the way launch films frame a UI.
// Rebuild the real product inside it in React (references/faux-ui.md): crisp at any zoom,
// every state animatable, no screenshot that can leak a name or a number.
export const AppWindow: React.FC<{width: number; height: number; children: React.ReactNode; chrome?: boolean; style?: React.CSSProperties}> = ({
  width, height, children, chrome = true, style,
}) => (
  <div
    style={{
      width, height, borderRadius: 26, overflow: 'hidden', background: ui.bg1, display: 'flex', flexDirection: 'column', fontFamily: sans,
      boxShadow: '0 50px 120px rgba(40,32,20,0.28), 0 12px 32px rgba(40,32,20,0.18), 0 0 0 1px rgba(0,0,0,0.5)', ...style,
    }}
  >
    {chrome ? (
      // Neutral dots: coloured traffic lights put a red accent in every frame (rule 5).
      <div style={{display: 'flex', gap: 9, padding: '18px 22px 6px'}}>
        {[0, 1, 2].map((i) => <div key={i} style={{width: 13, height: 13, borderRadius: 99, background: ui.alpha2}} />)}
      </div>
    ) : null}
    <div style={{flex: 1, position: 'relative', overflow: 'hidden'}}>{children}</div>
  </div>
);

// Map a point from window-local pixels to stage pixels, through a camera push (scale around an origin).
export const toStage = (p: {x: number; y: number}, win: {x: number; y: number}, cam: {scale: number; ox: number; oy: number}) => ({
  x: win.x + cam.ox + (p.x - cam.ox) * cam.scale,
  y: win.y + cam.oy + (p.y - cam.oy) * cam.scale,
});
