import { Box, Skeleton, css } from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';
import { RESET } from 'jotai/utils';
import { Feature } from 'ol';
import { Extent, createEmpty, extend, isEmpty } from 'ol/extent';
import { Geometry } from 'ol/geom';
import VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import * as olUtil from 'ol/util';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { useLocation } from 'react-router';

import {
  ALL_VECTOR_ITEM_LAYERS,
  VectorItemLayerKey,
  featureSelectorAtom,
  mapProjectionAtom,
  selectedItemLayersAtom,
  selectionSourceAtom,
} from '@frontend/stores/map';
import { useNavigationBlocker } from '@frontend/stores/navigationBlocker';
import { dirtyAndValidFieldsAtom, projectEditingAtom } from '@frontend/stores/projectView';
import { useMapInfoBox } from '@frontend/stores/useMapInfoBox';

import { MapInteraction } from './Map';
import { MapToolbar, ToolType } from './MapToolbar';
import { BaseMapWrapperProps, MapWrapper } from './MapWrapper';
import { NoGeomInfoBox } from './NoGeomInfoBox';
import {
  addFeaturesFromGeoJson,
  createDrawInteraction,
  createModifyInteraction,
  createSelectInteraction,
  deleteSelectedFeatures,
  getDrawLayer,
  getGeoJSONFeaturesString,
  getGeometryIconLayer,
  getSelectedDrawLayerFeatures,
  getSelectionLayer,
} from './mapInteractions';
import { mapOptions } from './mapOptions';
import {
  PROJECT_LAYER_Z_INDEX,
  PROJECT_OBJECT_LAYER_Z_INDEX,
  WFS_LAYER_DEFAULT_Z_INDEX,
} from './styles';

export interface DrawOptions {
  drawGeom: { isLoading: boolean; isFetching: boolean; geoJson: string | object | null };
  onFeaturesSaved?: (features: string) => void;
  drawStyle: Style | Style[];
  toolsHidden?: ToolType[];
  editable: boolean;
  coversMunicipality?: boolean;
  drawItemType: 'project' | 'projectObject';
}

interface Props extends BaseMapWrapperProps {
  drawOptions: DrawOptions;
  interactiveLayers?: VectorItemLayerKey[];
  drawSource?: VectorSource<Feature<Geometry>>;
  onGeometrySave?: (
    geometry: string,
  ) => Promise<{ projectId: string; geom: string } | { projectObjectId: string; geom: string }>;
  fitExtent: 'geoJson' | 'all';
}

