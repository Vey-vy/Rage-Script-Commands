'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { defaultLocale, getTranslation, locales, type Locale } from '@/lib/i18n';

const STORAGE_KEY = 'scriptcommands.locale';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function getPreferredLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;

  const saved = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
  if (saved && locales.includes(saved)) return saved;

  const browserLocale = navigator.language.toLowerCase();
  return browserLocale.startsWith('fr') ? 'fr' : 'en';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    setLocaleState(getPreferredLocale());
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, locale);
    }
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale: (nextLocale) => setLocaleState(nextLocale),
    t: (key, params = {}) => getTranslation(locale, key, params),
  }), [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useTranslation must be used inside I18nProvider');
  }

  return context;
}
