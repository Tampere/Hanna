import { atom } from 'jotai';

export type TabView = 'hankkeet' | 'kohteet';
export const selectedSearchViewAtom = atom<TabView>('hankkeet');
