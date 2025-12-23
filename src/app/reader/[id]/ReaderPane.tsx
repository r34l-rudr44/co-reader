'use client';

import {
    useState,
    useCallback,
    useRef,
    useEffect
} from 'react';
import dynamic from 'next/dynamic';
import {
    Document as DocType,
    Highlight,
    HighlightType,
    ReaderSettings,
    SelectionState,
    PdfAnchor,
    HtmlAnchor
} from '@/lib/types';
import {
    isValidSelection,
    clearSelection,
    extractContext
} from '@/lib/selection';
import { getHighlightsByDocument, createHighlight } from '@/lib/highlights';
import { createHtmlAnchor, createPdfAnchor } from '@/lib/anchoring';
import SelectionToolbar from './SelectionToolbar';
import HtmlRenderer from './HtmlRenderer';
import VocabularyCard from './VocabularyCard';

// Dynamic import for PDF renderer to avoid SSR issues with pdfjs-dist
const PdfRenderer = dynamic(() => import('./PdfRenderer'), {
    ssr: false,
    loading: () => (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-reader)'
        }}>
            Loading PDF viewer...
        </div>
    ),
});

interface ReaderPaneProps {
    docData: DocType;
    pdfData: string | Uint8Array | null;
    htmlContent: string | null;
    settings: ReaderSettings;
    onHighlightClick: (highlight: Highlight) => void;
}

interface PdfSelection {
    text: string;
    pageNumber: number;
    position: { top: number; left: number };
    range: Range | null;
}

