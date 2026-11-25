import type { LanguageTag } from './geocoder';

export const createLanguageHeaders = (
    language: LanguageTag | undefined,
): Record<string, string> => {
    return language === undefined ? {} : { 'Accept-Language': language };
};
