import { z } from 'zod';

// Like "fr" or "fr-CA", but not "f" or "fr-C"
export const isLanguageTag = (text: string) => {
    try {
        return Intl.getCanonicalLocales(text).length === 1;
    } catch {
        return false;
    }
};

export const LanguageTagSchema = z
    .string()
    .refine(isLanguageTag, 'Expected a language tag, like "fr-CA"');
