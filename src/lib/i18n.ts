import en from '../locals/en.json';
import fr from '../locals/fr.json';

export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

const dictionaries = {
  fr,
  en,
} as const;

export function getDictionary(locale: Locale) {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

export function getTranslation(
    locale: Locale, path: string, params: Record<string, string|number> = {}) {
  const segments = path.split('.');
  let value: unknown = dictionaries[locale] ?? dictionaries[defaultLocale];

  for (const segment of segments) {
    if (value && typeof value === 'object' && segment in value) {
      value = (value as Record<string, unknown>)[segment];
    } else {
      value = undefined;
      break;
    }
  }

  if (typeof value !== 'string') {
    return path;
  }

  return Object.entries(params).reduce(
      (result, [key, replacement]) =>
          result.replaceAll(`%${key}%`, String(replacement)),
      value);
}
