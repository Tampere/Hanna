import { SerializedStyles, css } from '@emotion/react';
import { Layers, ToggleOff, ToggleOn } from '@mui/icons-material';
import { Box, Divider, IconButton, MenuItem, Theme, Tooltip, Typography } from '@mui/material';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { useTranslations } from '@frontend/stores/lang';
import {
  ItemLayerState,
  LayerState,
  VectorItemLayerKey,
  VectorLayerKey,
  baseLayerIdAtom,
  vectorItemLayersAtom,
  vectorLayersAtom,
} from '@frontend/stores/map';

import { mapOptions } from './mapOptions';

const containerStyles = css`
  width: 280px;
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: stretch;
  flex-direction: column;
  overflow-y: auto;
  transition: opacity 0.15s ease-in-out;
  box-shadow: 2px 1px 4px #9c9c9c;
  border-top-right-radius: 2px 2px;
  border-bottom-right-radius: 2px 2px;
`;

const drawerStyles = css`
  min-height: 750px;
  position: relative;
  background-color: white;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const toggleOnStyle = (theme: Theme) => css`
  color: ${theme.palette.primary.main};
`;

const toggleOffStyle = css`
  color: #aaa;
`;

function setLayerSelected(
  layersState: LayerState[] | ItemLayerState[],
  layerId: VectorLayerKey | VectorItemLayerKey,
  selected: boolean,
) {
  return layersState.map((layer) => {
    return layer.id === layerId ||
      (layer.id === 'projectClusterResults' && layerId === 'projects') ||
      (layer.id === 'projectObjectClusterResults' && layerId === 'projectObjects')
      ? {
          ...layer,
          selected,
        }
      : layer;
  });
}

type NonClusterVectorItemLayers = Exclude<
  VectorItemLayerKey,
  'projectClusterResults' | 'projectObjectClusterResults' | 'municipality'
>;

export function LayerDrawer({
  enabledItemVectorLayers,
  isOpen,
  setIsOpen,
  toggleButtonStyle,
}: {
  enabledItemVectorLayers: VectorItemLayerKey[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  toggleButtonStyle?: (theme: Theme, isOpen: boolean) => SerializedStyles;
}) {
  const tr = useTranslations();
  const [baseLayerId, setBaseLayerId] = useAtom(baseLayerIdAtom);
  const [vectorLayers, setVectorLayers] = useAtom(vectorLayersAtom);
  const [vectorItemLayers, setVectorItemLayers] = useAtom(vectorItemLayersAtom);
  const { pathname } = useLocation();

  useEffect(() => {
    let selectedLayerIds: VectorItemLayerKey[] = [];
    switch (pathname) {
      case '/kartta/hankkeet':
        selectedLayerIds = ['projects', 'projectClusterResults'];
        break;
      case '/kartta/kohteet':
        selectedLayerIds = ['projectObjects', 'projectObjectClusterResults'];
        break;
      default:
        selectedLayerIds = [
          'projects',
          'projectObjects',
          'projectClusterResults',
          'projectObjectClusterResults',
          'municipality',
        ];
    }

    if (selectedLayerIds.length > 0) {
      setVectorItemLayers((prev) => {
        return prev.map((layerState) =>
          selectedLayerIds.includes(layerState.id)
            ? { ...layerState, selected: true }
            : { ...layerState, selected: false },
        );
      });
    }
  }, []);

  return (
    <>
      <Box css={containerStyles} style={{ zIndex: isOpen ? 202 : 0, opacity: isOpen ? 0.95 : 0 }}>
        <Box css={drawerStyles}>
          <Typography variant="overline" sx={{ padding: '8px' }}>
            {tr('map.layerdrawer.projectsAndObjects')}
          </Typography>
          {vectorItemLayers.map(
            (layerState) =>
              !['projectClusterResults', 'projectObjectClusterResults', 'municipality'].includes(
                layerState.id,
              ) && (
                <MenuItem
                  sx={{ display: 'flex', justifyContent: 'space-between' }}
                  key={`vectorlayer-${layerState.id}`}
                  disabled={!enabledItemVectorLayers.includes(layerState.id)}
                  onClick={() =>
                    setVectorItemLayers(
                      (prev) =>
                        setLayerSelected(
                          prev,
                          layerState.id,
                          !layerState.selected,
                        ) as ItemLayerState[],
                    )
                  }
                  disableTouchRipple
                >
                  <Box sx={{ display: 'flex' }}>
                    <Typography>
                      {tr(`vectorLayer.title.${layerState.id as NonClusterVectorItemLayers}`)}
                    </Typography>
                  </Box>
                  {layerState.selected ? (
                    <ToggleOn css={toggleOnStyle} fontSize="large" />
                  ) : (
                    <ToggleOff css={toggleOffStyle} fontSize="large" />
                  )}
                </MenuItem>
              ),
          )}
          <Divider />
          <Typography variant="overline" sx={{ padding: '8px' }}>
            {tr('map.layerdrawer.vectorLayersTitle')}
          </Typography>
          {vectorLayers.map((layerState) => (
            <MenuItem
              sx={{ display: 'flex', justifyContent: 'space-between' }}
              key={`vectorlayer-${layerState.id}`}
              onClick={() =>
                setVectorLayers(
                  (prev) =>
                    setLayerSelected(prev, layerState.id, !layerState.selected) as LayerState[],
                )
              }
              disableTouchRipple
            >
              <Box sx={{ display: 'flex' }}>
                <Typography>{tr(`vectorLayer.title.${layerState.id}`)}</Typography>
              </Box>
              {layerState.selected ? (
                <ToggleOn css={toggleOnStyle} fontSize="large" />
              ) : (
                <ToggleOff css={toggleOffStyle} fontSize="large" />
              )}
            </MenuItem>
          ))}
          <Divider />
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
        </Box>
      </Box>
      <Tooltip title={isOpen ? tr('map.layerdrawer.close') : tr('map.layerdrawer.open')}>
        <IconButton
          css={(theme) => toggleButtonStyle?.(theme, isOpen)}
          disableTouchRipple
          onClick={() => setIsOpen(!isOpen)}
        >
          <Layers />
        </IconButton>
      </Tooltip>
    </>
  );
}
