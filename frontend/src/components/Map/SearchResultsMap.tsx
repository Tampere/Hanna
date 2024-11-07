import { useAtomValue } from 'jotai';
import Feature from 'ol/Feature';
import { Geometry } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { useEffect, useMemo, useState } from 'react';

import {
  ALL_VECTOR_ITEM_LAYERS,
  VectorItemLayerKey,
  selectedItemLayersAtom,
  selectionSourceAtom,
} from '@frontend/stores/map';
import { useMapInfoBox } from '@frontend/stores/useMapInfoBox';

import { MapInteraction } from './Map';
import { BaseMapWrapperProps, MapWrapper } from './MapWrapper';
import { createSelectInteraction, getSelectionLayer } from './mapInteractions';

interface Props extends BaseMapWrapperProps {
  interactiveLayers?: VectorItemLayerKey[];
  vectorLayers?: VectorLayer<VectorSource<Feature<Geometry>>, Feature<Geometry>>[];
}

export function SearchResultsMap(props: Props) {
  const { vectorLayers: propVectorLayers, interactiveLayers, ...wrapperProps } = props;
  const [interactions, setInteractions] = useState<MapInteraction[] | null>(null);

  const { setInfoBox, resetInfoBox } = useMapInfoBox();

  const selectedItemLayers = useAtomValue(selectedItemLayersAtom);
  const selectionSource = useAtomValue(selectionSourceAtom);

  /** Layers */

  const selectionLayer = useMemo(() => getSelectionLayer(selectionSource), []);

  const vectorLayers = useMemo(() => {
    if (!selectedItemLayers || !propVectorLayers) return [];
    return propVectorLayers.filter(
      (layer) => selectedItemLayers.findIndex((l) => l.id === layer.getProperties().id) !== -1,
    );
  }, [selectedItemLayers, props.vectorLayers]);

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

  /** Effects */

  useEffect(() => {
    setInteractions([registerProjectSelectInteraction]);
    return () => {
      resetInfoBox();
    };
  }, []);

  /** Helper functions */

  function resetSelectInteractions() {
    resetInfoBox();
    setInteractions([registerProjectSelectInteraction]);
  }

  return (
    <MapWrapper
      {...wrapperProps}
      interactions={interactions}
      activeVectorLayers={vectorLayers}
      vectorLayers={props.vectorLayers ?? []}
      interactionLayers={[selectionLayer]}
      resetSelectInteractions={resetSelectInteractions}
    />
  );
}
