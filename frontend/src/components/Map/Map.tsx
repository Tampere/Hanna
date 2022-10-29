import { Layers } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import OLMap from 'ol/Map';
import View from 'ol/View';
import { defaults as defaultInteractions } from 'ol/interaction';
import { Projection, ProjectionLike } from 'ol/proj';
import React, { useEffect, useRef, useState } from 'react';

import {
  createWMTSLayer,
  getMapProjection,
  registerProjection,
} from '@frontend/components/Map/mapFunctions';

import { mapOptions } from './mapOptions';

const { code, extent, units, proj4String } = mapOptions.projection;
registerProjection(code, extent, proj4String);

export function Map() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [projection] = useState(() => getMapProjection(code, extent, units));
  const baseMapLayers = mapOptions.baseMaps.map((baseMap) =>
    createWMTSLayer(baseMap.options, projection as Projection)
  );

  /**
   * OpenLayers View: @see https://openlayers.org/en/latest/apidoc/module-ol_View-View.html
   * View's projection is defined based on the target country (area): E.g. EPSG:3067 in Finland
   */
  const [olView] = useState(() => {
    return new View({
      projection: projection as ProjectionLike,
      center: [327000, 6822500],
      extent: [313753, 6812223, 351129, 6861143],
      zoom: 10,
      multiWorld: false,
      enableRotation: false,
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
      interactions: defaultInteractions({
        altShiftDragRotate: false,
        pinchRotate: false,
        doubleClickZoom: false,
        shiftDragZoom: false,
      }),
    });
  });

  useEffect(() => {
    olMap.setTarget(mapRef.current as HTMLElement);
  }, [olMap]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div style={{ width: '100%', height: '100%', position: 'relative' }} ref={mapRef}>
        <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', zIndex: 999 }}>
          <IconButton size="large" color="primary">
            <Layers />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
