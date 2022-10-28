import OLMap from 'ol/Map';
import View from 'ol/View';
import React, { useEffect, useRef, useState } from 'react';

import { createWMTSLayer } from '@frontend/components/Map/mapFunctions';
import { EPSG3067 } from '@frontend/components/Map/projection';

import { mapOptions } from './mapOptions';

export function Map() {
  const baseMapLayers = mapOptions.baseMaps.map((baseMap) => createWMTSLayer(baseMap));

  const mapRef = useRef<HTMLDivElement>(null);
  /**
   * OpenLayers View: @see https://openlayers.org/en/latest/apidoc/module-ol_View-View.html
   * View's projection is defined based on the target country (area): E.g. EPSG:3067 in Finland
   */
  const [olView] = useState(() => {
    return new View({
      projection: EPSG3067,
      center: [327000, 6822500],
      zoom: 10,
    });
  });

  /**
   * OpenLayers Map: @see https://openlayers.org/en/latest/apidoc/module-ol_Map-Map.html
   * "For a map to render, a view, one or more layers, and a target container are needed" -docs
   */
  const [olMap] = useState(() => {
    return new OLMap({
      target: '',
      controls: [],
      view: olView,
      layers: [baseMapLayers[0]],
    });
  });

  useEffect(() => {
    olMap.setTarget(mapRef.current as HTMLElement);
  }, [olMap]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div style={{ width: '100%', height: '100%' }} ref={mapRef} />
    </div>
  );
}
