import { css } from '@emotion/react';
import { Add, Remove } from '@mui/icons-material';
import { Box, GlobalStyles } from '@mui/material';
import { useAtom } from 'jotai';
import React from 'react';

import { zoomAtom } from '@frontend/stores/map';

const zoomButtomStyle = css`
  width: 25px;
  height: 25px;
  border: 1px solid #22437b;
  background-color: #22437b;
  border-radius: 2px;
  color: #ffffff;
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
        zIndex: 999,
      }}
    >
      <GlobalStyles
        styles={{
          '.ol-scale-line-inner': {
            marginBottom: '1rem',
            textAlign: 'center',
            backgroundColor: 'white',
            opacity: '0.8',
            borderLeft: '2px solid #22437b',
            borderRight: '2px solid #22437b',
            borderBottom: '2px solid #22437b',
            borderBottomLeftRadius: '7px',
            borderBottomRightRadius: '7px',
          },
          '.ol-scale-line': {
            border: '5px 5px 0px 5px',
            borderStyle: '5px solid green',
            position: 'absolute',
            width: '100%',
            bottom: 0,
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
          },
        }}
      />
      <Box css={zoomButtomStyle} onClick={() => setZoom(zoom + zoomStep)} sx={{ mb: '2px' }}>
        <Add />
      </Box>
      <Box css={zoomButtomStyle} onClick={() => setZoom(zoom - zoomStep)}>
        <Remove />
      </Box>
    </Box>
  );
}