export default function ReaderPane({
    docData,
    pdfData,
    htmlContent,
    settings,
    onHighlightClick,
}: ReaderPaneProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selection, setSelection] = useState<PdfSelection | null>(null);
    const [highlights, setHighlights] = useState<Highlight[]>([]);
    const [pageTexts, setPageTexts] = useState<Map<number, string>>(new Map());
    const [vocabularyWord, setVocabularyWord] = useState<{
        word: string;
        context: string;
        position: { top: number; left: number };
    } | null>(null);

    // Load highlights on mount and listen for changes
    useEffect(() => {
        const loadHighlights = () => {
            setHighlights(getHighlightsByDocument(docData.id));
        };

        loadHighlights();

        // Listen for storage changes (for multi-tab support)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'coreader_highlights') {
                loadHighlights();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [docData.id]);

    // Handle text selection in PDF or HTML content
    useEffect(() => {
        const handleSelectionChange = () => {
            const sel = window.getSelection();

            if (!isValidSelection(sel)) {
                // Don't immediately clear - give a small delay for click handling
                return;
            }

            // Check if selection is within our container
            if (!containerRef.current) return;

            const range = sel!.getRangeAt(0);
            const commonAncestor = range.commonAncestorContainer;

            // Check if the selection is within our container
            let isInContainer = false;
            let current: Node | null = commonAncestor;
            while (current) {
                if (current === containerRef.current) {
                    isInContainer = true;
                    break;
                }
                current = current.parentNode;
            }

            if (!isInContainer) return;

            // For PDF: Find the page number from the nearest page element
            let pageNumber = 0;
            current = commonAncestor;

            while (current && current !== containerRef.current) {
                if (current instanceof HTMLElement && current.classList.contains('pdf-page')) {
                    // Get page number from index
                    const pdfContainer = containerRef.current.querySelector('.pdf-container');
                    if (pdfContainer) {
                        const pages = Array.from(pdfContainer.querySelectorAll('.pdf-page'));
                        const pageIndex = pages.indexOf(current);
                        pageNumber = pageIndex + 1;
                    }
                    break;
                }
                current = current.parentNode;
            }

            // For HTML content (URL articles): Use page 0 to indicate non-PDF
            // The anchor creation will handle this appropriately

            // Calculate position for toolbar
            const rect = range.getBoundingClientRect();
            const containerRect = containerRef.current.getBoundingClientRect();

            setSelection({
                text: sel!.toString().trim(),
                pageNumber,
                position: {
                    top: rect.top - containerRect.top + containerRef.current.scrollTop - 50,
                    left: rect.left - containerRect.left + (rect.width / 2),
                },
                range: range.cloneRange(),
            });
        };

        const handleMouseUp = () => {
            // Small delay to ensure selection is complete
            setTimeout(handleSelectionChange, 50);
        };

        const handleScroll = () => {
            setSelection(null);
            clearSelection();
        };

        // Use window.document to avoid prop shadowing
        window.document.addEventListener('selectionchange', handleSelectionChange);
        containerRef.current?.addEventListener('mouseup', handleMouseUp);
        containerRef.current?.addEventListener('scroll', handleScroll);

        return () => {
            window.document.removeEventListener('selectionchange', handleSelectionChange);
            containerRef.current?.removeEventListener('mouseup', handleMouseUp);
            containerRef.current?.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const handleHighlight = useCallback((type: HighlightType) => {
        if (!selection || !selection.range) return;

        const selectedText = selection.text;
        let anchor: PdfAnchor | HtmlAnchor;

        if (docData.sourceType === 'pdf' && selection.pageNumber > 0) {
            // PDF highlighting
            const pageText = pageTexts.get(selection.pageNumber) || '';

            // Find the position of selected text in page text
            const startOffset = pageText.indexOf(selectedText);
            const endOffset = startOffset + selectedText.length;

            // Extract context for fuzzy matching later
            const contextStart = Math.max(0, startOffset - 30);
            const contextEnd = Math.min(pageText.length, endOffset + 30);
            const context = pageText.slice(contextStart, contextEnd);

            anchor = {
                type: 'pdf',
                pageNumber: selection.pageNumber,
                startOffset,
                endOffset,
                context,
            } as PdfAnchor;
        } else {
            // HTML highlighting (URL articles)
            anchor = createHtmlAnchor(selection.range);
        }

        // Save highlight
        const highlight = createHighlight(
            docData.id,
            type,
            selectedText,
            anchor
        );

        // Update local state
        setHighlights(prev => [...prev, highlight]);

        // Clear selection
        clearSelection();
        setSelection(null);
    }, [selection, docData.id, docData.sourceType, pageTexts]);

    const handleAddWord = useCallback(() => {
        if (!selection) return;

        // Extract context sentence (find sentence boundaries)
        const text = selection.text.trim();
        const words = text.split(/\s+/);

        // Only support single words for vocabulary
        if (words.length > 3) {
            alert('Please select a single word or short phrase for vocabulary.');
            return;
        }

        // Use the selection range for context extraction, or fallback to text
        const contextSentence = selection.range
            ? extractContext(selection.range, 50)
            : text;

        // Show vocabulary card
        setVocabularyWord({
            word: text,
            context: contextSentence,
            position: selection.position,
        });

        // Clear selection but keep vocab card open
        clearSelection();
        setSelection(null);
    }, [selection]);

    const handleCloseVocabularyCard = useCallback(() => {
        setVocabularyWord(null);
    }, []);

    const handleDismissToolbar = useCallback(() => {
        clearSelection();
        setSelection(null);
    }, []);

    // Store page text for anchoring
    const handlePageTextExtracted = useCallback((pageNumber: number, text: string) => {
        setPageTexts(prev => {
            const newMap = new Map(prev);
            newMap.set(pageNumber, text);
            return newMap;
        });
    }, []);

    return (
        <div
            ref={containerRef}
            className="reader-pane"
            style={{
                fontSize: `${settings.fontSize}px`,
                lineHeight: settings.lineHeight,
            }}
        >
            {docData.sourceType === 'pdf' && pdfData ? (
                <PdfRenderer
                    pdfData={pdfData}
                    highlights={highlights}
                    onHighlightClick={onHighlightClick}
                />
            ) : docData.sourceType === 'url' && htmlContent ? (
                <HtmlRenderer
                    htmlContent={htmlContent}
                    highlights={highlights}
                    onHighlightClick={onHighlightClick}
                />
            ) : (
                <div className="reader-content">
                    <p className="reader-placeholder">
                        {docData.sourceType === 'pdf' ? 'PDF data not found' : 'Article content not found'}
                    </p>
                </div>
            )}

            {selection && selection.text.length > 0 && (
                <SelectionToolbar
                    position={selection.position}
                    text={selection.text}
                    onHighlight={handleHighlight}
                    onAddWord={handleAddWord}
                    onDismiss={handleDismissToolbar}
                />
            )}

            {vocabularyWord && (
                <VocabularyCard
                    word={vocabularyWord.word}
                    contextSentence={vocabularyWord.context}
                    documentId={docData.id}
                    position={vocabularyWord.position}
                    onClose={handleCloseVocabularyCard}
                />
            )}

            <style jsx>{`
        .reader-pane {
          flex: 1;
          padding: var(--spacing-2xl) var(--spacing-lg);
          overflow-y: auto;
          position: relative;
        }

        .reader-content {
          max-width: var(--line-length-max);
          margin: 0 auto;
        }

        .reader-placeholder {
          text-align: center;
          color: var(--text-muted);
          padding: var(--spacing-2xl);
        }
      `}</style>
        </div>
    );
}
