// Anchoring Utilities
// Anchor creation and resolution for PDF and HTML

import { Anchor, PdfAnchor, HtmlAnchor, BoundingRect } from './types';
import { extractContext } from './selection';

// ============================================
// XPath Utilities
// ============================================

/**
 * Generate XPath for a node
 */
export function getXPath(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentNode!;
    }

    const parts: string[] = [];
    let current: Node | null = node;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
        let index = 1;
        let sibling = current.previousSibling;

        while (sibling) {
            if (sibling.nodeType === Node.ELEMENT_NODE &&
                sibling.nodeName === current.nodeName) {
                index++;
            }
            sibling = sibling.previousSibling;
        }

        const tagName = (current as Element).tagName.toLowerCase();
        parts.unshift(`${tagName}[${index}]`);
        current = current.parentNode;
    }

    return '/' + parts.join('/');
}

/**
 * Resolve XPath to a node
 */
export function resolveXPath(xpath: string, document: Document): Node | null {
    try {
        const result = document.evaluate(
            xpath,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
        );
        return result.singleNodeValue;
    } catch {
        return null;
    }
}

// ============================================
// HTML Anchor Creation/Resolution
// ============================================

/**
 * Create HTML anchor from selection range
 */
export function createHtmlAnchor(range: Range): HtmlAnchor {
    const container = range.startContainer;
    const xpath = getXPath(container);
    const context = extractContext(range);

    return {
        type: 'html',
        xpath,
        startOffset: range.startOffset,
        endOffset: range.endOffset,
        context,
    };
}

/**
 * Resolve HTML anchor to bounding rects
 */
export function resolveHtmlAnchor(
    anchor: HtmlAnchor,
    doc: Document
): BoundingRect[] | null {
    const node = resolveXPath(anchor.xpath, doc);
    if (!node) return null;

    // Find the text node
    let textNode: Text | null = null;
    if (node.nodeType === Node.TEXT_NODE) {
        textNode = node as Text;
    } else if (node.firstChild?.nodeType === Node.TEXT_NODE) {
        textNode = node.firstChild as Text;
    }

    if (!textNode) return null;

    // Verify context matches
    const nodeText = textNode.textContent || '';
    if (!nodeText.includes(anchor.context.slice(10, -10))) {
        // Context mismatch - suppress rendering
        return null;
    }

    // Create range and get rects
    const range = doc.createRange();
    try {
        range.setStart(textNode, anchor.startOffset);
        range.setEnd(textNode, anchor.endOffset);
    } catch {
        return null;
    }

    const clientRects = range.getClientRects();
    const rects: BoundingRect[] = [];

    for (let i = 0; i < clientRects.length; i++) {
        const rect = clientRects[i];
        rects.push({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
        });
    }

    return rects.length > 0 ? rects : null;
}

// ============================================
// PDF Anchor Creation/Resolution
// ============================================

/**
 * Create PDF anchor from selection
 */
export function createPdfAnchor(
    pageNumber: number,
    startOffset: number,
    endOffset: number,
    context: string
): PdfAnchor {
    return {
        type: 'pdf',
        pageNumber,
        startOffset,
        endOffset,
        context,
    };
}

/**
 * Resolve PDF anchor to bounding rects
 * This requires the PDF text layer to be rendered
 */
export function resolvePdfAnchor(
    anchor: PdfAnchor,
    pageTextContent: string,
    textLayerElement: HTMLElement | null
): BoundingRect[] | null {
    if (!textLayerElement) return null;

    // Verify context matches
    const contextCore = anchor.context.slice(10, -10);
    if (!pageTextContent.includes(contextCore)) {
        return null; // Context mismatch
    }

    // Find the corresponding text spans in the text layer
    const spans = textLayerElement.querySelectorAll('span');
    const rects: BoundingRect[] = [];

    let currentOffset = 0;
    for (const span of spans) {
        const spanText = span.textContent || '';
        const spanStart = currentOffset;
        const spanEnd = currentOffset + spanText.length;

        // Check if this span overlaps with our anchor
        if (spanEnd > anchor.startOffset && spanStart < anchor.endOffset) {
            const rect = span.getBoundingClientRect();
            rects.push({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
            });
        }

        currentOffset = spanEnd;
    }

    return rects.length > 0 ? rects : null;
}

// ============================================
// Unified Anchor API
// ============================================

/**
 * Create anchor based on document type
 */
export function createAnchor(
    range: Range,
    type: 'html'
): HtmlAnchor;
export function createAnchor(
    range: Range,
    type: 'pdf',
    pageNumber: number,
    pageText: string
): PdfAnchor;
export function createAnchor(
    range: Range,
    type: 'html' | 'pdf',
    pageNumber?: number,
    pageText?: string
): Anchor {
    if (type === 'html') {
        return createHtmlAnchor(range);
    }

    // For PDF, we need to map the selection to the page text stream
    const selectedText = range.toString();
    const context = extractContext(range);

    // Find offsets in page text
    const startOffset = pageText!.indexOf(selectedText);
    const endOffset = startOffset + selectedText.length;

    return createPdfAnchor(pageNumber!, startOffset, endOffset, context);
}

/**
 * Resolve anchor to bounding rects
 */
export function resolveAnchorToRects(
    anchor: Anchor,
    doc: Document,
    pdfContext?: {
        pageTextContent: string;
        textLayerElement: HTMLElement | null;
    }
): BoundingRect[] | null {
    if (anchor.type === 'html') {
        return resolveHtmlAnchor(anchor, doc);
    }

    if (!pdfContext) return null;

    return resolvePdfAnchor(
        anchor,
        pdfContext.pageTextContent,
        pdfContext.textLayerElement
    );
}

/**
 * Normalize rects relative to a container
 */
export function normalizeRectsToContainer(
    rects: BoundingRect[],
    container: HTMLElement
): BoundingRect[] {
    const containerRect = container.getBoundingClientRect();
    const scrollTop = container.scrollTop;
    const scrollLeft = container.scrollLeft;

    return rects.map(rect => ({
        top: rect.top - containerRect.top + scrollTop,
        left: rect.left - containerRect.left + scrollLeft,
        width: rect.width,
        height: rect.height,
    }));
}