export const DrawMap = forwardRef(function DrawMap(
  props: Props,
  ref: React.Ref<{ handleUndoDraw: () => void }>,
) {
  const {
    drawOptions,
    interactiveLayers,
    vectorLayers: propVectorLayers,
    drawSource: propDrawSource,
    onGeometrySave,
    fitExtent,
    ...wrapperProps
  } = props;

  const [selectedTool, setSelectedTool] = useState<ToolType | null>(null);
  const [extent, setExtent] = useState<number[] | null>(null);
  const [interactions, setInteractions] = useState<MapInteraction[] | null>(null);

  const { pathname } = useLocation();
  const { setInfoBox, resetInfoBox, isVisible: infoBoxVisible } = useMapInfoBox();

  const [featureSelector, setFeatureSelector] = useAtom(featureSelectorAtom);
  const projection = useAtomValue(mapProjectionAtom);
  const [dirtyAndValidViews, setDirtyAndValidViews] = useAtom(dirtyAndValidFieldsAtom);
  const [editing, setEditing] = useAtom(projectEditingAtom);
  const selectedItemLayers = useAtomValue(selectedItemLayersAtom);

  useNavigationBlocker(dirtyAndValidViews.map.isDirtyAndValid, 'map');

  const selectionSource = useAtomValue(selectionSourceAtom);
  const drawSource = useMemo(() => propDrawSource ?? new VectorSource({ wrapX: false }), []);
  const geometryCenterIconSource = useMemo(() => new VectorSource({ wrapX: false }), []);

  useImperativeHandle(
    ref,
    () => ({
      handleUndoDraw,
      handleSave: async () => {
        selectionSource.clear();
        setFeatureSelector(RESET);
        setSelectedTool(null);
        const result = await onGeometrySave?.(
          getGeoJSONFeaturesString(
            drawSource.getFeatures(),
            projection?.getCode() ?? mapOptions.projection.code,
          ),
        );
        if (result) {
          setDirtyAndValidViews((prev) => ({ ...prev, map: { isDirtyAndValid: false } }));
        }
      },
      getGeometry: getGeometryForSave,
    }),
    [drawSource, selectionSource, handleUndoDraw, getGeometryForSave],
  );

  /** Layers */

  const selectionLayer = useMemo(() => getSelectionLayer(selectionSource), []);

  const drawLayer = useMemo(
    () => getDrawLayer(drawSource, drawOptions.drawStyle, drawOptions.drawItemType),
    [],
  );

  const geometryCenterIconLayer = useMemo(
    () => getGeometryIconLayer(geometryCenterIconSource, drawOptions.drawItemType),
    [],
  );

  const vectorLayers = useMemo(() => {
    if (!selectedItemLayers || !propVectorLayers) return [];
    return propVectorLayers
      .filter(
        (layer) => selectedItemLayers.findIndex((l) => l.id === layer.getProperties().id) !== -1,
      )
      .concat(geometryCenterIconLayer);
  }, [selectedItemLayers, propVectorLayers]);

  /** Interactions */

  const registerProjectSelectInteraction = useMemo(() => {
    return createSelectInteraction({
      source: selectionSource,
      onSelectionChanged(features, event) {
        setInfoBox(features, event.mapBrowserEvent.pixel);
      },
      multi: true,
      delegateFeatureAdding: true,
      filterLayers(layer) {
        if ((interactiveLayers ?? ALL_VECTOR_ITEM_LAYERS).includes(layer.getProperties().id))
          return true;
        return false;
      },
      drawLayerHooverDisabled: true,
    });
  }, []);

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

  const registerDrawInteraction = useMemo(
    () =>
      createDrawInteraction({
        source: drawSource,
        drawStyle: drawOptions?.drawStyle,
        trace: selectedTool === 'tracedFeature',
        traceSource: selectionSource,
        onDrawEnd: () => {
          setDirtyAndValidViews((prev) => ({ ...prev, map: { isDirtyAndValid: true } }));
        },
        drawType: selectedTool === 'newPointFeature' ? 'Point' : 'Polygon',
      }),
    [selectedTool],
  );

  /** Effects */

  useEffect(() => {
    return () => {
      resetInfoBox();
      setEditing(false);
      setDirtyAndValidViews((prev) => ({ ...prev, map: { isDirtyAndValid: false } }));
    };
  }, []);

  useEffect(() => {
    setExtent(null);
  }, [pathname]);

  useEffect(() => {
    if (props.drawOptions?.coversMunicipality === undefined) return;

    drawSource.clear();

    if (props.drawOptions?.coversMunicipality === false) {
      addFeaturesFromGeoJson(drawSource, props.drawOptions.drawGeom.geoJson, { editing });
      addFeaturesFromGeoJson(geometryCenterIconSource, props.drawOptions.drawGeom.geoJson, {
        editing,
      });
    }
    drawFinished();
  }, [props.drawOptions?.coversMunicipality]);

  useEffect(() => {
    if (drawOptions.drawGeom.isFetching || props.drawOptions?.coversMunicipality) {
      return;
    }

    if (drawOptions?.drawGeom.geoJson) {
      addFeaturesFromGeoJson(drawSource, drawOptions.drawGeom.geoJson, { editing });
      addFeaturesFromGeoJson(geometryCenterIconSource, props.drawOptions.drawGeom.geoJson, {
        editing,
      });
    }

    if (!extent) {
      let newExtent = createEmpty();
      switch (fitExtent) {
        case 'geoJson':
          if (drawSource && drawSource.getFeatures().length > 0) {
            setExtent(drawSource.getExtent());
          }
          break;
        case 'all':
          if (drawSource.getFeatures().length > 0) {
            setExtent(drawSource.getExtent());
          } else {
            newExtent = vectorLayers?.reduce((extent, layer) => {
              const layerExtent = layer.getSource()?.getExtent();
              if (!layerExtent) return extent;
              return extend(extent, layerExtent);
            }, createEmpty()) as Extent;

            if (!isEmpty(newExtent)) {
              setExtent(newExtent);
            }
          }
      }
    }
    // GeoJSON can change without fetching if editing status is changed
  }, [drawOptions.drawGeom.geoJson, drawOptions.drawGeom.isFetching, vectorLayers]);

  useEffect(() => {
    if (editing) {
      drawLayer.setZIndex(WFS_LAYER_DEFAULT_Z_INDEX - 1);
    } else {
      drawLayer.setZIndex(
        drawOptions.drawItemType === 'project'
          ? PROJECT_LAYER_Z_INDEX
          : PROJECT_OBJECT_LAYER_Z_INDEX,
      );
    }
  }, [editing]);

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

  /** Helper functions */

  function resetSelectInteractions() {
    resetInfoBox();
    setInteractions([registerProjectSelectInteraction]);
  }

  function handleUndoDraw() {
    setFeatureSelector((prev) => ({
      features: deleteSelectedFeatures(drawSource, selectionSource),
      pos: prev.pos,
    }));
    setSelectedTool(null);
    setDirtyAndValidViews((prev) => ({ ...prev, map: { isDirtyAndValid: false } }));
    selectionSource.clear();
    addFeaturesFromGeoJson(drawSource, drawOptions.drawGeom.geoJson, { editing });
    addFeaturesFromGeoJson(geometryCenterIconSource, props.drawOptions.drawGeom.geoJson, {
      editing,
    });
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

  function drawSourceHasGeometryOfType(
    geometryType: 'Point' | 'MultiPoint' | 'Polygon' | 'MultiPolygon',
  ) {
    return drawSource
      .getFeatures()
      ?.some((feature) => feature.getGeometry()?.getType() === geometryType);
  }

  function copySelectionToDrawSource() {
    const drawFeatureIds = drawSource.getFeatures().map((feature) => olUtil.getUid(feature));
    const selectionFeatures = selectionSource.getFeatures();
    const featuresToCopy = selectionFeatures
      .filter((feature) => !drawFeatureIds.includes(olUtil.getUid(feature)))
      .map((feature) => {
        feature.setProperties({ editing: true });
        return feature;
      });
    drawSource.addFeatures(featuresToCopy);
    geometryCenterIconSource.addFeatures(featuresToCopy);
    selectionSource.clear();
    drawFinished();
    setDirtyAndValidViews((prev) => ({ ...prev, map: { isDirtyAndValid: true } }));
  }

  function drawFinished() {
    setInteractions([registerProjectSelectInteraction]);
    setSelectedTool(null);
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
          !drawOptions?.drawGeom.geoJson && drawSource.getFeatures().length === 0 ? false : true,
      },
    }));
    drawFinished();
  }

  function handleFitScreen() {
    setExtent(drawSource.getExtent());
  }

  const featuresAvailable =
    props.drawOptions.drawGeom.geoJson ||
    vectorLayers.some((layer) => {
      const features = layer.getSource()?.getFeatures();
      return features && features.length > 0;
    });

  if (drawOptions.drawGeom.isLoading || (!editing && !extent && featuresAvailable)) {
    return <Skeleton variant="rectangular" height="100%" />;
  }

  return (
    <Box
      css={css`
        display: flex;
        flex: 1;
        min-height: 320px;
        position: relative;
        overflow: hidden;
      `}
    >
      <MapWrapper
        {...wrapperProps}
        extent={extent}
        handleFitScreen={handleFitScreen}
        interactions={interactions}
        activeVectorLayers={vectorLayers}
        vectorLayers={propVectorLayers ?? []}
        interactionLayers={[selectionLayer, drawLayer]}
        resetSelectInteractions={resetSelectInteractions}
      />
      <NoGeomInfoBox
        drawItemType={props.drawOptions.drawItemType}
        isVisible={
          !editing && !props.drawOptions.drawGeom.geoJson && !props.drawOptions.coversMunicipality
        }
      />
      {drawOptions.editable && (
        <MapToolbar
          geometryExists={drawSource.getFeatures().length > 0}
          toolsHidden={drawOptions?.toolsHidden}
          toolsDisabled={{
            selectFeature: infoBoxVisible,
            copyFromSelection:
              featureSelector.features.every(
                (feature) => feature.getProperties().layer === 'drawLayer',
              ) || infoBoxVisible,
            newFeature:
              drawSourceHasGeometryOfType('Point') ||
              drawSourceHasGeometryOfType('MultiPoint') ||
              infoBoxVisible,
            newPointFeature:
              drawSourceHasGeometryOfType('Polygon') ||
              drawSourceHasGeometryOfType('MultiPolygon') ||
              infoBoxVisible,
            tracedFeature:
              featureSelector.features.length === 0 ||
              drawSourceHasGeometryOfType('Point') ||
              drawSourceHasGeometryOfType('MultiPoint') ||
              infoBoxVisible,
            editFeature: getSelectedDrawLayerFeatures(featureSelector.features).length === 0,
            clearSelectedFeature: featureSelector.features.length === 0 || infoBoxVisible,
            deleteFeature: getSelectedDrawLayerFeatures(featureSelector.features).length === 0,
            deleteAllFeatures: drawSource.getFeatures().length === 0,
          }}
          onToolChange={(tool) => setSelectedTool(tool)}
        />
      )}
    </Box>
  );
});
