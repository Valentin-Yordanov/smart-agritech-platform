'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE,
  LANGUAGE_STORAGE_KEY,
  isLanguage,
  type Language,
  type Message,
} from '@/i18n/config';
import { messages, type MessageKey } from '@/i18n/messages';
import { localizeCondition, localizeCrop, localizePart } from '@/i18n/taxonomy';

type Vars = Record<string, string | number>;

const table: Record<string, Message> = messages;
const lookup = (key: MessageKey): Message => table[key];

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: MessageKey, vars?: Vars) => string;
  /** Looks up a dynamic key and falls back to the given text when no translation exists. */
  tr: (key: string, fallback: string) => string;
  /** Localised crop, plant part and condition names for model output. */
  crop: (name: string) => string;
  part: (name: string) => string;
  condition: (name: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match
  );
}

// Page titles are static metadata, so the tab title is swapped to match the active language.
const TITLE_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['Smart AgriTech | AI Plant Pathology & Agronomy Platform', 'Smart AgriTech | ИИ диагностика на растения и агрономия'],
  [messages['kb.metaTitle'][0], messages['kb.metaTitle'][1]],
];

function syncDocumentTitle(lang: Language) {
  const from = lang === 'bg' ? 0 : 1;
  const pair = TITLE_PAIRS.find((p) => p[from] === document.title);
  if (pair) document.title = pair[1 - from];
}

function persistLanguage(lang: Language) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // Storage can be blocked; the cookie below still keeps the choice.
  }
  const isSecure = window.location.protocol === 'https:';
  document.cookie = `${LANGUAGE_COOKIE}=${lang}; path=/; max-age=31536000; SameSite=Lax${isSecure ? '; Secure' : ''}`;
  document.documentElement.lang = lang;
  syncDocumentTitle(lang);
}

export function LanguageProvider({
  initialLang,
  children,
}: {
  initialLang: Language;
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<Language>(initialLang);

  // The server renders from the cookie; this only recovers a choice kept in localStorage alone.
  useEffect(() => {
    document.documentElement.lang = initialLang;
    syncDocumentTitle(initialLang);
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (isLanguage(stored) && stored !== initialLang) {
        setLangState(stored);
        persistLanguage(stored);
      }
    } catch {
      // ignore
    }
  }, [initialLang]);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    persistLanguage(next);
  }, []);

  const value = useMemo<LanguageContextValue>(() => {
    const index = lang === 'bg' ? 1 : 0;
    return {
      lang,
      setLang,
      t: (key, vars) => interpolate(lookup(key)[index] ?? lookup(key)[0], vars),
      tr: (key, fallback) => {
        const entry = table[key];
        return entry ? (entry[index] ?? entry[0]) : fallback;
      },
      crop: (name) => localizeCrop(name, lang),
      part: (name) => localizePart(name, lang),
      condition: (name) => localizeCondition(name, lang),
    };
  }, [lang, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      lang: DEFAULT_LANGUAGE,
      setLang: () => undefined,
      t: (key, vars) => interpolate(lookup(key)[0], vars),
      tr: (key, fallback) => {
        const entry = table[key];
        return entry ? entry[0] : fallback;
      },
      crop: (name) => name,
      part: (name) => name,
      condition: (name) => name,
    };
  }
  return ctx;
}
