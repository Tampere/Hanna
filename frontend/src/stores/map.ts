import { atom } from 'jotai';

export const baseLayerIdAtom = atom<string>('virastokartta');

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

export const vectorLayersAtom = atom<LayerState[]>(defaultLayerState);

export const selectedWFSLayersAtom = atom<LayerState[]>((get) =>
  get(vectorLayersAtom).filter((l) => l.selected),
);
