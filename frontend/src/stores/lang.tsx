import { atom, useAtomValue } from 'jotai';

import { Language, TranslationKey, translations } from '@shared/language';

export const langAtom = atom<Language>('fi');
export const trAtom = atom((get) => translations[get(langAtom)]);

export function useTranslations() {
  const value = useAtomValue(trAtom);
  return function tr(key: TranslationKey, ...args: any[]) {
    let translation = value[key];
    if (translation) {
      args.forEach((arg, index) => {
        translation = translation.replace(`{${index}}`, arg);
      });
    }
    return translation ?? <span style={{ background: 'yellow', color: 'black' }}>{key}</span>;
  };
}
