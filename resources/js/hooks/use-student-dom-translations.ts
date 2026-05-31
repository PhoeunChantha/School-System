import { useStudentTranslation } from '@/hooks/use-student-translation';
import { useEffect } from 'react';

const ORIGINAL_TEXT = new WeakMap<Text, string>();
const ORIGINAL_ATTRIBUTE = new WeakMap<Element, Map<string, string>>();
const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'aria-label', 'title'];

const shouldSkipElement = (element: Element | null): boolean => {
    if (!element) {
        return false;
    }

    return Boolean(
        element.closest(
            'script, style, code, pre, textarea, [data-no-translate="true"]',
        ),
    );
};

export function useStudentDomTranslations() {
    const { lang, translateText } = useStudentTranslation();

    useEffect(() => {
        const root = document.querySelector('.student-wrap');

        if (!root) {
            return;
        }

        const translateNode = (textNode: Text) => {
            if (shouldSkipElement(textNode.parentElement)) {
                return;
            }

            const original = ORIGINAL_TEXT.get(textNode) ?? textNode.nodeValue;

            if (!original?.trim()) {
                return;
            }

            ORIGINAL_TEXT.set(textNode, original);
            const nextValue =
                lang === 'en' ? original : translateText(original);

            if (textNode.nodeValue !== nextValue) {
                textNode.nodeValue = nextValue;
            }
        };

        const translateElementAttributes = (element: Element) => {
            if (shouldSkipElement(element)) {
                return;
            }

            TRANSLATABLE_ATTRIBUTES.forEach((attribute) => {
                const value = element.getAttribute(attribute);

                if (!value?.trim()) {
                    return;
                }

                const originalAttributes =
                    ORIGINAL_ATTRIBUTE.get(element) ??
                    new Map<string, string>();
                const original = originalAttributes.get(attribute) ?? value;

                originalAttributes.set(attribute, original);
                ORIGINAL_ATTRIBUTE.set(element, originalAttributes);

                const nextValue =
                    lang === 'en' ? original : translateText(original);

                if (element.getAttribute(attribute) !== nextValue) {
                    element.setAttribute(attribute, nextValue);
                }
            });
        };

        const translateTree = () => {
            const walker = document.createTreeWalker(
                root,
                NodeFilter.SHOW_TEXT,
            );
            const textNodes: Text[] = [];

            while (walker.nextNode()) {
                textNodes.push(walker.currentNode as Text);
            }

            textNodes.forEach(translateNode);
            root.querySelectorAll('*').forEach(translateElementAttributes);
        };

        translateTree();

        const observer = new MutationObserver(() => translateTree());

        observer.observe(root, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: TRANSLATABLE_ATTRIBUTES,
        });

        return () => observer.disconnect();
    }, [lang, translateText]);
}
