import { GlobalStyles } from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';
import { Projection } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import { useEffect, useMemo, useState } from 'react';

import { MapToolbar, ToolType } from '@frontend/components/Map/MapToolbar';
import {
  createDrawInteraction,
  createDrawLayer,
  createModifyInteraction,
  createSelectInteraction,
  createSelectionLayer,
  deleteSelectedFeatures,
  featuresFromGeoJSON,
  getGeoJSONFeaturesString,
} from '@frontend/components/Map/mapInteractions';
import { baseLayerIdAtom, selectedVectorLayersAtom } from '@frontend/stores/map';

import { LayerDrawer } from './LayerDrawer';
import { Map, MapInteraction } from './Map';
import { Zoom } from './Zoom';
import { createVectorLayer, createWMTSLayer, getMapProjection } from './mapFunctions';
import { mapOptions } from './mapOptions';

interface Props {
  geoJson?: string | null;
  editable?: boolean;
  onFeaturesSaved?: (features: string) => void;
}

export function MapWrapper({ geoJson, onFeaturesSaved, editable }: Props) {
  const [projection] = useState(() =>
    getMapProjection(
      mapOptions.projection.code,
      mapOptions.projection.extent,
      mapOptions.projection.units
    )
  );
  const [baseLayerId] = useAtom(baseLayerIdAtom);
  const selectedVectorLayers = useAtomValue(selectedVectorLayersAtom);

  const baseMapLayers = useMemo(() => {
    if (!baseLayerId) return [];

    return mapOptions.baseMaps
      .filter((baseMap) => baseMap.id === (baseLayerId ? baseLayerId : 'virastokartta'))
      .map((baseMap) => createWMTSLayer(baseMap.options, projection as Projection));
  }, [baseLayerId]);

  const vectorLayers = useMemo(() => {
    if (!selectedVectorLayers) return [];
    return mapOptions.vectorLayers
      .filter((layer) => selectedVectorLayers.findIndex((l) => l.id === layer.id) !== -1)
      .map((layer) => createVectorLayer(layer));
  }, [selectedVectorLayers]);

  /**
   * Custom tools and interactions
   */

  const [selectedTool, setSelectedTool] = useState<ToolType | null>(null);
  const [interactions, setInteractions] = useState<MapInteraction[] | null>(null);

  const selectionSource = useMemo(() => new VectorSource({ wrapX: false }), []);
  const selectionLayer = useMemo(() => createSelectionLayer(selectionSource), []);
  const registerSelectInteraction = useMemo(() => createSelectInteraction(selectionSource), []);
  const registerModifyInteraction = useMemo(() => createModifyInteraction(selectionSource), []);

  const drawSource = useMemo(() => {
    const opts = { wrapX: true };
    const features = geoJson ? featuresFromGeoJSON(geoJson) : [];
    const source = new VectorSource({ ...opts });
    for (const feature of features) {
      source.addFeature(feature);
    }
    return source;
  }, [geoJson]);

  const drawLayer = useMemo(() => createDrawLayer(drawSource), []);
  const registerDrawInteraction = useMemo(
    () =>
      createDrawInteraction({
        source: drawSource,
        trace: selectedTool === 'tracedFeature',
        traceSource: selectionSource,
      }),
    [selectedTool]
  );

  useEffect(() => {
    switch (selectedTool) {
      case 'selectFeature':
        setInteractions([registerSelectInteraction]);
        break;
      case 'newFeature':
        setInteractions([registerDrawInteraction]);
        break;
      case 'tracedFeature':
        setInteractions([registerDrawInteraction]);
        break;
      case 'editFeature':
        setInteractions([registerSelectInteraction, registerModifyInteraction]);
        break;
      case 'deleteFeature':
        deleteSelectedFeatures(drawSource, selectionSource);
        break;
      default:
        setInteractions(null);
        break;
    }
  }, [selectedTool]);

  return (
    <Map
      extent={drawSource.getExtent()}
      baseMapLayers={baseMapLayers}
      vectorLayers={vectorLayers}
      interactions={interactions}
      interactionLayers={[selectionLayer, drawLayer]}
    >
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
      {editable && (
        <MapToolbar
          onToolChange={(tool) => setSelectedTool(tool)}
          onSaveClick={() =>
            onFeaturesSaved?.(
              getGeoJSONFeaturesString(
                drawSource.getFeatures(),
                projection?.getCode() || mapOptions.projection.code
              )
            )
          }
          onUndoClick={() => console.log('Undo callback')}
        />
      )}
    </Map>
  );
}
