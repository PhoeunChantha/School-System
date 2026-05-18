import { useAdminTranslation } from '@/hooks/use-admin-translation';
import { useEffect } from 'react';

const ORIGINAL_TEXT = new WeakMap<Text, string>();
const ORIGINAL_ATTRIBUTE = new WeakMap<Element, Map<string, string>>();
const ORIGINAL_DISPLAY = new WeakMap<HTMLElement, string>();
const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'aria-label', 'title'];
const KHMER_PATTERN = /[\u1780-\u17ff]/;
const LATIN_PATTERN = /[A-Za-z]/;

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

export function useAdminDomTranslations() {
    const { lang, translateText } = useAdminTranslation();

    useEffect(() => {
        const root = document.querySelector('.main-content');

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

        const getOwnText = (element: Element): string => {
            return Array.from(element.childNodes)
                .filter((node) => node.nodeType === Node.TEXT_NODE)
                .map(
                    (node) =>
                        ORIGINAL_TEXT.get(node as Text) ??
                        node.textContent ??
                        '',
                )
                .join('')
                .trim();
        };

        const setElementVisible = (
            element: HTMLElement,
            isVisible: boolean,
        ) => {
            if (!ORIGINAL_DISPLAY.has(element)) {
                ORIGINAL_DISPLAY.set(element, element.style.display);
            }

            element.style.display = isVisible
                ? (ORIGINAL_DISPLAY.get(element) ?? '')
                : 'none';
        };

        const applyBilingualPairVisibility = () => {
            root.querySelectorAll<HTMLElement>('*').forEach((element) => {
                if (shouldSkipElement(element)) {
                    return;
                }

                const ownText = getOwnText(element);

                if (!KHMER_PATTERN.test(ownText)) {
                    return;
                }

                const siblings = [
                    element.nextElementSibling,
                    element.previousElementSibling,
                ].filter(Boolean) as HTMLElement[];

                const latinSibling = siblings.find((sibling) => {
                    const siblingText = getOwnText(sibling);

                    return (
                        LATIN_PATTERN.test(siblingText) &&
                        !KHMER_PATTERN.test(siblingText)
                    );
                });

                if (!latinSibling) {
                    return;
                }

                setElementVisible(element, lang !== 'en');
                setElementVisible(latinSibling, lang === 'en');
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
            applyBilingualPairVisibility();
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
