import { GlobalStyles } from '@mui/material';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { RESET } from 'jotai/utils';
import Feature from 'ol/Feature';
import { Geometry } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorImageLayer from 'ol/layer/VectorImage';
import { Projection } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import { ComponentProps, useEffect, useMemo, useRef, useState } from 'react';

import {
  BaseLayerKey,
  ItemLayerState,
  VectorLayerKey,
  baseLayerIdAtom,
  baseLayerStatusAtom,
  featureSelectorAtom,
  freezeMapHeightAtom,
  mapProjectionAtom,
  selectedItemLayersAtom,
  selectedWFSLayersAtom,
  selectionSourceAtom,
  setWFSLayerStatusAtom,
} from '@frontend/stores/map';
import { useMapInfoBox } from '@frontend/stores/useMapInfoBox';

import { ColorPatternSelect } from './ColorPatternSelect';
import { DrawerContainer } from './DrawerContainer';
import { Map, MapInteraction } from './Map';
import { MapControls } from './MapControls';
import { MapInfoBoxButton } from './MapInfoBoxButton';
import { SelectionInfoBox } from './SelectionInfoBox';
import { createWFSLayer, createWMTSLayer, getFeatureItemIds } from './mapFunctions';
import { mapOptions } from './mapOptions';

export type BaseMapWrapperProps = Omit<
  ComponentProps<typeof MapWrapper>,
  'resetSelectInteractions'
> & {
  drawLayer?: VectorLayer<VectorSource<Feature<Geometry>>, Feature<Geometry>>;
};

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
  resetSelectInteractions: () => void;
  onMoveEnd?: (zoom: number, extent: number[]) => void;
  projects?: TProject[];
  projectObjects?: TProjectObject[];
  extent?: number[] | null;
  handleFitScreen?: () => void;
  withColorPatternSelect?: boolean;
  interactions?: MapInteraction[] | null;
  vectorLayers?: VectorLayer<VectorSource<Feature<Geometry>>, Feature<Geometry>>[];
  activeVectorLayers?: VectorLayer<VectorSource<Feature<Geometry>>, Feature<Geometry>>[];
  interactionLayers?: VectorLayer<VectorSource<Feature<Geometry>>, Feature<Geometry>>[];
}

