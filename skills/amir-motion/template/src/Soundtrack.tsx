import React from 'react';
import {Sequence, staticFile} from 'remotion';
import {Audio} from '@remotion/media';
import {CUES, MUSIC} from './cues';
import {at, K} from './timeline';

// Music bed plus one Sequence per cue, placed by the scene clock (see cues.ts).
export const Soundtrack: React.FC = () => (
  <>
    <Audio src={staticFile(MUSIC.file)} volume={MUSIC.vol} />
    {CUES.map((c, i) => (
      <Sequence key={i} from={at(c.scene, c.local) * K} layout="none" name={`sfx ${c.sfx}`}>
        <Audio src={staticFile(`audio/sfx/${c.sfx}.wav`)} volume={c.vol} />
      </Sequence>
    ))}
  </>
);
