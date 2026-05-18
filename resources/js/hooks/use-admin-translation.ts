import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type AdminLanguage = 'kh' | 'en';

export const ADMIN_LANGUAGE_STORAGE_KEY = 'admin-language';
const ADMIN_LANGUAGE_CHANGE_EVENT = 'admin-language-change';

type TranslationDictionary = Record<string, unknown>;

const escapeRegExp = (value: string): string => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const getInitialLanguage = (): AdminLanguage => {
    if (typeof window === 'undefined') {
        return 'kh';
    }

    const stored = window.localStorage.getItem(ADMIN_LANGUAGE_STORAGE_KEY);

    if (stored === 'kh' || stored === 'en') {
        return stored;
    }

    return document.documentElement.lang.toLowerCase().startsWith('en')
        ? 'en'
        : 'kh';
};

const getNestedValue = (
    dictionary: TranslationDictionary,
    key: string,
): unknown => {
    return key.split('.').reduce<unknown>((carry, segment) => {
        if (carry && typeof carry === 'object' && segment in carry) {
            return (carry as Record<string, unknown>)[segment];
        }

        return undefined;
    }, dictionary);
};

const formatTranslation = (
    value: string,
    replacements?: Record<string, string | number>,
): string => {
    if (!replacements) {
        return value;
    }

    return Object.entries(replacements).reduce(
        (content, [key, replacement]) =>
            content.replaceAll(`:${key}`, String(replacement)),
        value,
    );
};

export function useAdminTranslation() {
    const { props } = usePage<SharedData>();
    const [lang, setLangState] = useState<AdminLanguage>(getInitialLanguage);

    useEffect(() => {
        const syncLanguage = () => setLangState(getInitialLanguage());

        window.addEventListener(ADMIN_LANGUAGE_CHANGE_EVENT, syncLanguage);
        window.addEventListener('storage', syncLanguage);

        return () => {
            window.removeEventListener(
                ADMIN_LANGUAGE_CHANGE_EVENT,
                syncLanguage,
            );
            window.removeEventListener('storage', syncLanguage);
        };
    }, []);

    const setLang = useCallback((nextLanguage: AdminLanguage) => {
        setLangState(nextLanguage);

        if (typeof window === 'undefined') {
            return;
        }

        window.localStorage.setItem(ADMIN_LANGUAGE_STORAGE_KEY, nextLanguage);
        document.documentElement.lang = nextLanguage === 'kh' ? 'km' : 'en';
        window.dispatchEvent(new Event(ADMIN_LANGUAGE_CHANGE_EVENT));
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        window.localStorage.setItem(ADMIN_LANGUAGE_STORAGE_KEY, lang);
        document.documentElement.lang = lang === 'kh' ? 'km' : 'en';
    }, [lang]);

    const adminTranslations = useMemo(
        () =>
            (props.translations?.admin ?? {}) as Partial<
                Record<AdminLanguage, TranslationDictionary>
            >,
        [props.translations?.admin],
    );

    const fallbackTranslations = adminTranslations.en ?? {};
    const currentTranslations = adminTranslations[lang] ?? fallbackTranslations;
    const secondaryLanguage: AdminLanguage = lang === 'kh' ? 'en' : 'kh';
    const secondaryTranslations =
        adminTranslations[secondaryLanguage] ?? fallbackTranslations;

    const t = useCallback(
        (
            key: string,
            replacements?: Record<string, string | number>,
        ): string => {
            const value =
                getNestedValue(currentTranslations, key) ??
                getNestedValue(fallbackTranslations, key);

            if (typeof value !== 'string') {
                return key;
            }

            return formatTranslation(value, replacements);
        },
        [currentTranslations, fallbackTranslations],
    );

    const tSecondary = useCallback(
        (key: string): string => {
            const value =
                getNestedValue(secondaryTranslations, key) ??
                getNestedValue(fallbackTranslations, key);

            return typeof value === 'string' ? value : key;
        },
        [fallbackTranslations, secondaryTranslations],
    );

    const translateText = useCallback(
        (value: string): string => {
            const trimmed = value.trim();

            if (!trimmed) {
                return value;
            }

            const contentTranslations = getNestedValue(
                currentTranslations,
                'content_text',
            );
            const fallbackContentTranslations = getNestedValue(
                fallbackTranslations,
                'content_text',
            );

            const dictionary =
                contentTranslations && typeof contentTranslations === 'object'
                    ? (contentTranslations as Record<string, unknown>)
                    : fallbackContentTranslations &&
                        typeof fallbackContentTranslations === 'object'
                      ? (fallbackContentTranslations as Record<string, unknown>)
                      : {};

            const translated =
                dictionary[trimmed] ??
                Object.entries(dictionary).find(
                    ([source]) =>
                        source.toLowerCase() === trimmed.toLowerCase(),
                )?.[1];

            if (typeof translated !== 'string') {
                return Object.entries(dictionary)
                    .filter(
                        ([source, replacement]) =>
                            source.length > 3 &&
                            typeof replacement === 'string' &&
                            new RegExp(escapeRegExp(source), 'i').test(value),
                    )
                    .sort(([a], [b]) => b.length - a.length)
                    .reduce(
                        (content, [source, replacement]) =>
                            content.replace(
                                new RegExp(escapeRegExp(source), 'gi'),
                                replacement as string,
                            ),
                        value,
                    );
            }

            return value.replace(trimmed, translated);
        },
        [currentTranslations, fallbackTranslations],
    );

    return { lang, setLang, t, tSecondary, translateText };
}
