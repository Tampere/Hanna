import { Add, Remove } from '@mui/icons-material';
import { useAtom } from 'jotai';
import React from 'react';

import { zoomAtom } from '@frontend/stores/map';

interface Props {
  zoomStep: number;
}

export function Zoom({ zoomStep = 1 }: Props) {
  const [zoom, setZoom] = useAtom(zoomAtom);

  return (
    <div
      style={{
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        zIndex: 999,
      }}
    >
      <div
        style={{
          width: '25px',
          height: '25px',
          border: '1px solid #22437b',
          backgroundColor: '#22437b',
          marginBottom: '2px',
          borderRadius: '2px',
        }}
        onClick={() => setZoom(zoom + zoomStep)}
      >
        <Add style={{ color: 'white' }} />
      </div>
      <div
        style={{
          width: '25px',
          height: '25px',
          border: '1px solid #22437b',
          backgroundColor: '#22437b',
          borderRadius: '2px',
        }}
        onClick={() => setZoom(zoom - zoomStep)}
      >
        <Remove style={{ color: 'white' }} />
      </div>
    </div>
  );
}
