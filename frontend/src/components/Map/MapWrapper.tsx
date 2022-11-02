import { GlobalStyles } from '@mui/material';
import { useAtom } from 'jotai';
import { Projection } from 'ol/proj';
import React, { useMemo, useState } from 'react';

import { baseLayerIdAtom } from '@frontend/stores/map';

import { LayerDrawer } from './LayerDrawer';
import { Map } from './Map';
import { Zoom } from './Zoom';
import { createWMTSLayer, getMapProjection } from './mapFunctions';
import { mapOptions } from './mapOptions';

export function MapWrapper() {
  const [projection] = useState(() =>
    getMapProjection(
      mapOptions.projection.code,
      mapOptions.projection.extent,
      mapOptions.projection.units
    )
  );
  const [baseLayerId] = useAtom(baseLayerIdAtom);

  const baseMapLayers = useMemo(() => {
    if (!baseLayerId) return [];

    return mapOptions.baseMaps
      .filter((baseMap) => baseMap.id === (baseLayerId ? baseLayerId : 'opaskartta'))
      .map((baseMap) => createWMTSLayer(baseMap.options, projection as Projection));
  }, [baseLayerId]);

  return (
    <Map baseMapLayers={baseMapLayers}>
      {/* Styles for the OpenLayers ScaleLine -component */}
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
      <Zoom zoomStep={1} />
      <LayerDrawer />
    </Map>
  );
}
