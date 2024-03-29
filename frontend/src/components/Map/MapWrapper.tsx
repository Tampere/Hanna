import { GlobalStyles } from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';
import Feature from 'ol/Feature';
import { Extent, createEmpty, extend, isEmpty } from 'ol/extent';
import { Geometry } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import { Projection } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import { useEffect, useMemo, useState } from 'react';

import { MapToolbar, ToolType } from '@frontend/components/Map/MapToolbar';
import {
  addFeaturesFromGeoJson,
  createDrawInteraction,
  createDrawLayer,
  createModifyInteraction,
  createSelectInteraction,
  createSelectionLayer,
  deleteSelectedFeatures,
  getGeoJSONFeaturesString,
} from '@frontend/components/Map/mapInteractions';
import { baseLayerIdAtom, selectedWFSLayersAtom } from '@frontend/stores/map';
import { useNavigationBlocker } from '@frontend/stores/navigationBlocker';

import { LayerDrawer } from './LayerDrawer';
import { Map, MapInteraction } from './Map';
import { MapControls } from './MapControls';
import { createWFSLayer, createWMTSLayer, getMapProjection } from './mapFunctions';
import { mapOptions } from './mapOptions';

interface Props {
  geoJson?: string | object | null;
  editable?: boolean;
  drawStyle?: Style;
  onFeaturesSaved?: (features: string) => void;
  onMoveEnd?: (zoom: number, extent: number[]) => void;
  loading?: boolean;
  vectorLayers?: VectorLayer<VectorSource<Feature<Geometry>>>[];
  fitExtent?: 'geoJson' | 'vectorLayers' | 'all';
}

export function MapWrapper(props: Props) {
  const { geoJson, onFeaturesSaved, editable } = props;

  const [dirty, setDirty] = useState(false);
  const [featuresSelected, setFeaturesSelected] = useState(false);
  const [zoom, setZoom] = useState(mapOptions.tre.defaultZoom);
  const [viewExtent, setViewExtent] = useState<number[]>(mapOptions.tre.extent);

  useNavigationBlocker(dirty, 'map');

  useEffect(() => {
    if (props.onMoveEnd) {
      props.onMoveEnd(zoom, viewExtent);
    }
  }, [zoom, viewExtent]);

  const [extent, setExtent] = useState<number[] | null>(null);

  const [projection] = useState(() =>
    getMapProjection(
      mapOptions.projection.code,
      mapOptions.projection.extent,
      mapOptions.projection.units,
    ),
  );
  const [baseLayerId] = useAtom(baseLayerIdAtom);
  const selectedWFSLayers = useAtomValue(selectedWFSLayersAtom);

  const baseMapLayers = useMemo(() => {
    if (!baseLayerId) return [];

    return mapOptions.baseMaps
      .filter((baseMap) => baseMap.id === (baseLayerId ? baseLayerId : 'virastokartta'))
      .map((baseMap) => createWMTSLayer(baseMap.options, projection as Projection));
  }, [baseLayerId]);

  const WFSLayers = useMemo(() => {
    if (!selectedWFSLayers) return [];
    return mapOptions.wfsLayers
      .filter((layer) => selectedWFSLayers.findIndex((l) => l.id === layer.id) !== -1)
      .map((layer) => createWFSLayer(layer));
  }, [selectedWFSLayers]);

  /**
   * Custom tools and interactions
   */

  const [selectedTool, setSelectedTool] = useState<ToolType | null>(null);
  const [interactions, setInteractions] = useState<MapInteraction[] | null>(null);

  const selectionSource = useMemo(() => new VectorSource({ wrapX: false }), []);
  const selectionLayer = useMemo(() => createSelectionLayer(selectionSource), []);
  const registerSelectInteraction = useMemo(
    () =>
      createSelectInteraction({
        source: selectionSource,
        onSelectionChanged(features) {
          setFeaturesSelected(features.length > 0);
        },
      }),
    [],
  );
  const registerModifyInteraction = useMemo(
    () => createModifyInteraction({ source: selectionSource, onModifyEnd: () => setDirty(true) }),
    [],
  );

  const drawSource = useMemo(() => new VectorSource({ wrapX: false }), []);

  useEffect(() => {
    if (geoJson) {
      addFeaturesFromGeoJson(drawSource, geoJson);
    }
  }, [geoJson]);

  const drawLayer = useMemo(() => createDrawLayer(drawSource, props.drawStyle), []);
  const registerDrawInteraction = useMemo(
    () =>
      createDrawInteraction({
        source: drawSource,
        drawStyle: props.drawStyle,
        trace: selectedTool === 'tracedFeature',
        traceSource: selectionSource,
        onDrawEnd: () => {
          setDirty(true);
        },
      }),
    [selectedTool],
  );

  useEffect(() => {
    let extent = createEmpty();
    switch (props.fitExtent) {
      case 'geoJson':
        if (geoJson) {
          setExtent(drawSource.getExtent());
        }
        break;
      case 'vectorLayers':
        extent = props.vectorLayers?.reduce((extent, layer) => {
          const layerExtent = layer.getSource()?.getExtent();
          if (!layerExtent) return extent;
          return extend(extent, layerExtent);
        }, createEmpty()) as Extent;
        if (!isEmpty(extent)) {
          setExtent(extent);
        }
        break;
    }
  }, [geoJson, props.vectorLayers, props.fitExtent]);

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
        setInteractions([registerModifyInteraction]);
        break;
      case 'deleteFeature':
        setDirty(true);
        setFeaturesSelected(false);
        deleteSelectedFeatures(drawSource, selectionSource);
        break;
      default:
        setInteractions(null);
        break;
    }
  }, [selectedTool]);

  return (
    <div
      style={{
        height: '100%',
        position: 'relative',
        display: 'flex',
        flex: 1,
      }}
    >
      <Map
        zoom={zoom}
        onMoveEnd={(zoom, extent) => {
          setZoom(zoom);
          setViewExtent(extent);
        }}
        extent={extent}
        baseMapLayers={baseMapLayers}
        wfsLayers={WFSLayers}
        vectorLayers={props.vectorLayers}
        interactions={interactions}
        interactionLayers={[selectionLayer, drawLayer]}
      >
        {/* Styles for the OpenLayers ScaleLine -component */}
        <GlobalStyles
          styles={{
            '.ol-viewport': {
              cursor: 'crosshair',
            },
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
        <MapControls
          zoom={zoom}
          zoomStep={1}
          defaultZoom={mapOptions.tre.defaultZoom}
          onZoomChanged={(changedZoom) => setZoom(changedZoom)}
          onFitScreen={() => setExtent(drawSource?.getExtent())}
        />

        <LayerDrawer />

        {editable && (
          <MapToolbar
            toolsDisabled={{
              tracedFeature: !featuresSelected,
              editFeature: !featuresSelected,
              deleteFeature: !featuresSelected,
            }}
            onToolChange={(tool) => setSelectedTool(tool)}
            onSaveClick={() => {
              selectionSource.clear();
              setDirty(false);
              onFeaturesSaved?.(
                getGeoJSONFeaturesString(
                  drawSource.getFeatures(),
                  projection?.getCode() ?? mapOptions.projection.code,
                ),
              );
            }}
            saveDisabled={!dirty}
            onUndoClick={() => {
              selectionSource.clear();
              setDirty(false);
              addFeaturesFromGeoJson(drawSource, geoJson);
            }}
            undoDisabled={!dirty}
          />
        )}
      </Map>
    </div>
  );
}
