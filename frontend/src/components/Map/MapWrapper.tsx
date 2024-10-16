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
import * as olUtil from 'ol/util';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation, useParams } from 'react-router';

import {
  ALL_VECTOR_ITEM_LAYERS,
  ItemLayerState,
  VectorItemLayerKey,
  baseLayerIdAtom,
  featureSelectorAtom,
  freezeMapHeightAtom,
  mapProjectionAtom,
  selectedItemLayersAtom,
  selectedWFSLayersAtom,
  selectionSourceAtom,
} from '@frontend/stores/map';
import { useNavigationBlocker } from '@frontend/stores/navigationBlocker';
import { dirtyAndValidFieldsAtom, projectEditingAtom } from '@frontend/stores/projectView';
import { useMapInfoBox } from '@frontend/stores/useMapInfoBox';

import { ColorPatternSelect } from './ColorPatternSelect';
import { DrawerContainer } from './DrawerContainer';
import { Map, MapInteraction } from './Map';
import { MapControls } from './MapControls';
import { MapInfoBoxButton } from './MapInfoBoxButton';
import { MapToolbar, ToolType } from './MapToolbar';
import { SelectionInfoBox } from './SelectionInfoBox';
import { createWFSLayer, createWMTSLayer, getFeatureItemIds } from './mapFunctions';
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
  drawStyle: Style | Style[];
  toolsHidden?: ToolType[];
  editable: boolean;
  coversMunicipality?: boolean;
  drawItemType: 'project' | 'projectObject';
}

export interface ProjectData {
  projectId: string;
  projectName: string;
  endDate: string;
  startDate: string;
  projectType: 'investmentProject' | 'detailplanProject' | 'maintenanceProject';
  coversMunicipality: boolean;
}

export interface ProjectObjectData {
  projectObjectId: string;
  objectName: string;
  startDate: string;
  endDate: string;
  objectStage?: string | null;
  project: {
    projectId: string;
    projectName: string;
    projectType?: ProjectData['projectType'];
    coversMunicipality: boolean;
  };
}

interface Props<TProject, TProjectObject> {
  drawOptions?: DrawOptions;
  onMoveEnd?: (zoom: number, extent: number[]) => void;
  loading?: boolean;
  vectorLayers?: VectorLayer<VectorSource<Feature<Geometry>>, Feature<Geometry>>[];
  fitExtent?: 'geoJson' | 'vectorLayers' | 'all';
  projects?: TProject[];
  projectObjects?: TProjectObject[];
  /** Layers which contain features users can interact with by clicking a feature and opening a map info box. */
  interactiveLayers?: VectorItemLayerKey[];
  drawSource?: VectorSource<Feature<Geometry>>;
  withColorPatternSelect?: boolean;
  onGeometrySave?: (geometry: string) => Promise<void>;
}

