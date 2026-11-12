import React from 'react';
import {AbsoluteFill, Freeze} from 'remotion';
import {Lang} from './copy';
import {Format, FORMATS} from './format';
import {Film} from './Film';
import {mono, stage} from './theme';
import {FILM_FPS, K, SCENES} from './timeline';

// Contact sheet: the film frozen at the frames that matter, in one still. For each scene, just
// after it lands, its middle, and just before it leaves (its own clock); plus frame 0, the thumbnail.
// Each cell runs the whole Film tree: keep the sheet for review, never for the render.
export const sheetFrames = () => {
  const out = [0];
  for (const s of Object.values(SCENES)) {
    for (const local of [30, Math.round(s.authored / 2), s.authored - 20]) out.push(Math.round(s.from + local / s.pace) * K);
  }
  return [...new Set(out)].sort((a, b) => a - b);
};

const GRID = {wide: {cols: 4, cell: 480}, tall: {cols: 7, cell: 300}} as const;
const GAP = 12;
const LABEL = 30;

const cellHeight = (cut: Format) => Math.round((GRID[cut].cell * FORMATS[cut].height) / FORMATS[cut].width);

export const sheetSize = (cut: Format) => {
  const {cols, cell} = GRID[cut];
  const rows = Math.ceil(sheetFrames().length / cols);
  const cellH = cellHeight(cut);
  return {width: cols * cell + (cols + 1) * GAP, height: rows * (cellH + LABEL) + (rows + 1) * GAP};
};

export const Sheet: React.FC<{lang: Lang; cut: Format}> = ({lang, cut}) => {
  const {cols, cell} = GRID[cut];
  const {width, height} = FORMATS[cut];
  const k = cell / width;
  return (
    <AbsoluteFill style={{background: stage.paperDeep, padding: GAP, display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gap: GAP, alignContent: 'start'}}>
      {sheetFrames().map((f) => (
        <div key={f}>
          <div style={{width: cell, height: cellHeight(cut), position: 'relative', overflow: 'hidden', borderRadius: 6}}>
            <div style={{width, height, transform: `scale(${k})`, transformOrigin: '0 0', position: 'absolute'}}>
              <Freeze frame={f}>
                <Film lang={lang} cut={cut} sound={false} />
              </Freeze>
            </div>
          </div>
          <div style={{height: LABEL, fontFamily: mono, fontSize: 18, color: stage.inkSoft, paddingTop: 4}}>
            {(f / FILM_FPS).toFixed(2)} s · f{f / K}
          </div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
