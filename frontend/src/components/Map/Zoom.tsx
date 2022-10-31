import { Add, Remove } from '@mui/icons-material';
import { IconButton, IconButtonProps } from '@mui/material';
// import { useMap } from '@src/stores/MapContext';
import React from 'react';

interface Props {
  /**
   * Props for each zoom in & zoom add buttons.
   */
  ButtonProps?: IconButtonProps;
  /**
   * Style for the entire zoom container component.
   */
  style?: React.CSSProperties;
  /**
   * How much the zoom level is increased/decreased on a single zoom click
   */
  zoomStep: number;
}

export function Zoom({
  ButtonProps = { style: { color: 'white', opacity: '0.7' } },
  zoomStep = 1,
}: Props) {
  // const { setZoom, zoom } = useMap();

  return (
    <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 999 }}>
      <IconButton {...ButtonProps} onClick={() => console.log(+zoomStep)}>
        <Add />
      </IconButton>
      <IconButton {...ButtonProps} onClick={() => console.log(-zoomStep)}>
        <Remove />
      </IconButton>
    </div>
  );
}