export const MapWrapper = forwardRef(function MapWrapper<
  TProject extends ProjectData,
  TProjectObject extends ProjectObjectData,
>(props: Props<TProject, TProjectObject>, ref: React.Ref<{ handleUndoDraw: () => void }>) {
  const { projectObjectId } = useParams() as { projectObjectId?: string };
  const [zoom, setZoom] = useState(mapOptions.tre.defaultZoom);
  const [viewExtent, setViewExtent] = useState<number[]>(mapOptions.tre.extent);
  const [mapGeometryInitialized, setMapGeometryInitialized] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (mapGeometryInitialized) setMapGeometryInitialized(false);
  }, [location]);

  const mapWrapperRef = useRef<HTMLDivElement>(null);

  const [featureSelector, setFeatureSelector] = useAtom(featureSelectorAtom);
  const selectionSource = useAtomValue(selectionSourceAtom);

  useEffect(() => {
    if (props.onMoveEnd) {
      props.onMoveEnd(zoom, viewExtent);
    }
  }, [zoom, viewExtent]);

  const [extent, setExtent] = useState<number[] | null>(null);

  const projection = useAtomValue(mapProjectionAtom);

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

  const { setInfoBox, resetInfoBox, isVisible: infoBoxVisible } = useMapInfoBox();
  const [wholeMunicipalityInfoBoxVisible, setWholeMunicipalityInfoBoxVisible] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolType | null>(null);
  const [interactions, setInteractions] = useState<MapInteraction[] | null>(null);
  const selectionLayer = useMemo(() => createSelectionLayer(selectionSource), []);
  const freezeMapHeight = useAtomValue(freezeMapHeightAtom);
  const [dirtyAndValidViews, setDirtyAndValidViews] = useAtom(dirtyAndValidFieldsAtom);
  const [editing, setEditing] = useAtom(projectEditingAtom);
  useNavigationBlocker(dirtyAndValidViews.map.isDirtyAndValid, 'map');

  useEffect(() => {
    return () => {
      resetInfoBox();
      setEditing(false);
      setDirtyAndValidViews((prev) => ({ ...prev, map: { isDirtyAndValid: false } }));
    };
  }, []);

  const drawSource = useMemo(() => props.drawSource ?? new VectorSource({ wrapX: false }), []);

  useImperativeHandle(
    ref,
    () => ({
      handleUndoDraw,
      handleSave: async () => {
        selectionSource.clear();
        setFeatureSelector(RESET);
        setSelectedTool(null);
        await props.onGeometrySave?.(
          getGeoJSONFeaturesString(
            drawSource.getFeatures(),
            projection?.getCode() ?? mapOptions.projection.code,
          ),
        );
        setDirtyAndValidViews((prev) => ({ ...prev, map: { isDirtyAndValid: false } }));
      },
      getGeometry: getGeometryForSave,
    }),
    [drawSource, selectionSource, handleUndoDraw, getGeometryForSave],
  );

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
        drawLayerHooverDisabled: false,
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
      drawLayerHooverDisabled: true,
    });
  }, []);

  const registerModifyInteraction = useMemo(
    () =>
      createModifyInteraction({
        source: selectionSource,
        onModifyEnd: () => {
          setDirtyAndValidViews((prev) => ({ ...prev, map: { isDirtyAndValid: true } }));
        },
      }),
    [],
  );

  useEffect(() => {
    if (props.drawOptions?.geoJson) {
      addFeaturesFromGeoJson(drawSource, props.drawOptions.geoJson, { editing });
      if (!mapGeometryInitialized) setMapGeometryInitialized(true);
    }
  }, [props.drawOptions?.geoJson]);

  function drawSourceHasGeometryOfType(geometryType: 'Point' | 'Polygon') {
    return drawSource
      .getFeatures()
      ?.some((feature) => feature.getGeometry()?.getType() === geometryType);
  }

  const drawLayer = useMemo(
    () =>
      createDrawLayer(drawSource, props.drawOptions?.drawStyle, props.drawOptions?.drawItemType),
    [],
  );

  const registerDrawInteraction = useMemo(
    () =>
      createDrawInteraction({
        source: drawSource,
        drawStyle: props.drawOptions?.drawStyle,
        trace: selectedTool === 'tracedFeature',
        traceSource: selectionSource,
        onDrawEnd: () => {
          setDirtyAndValidViews((prev) => ({ ...prev, map: { isDirtyAndValid: true } }));
        },
        drawType: selectedTool === 'newPointFeature' ? 'Point' : 'Polygon',
      }),
    [selectedTool],
  );

  const projectsForWholeMunicipality = useMemo(() => {
    if (props.projects) return props.projects.filter((project) => project.coversMunicipality);
    return [];
  }, [props.projects]);

  useEffect(() => {
    if (props.drawOptions?.geoJson)
      // GeoJson is not loading
      drawSource.getFeatures().forEach((feature) => {
        feature.setProperties({ editing });
      });

    if (projectObjectId) {
      return;
    }

    if (editing) {
      drawLayer.setZIndex(101);
    } else {
      drawLayer.setZIndex(0);
    }
  }, [editing, drawLayer, projectObjectId]);

  useEffect(() => {
    if (!mapGeometryInitialized) {
      return;
    }
    let extent = createEmpty();
    switch (props.fitExtent) {
      case 'geoJson':
        if (drawSource && drawSource.getFeatures().length > 0) {
          if (
            Object.values(dirtyAndValidViews).every(
              (status) => !status.isValid || !status.isDirtyAndValid,
            )
          )
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
        if (drawSource.getFeatures().length > 0) {
          if (
            Object.values(dirtyAndValidViews).every(
              (status) => !status.isValid || !status.isDirtyAndValid,
            )
          )
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
  }, [mapGeometryInitialized]);

  function drawFinished() {
    if (props.projects || props.projectObjects) {
      setInteractions([registerProjectSelectInteraction]);
    } else {
      setInteractions(null);
    }
    setSelectedTool(null);
  }

  function copySelectionToDrawSource() {
    const drawFeatureIds = drawSource.getFeatures().map((feature) => olUtil.getUid(feature));
    const selectionFeatures = selectionSource.getFeatures();
    const featuresToCopy = selectionFeatures.filter(
      (feature) => !drawFeatureIds.includes(olUtil.getUid(feature)),
    );
    drawSource.addFeatures(featuresToCopy);
    selectionSource.clear();
    drawFinished();
    setDirtyAndValidViews((prev) => ({ ...prev, map: { isDirtyAndValid: true } }));
  }

  function handleDeleteFeatures(selectedOnly = true) {
    if (selectedOnly) {
      setFeatureSelector((prev) => ({
        features: deleteSelectedFeatures(drawSource, selectionSource),
        pos: prev.pos,
      }));
    } else {
      drawSource.clear();
      selectionSource.clear();
      setFeatureSelector((prev) => ({
        features: [],
        pos: prev.pos,
      }));
    }

    setDirtyAndValidViews((prev) => ({
      ...prev,
      map: {
        isDirtyAndValid:
          !props.drawOptions?.geoJson && drawSource.getFeatures().length === 0 ? false : true,
      },
    }));
    drawFinished();
  }

  useEffect(() => {
    switch (selectedTool) {
      case 'selectFeature':
        setInteractions([registerSelectInteraction]);
        break;
      case 'copyFromSelection':
        copySelectionToDrawSource();
        break;
      case 'newFeature':
      case 'newPointFeature':
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
        drawFinished();
        break;
      case 'deleteFeature':
        handleDeleteFeatures();
        break;
      case 'deleteAllFeatures':
        handleDeleteFeatures(false);
        break;
      default:
        drawFinished();
        break;
    }
  }, [selectedTool]);

  useEffect(() => {
    if (props.drawOptions?.coversMunicipality === undefined) return;

    drawSource.clear();

    if (props.drawOptions?.coversMunicipality === false) {
      addFeaturesFromGeoJson(drawSource, props.drawOptions.geoJson, { editing });
    }
    drawFinished();
  }, [props.drawOptions?.coversMunicipality]);

  useEffect(() => {
    if (props.projects || props.projectObjects) setInteractions([registerProjectSelectInteraction]);
  }, []);

  function handleMapClickEvent() {
    // This is just used to clear the whole municipality info box, use interactions for other events
    setWholeMunicipalityInfoBoxVisible(false);
    resetSelectInteractions();
  }

  const wholeMunicipalityInfoBoxButtonVisible = useMemo(() => {
    return selectedItemLayers.some(
      (layer: ItemLayerState) =>
        layer.selected && ['projects', 'projectClusterResults'].includes(layer.id),
    );
  }, [selectedItemLayers]);

  function handleUndoDraw() {
    setFeatureSelector((prev) => ({
      features: deleteSelectedFeatures(drawSource, selectionSource),
      pos: prev.pos,
    }));
    setSelectedTool(null);
    setDirtyAndValidViews((prev) => ({ ...prev, map: { isDirtyAndValid: false } }));
    selectionSource.clear();
    addFeaturesFromGeoJson(drawSource, props.drawOptions?.geoJson, { editing });
  }

  function getGeometryForSave() {
    selectionSource.clear();
    setFeatureSelector(RESET);
    setSelectedTool(null);
    setDirtyAndValidViews((prev) => ({ ...prev, map: { isDirtyAndValid: false } }));
    return getGeoJSONFeaturesString(
      drawSource.getFeatures(),
      projection?.getCode() ?? mapOptions.projection.code,
    );
  }

  return (
    <div
      ref={mapWrapperRef}
      style={{
        transition: freezeMapHeight ? 'none' : ' height  0.4s',
        height: freezeMapHeight
          ? mapWrapperRef.current?.clientHeight
            ? `${mapWrapperRef.current.clientHeight}px`
            : '100%'
          : '100%',
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
          {...(wholeMunicipalityInfoBoxButtonVisible &&
            wholeMunicipalityInfoBoxVisible && { handleSingleClickEvent: handleMapClickEvent })}
        >
          {/* Styles for the OpenLayers ScaleLine -component */}
          <GlobalStyles
            styles={{
              '.ol-viewport': {
                cursor: 'grab',
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
          {wholeMunicipalityInfoBoxButtonVisible && (
            <MapInfoBoxButton
              onClick={() => {
                resetInfoBox(false);
                setWholeMunicipalityInfoBoxVisible(true);
              }}
              isOpen={wholeMunicipalityInfoBoxVisible}
              setIsOpen={setWholeMunicipalityInfoBoxVisible}
              projects={projectsForWholeMunicipality}
              pos={[100, 100]}
              handleCloseInfoBox={resetSelectInteractions}
            />
          )}

          {props.withColorPatternSelect && <ColorPatternSelect />}

          <DrawerContainer
            layerDrawerEnabledLayers={
              props.vectorLayers?.map((layer) => layer.getProperties().id) ?? []
            }
            legendVectorLayerKeys={
              props.vectorLayers
                ?.map((layer) => layer.getProperties().id)
                ?.filter((id) => ['projects', 'projectObjects'].includes(id)) ?? []
            }
            colorPatternSelectorVisible={props.withColorPatternSelect}
          />
        </Map>
        {props.drawOptions?.editable && (
          <MapToolbar
            geometryExists={drawSource.getFeatures().length > 0}
            toolsHidden={props.drawOptions?.toolsHidden}
            toolsDisabled={{
              selectFeature: infoBoxVisible,
              copyFromSelection:
                featureSelector.features.every(
                  (feature) => feature.getProperties().layer === 'drawLayer',
                ) || infoBoxVisible,
              newFeature: drawSourceHasGeometryOfType('Point') || infoBoxVisible,
              newPointFeature: drawSourceHasGeometryOfType('Polygon') || infoBoxVisible,
              tracedFeature:
                featureSelector.features.length === 0 ||
                drawSourceHasGeometryOfType('Point') ||
                infoBoxVisible,
              editFeature: getSelectedDrawLayerFeatures(featureSelector.features).length === 0,
              clearSelectedFeature: featureSelector.features.length === 0 || infoBoxVisible,
              deleteFeature: getSelectedDrawLayerFeatures(featureSelector.features).length === 0,
              deleteAllFeatures: drawSource.getFeatures().length === 0,
            }}
            onToolChange={(tool) => setSelectedTool(tool)}
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
});
