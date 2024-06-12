import { GlobalStyles } from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';
import { RESET } from 'jotai/utils';
import Feature from 'ol/Feature';
import { Extent, createEmpty, extend, isEmpty } from 'ol/extent';
import { Geometry } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import { Projection } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  ALL_VECTOR_ITEM_LAYERS,
  VectorItemLayerKey,
  baseLayerIdAtom,
  featureSelectorAtom,
  selectedItemLayersAtom,
  selectedWFSLayersAtom,
  selectionSourceAtom,
} from '@frontend/stores/map';
import { useNavigationBlocker } from '@frontend/stores/navigationBlocker';
import { useMapInfoBox } from '@frontend/stores/useMapInfoBox';

import { ProjectSearchResult } from '@shared/schema/project';
import { ProjectObjectSearchResult } from '@shared/schema/projectObject';

import { LayerDrawer } from './LayerDrawer';
import { Map, MapInteraction } from './Map';
import { MapControls } from './MapControls';
import { MapToolbar, ToolType } from './MapToolbar';
import { SelectionInfoBox } from './SelectionInfoBox';
import {
  createWFSLayer,
  createWMTSLayer,
  getFeatureItemIds,
  getMapProjection,
} from './mapFunctions';
import {
  addFeaturesFromGeoJson,
  createDrawInteraction,
  createDrawLayer,
  createModifyInteraction,
  createSelectInteraction,
  createSelectionLayer,
  deleteSelectedFeatures,
  getGeoJSONFeaturesString,
  getSelectedDrawLayerFeatures,
} from './mapInteractions';
import { mapOptions } from './mapOptions';

export interface DrawOptions {
  geoJson: string | object | null;
  onFeaturesSaved?: (features: string) => void;
  drawStyle: Style;
  editable: boolean;
}

interface Props {
  drawOptions?: DrawOptions;
  onMoveEnd?: (zoom: number, extent: number[]) => void;
  loading?: boolean;
  vectorLayers?: VectorLayer<VectorSource<Feature<Geometry>>>[];
  fitExtent?: 'geoJson' | 'vectorLayers' | 'all';
  projects?: ProjectSearchResult['projects'];
  projectObjects?: ProjectObjectSearchResult['projectObjects'];
  interactiveLayers?: VectorItemLayerKey[];
}

