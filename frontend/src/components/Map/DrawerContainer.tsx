import { Box, Theme, css } from '@mui/material';
import { useState } from 'react';

import { VectorItemLayerKey } from '@frontend/stores/map';

import { LayerDrawer } from './LayerDrawer';
import { Legend } from './Legend';

interface Props {
  layerDrawerEnabledLayers: VectorItemLayerKey[];
  legendVectorLayerKeys: Extract<VectorItemLayerKey, 'projects' | 'projectObjects'>[];
  colorPatternSelectorVisible?: boolean;
}

const toggleButtonStyle = (theme: Theme, isOpen: boolean) => css`
  background-color: ${isOpen ? theme.palette.primary.main : 'rgb(255, 255, 255, 0.8)'};
  z-index: 202;
  color: ${isOpen ? '#fff' : theme.palette.primary.main};
  height: 42px;
  width: 42px;
  border: ${isOpen ? 'none' : '1px solid rgb(134, 167, 223)'};
  :hover {
    opacity: 0.9;
    background-color: ${isOpen ? theme.palette.primary.dark : 'rgb(255, 255, 255, 0.8)'};
    border: 1px solid ${theme.palette.primary.dark};
  }
  position: relative;
  bottom: 1rem;
  left: 1rem;
`;

export function DrawerContainer(props: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);

  return (
    <Box
      css={css`
        position: absolute;
        top: 0;
        bottom: 0;
        display: flex;
        align-items: flex-end;
        gap: 1rem;
      `}
    >
      <LayerDrawer
        isOpen={drawerOpen}
        setIsOpen={(value) => {
          if (value) {
            setLegendOpen(false);
          }
          setDrawerOpen(value);
        }}
        enabledItemVectorLayers={props.layerDrawerEnabledLayers}
        toggleButtonStyle={toggleButtonStyle}
      />
      <Legend
        isOpen={legendOpen}
        setIsOpen={(value) => {
          if (value) {
            setDrawerOpen(false);
          }
          setLegendOpen(value);
        }}
        vectorLayerKeys={props.legendVectorLayerKeys}
        toggleButtonStyle={toggleButtonStyle}
        colorPatternSelectorVisible={props.colorPatternSelectorVisible ?? false}
      />
    </Box>
  );
}
