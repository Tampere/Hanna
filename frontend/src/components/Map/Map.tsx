import { useAtom } from 'jotai';
import OLMap from 'ol/Map';
import View from 'ol/View';
import { ScaleLine } from 'ol/control';
import { defaults as defaultInteractions } from 'ol/interaction';
import TileLayer from 'ol/layer/Tile';
import { ProjectionLike } from 'ol/proj';
import WMTS from 'ol/source/WMTS';
import { ReactNode, useEffect, useRef, useState } from 'react';

import {
  WebGLLayer,
  getMapProjection,
  registerProjection,
} from '@frontend/components/Map/mapFunctions';
import { zoomAtom } from '@frontend/stores/map';

import { mapOptions } from './mapOptions';

interface Props {
  children?: ReactNode;
  baseMapLayers: TileLayer<WMTS>[];
  vectorLayers?: WebGLLayer[];
}

const { code, extent, units, proj4String } = mapOptions.projection;
registerProjection(code, extent, proj4String);

export function Map({ baseMapLayers, vectorLayers, children }: Props) {
  const [zoom, setZoom] = useAtom(zoomAtom);
  const [projection] = useState(() => getMapProjection(code, extent, units));
  const mapRef = useRef<HTMLDivElement>(null);

  /**
   * OpenLayers View: @see https://openlayers.org/en/latest/apidoc/module-ol_View-View.html
   * View's projection is defined based on the target country (area): E.g. EPSG:3067 in Finland
   */
  const [olView] = useState(() => {
    return new View({
      projection: projection as ProjectionLike,
      center: mapOptions.tre.center,
      extent: mapOptions.tre.extent,
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
      layers: [...(baseMapLayers ?? [])],
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

  /** Update Map layers based on different ol/layers passed as props */
  useEffect(() => {
    if (!baseMapLayers) return;
    const layers = [...olMap.getLayers().getArray()];
    layers.forEach((layer) => {
      if (layer.get('type') === 'basemap') {
        olMap.removeLayer(layer);
      }
    });
    baseMapLayers.forEach((layer) => {
      olMap.addLayer(layer);
    });
  }, [baseMapLayers]);

  useEffect(() => {
    console.log('vectorLayers changed');
    if (!vectorLayers) return;
    const currentVectorLayerIds = new Set(vectorLayers.map((layer) => layer.get('id')));
    const layers = [...olMap.getLayers().getArray()];
    console.log(layers.length);
    layers.forEach((layer) => {
      if (layer.get('type') === 'vector') {
        olMap.removeLayer(layer);
      }
    });
    vectorLayers.forEach((layer) => {
      layer.setZIndex(1);
      olMap.addLayer(layer);
    });
  }, [vectorLayers]);

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
