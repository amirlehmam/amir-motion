import {createContext, useContext} from 'react';
import {useCurrentFrame} from 'remotion';
import {K} from './timeline';

// A scene is authored on its own clock; Pace > 1 plays its action faster to fit the film.
// Captions read Pace back and keep their word timing in real seconds, so text never speeds up.
export const Pace = createContext(1);

export const useSceneFrame = () => (useCurrentFrame() / K) * useContext(Pace);
export const useFrame30 = () => useCurrentFrame() / K;
export const usePace = () => useContext(Pace);
