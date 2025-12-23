'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Highlight, PdfAnchor, BoundingRect } from '@/lib/types';

// Dynamic import for pdfjs-dist (client-only)
type PDFDocumentProxy = any;
type PDFPageProxy = any;

interface PdfRendererProps {
    pdfData: string | Uint8Array;
    highlights: Highlight[];
    onHighlightClick: (highlight: Highlight) => void;
    onTextSelect?: (text: string, pageNumber: number, rects: BoundingRect[]) => void;
}

interface TextSpan {
    text: string;
    left: number;
    top: number;
    width: number;
    height: number;
    fontSize: number;
}

export default function PdfRenderer({
    pdfData,
    highlights,
    onHighlightClick,
    onTextSelect,
}: PdfRendererProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [pdfLib, setPdfLib] = useState<any>(null);
    const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
    const [numPages, setNumPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [scale, setScale] = useState(1.5);
    const [pageTexts, setPageTexts] = useState<Map<number, string>>(new Map());

    // Dynamically import pdfjs-dist on client side only
    useEffect(() => {
        const loadPdfJs = async () => {
            try {
                const pdfjsLib = await import('pdfjs-dist');
                // Use local worker file copied from node_modules
                pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
                setPdfLib(pdfjsLib);
            } catch (err) {
                console.error('Failed to load pdf.js:', err);
                setError('Failed to load PDF library');
                setLoading(false);
            }
        };

        loadPdfJs();
    }, []);

    // Load PDF document after pdfjs is loaded
    useEffect(() => {
        if (!pdfLib || !pdfData) return;

        const loadPdf = async () => {
            try {
                setLoading(true);
                setError(null);

                let loadingTask;

                if (typeof pdfData === 'string') {
                    // Legacy base64 support (for local storage)
                    const base64Data = pdfData.includes(',') ? pdfData.split(',')[1] : pdfData;
                    // Binary string method is deprecated but we keep it for now for string inputs
                    const binaryData = atob(base64Data);
                    loadingTask = pdfLib.getDocument({ data: binaryData });
                } else {
                    // Modern Uint8Array support (for cloud storage)
                    // We need to clone it because pdfjs might detach the buffer
                    loadingTask = pdfLib.getDocument({ data: new Uint8Array(pdfData) });
                }

                const doc = await loadingTask.promise;

                setPdfDoc(doc);
                setNumPages(doc.numPages);
                setLoading(false);
            } catch (err: any) {
                console.error('Failed to load PDF:', err);
                setError(`Failed to load PDF document: ${err.message}`);
                setLoading(false);
            }
        };

        loadPdf();
    }, [pdfLib, pdfData]);

    // Store page text for anchoring
    const handlePageTextExtracted = useCallback((pageNumber: number, text: string) => {
        setPageTexts(prev => {
            const newMap = new Map(prev);
            newMap.set(pageNumber, text);
            return newMap;
        });
    }, []);

    if (loading) {
        return (
            <div className="pdf-loading">
                <span>Loading PDF...</span>
                <style jsx>{`
          .pdf-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            color: var(--text-muted);
            font-family: var(--font-reader);
          }
        `}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div className="pdf-error">
                <span>{error}</span>
                <style jsx>{`
          .pdf-error {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            color: var(--hl-question-solid);
            font-family: var(--font-reader);
          }
        `}</style>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="pdf-container">
            {pdfDoc && Array.from({ length: numPages }, (_, i) => (
                <PdfPage
                    key={i + 1}
                    pdfLib={pdfLib}
                    pdfDoc={pdfDoc}
                    pageNumber={i + 1}
                    scale={scale}
                    highlights={highlights.filter(
                        h => h.anchor.type === 'pdf' && (h.anchor as PdfAnchor).pageNumber === i + 1
                    )}
                    onHighlightClick={onHighlightClick}
                    onTextExtracted={handlePageTextExtracted}
                />
            ))}

            <style jsx>{`
        .pdf-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-lg);
        }
      `}</style>
        </div>
    );
}

interface PdfPageProps {
    pdfLib: any;
    pdfDoc: PDFDocumentProxy;
    pageNumber: number;
    scale: number;
    highlights: Highlight[];
    onHighlightClick: (highlight: Highlight) => void;
    onTextExtracted: (pageNumber: number, text: string) => void;
}

function PdfPage({
    pdfLib,
    pdfDoc,
    pageNumber,
    scale,
    highlights,
    onHighlightClick,
    onTextExtracted,
}: PdfPageProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const textLayerRef = useRef<HTMLDivElement>(null);
    const highlightLayerRef = useRef<HTMLDivElement>(null);
    const [rendered, setRendered] = useState(false);
    const [pageText, setPageText] = useState('');
    const [textSpans, setTextSpans] = useState<TextSpan[]>([]);

    useEffect(() => {
        const renderPage = async () => {
            if (!canvasRef.current || !textLayerRef.current) return;

            try {
                const page = await pdfDoc.getPage(pageNumber);
                const viewport = page.getViewport({ scale });

                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');

                if (!context) return;

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                // Render PDF page to canvas
                await page.render({
                    canvasContext: context,
                    viewport,
                    canvas,
                } as any).promise;

                // Get text content for selection and anchoring
                const textContent = await page.getTextContent();
                const textLayer = textLayerRef.current;

                // Clear existing text layer
                textLayer.innerHTML = '';
                textLayer.style.width = `${viewport.width}px`;
                textLayer.style.height = `${viewport.height}px`;

                // Use official renderTextLayer for correct selection behavior
                await pdfLib.renderTextLayer({
                    textContentSource: textContent,
                    container: textLayer,
                    viewport: viewport,
                    textDivs: []
                }).promise;

                // Build text metadata for highlighting system (separate from DOM)
                let fullText = '';
                const spans: TextSpan[] = [];

                textContent.items.forEach((item: any) => {
                    if ('str' in item && item.str) {
                        const tx = pdfLib.Util.transform(
                            viewport.transform,
                            item.transform
                        );

                        const fontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]);
                        const left = tx[4];
                        const top = tx[5] - fontSize;

                        // Store span info for highlight positioning
                        spans.push({
                            text: item.str,
                            left,
                            top,
                            width: item.width * scale,
                            height: fontSize,
                            fontSize,
                        });

                        fullText += item.str + ' ';
                    }
                });

                setPageText(fullText);
                setTextSpans(spans);
                onTextExtracted(pageNumber, fullText);
                setRendered(true);
            } catch (err) {
                console.error(`Failed to render page ${pageNumber}:`, err);
            }
        };

        renderPage();
    }, [pdfDoc, pdfLib, pageNumber, scale, onTextExtracted]);

    // Render highlights based on anchor data
    const renderHighlights = () => {
        if (!rendered) return null;

        return highlights.map((highlight) => {
            const anchor = highlight.anchor as PdfAnchor;

            // Find matching text spans for the highlight
            const rects = findHighlightRects(
                anchor.context,
                anchor.startOffset,
                anchor.endOffset,
                textSpans,
                pageText
            );

            if (rects.length === 0) return null;

            return rects.map((rect, i) => (
                <div
                    key={`${highlight.id}-${i}`}
                    className={`pdf-highlight ${highlight.type}`}
                    style={{
                        position: 'absolute',
                        left: `${rect.left}px`,
                        top: `${rect.top}px`,
                        width: `${rect.width}px`,
                        height: `${rect.height}px`,
                    }}
                    onClick={() => onHighlightClick(highlight)}
                />
            ));
        });
    };

    return (
        <div className="pdf-page" style={{ position: 'relative' }}>
            <canvas ref={canvasRef} style={{ display: 'block' }} />
            <div
                ref={textLayerRef}
                className="pdf-text-layer"
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    overflow: 'hidden',
                    opacity: 0.2,
                    lineHeight: 1,
                }}
            />
            <div
                ref={highlightLayerRef}
                className="pdf-highlight-layer"
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                }}
            >
                {renderHighlights()}
            </div>

            <style jsx>{`
        .pdf-page {
          background: white;
          box-shadow: var(--shadow-soft);
          position: relative;
        }

        .pdf-page :global(.pdf-text-layer span) {
          position: absolute;
          white-space: pre;
          color: transparent;
          pointer-events: all;
        }

        .pdf-page :global(.pdf-text-layer ::selection) {
          background: var(--hl-definition);
        }

        .pdf-page :global(.pdf-highlight) {
          pointer-events: auto;
          cursor: pointer;
          transition: opacity var(--transition-fast);
        }

        .pdf-page :global(.pdf-highlight:hover) {
          opacity: 0.6;
        }

        .pdf-page :global(.pdf-highlight.insight) {
          background: var(--hl-insight);
          border-radius: 4px;
        }

        .pdf-page :global(.pdf-highlight.definition) {
          background: var(--hl-definition);
          border-radius: 2px;
        }

        .pdf-page :global(.pdf-highlight.question) {
          background: var(--hl-question);
          border-radius: 2px;
        }
      `}</style>
        </div>
    );
}

/**
 * Find bounding rects for a highlight based on anchor data
 */
function findHighlightRects(
    context: string,
    startOffset: number,
    endOffset: number,
    textSpans: TextSpan[],
    pageText: string
): BoundingRect[] {
    // Try to find the context in the page text
    const contextCore = context.slice(10, -10); // Skip fuzzy edges
    const contextIndex = pageText.indexOf(contextCore);

    if (contextIndex === -1) {
        return []; // Context not found, suppress highlight
    }

    // Map character offsets to text spans
    const rects: BoundingRect[] = [];
    let currentOffset = 0;

    for (const span of textSpans) {
        const spanStart = currentOffset;
        const spanEnd = currentOffset + span.text.length;

        // Check if this span overlaps with the highlight range
        if (spanEnd > startOffset && spanStart < endOffset) {
            rects.push({
                left: span.left,
                top: span.top,
                width: span.width || 100, // Fallback width
                height: span.height,
            });
        }

        currentOffset = spanEnd + 1; // +1 for space
    }

    return rects;
}
