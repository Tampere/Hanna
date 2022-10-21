import { atom, useAtomValue } from 'jotai';

import en from './en.json';
import fi from './fi.json';

export type Language = 'fi' | 'en';
const translations = { fi, en };
export const langAtom = atom<Language>('fi');
export const trAtom = atom((get) => translations[get(langAtom)]);

export function useTranslations() {
  return useAtomValue(trAtom);
}
