import { useAtom } from 'jotai';
import OLMap from 'ol/Map';
import View from 'ol/View';
import { ScaleLine } from 'ol/control';
import { defaults as defaultInteractions } from 'ol/interaction';
import { Projection, ProjectionLike } from 'ol/proj';
import React, { ReactNode, useEffect, useRef, useState } from 'react';

import {
  createWMTSLayer,
  getMapProjection,
  registerProjection,
} from '@frontend/components/Map/mapFunctions';
import { zoomAtom } from '@frontend/stores/map';

import { mapOptions } from './mapOptions';

interface Props {
  children?: ReactNode;
  baseLayerId?: string;
}

const { code, extent, units, proj4String } = mapOptions.projection;
registerProjection(code, extent, proj4String);

export function Map({ baseLayerId, children }: Props) {
  const [zoom, setZoom] = useAtom(zoomAtom);
  const mapRef = useRef<HTMLDivElement>(null);
  const [projection] = useState(() => getMapProjection(code, extent, units));

  const baseMapLayer = mapOptions.baseMaps
    .filter((baseMap) => baseMap.id === (baseLayerId ? baseLayerId : 'opaskartta'))
    .map((baseMap) => createWMTSLayer(baseMap.options, projection as Projection));

  /**
   * OpenLayers View: @see https://openlayers.org/en/latest/apidoc/module-ol_View-View.html
   * View's projection is defined based on the target country (area): E.g. EPSG:3067 in Finland
   */
  const [olView] = useState(() => {
    return new View({
      projection: projection as ProjectionLike,
      // Tampere specific numbers
      center: [327000, 6822500],
      extent: [313753, 6812223, 351129, 6861143],
      zoom: zoom ?? 10,
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
      controls: [
        new ScaleLine({
          units: 'metric',
        }),
      ],
      view: olView,
      layers: [...baseMapLayer],
      interactions: defaultInteractions({
        altShiftDragRotate: false,
        pinchRotate: false,
        doubleClickZoom: false,
        shiftDragZoom: false,
      }),
    });
  });

  /** olMap -object's initialization on startup  */
  useEffect(() => {
    olMap.setTarget(mapRef.current as HTMLElement);

    // Register event listeners
    olMap.on('moveend', () => {
      setZoom(olView.getZoom() as number);
    });
  }, [olMap]);

  /**  */
  useEffect(() => {
    if (!baseLayerId) return;

    olMap.getAllLayers().map((layer) => olMap.removeLayer(layer));
    olMap.setLayers(baseMapLayer);
  }, [baseLayerId]);

  /** Set Map's zoom based on changes from the Zoom -component */
  useEffect(() => {
    if (!zoom) return;

    olView.setZoom(zoom);
  }, [zoom]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div style={{ width: '100%', height: '100%', position: 'relative' }} ref={mapRef}>
        {children}
      </div>
    </div>
  );
}
