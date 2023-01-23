import { atom, useAtomValue } from 'jotai';

import { Language } from '@shared/language';

import en from './en.json';
import fi from './fi.json';

const translations = { fi, en };
export const langAtom = atom<Language>('fi');
export const trAtom = atom((get) => translations[get(langAtom)]);

export type TranslationKey = keyof typeof translations[Language];

export function useTranslations() {
  const value = useAtomValue(trAtom);
  return function tr(key: TranslationKey) {
    return value[key] ?? <span style={{ background: 'yellow', color: 'black' }}>{key}</span>;
  };
}

export function getLanguageName(language: Language) {
  return translations[language].language;
}
