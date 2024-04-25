import { atom } from 'jotai';
import { Feature } from 'ol';
import { Geometry } from 'ol/geom';
import { Pixel } from 'ol/pixel';

import { getFeatureProjectIds } from '@frontend/components/Map/mapFunctions';

export const baseLayerIdAtom = atom<string>('virastokartta');

export interface FeatureSelector {
  pos: Pixel;
  features: Feature<Geometry>[];
}

export const defaultFeatureSelectorState: FeatureSelector = {
  pos: [0, 0],
  features: [],
};

export const featureSelectorAtom = atom<FeatureSelector>(defaultFeatureSelectorState);

export type VectorLayerKey =
  | 'kaupunginosat'
  | 'kiinteistot'
  | 'rakennukset'
  | 'kadut'
  | 'kevyenliikenteenvaylat';

export interface LayerState {
  id: VectorLayerKey;
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

export const activeProjectIdAtom = atom<string | null>(null);

export const selectedProjectIdsAtom = atom<string[]>((get) =>
  getFeatureProjectIds(get(featureSelectorAtom).features),
);

export const vectorLayersAtom = atom<LayerState[]>(defaultLayerState);

export const selectedWFSLayersAtom = atom<LayerState[]>((get) =>
  get(vectorLayersAtom).filter((l) => l.selected),
);
