import React, { useState } from 'react';

import { LayerDrawer } from './LayerDrawer';
import { Map } from './Map';
import { Zoom } from './Zoom';

export function MapWrapper() {
  const [baseLayer, setBaseLayer] = useState<string>();

  return (
    <Map baseLayer={baseLayer}>
      <Zoom zoomStep={1} />
      <LayerDrawer onLayerChange={(layerId: string) => setBaseLayer(layerId)} />
    </Map>
  );
}