export function MapWrapper(props: Props) {
  const [zoom, setZoom] = useState(mapOptions.tre.defaultZoom);
  const [viewExtent, setViewExtent] = useState<number[]>(mapOptions.tre.extent);

  const mapWrapperRef = useRef<HTMLDivElement>(null);

  const [featureSelector, setFeatureSelector] = useAtom(featureSelectorAtom);
  const selectionSource = useAtomValue(selectionSourceAtom);

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
  const selectedItemLayers = useAtomValue(selectedItemLayersAtom);

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

  const vectorLayers = useMemo(() => {
    if (!selectedItemLayers || !props.vectorLayers) return [];
    return props.vectorLayers.filter(
      (layer) => selectedItemLayers.findIndex((l) => l.id === layer.getProperties().id) !== -1,
    );
  }, [selectedItemLayers, props.vectorLayers]);

  /**
   * Interactions
   */

  const [dirty, setDirty] = useState(false);
  useNavigationBlocker(dirty, 'map');
  const { setInfoBox, resetInfoBox, isVisible: infoBoxVisible } = useMapInfoBox();

  const [selectedTool, setSelectedTool] = useState<ToolType | null>(null);
  const [interactions, setInteractions] = useState<MapInteraction[] | null>(null);

  const selectionLayer = useMemo(() => createSelectionLayer(selectionSource), []);

  useEffect(() => {
    return () => resetInfoBox();
  }, []);

  function resetSelectInteractions() {
    resetInfoBox();
    setInteractions([registerProjectSelectInteraction]);
  }

  const registerSelectInteraction = useMemo(
    () =>
      createSelectInteraction({
        source: selectionSource,
        onSelectionChanged(features) {
          setFeatureSelector({ features: features, pos: [0, 0] });
        },
      }),
    [],
  );
  const registerProjectSelectInteraction = useMemo(() => {
    return createSelectInteraction({
      source: selectionSource,
      onSelectionChanged(features, event) {
        setInfoBox(features, event.mapBrowserEvent.pixel);
      },
      multi: true,
      delegateFeatureAdding: true,
      filterLayers(layer) {
        if ((props.interactiveLayers ?? ALL_VECTOR_ITEM_LAYERS).includes(layer.getProperties().id))
          return true;
        return false;
      },
    });
  }, []);

  const registerModifyInteraction = useMemo(
    () =>
      createModifyInteraction({
        source: selectionSource,
        onModifyEnd: () => setDirty(true),
      }),
    [],
  );

  const drawSource = useMemo(() => new VectorSource({ wrapX: false }), []);

  useEffect(() => {
    if (props.drawOptions?.geoJson) {
      addFeaturesFromGeoJson(drawSource, props.drawOptions.geoJson);
    }
  }, [props.drawOptions?.geoJson]);

  const drawLayer = useMemo(() => createDrawLayer(drawSource, props.drawOptions?.drawStyle), []);
  const registerDrawInteraction = useMemo(
    () =>
      createDrawInteraction({
        source: drawSource,
        drawStyle: props.drawOptions?.drawStyle,
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
        if (props?.drawOptions?.geoJson && drawSource) {
          setExtent(drawSource.getExtent());
        }
        break;
      case 'vectorLayers':
        extent = vectorLayers?.reduce((extent, layer) => {
          const layerExtent = layer.getSource()?.getExtent();
          if (!layerExtent) return extent;
          return extend(extent, layerExtent);
        }, createEmpty()) as Extent;
        if (!isEmpty(extent)) {
          setExtent(extent);
        }
        break;
      case 'all':
        if (props?.drawOptions?.geoJson && drawSource) {
          setExtent(drawSource.getExtent());
        } else {
          extent = vectorLayers?.reduce((extent, layer) => {
            const layerExtent = layer.getSource()?.getExtent();
            if (!layerExtent) return extent;
            return extend(extent, layerExtent);
          }, createEmpty()) as Extent;
          if (!isEmpty(extent)) {
            setExtent(extent);
          }
        }
    }
  }, [props.drawOptions?.geoJson, vectorLayers, props.fitExtent]);

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
      case 'clearSelectedFeature':
        setFeatureSelector(RESET);
        selectionSource.clear();
        break;
      case 'deleteFeature':
        setDirty(true);
        setFeatureSelector((prev) => ({
          features: deleteSelectedFeatures(drawSource, selectionSource),
          pos: prev.pos,
        }));
        break;
      default:
        setInteractions(null);
        break;
    }
  }, [selectedTool]);

  useEffect(() => {
    if (props.projects || props.projectObjects) setInteractions([registerProjectSelectInteraction]);
  }, []);

  return (
    <div
      ref={mapWrapperRef}
      style={{
        height: '100%',
        position: 'relative',
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
      }}
    >
      <>
        <Map
          zoom={zoom}
          onMoveEnd={(zoom, extent) => {
            setZoom(zoom);
            setViewExtent(extent);
          }}
          extent={extent}
          baseMapLayers={baseMapLayers}
          wfsLayers={WFSLayers}
          vectorLayers={vectorLayers}
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
            onZoomChanged={(changedZoom) => {
              if (changedZoom <= mapOptions.tre.maxZoom && changedZoom >= mapOptions.tre.minZoom)
                setZoom(changedZoom);
            }}
            onFitScreen={() => setExtent(drawSource?.getExtent())}
          />

          <LayerDrawer
            enabledItemVectorLayers={
              props.vectorLayers?.map((layer) => layer.getProperties().id) ?? []
            }
          />
        </Map>
        {props.drawOptions?.editable && (
          <MapToolbar
            toolsDisabled={{
              tracedFeature: featureSelector.features.length === 0,
              editFeature: getSelectedDrawLayerFeatures(featureSelector.features).length === 0,
              clearSelectedFeature: featureSelector.features.length === 0,
              deleteFeature: getSelectedDrawLayerFeatures(featureSelector.features).length === 0,
            }}
            onToolChange={(tool) => setSelectedTool(tool)}
            onSaveClick={() => {
              selectionSource.clear();
              setFeatureSelector(RESET);
              setDirty(false);
              props.drawOptions?.onFeaturesSaved?.(
                getGeoJSONFeaturesString(
                  drawSource.getFeatures(),
                  projection?.getCode() ?? mapOptions.projection.code,
                ),
              );
            }}
            saveDisabled={!dirty}
            onUndoClick={() => {
              setFeatureSelector((prev) => ({
                features: deleteSelectedFeatures(drawSource, selectionSource),
                pos: prev.pos,
              }));
              setDirty(false);
              addFeaturesFromGeoJson(drawSource, props.drawOptions?.geoJson);
            }}
            undoDisabled={!dirty}
          />
        )}
        {infoBoxVisible && (
          <SelectionInfoBox
            projects={props.projects}
            projectObjects={props.projectObjects}
            parentHeight={mapWrapperRef?.current?.clientHeight ?? 0}
            parentWidth={mapWrapperRef?.current?.clientWidth ?? 0}
            pos={featureSelector.pos}
            handleActiveFeatureChange={(projectId) => {
              const selectedFeature = featureSelector.features.find((feature) =>
                getFeatureItemIds([feature]).includes(projectId),
              );

              if (selectedFeature) {
                selectionSource.clear();
                selectionSource.addFeature(selectedFeature);
              }
            }}
            handleCloseInfoBox={resetSelectInteractions}
          />
        )}
      </>
    </div>
  );
}
