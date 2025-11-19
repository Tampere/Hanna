import { atom } from 'jotai';
import { atomWithReset } from 'jotai/utils';
import { Feature } from 'ol';
import { Geometry } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import { Pixel } from 'ol/pixel';
import VectorSource from 'ol/source/Vector';

import { getFeatureItemIds, getMapProjection } from '@frontend/components/Map/mapFunctions';
import { mapOptions } from '@frontend/components/Map/mapOptions';
import {
  CLUSTER_LAYER_Z_INDEX,
  PROJECT_LAYER_Z_INDEX,
  PROJECT_OBJECT_LAYER_Z_INDEX,
  ProjectColorCodes,
  WHOLE_MUNICIPALITY_PROJECT_AREA_STYLE,
  clusterStyle,
  getStyleWithPointIcon,
  projectAreaStyle,
  projectColorCodes,
  projectObjectAreaStyle,
} from '@frontend/components/Map/styles';

export const baseLayerIdAtom = atom<BaseLayerKey>('virastokartta');

export interface FeatureSelector {
  pos: Pixel;
  features: Feature<Geometry>[];
}

const defaultFeatureSelectorState: FeatureSelector = {
  pos: [0, 0],
  features: [],
};

export const featureSelectorAtom = atomWithReset<FeatureSelector>(defaultFeatureSelectorState);

export const mapProjectionAtom = atom(
  getMapProjection(
    mapOptions.projection.code,
    mapOptions.projection.extent,
    mapOptions.projection.units,
  ),
);

export type VectorLayerKey =
  | 'tilastoalueet'
  | 'kiinteistot'
  | 'rakennukset'
  | 'kadut'
  | 'kevyenliikenteenvaylat'
  | 'urakka-alueet'
  | 'kaavatyot';

export type BaseLayerKey =
  | 'virastokartta'
  | 'opaskartta'
  | 'kantakartta'
  | 'ilmakuva'
  | 'asemakaava';

export const ALL_VECTOR_ITEM_LAYERS = [
  'projects',
  'projectObjects',
  'projectClusterResults',
  'projectObjectClusterResults',
  'municipality',
] as const;

type wfsVectorLayerStatusAction = 'setError' | 'setLoading';

export type VectorItemLayerKey = (typeof ALL_VECTOR_ITEM_LAYERS)[number];

export interface VectorLayerState {
  id: VectorLayerKey;
  selected: boolean;
  opacity: number;
}

export interface BaseLayerState {
  id: BaseLayerKey;
  selected: boolean;
  opacity: number;
}

export interface ItemLayerState {
  id: VectorItemLayerKey;
  selected: boolean;
  opacity: number;
}

const baseMapLayerErrorState = [
  {
    id: 'virastokartta' as const,
    hasError: false,
  },
  {
    id: 'opaskartta' as const,
    hasError: false,
  },
  {
    id: 'kantakartta' as const,
    hasError: false,
  },
  {
    id: 'ilmakuva' as const,
    hasError: false,
  },
  {
    id: 'asemakaava' as const,
    hasError: false,
  },
];

const defaultWfsLayerStatusState = [
  {
    id: 'tilastoalueet' as const,
    isLoading: false,
    hasError: false,
  },
  {
    id: 'kiinteistot' as const,
    isLoading: false,
    hasError: false,
  },
  {
    id: 'rakennukset' as const,
    isLoading: false,
    hasError: false,
  },
  {
    id: 'kadut' as const,
    isLoading: false,
    hasError: false,
  },
  {
    id: 'kevyenliikenteenvaylat' as const,
    isLoading: false,
    hasError: false,
  },
];

const defaultWfsLayerState = [
  {
    id: 'tilastoalueet' as const,
    selected: false,
    opacity: 1,
  },
  {
    id: 'kiinteistot' as const,
    selected: false,
    opacity: 1,
  },
  {
    id: 'rakennukset' as const,
    selected: false,
    opacity: 1,
  },
  {
    id: 'kadut' as const,
    selected: false,
    opacity: 1,
  },
  {
    id: 'kevyenliikenteenvaylat' as const,
    selected: false,
    opacity: 1,
  },
  { id: 'urakka-alueet' as const, selected: false, opacity: 1 },
  { id: 'kaavatyot' as const, selected: false, opacity: 1 },
];