export function MapWrapper<TProject extends ProjectData, TProjectObject extends ProjectObjectData>(
  props: Props<TProject, TProjectObject>,
) {
  const [zoom, setZoom] = useState<number>(mapOptions.tre.defaultZoom);
  const [viewExtent, setViewExtent] = useState<number[]>([...mapOptions.tre.extent]);

  const mapWrapperRef = useRef<HTMLDivElement>(null);

  const featureSelector = useAtomValue(featureSelectorAtom);
  const selectionSource = useAtomValue(selectionSourceAtom);

  useEffect(() => {
    if (props.onMoveEnd) {
      props.onMoveEnd(zoom, viewExtent);
    }
  }, [zoom, viewExtent]);

  const projection = useAtomValue(mapProjectionAtom);

  const [baseLayerId] = useAtom(baseLayerIdAtom);
  const selectedWFSLayers = useAtomValue(selectedWFSLayersAtom);
  const selectedItemLayers = useAtomValue(selectedItemLayersAtom);
  const setWfsLayerStatus = useSetAtom(setWFSLayerStatusAtom);
  const [baseLayerStatus, setBaseLayerStatus] = useAtom(baseLayerStatusAtom);

  function toggleWfsLayerFetchError(layerId: VectorLayerKey, isError: boolean) {
    setWfsLayerStatus({ type: 'setError', layerId: layerId, payload: isError });
  }

  function toggleWfsLayerFetchLoading(layerId: VectorLayerKey, isLoading: boolean) {
    setWfsLayerStatus({ type: 'setLoading', layerId: layerId, payload: isLoading });
  }

  function toggleBaseMapLayerError(layerId: BaseLayerKey) {
    const currentLayerState = baseLayerStatus.find((layer) => layer.id === layerId);

    if (currentLayerState && !currentLayerState?.hasError) {
      setBaseLayerStatus((prev) =>
        prev.map((layer) => (layer.id === layerId ? { ...layer, hasError: true } : layer)),
      );
    }
  }

  useEffect(() => {
    setBaseLayerStatus(RESET);
  }, [baseLayerId]);

  const baseMapLayers = useMemo(() => {
    if (!baseLayerId) return [];
    return mapOptions.baseMaps
      .filter((baseMap) => baseMap.id === (baseLayerId ? baseLayerId : 'virastokartta'))
      .map((baseMap) =>
        createWMTSLayer(baseMap.options, projection as Projection, () =>
          toggleBaseMapLayerError(baseLayerId ?? 'virastokartta'),
        ),
      );
  }, [baseLayerId, baseLayerStatus]);

  const [WFSLayers, setWFSLayers] = useState<
    VectorImageLayer<Feature<Geometry>, VectorSource<Feature<Geometry>>>[]
  >([]);

  useEffect(() => {
    if (!selectedWFSLayers) return;
    setWFSLayers((prevWfsLayers) => {
      return mapOptions.wfsLayers
        .filter((layer) => selectedWFSLayers.findIndex((l) => l.id === layer.id) !== -1)
        .map(
          (layer) =>
            prevWfsLayers.find((l) => l.get('id') === layer.id) ??
            createWFSLayer(layer, toggleWfsLayerFetchError, toggleWfsLayerFetchLoading),
        );
    });
  }, [selectedWFSLayers]);

  const { resetInfoBox, isVisible: infoBoxVisible } = useMapInfoBox();
  const [wholeMunicipalityInfoBoxVisible, setWholeMunicipalityInfoBoxVisible] = useState(false);

  const freezeMapHeight = useAtomValue(freezeMapHeightAtom);

  function handleMapClickEvent() {
    // This is just used to clear the whole municipality info box, use interactions for other events
    setWholeMunicipalityInfoBoxVisible(false);
    props.resetSelectInteractions();
  }

  const projectsForWholeMunicipality = useMemo(() => {
    if (props.projects) return props.projects.filter((project) => project.coversMunicipality);
    return [];
  }, [props.projects]);

  const wholeMunicipalityInfoBoxButtonVisible = useMemo(() => {
    return selectedItemLayers.some(
      (layer: ItemLayerState) =>
        layer.selected && ['projects', 'projectClusterResults'].includes(layer.id),
    );
  }, [selectedItemLayers]);

  return (
    <div
      ref={mapWrapperRef}
      style={{
        transition: 'opacity 0.3s',
        height: freezeMapHeight
          ? mapWrapperRef.current?.clientHeight
            ? `${mapWrapperRef.current.clientHeight}px`
            : '100%'
          : '100%',
        opacity: freezeMapHeight ? 0 : 1,
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
          extent={props.extent ?? null}
          baseMapLayers={baseMapLayers}
          wfsLayers={WFSLayers}
          vectorLayers={props.activeVectorLayers ?? []}
          interactions={props.interactions ?? []}
          interactionLayers={props.interactionLayers ?? []}
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
            {...(props.handleFitScreen && { onFitScreen: props.handleFitScreen })}
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
              handleCloseInfoBox={props.resetSelectInteractions}
            />
          )}

          {props.withColorPatternSelect && <ColorPatternSelect />}

          <DrawerContainer
            layerDrawerEnabledLayers={props.vectorLayers?.map((layer) => layer.get('id')) ?? []}
            legendVectorLayerKeys={
              props.vectorLayers
                ?.map((layer) => layer.get('id'))
                ?.filter((id) => ['projects', 'projectObjects'].includes(id)) ?? []
            }
            colorPatternSelectorVisible={props.withColorPatternSelect}
          />
        </Map>

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
            handleCloseInfoBox={props.resetSelectInteractions}
          />
        )}
      </>
    </div>
  );
}
