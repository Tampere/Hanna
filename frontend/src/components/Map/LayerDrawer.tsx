import { css } from '@emotion/react';
import { DragIndicator, Layers, ToggleOff, ToggleOn } from '@mui/icons-material';
import { Box, Divider, IconButton, MenuItem, Tooltip, Typography } from '@mui/material';
import { useAtom } from 'jotai';
import { useState } from 'react';

import { useTranslations } from '@frontend/stores/lang';
import {
  LayerState,
  VectorLayerKey,
  baseLayerIdAtom,
  vectorLayersAtom,
} from '@frontend/stores/map';

import { mapOptions } from './mapOptions';

const drawerButtonStyle = css`
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  z-index: 202;
  background-color: rgba(256, 256, 256, 0.8);
  color: #22437b;
  border: 1px solid rgb(134, 167, 223);
  :hover {
    background-color: rgba(256, 256, 256, 0.9);
    border: 1px solid rgb(0, 33, 89);
    color: rgb(0, 33, 89);
  }
`;

const containerStyles = css`
  position: absolute;
  height: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const drawerStyles = css`
  height: 100%;
  width: 200px;
  background-color: white;
  transition: opacity 0.15s ease-in-out;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 1px 4px #9c9c9c;
  border-top: 1px solid #e8e8e8;
  border-bottom: 1px solid #e8e8e8;
  border-top-right-radius: 2px 2px;
  border-bottom-right-radius: 2px 2px;
`;

const dragIndicatorStyle = css`
  color: #aaa;
  :hover {
    cursor: grab;
    color: #777;
    transform: scale(1.3);
  }
  transition: transform 0.1s ease-in-out;
`;

const toggleOnStyle = css`
  color: green;
`;

const toggleOffStyle = css`
  color: #aaa;
`;

function setLayerSelected(layersState: LayerState[], layerId: VectorLayerKey, selected: boolean) {
  const newLayers = layersState.slice();
  const layerIndex = newLayers.findIndex((layer) => layer.id === layerId);
  newLayers[layerIndex] = { ...newLayers[layerIndex], selected };
  return newLayers;
}

export function LayerDrawer() {
  const tr = useTranslations();
  const [baseLayerId, setBaseLayerId] = useAtom(baseLayerIdAtom);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [vectorLayers, setVectorLayers] = useAtom(vectorLayersAtom);

  return (
    <Box css={containerStyles}>
      <Tooltip title={drawerOpen ? tr('map.layerdrawer.close') : tr('map.layerdrawer.open')}>
        <IconButton
          css={drawerButtonStyle}
          color="primary"
          onClick={() => setDrawerOpen((drawerOpen) => !drawerOpen)}
        >
          <Layers />
        </IconButton>
      </Tooltip>
      <Box
        css={drawerStyles}
        style={{ zIndex: drawerOpen ? 201 : 0, opacity: drawerOpen ? 0.95 : 0 }}
      >
        <Typography variant="overline" sx={{ padding: '8px' }}>
          {tr('map.layerdrawer.baseLayersTitle')}
        </Typography>
        {/* The drawer content will change at some point when other map layers are taken into use */}
        {mapOptions.baseMaps.map((baseMap, index) => (
          <MenuItem
            key={`basemap-${index}`}
            onClick={() => setBaseLayerId(baseMap.id)}
            style={{
              backgroundColor: baseMap.id === baseLayerId ? '#22437b' : '',
              color: baseMap.id === baseLayerId ? 'white' : '',
            }}
          >
            <Typography>{baseMap.name}</Typography>
          </MenuItem>
        ))}
        <Divider />
        <Typography variant="overline" sx={{ padding: '8px' }}>
          {tr('map.layerdrawer.vectorLayersTitle')}
        </Typography>
        {vectorLayers.map((layerState) => (
          <MenuItem
            sx={{ display: 'flex', justifyContent: 'space-between' }}
            key={`vectorlayer-${layerState.id}`}
            onClick={() =>
              setVectorLayers((prev) => setLayerSelected(prev, layerState.id, !layerState.selected))
            }
            disableTouchRipple
          >
            <Box sx={{ display: 'flex' }}>
              <DragIndicator css={dragIndicatorStyle} />
              <Typography>{tr(`vectorLayer.title.${layerState.id}`)}</Typography>
            </Box>
            {layerState.selected ? (
              <ToggleOn css={toggleOnStyle} fontSize="large" />
            ) : (
              <ToggleOff css={toggleOffStyle} fontSize="large" />
            )}
          </MenuItem>
        ))}
      </Box>
    </Box>
  );
}