const defaultItemLayerState = [
  { id: 'projects' as const, selected: true, opacity: 1 },
  { id: 'projectClusterResults' as const, selected: true, opacity: 1 },
  { id: 'projectObjectClusterResults' as const, selected: true, opacity: 1 },
  { id: 'projectObjects' as const, selected: true, opacity: 1 },
  { id: 'municipality' as const, selected: false, opacity: 1 },
];

export const colorPatternSelections: SelectedProjectColorCode[] = [
  {
    title: 'Oletus',
    projectColorCodes: null,
  },
  {
    title: 'Hanketyypeittäin',
    projectColorCodes: projectColorCodes,
  },
];

export interface SelectedProjectColorCode {
  title: 'Oletus' | 'Hanketyypeittäin';
  projectColorCodes: ProjectColorCodes | null;
}

export const selectedFeatureColorCodeAtom = atom<SelectedProjectColorCode>({
  title: 'Oletus',
  projectColorCodes: null,
});

export function getProjectsLayer(
  source: VectorSource,
  projectColorCodes?: SelectedProjectColorCode['projectColorCodes'],
) {
  return new VectorLayer({
    source,
    style: (feature) => projectAreaStyle(feature, projectColorCodes),
    zIndex: PROJECT_LAYER_Z_INDEX,
    properties: {
      id: 'projects',
      type: 'vector',
    },
  });
}

export function getProjectMunicipalityLayer(source: VectorSource) {
  return new VectorLayer({
    source,
    style: WHOLE_MUNICIPALITY_PROJECT_AREA_STYLE,
    properties: {
      id: 'municipality',
      type: 'vector',
    },
  });
}

export function getProjectObjectsLayer(source: VectorSource, isFaded: boolean = false) {
  return new VectorLayer({
    source,
    style: getStyleWithPointIcon((feature) => projectObjectAreaStyle(feature, isFaded), isFaded),
    zIndex: PROJECT_OBJECT_LAYER_Z_INDEX,
    properties: {
      id: 'projectObjects',
      type: 'vector',
    },
  });
}

export function getClusterLayer(
  source: VectorSource,
  type: 'project' | 'projectObject',
  projectColorCodes?: ProjectColorCodes,
) {
  const idsByType = {
    project: 'projectClusterResults',
    projectObject: 'projectObjectClusterResults',
  };

  return new VectorLayer({
    source,
    style: (feature) => clusterStyle(feature, type, projectColorCodes),
    zIndex: CLUSTER_LAYER_Z_INDEX,
    properties: {
      id: idsByType[type],
      type: 'vector',
    },
  });
}

export const selectionSourceAtom = atom<VectorSource<Feature<Geometry>>>(
  new VectorSource({ wrapX: false }),
);

export const activeItemIdAtom = atom<string | null>(null);

export const selectedItemIdsAtom = atom<string[]>((get) =>
  getFeatureItemIds(get(featureSelectorAtom).features),
);

export const wfsVectorLayersAtom = atom<VectorLayerState[]>(defaultWfsLayerState);
export const vectorItemLayersAtom = atom<ItemLayerState[]>(defaultItemLayerState);
export const wfsLayerStatusAtom = atom(defaultWfsLayerStatusState);
export const baseLayerStatusAtom = atomWithReset(baseMapLayerErrorState);

export const selectedWFSLayersAtom = atom<VectorLayerState[]>((get) =>
  get(wfsVectorLayersAtom).filter((l) => l.selected),
);

export const setWFSLayerStatusAtom = atom<
  null,
  [{ type: wfsVectorLayerStatusAction; layerId: VectorLayerKey; payload: boolean }],
  void
>(null, (_get, set, action) => {
  switch (action.type) {
    case 'setError':
      set(wfsLayerStatusAtom, (layers) =>
        layers.map((layer) =>
          layer.id === action.layerId
            ? { ...layer, hasError: action.payload, ...(action.payload && { isLoading: false }) }
            : layer,
        ),
      );
      break;
    case 'setLoading':
      set(wfsLayerStatusAtom, (layers) =>
        layers.map((layer) =>
          layer.id === action.layerId
            ? { ...layer, isLoading: action.payload, ...(action.payload && { hasError: false }) }
            : layer,
        ),
      );
      break;
  }
});

export const selectedItemLayersAtom = atom<ItemLayerState[]>((get) =>
  get(vectorItemLayersAtom).filter((l) => l.selected),
);

export const freezeMapHeightAtom = atom<boolean>(false);

export const noGeomInfoBoxAtom = atom<boolean>(false);
