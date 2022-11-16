export const languages = ['fi', 'en'] as const;

export type Language = typeof languages[number];
