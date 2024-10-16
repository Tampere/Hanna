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
  ProjectColorCodes,
  WHOLE_MUNICIPALITY_PROJECT_AREA_STYLE,
  getProjectAreaStyle,
  getStyleWithPointIcon,
  projectColorCodes,
  projectObjectStyle,
} from '@frontend/components/Map/styles';

export const baseLayerIdAtom = atom<string>('virastokartta');

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
  | 'kaupunginosat'
  | 'kiinteistot'
  | 'rakennukset'
  | 'kadut'
  | 'kevyenliikenteenvaylat';

export const ALL_VECTOR_ITEM_LAYERS = [
  'projects',
  'projectObjects',
  'projectClusterResults',
  'projectObjectClusterResults',
  'municipality',
] as const;

export type VectorItemLayerKey = (typeof ALL_VECTOR_ITEM_LAYERS)[number];

export interface LayerState {
  id: VectorLayerKey;
  selected: boolean;
  opacity: number;
}

export interface ItemLayerState {
  id: VectorItemLayerKey;
  selected: boolean;
  opacity: number;
}

const defaultLayerState = [
  {
    id: 'kaupunginosat' as const,
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
    style: (feature) => getProjectAreaStyle(feature, projectColorCodes),
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

export function getProjectObjectsLayer(source: VectorSource, opacity?: number) {
  return new VectorLayer({
    source,
    opacity: opacity ?? 1,
    style: getStyleWithPointIcon(projectObjectStyle),
    properties: {
      id: 'projectObjects',
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

export const vectorLayersAtom = atom<LayerState[]>(defaultLayerState);
export const vectorItemLayersAtom = atom<ItemLayerState[]>(defaultItemLayerState);

export const selectedWFSLayersAtom = atom<LayerState[]>((get) =>
  get(vectorLayersAtom).filter((l) => l.selected),
);

export const selectedItemLayersAtom = atom<ItemLayerState[]>((get) =>
  get(vectorItemLayersAtom).filter((l) => l.selected),
);

export const freezeMapHeightAtom = atom<boolean>(false);
