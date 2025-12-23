'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Highlight, HtmlAnchor, BoundingRect } from '@/lib/types';

interface HtmlRendererProps {
    htmlContent: string;
    highlights: Highlight[];
    onHighlightClick: (highlight: Highlight) => void;
}

export default function HtmlRenderer({
    htmlContent,
    highlights,
    onHighlightClick,
}: HtmlRendererProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const [highlightRects, setHighlightRects] = useState<Map<string, BoundingRect[]>>(new Map());

    // Calculate highlight positions after content renders
    useEffect(() => {
        if (!contentRef.current || highlights.length === 0) return;

        const newRects = new Map<string, BoundingRect[]>();

        highlights.forEach((highlight) => {
            if (highlight.anchor.type !== 'html') return;

            const rects = resolveHtmlHighlight(
                contentRef.current!,
                highlight.anchor as HtmlAnchor,
                highlight.text
            );

            if (rects.length > 0) {
                newRects.set(highlight.id, rects);
            }
        });

        setHighlightRects(newRects);
    }, [highlights, htmlContent]);

    // Re-calculate on resize
    useEffect(() => {
        const handleResize = debounce(() => {
            if (!contentRef.current || highlights.length === 0) return;

            const newRects = new Map<string, BoundingRect[]>();

            highlights.forEach((highlight) => {
                if (highlight.anchor.type !== 'html') return;

                const rects = resolveHtmlHighlight(
                    contentRef.current!,
                    highlight.anchor as HtmlAnchor,
                    highlight.text
                );

                if (rects.length > 0) {
                    newRects.set(highlight.id, rects);
                }
            });

            setHighlightRects(newRects);
        }, 250);

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [highlights, htmlContent]);

    return (
        <div className="html-renderer">
            {/* Highlight overlay layer */}
            <div className="html-highlight-layer">
                {Array.from(highlightRects.entries()).map(([highlightId, rects]) => {
                    const highlight = highlights.find(h => h.id === highlightId);
                    if (!highlight) return null;

                    return rects.map((rect, i) => (
                        <div
                            key={`${highlightId}-${i}`}
                            className={`html-highlight ${highlight.type}`}
                            style={{
                                position: 'absolute',
                                top: `${rect.top}px`,
                                left: `${rect.left}px`,
                                width: `${rect.width}px`,
                                height: `${rect.height}px`,
                            }}
                            onClick={() => onHighlightClick(highlight)}
                        />
                    ));
                })}
            </div>

            {/* Content layer */}
            <article
                ref={contentRef}
                className="html-content"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
            />

            <style jsx>{`
        .html-renderer {
          position: relative;
          max-width: var(--line-length-max);
          margin: 0 auto;
        }

        .html-highlight-layer {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: var(--z-highlight);
        }

        .html-highlight {
          pointer-events: auto;
          cursor: pointer;
          transition: opacity var(--transition-fast);
        }

        .html-highlight:hover {
          opacity: 0.6;
        }

        .html-highlight.insight {
          background: var(--hl-insight);
          border-radius: 4px;
        }

        .html-highlight.definition {
          background: var(--hl-definition);
          border-radius: 2px;
        }

        .html-highlight.question {
          background: var(--hl-question);
          border-radius: 2px;
        }

        .html-content {
          position: relative;
          z-index: var(--z-text);
          font-family: var(--font-reader);
          font-size: var(--font-size-base);
          line-height: var(--line-height-reader);
          color: var(--text-primary);
        }

        .html-content :global(h1),
        .html-content :global(h2),
        .html-content :global(h3),
        .html-content :global(h4),
        .html-content :global(h5),
        .html-content :global(h6) {
          font-family: var(--font-reader);
          color: var(--text-primary);
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          line-height: 1.3;
        }

        .html-content :global(h1) {
          font-size: 1.8em;
          font-weight: 600;
        }

        .html-content :global(h2) {
          font-size: 1.4em;
          font-weight: 500;
        }

        .html-content :global(h3) {
          font-size: 1.2em;
          font-weight: 500;
        }

        .html-content :global(p) {
          margin-bottom: 1.2em;
        }

        .html-content :global(a) {
          color: var(--hl-definition-solid);
          text-decoration: none;
        }

        .html-content :global(a:hover) {
          text-decoration: underline;
        }

        .html-content :global(blockquote) {
          margin: 1.5em 0;
          padding-left: 1em;
          border-left: 3px solid var(--border-color);
          color: var(--text-secondary);
          font-style: italic;
        }

        .html-content :global(code) {
          font-family: 'SF Mono', Monaco, monospace;
          font-size: 0.9em;
          background: var(--bg-secondary);
          padding: 0.1em 0.3em;
          border-radius: 3px;
        }

        .html-content :global(pre) {
          background: var(--bg-secondary);
          padding: 1em;
          border-radius: 6px;
          overflow-x: auto;
          margin: 1.5em 0;
        }

        .html-content :global(pre code) {
          background: none;
          padding: 0;
        }

        .html-content :global(img) {
          max-width: 100%;
          height: auto;
          border-radius: 6px;
          margin: 1em 0;
        }

        .html-content :global(ul),
        .html-content :global(ol) {
          margin: 1em 0;
          padding-left: 1.5em;
        }

        .html-content :global(li) {
          margin-bottom: 0.5em;
        }

        .html-content :global(hr) {
          border: none;
          border-top: 1px solid var(--border-color);
          margin: 2em 0;
        }

        .html-content :global(table) {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5em 0;
        }

        .html-content :global(th),
        .html-content :global(td) {
          padding: 0.75em;
          border: 1px solid var(--border-color);
          text-align: left;
        }

        .html-content :global(th) {
          background: var(--bg-secondary);
          font-weight: 500;
        }

        .html-content :global(::selection) {
          background: var(--hl-definition);
        }
      `}</style>
        </div>
    );
}

/**
 * Resolve HTML highlight anchor to bounding rects
 */
function resolveHtmlHighlight(
    container: HTMLElement,
    anchor: HtmlAnchor,
    expectedText: string
): BoundingRect[] {
    try {
        // Find the element using XPath
        const result = document.evaluate(
            anchor.xpath,
            container,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
        );

        const targetNode = result.singleNodeValue;
        if (!targetNode) return [];

        // Get text content
        const textContent = targetNode.textContent || '';

        // Verify context matches (fuzzy)
        const contextCore = anchor.context.slice(10, -10);
        if (!textContent.includes(contextCore)) {
            return []; // Context doesn't match, suppress highlight
        }

        // Create a range for the highlight
        const range = document.createRange();

        // Find the text node and offsets
        const walker = document.createTreeWalker(
            targetNode,
            NodeFilter.SHOW_TEXT,
            null
        );

        let currentOffset = 0;
        let startNode: Text | null = null;
        let endNode: Text | null = null;
        let startOffsetInNode = 0;
        let endOffsetInNode = 0;

        while (walker.nextNode()) {
            const textNode = walker.currentNode as Text;
            const nodeLength = textNode.length;

            // Check for start
            if (!startNode && currentOffset + nodeLength > anchor.startOffset) {
                startNode = textNode;
                startOffsetInNode = anchor.startOffset - currentOffset;
            }

            // Check for end
            if (startNode && currentOffset + nodeLength >= anchor.endOffset) {
                endNode = textNode;
                endOffsetInNode = anchor.endOffset - currentOffset;
                break;
            }

            currentOffset += nodeLength;
        }

        if (!startNode || !endNode) return [];

        // Set the range
        range.setStart(startNode, Math.min(startOffsetInNode, startNode.length));
        range.setEnd(endNode, Math.min(endOffsetInNode, endNode.length));

        // Get bounding rects
        const rects = range.getClientRects();
        const containerRect = container.getBoundingClientRect();

        const boundingRects: BoundingRect[] = [];
        for (let i = 0; i < rects.length; i++) {
            const rect = rects[i];
            boundingRects.push({
                top: rect.top - containerRect.top + container.scrollTop,
                left: rect.left - containerRect.left,
                width: rect.width,
                height: rect.height,
            });
        }

        return boundingRects;
    } catch (error) {
        console.error('Failed to resolve HTML highlight:', error);
        return [];
    }
}

/**
 * Simple debounce helper
 */
function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
