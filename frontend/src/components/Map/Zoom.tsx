import { css } from '@emotion/react';
import { Add, Remove } from '@mui/icons-material';
import { Box } from '@mui/material';
import { useAtom } from 'jotai';
import React from 'react';

import { zoomAtom } from '@frontend/stores/map';

const zoomButtomStyle = css`
  width: 25px;
  height: 25px;
  background-color: #22437b;
  border-radius: 2px;
  color: #ffffff;
  cursor: pointer;
  :hover {
    background-color: rgb(0, 33, 89);
  }
`;

interface Props {
  zoomStep: number;
}

export function Zoom({ zoomStep = 1 }: Props) {
  const [zoom, setZoom] = useAtom(zoomAtom);

  return (
    <Box
      sx={{
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        zIndex: 200,
      }}
    >
      <Box css={zoomButtomStyle} onClick={() => setZoom(zoom + zoomStep)} sx={{ mb: '2px' }}>
        <Add />
      </Box>
      <Box css={zoomButtomStyle} onClick={() => setZoom(zoom - zoomStep)}>
        <Remove />
      </Box>
    </Box>
  );
}
