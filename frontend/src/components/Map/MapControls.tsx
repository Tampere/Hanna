import { css } from '@emotion/react';
import { Add, Remove, ZoomInMap, ZoomOutMap } from '@mui/icons-material';
import { Box, Tooltip } from '@mui/material';

import { useTranslations } from '@frontend/stores/lang';

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
  zoom: number;
  defaultZoom: number;
  zoomStep: number;
  onZoomChanged: (zoom: number) => void;
  onFitScreen: () => void;
}

export function MapControls(props: Props) {
  const tr = useTranslations();
  const { zoom, zoomStep, onZoomChanged, onFitScreen } = props;
  const toolTipOpts = { enterDelay: 1000, enterNextDelay: 1000, placement: 'right' as const };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <Box css={zoomButtomStyle} onClick={onFitScreen}>
        <Tooltip {...toolTipOpts} title={tr('map.fitScreen')}>
          <ZoomInMap />
        </Tooltip>
      </Box>
      <Box css={zoomButtomStyle} onClick={() => onZoomChanged(Math.floor(zoom + zoomStep))}>
        <Add />
      </Box>
      <Box css={zoomButtomStyle} onClick={() => onZoomChanged(Math.floor(zoom - zoomStep))}>
        <Remove />
      </Box>
      <Box css={zoomButtomStyle} onClick={() => onZoomChanged(props.defaultZoom)}>
        <Tooltip {...toolTipOpts} title={tr('map.resetZoom')}>
          <ZoomOutMap />
        </Tooltip>
      </Box>
    </Box>
  );
}
