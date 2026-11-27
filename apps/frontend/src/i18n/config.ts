export type Language = 'en' | 'bg';

export const LANGUAGES: readonly Language[] = ['en', 'bg'];
export const DEFAULT_LANGUAGE: Language = 'en';
export const LANGUAGE_COOKIE = 'agritech-lang';
export const LANGUAGE_STORAGE_KEY = 'agritech-lang';

export function isLanguage(value: unknown): value is Language {
  return value === 'en' || value === 'bg';
}

// A missing bg string falls back to English, which keeps technical terms untranslated.
export type Message = readonly [en: string, bg?: string];

export function defineMessages<const T extends Record<string, Message>>(messages: T): T {
  return messages;
}
