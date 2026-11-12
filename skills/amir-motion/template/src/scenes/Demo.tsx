import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useSceneFrame} from '../pace';
import {Copy} from '../copy';
import {useLayout} from '../format';
import {accent, easeInOut, lerp, pop, prog, size, springs, ui} from '../theme';
import {SceneCaptions} from '../ui/Caption';
import {Cursor, cursorAt} from '../ui/Cursor';
import {AppWindow, toStage} from '../ui/Window';

// Example scene: one request arrives, the camera leans in, a click, it resolves.
// One thing moves at a time, and every beat below has its sound in cues.ts at the same number.
const B = {arrive: 40, pushFrom: 64, pushTo: 118, cursorIn: 118, press: 150, work: 158, ticks: [176, 190, 204], done: 214};

const CHROME = 37; // the window's title strip
const TOP = 110; // first row, in content pixels
const ROW_H = 104;

const Check: React.FC<{s: number}> = ({s}) => (
  <svg width={20} height={20} viewBox="0 0 20 20" style={{transform: `scale(${s})`}}>
    <path d="M4.5 10.5l3.5 3.5 7.5-8" fill="none" stroke={ui.onSuccess} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// The right side of the hero row: button, then progress, then the result.
const RowStatus: React.FC<{c: Copy; f: number; pressed: boolean; working: number; done: number}> = ({c, f, pressed, working, done}) => {
  if (f < B.work) {
    return (
      <div style={{height: 56, width: 140, borderRadius: 14, background: accent, color: ui.onAccent, display: 'grid', placeItems: 'center', fontWeight: 600, transform: `scale(${pressed ? 0.95 : 1})`}}>
        {c.run}
      </div>
    );
  }
  if (done < 0.05) {
    return (
      <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
        {B.ticks.map((t) => {
          const k = pop(f, t, springs.pop);
          return <div key={t} style={{width: 22, height: 22, borderRadius: 99, background: k > 0.1 ? ui.success : ui.alpha2, transform: `scale(${0.7 + 0.3 * k})`}} />;
        })}
        <div style={{width: 200, height: 8, borderRadius: 9, background: ui.alpha2, overflow: 'hidden'}}>
          <div style={{width: `${working * 100}%`, height: '100%', background: accent}} />
        </div>
      </div>
    );
  }
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 12, height: 56, padding: '0 20px', borderRadius: 14, background: `${ui.success}22`, color: ui.success, fontWeight: 600, opacity: done, transform: `scale(${0.9 + 0.1 * done})`}}>
      <div style={{width: 30, height: 30, borderRadius: 99, background: ui.success, display: 'grid', placeItems: 'center'}}><Check s={done} /></div>
      {c.done}
    </div>
  );
};

export const Demo: React.FC<{c: Copy; dur: number}> = ({c}) => {
  const f = useSceneFrame();
  const {tall} = useLayout();
  const win = tall ? {x: 40, y: 640, w: 1000, h: 980} : {x: 210, y: 250, w: 1500, h: 780};
  const rowW = win.w - 56;

  // Beats
  const arrive = prog(f, B.arrive, B.arrive + 26);
  const push = prog(f, B.pushFrom, B.pushTo, easeInOut);
  const working = prog(f, B.work, B.ticks[2] + 8);
  const done = pop(f, B.done, springs.pop);
  const pressed = f >= B.press && f < B.press + 6;

  // Camera: lean in on the hero row (scale around its centre, in window pixels).
  const cam = {scale: lerp(push, 1, 1.08), ox: win.w / 2, oy: CHROME + TOP + ROW_H / 2};

  // The button the cursor clicks, in window pixels, then on stage through the camera.
  const btn = toStage({x: 28 + rowW - 24 - 70, y: CHROME + TOP + ROW_H / 2}, win, cam);
  const hand = cursorAt(f, [
    {f: B.cursorIn, x: win.x + win.w * 0.9, y: win.y + win.h + 60},
    {f: B.press - 2, x: btn.x, y: btn.y},
  ]);

  const others = c.rows.slice(1);
  return (
    <AbsoluteFill>
      <SceneCaptions scene="demo" c={c} frame={f} />
      <div style={{position: 'absolute', left: win.x, top: win.y, transform: `scale(${cam.scale})`, transformOrigin: `${cam.ox}px ${cam.oy}px`}}>
        <AppWindow width={win.w} height={win.h}>
          <div style={{position: 'absolute', left: 40, top: 30, display: 'flex', alignItems: 'center', gap: 14, fontSize: size.label, fontWeight: 600, color: ui.text}}>
            {c.listTitle}
            <div style={{fontSize: size.label, fontWeight: 500, color: ui.text3}}>{3 + (arrive > 0.5 ? 1 : 0)}</div>
          </div>

          {/* Filler rows: the list is busy, only the hero has a role */}
          {others.map((title, i) => (
            <div key={title} style={{position: 'absolute', left: 28, top: TOP + (i + arrive) * ROW_H, width: rowW, height: ROW_H - 14, borderRadius: 18, background: ui.card, border: `1px solid ${ui.border}`, display: 'flex', alignItems: 'center', padding: '0 28px', fontSize: size.label, color: ui.text2}}>
              {title}
            </div>
          ))}

          {/* Hero row */}
          <div
            style={{
              position: 'absolute', left: 28, top: TOP - 30 * (1 - arrive), width: rowW, height: ROW_H - 14, borderRadius: 18, opacity: arrive,
              background: ui.panel, border: `1px solid ${done > 0.5 ? ui.success : accent}`, boxShadow: `0 0 0 ${4 * (1 - done)}px ${accent}33`,
              display: 'flex', alignItems: 'center', padding: '0 24px 0 28px', fontSize: size.label, color: ui.text, fontWeight: 500,
            }}
          >
            <div style={{flex: 1}}>{c.rows[0]}</div>
            <RowStatus c={c} f={f} pressed={pressed} working={working} done={done} />
          </div>
        </AppWindow>
      </div>
      <Cursor x={hand.x} y={hand.y} pressed={pressed} opacity={prog(f, B.cursorIn, B.cursorIn + 8) * (1 - prog(f, B.press + 18, B.press + 28))} />
    </AbsoluteFill>
  );
};
