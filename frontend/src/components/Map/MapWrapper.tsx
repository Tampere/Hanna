import { GlobalStyles } from '@mui/material';
import React, { useState } from 'react';

import { LayerDrawer } from './LayerDrawer';
import { Map } from './Map';
import { Zoom } from './Zoom';

export function MapWrapper() {
  const [baseLayer, setBaseLayer] = useState<string>();

  return (
    <Map baseLayerId={baseLayer}>
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
      <LayerDrawer onLayerChange={(layerId: string) => setBaseLayer(layerId)} />
    </Map>
  );
}
