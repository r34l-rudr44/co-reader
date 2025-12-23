'use client';

import { useCallback, useEffect, useRef } from 'react';
import { HighlightType } from '@/lib/types';
import { isSingleWordSelection } from '@/lib/selection';

interface SelectionToolbarProps {
    position: { top: number; left: number };
    text: string;
    onHighlight: (type: HighlightType) => void;
    onAddWord: () => void;
    onDismiss: () => void;
}

export default function SelectionToolbar({
    position,
    text,
    onHighlight,
    onAddWord,
    onDismiss,
}: SelectionToolbarProps) {
    const toolbarRef = useRef<HTMLDivElement>(null);
    const isSingleWord = isSingleWordSelection(text);

    // Dismiss on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
                onDismiss();
            }
        };

        // Delay to prevent immediate dismissal
        const timeoutId = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 100);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onDismiss]);

    // Dismiss on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onDismiss();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onDismiss]);

    const handleHighlightClick = useCallback((type: HighlightType) => {
        onHighlight(type);
    }, [onHighlight]);

    return (
        <div
            ref={toolbarRef}
            className="selection-toolbar"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                transform: 'translateX(-50%)',
            }}
        >
            <button
                className="toolbar-btn"
                data-type="insight"
                onClick={() => handleHighlightClick('insight')}
                title="Mark as Insight"
                aria-label="Mark as Insight"
            >
                ◯
            </button>

            <button
                className="toolbar-btn"
                data-type="definition"
                onClick={() => handleHighlightClick('definition')}
                title="Mark as Definition"
                aria-label="Mark as Definition"
            >
                ▭
            </button>

            <button
                className="toolbar-btn"
                data-type="question"
                onClick={() => handleHighlightClick('question')}
                title="Mark as Question"
                aria-label="Mark as Question"
            >
                ☐
            </button>

            {isSingleWord && (
                <>
                    <div className="toolbar-divider" />
                    <button
                        className="toolbar-btn toolbar-btn-word"
                        onClick={onAddWord}
                        title="Add to Vocabulary"
                        aria-label="Add to Vocabulary"
                    >
                        + Word
                    </button>
                </>
            )}
        </div>
    );
}
