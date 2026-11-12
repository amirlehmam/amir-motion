import {createContext, useContext} from 'react';

// Each format is another cut, not a crop. Scenes read this and recompose: in the tall cut the
// product sits lower and smaller, captions wrap above it, inside the safe band.
export const FORMATS = {
  wide: {width: 1920, height: 1080}, // site, YouTube, LinkedIn, decks
  tall: {width: 1080, height: 1920}, // Reels, Shorts, TikTok, LinkedIn mobile
} as const;
export type Format = keyof typeof FORMATS;

// The cut comes from the Film's props, not from the composition size, so the contact sheet can
// render many frozen frames of a cut inside one big still.
export const Cut = createContext<Format>('wide');

export const useLayout = () => {
  const cut = useContext(Cut);
  const {width, height} = FORMATS[cut];
  const tall = cut === 'tall';
  return {
    width,
    height,
    tall,
    // Text stays inside 80 % of the frame; tall platforms cover the top and bottom with their UI.
    safeX: width * 0.1,
    captionTop: tall ? 300 : 96,
    captionWidth: tall ? width * 0.8 : width - 240,
  };
};
