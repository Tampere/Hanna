import { fi } from './fi.js';

export const translations = { fi };

export type Language = keyof typeof translations;

export const languages = Object.keys(translations) as Language[];

export type TranslationKey = keyof (typeof translations)[Language];

export function isTranslationKey(text?: string | null): text is TranslationKey {
  return text != null && Object.keys(translations.fi).includes(text);
}

export function getLanguageName(language: Language) {
  return translations[language].language;
}
