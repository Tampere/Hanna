import OLMap from 'ol/Map';
import View from 'ol/View';
import { ScaleLine } from 'ol/control';
import { isEmpty } from 'ol/extent';
import { Geometry } from 'ol/geom';
import { defaults as defaultInteractions } from 'ol/interaction';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { ProjectionLike } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import WMTS from 'ol/source/WMTS';
import { ReactNode, useEffect, useRef, useState } from 'react';

import { getMapProjection, registerProjection } from '@frontend/components/Map/mapFunctions';

import { mapOptions } from './mapOptions';

export type MapInteraction = (map: OLMap) => void;

interface Props {
  zoom: number;
  onMoveEnd: (zoom: number, extent: number[]) => void;
  baseMapLayers: TileLayer<WMTS>[];
  children?: ReactNode;
  extent: number[] | null;
  wfsLayers?: VectorLayer<VectorSource<Geometry>>[];
  vectorLayers?: VectorLayer<VectorSource<Geometry>>[];
  interactions?: MapInteraction[] | null;
  interactionLayers?: VectorLayer<VectorSource<Geometry>>[];
}

const { code, units, proj4String } = mapOptions.projection;
registerProjection(code, mapOptions.projection.extent, proj4String);

const initialInteractions = defaultInteractions({
  altShiftDragRotate: false,
  pinchRotate: false,
  doubleClickZoom: false,
  shiftDragZoom: false,
  keyboard: true,
});

export function Map({
  zoom,
  onMoveEnd,
  baseMapLayers,
  children,
  extent,
  wfsLayers,
  vectorLayers,
  interactions,
  interactionLayers,
}: Props) {
  const [projection] = useState(() => getMapProjection(code, mapOptions.projection.extent, units));
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
      zoom: zoom,
      minZoom: mapOptions.tre.minZoom,
      maxZoom: mapOptions.tre.maxZoom,
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
      keyboardEventTarget: document,
      layers: [...(baseMapLayers ?? [])],
      interactions: initialInteractions,
    });
  });

  /** olMap -object's initialization on startup  */
  useEffect(() => {
    olMap.setTarget(mapRef.current as HTMLElement);

    // Register event listeners
    olMap.on('moveend', () => {
      const moveZoom = olMap.getView().getZoom() || zoom;
      const viewBounds = olMap.getView().calculateExtent(olMap.getSize());
      onMoveEnd(moveZoom, viewBounds);
    });
  }, [olMap]);

  /** Set Map's zoom based on changes from the Zoom -component */
  useEffect(() => {
    if (!zoom) return;
    olView.setZoom(zoom);
  }, [zoom]);

  useEffect(() => {
    if (!extent) return;
    if (!isEmpty(extent) && olView && olView.getProjection()) {
      olView.fit(extent, {
        size: olMap.getSize(),
        padding: [64, 64, 64, 64],
        maxZoom: 15,
      });
    }
  }, [extent]);

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

  /** WFS vector layers */
  useEffect(() => {
    if (!wfsLayers) return;
    const wfsLayerIds = new Set(wfsLayers.map((layer) => layer.get('id')));
    const allLayers = [...olMap.getLayers().getArray()];
    allLayers.forEach((layer) => {
      if (layer.get('type') === 'wfs' && !wfsLayerIds.has(layer.get('id'))) {
        olMap.removeLayer(layer);
      }
    });
    wfsLayers.forEach((layer) => {
      layer.setZIndex(2);
      olMap.addLayer(layer);
    });
  }, [wfsLayers]);

  /** Vector layers */
  useEffect(() => {
    const allLayers = [...olMap.getLayers().getArray()];
    allLayers.forEach((layer) => {
      if (layer.get('type') === 'vector') {
        olMap.removeLayer(layer);
      }
    });
    vectorLayers?.forEach((layer) => {
      layer.setZIndex(1);
      olMap.addLayer(layer);
    });
  }, [vectorLayers]);

  /** Interactions and related layers */
  useEffect(() => {
    const mapInteractions = [...olMap.getInteractions().getArray()];
    mapInteractions.forEach((interaction) => {
      if (interaction.get('type') === 'customInteraction') {
        olMap.removeInteraction(interaction);
      }
    });

    interactions?.forEach((interaction) => {
      interaction(olMap);
    });
  }, [interactions]);

  useEffect(() => {
    const mapLayerIds = new Set(
      olMap
        .getLayers()
        .getArray()
        .map((layer) => layer.get('id'))
        .filter((id) => id),
    );
    interactionLayers?.forEach((layer) => {
      if (!mapLayerIds.has(layer.get('id'))) {
        olMap.addLayer(layer);
      }
    });
  }, [interactionLayers]);

  return (
    <div style={{ flex: 1 }} ref={mapRef}>
      {children}
    </div>
  );
}
