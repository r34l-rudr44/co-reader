// Selection Utilities
// Native Selection API handling

import { SelectionState } from './types';

/**
 * Check if a selection is valid for highlighting
 */
export function isValidSelection(selection: Selection | null): boolean {
    if (!selection) return false;
    if (selection.isCollapsed) return false;
    if (selection.rangeCount === 0) return false;

    const text = selection.toString().trim();
    if (text.length === 0) return false;

    return true;
}

/**
 * Check if selection is within the reader pane
 */
export function isSelectionInReader(
    selection: Selection,
    readerRef: HTMLElement | null
): boolean {
    if (!readerRef || !selection.rangeCount) return false;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;

    return readerRef.contains(
        container.nodeType === Node.TEXT_NODE
            ? container.parentElement
            : container as HTMLElement
    );
}

/**
 * Extract selection state including position for toolbar
 */
export function getSelectionState(
    selection: Selection,
    containerRef: HTMLElement | null
): SelectionState | null {
    if (!isValidSelection(selection) || !containerRef) return null;
    if (!isSelectionInReader(selection, containerRef)) return null;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.getBoundingClientRect();

    return {
        text: selection.toString().trim(),
        range: range.cloneRange(),
        position: {
            top: rect.top - containerRect.top + containerRef.scrollTop - 48, // Above selection
            left: rect.left - containerRect.left + (rect.width / 2), // Centered
        },
    };
}

/**
 * Check if selection is a single word (for vocabulary)
 */
export function isSingleWordSelection(text: string): boolean {
    const trimmed = text.trim();
    // Single word: no spaces, only letters/hyphens/apostrophes
    return /^[\p{L}\p{M}'-]+$/u.test(trimmed);
}

/**
 * Extract context around selection (±30 chars)
 */
export function extractContext(range: Range, contextLength: number = 30): string {
    const container = range.commonAncestorContainer;
    let textContent = '';

    if (container.nodeType === Node.TEXT_NODE) {
        textContent = container.textContent || '';
    } else if (container instanceof HTMLElement) {
        textContent = container.textContent || '';
    }

    const selectedText = range.toString();
    const index = textContent.indexOf(selectedText);

    if (index === -1) return selectedText;

    const start = Math.max(0, index - contextLength);
    const end = Math.min(textContent.length, index + selectedText.length + contextLength);

    return textContent.slice(start, end);
}

/**
 * Clear the current selection
 */
export function clearSelection(): void {
    const selection = window.getSelection();
    if (selection) {
        selection.removeAllRanges();
    }
}
