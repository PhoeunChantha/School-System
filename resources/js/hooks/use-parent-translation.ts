import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type ParentLanguage = 'kh' | 'en';

export const PARENT_LANGUAGE_STORAGE_KEY = 'parent-language';
const PARENT_LANGUAGE_CHANGE_EVENT = 'parent-language-change';

type TranslationDictionary = Record<string, unknown>;

const escapeRegExp = (value: string): string => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const getInitialLanguage = (): ParentLanguage => {
    if (typeof window === 'undefined') {
        return 'en';
    }

    const stored = window.localStorage.getItem(PARENT_LANGUAGE_STORAGE_KEY);

    if (stored === 'kh' || stored === 'en') {
        return stored;
    }

    return document.documentElement.lang.toLowerCase().startsWith('km')
        ? 'kh'
        : 'en';
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

export function useParentTranslation() {
    const { props } = usePage<SharedData>();
    const [lang, setLangState] = useState<ParentLanguage>(getInitialLanguage);

    useEffect(() => {
        const syncLanguage = () => setLangState(getInitialLanguage());

        window.addEventListener(PARENT_LANGUAGE_CHANGE_EVENT, syncLanguage);
        window.addEventListener('storage', syncLanguage);

        return () => {
            window.removeEventListener(
                PARENT_LANGUAGE_CHANGE_EVENT,
                syncLanguage,
            );
            window.removeEventListener('storage', syncLanguage);
        };
    }, []);

    const setLang = useCallback((nextLanguage: ParentLanguage) => {
        setLangState(nextLanguage);

        if (typeof window === 'undefined') {
            return;
        }

        window.localStorage.setItem(PARENT_LANGUAGE_STORAGE_KEY, nextLanguage);
        document.documentElement.lang = nextLanguage === 'kh' ? 'km' : 'en';
        window.dispatchEvent(new Event(PARENT_LANGUAGE_CHANGE_EVENT));
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        window.localStorage.setItem(PARENT_LANGUAGE_STORAGE_KEY, lang);
        document.documentElement.lang = lang === 'kh' ? 'km' : 'en';
    }, [lang]);

    const parentTranslations = useMemo(
        () =>
            (props.translations?.parent ?? {}) as Partial<
                Record<ParentLanguage, TranslationDictionary>
            >,
        [props.translations?.parent],
    );

    const fallbackTranslations = useMemo(
        () => parentTranslations.en ?? {},
        [parentTranslations.en],
    );
    const currentTranslations = useMemo(
        () => parentTranslations[lang] ?? fallbackTranslations,
        [fallbackTranslations, lang, parentTranslations],
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
                            source.length > 2 &&
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

    return { lang, setLang, translateText };
}
