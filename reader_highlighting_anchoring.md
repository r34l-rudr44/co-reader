# Reader Pane, Highlight Layer & Anchoring — Technical Specification

> **Purpose**: This document defines *exact interaction logic*, *rendering flow*, and *anchoring strategy* for text selection, highlights, and notes.
>
> This exists to eliminate ambiguity, prevent UI hallucinations, and keep logic deterministic.

---

## 1. Core Architectural Principle

**Reading content is immutable.**  
Highlights and notes are rendered as an *overlay layer*, never by mutating source text.

This applies to **both PDF and HTML**.

---

## 2. Component Responsibilities (Strict)

### `<ReaderPane>`
- Hosts rendered content (PDF or HTML)
- Owns scroll container
- Emits selection events

### `<DocumentRenderer>`
- Renders raw content
- No highlight logic
- No state mutation

### `<HighlightLayer>`
- Pure render layer
- Receives highlight data
- Paints shapes based on anchor positions

### `<SelectionToolbar>`
- Appears contextually
- Emits user intent (highlight type / add word)

---

## 3. Text Selection Flow (End-to-End)

### 3.1 Event Sequence

```
User selects text
    ↓
Browser fires selectionchange
    ↓
ReaderPane validates selection
    ↓
SelectionToolbar rendered near range
```

### 3.2 Selection Validation Rules

Accept selection only if:
- Selection length > 0
- Selection is within ReaderPane bounds
- Selection is not already inside a toolbar or margin panel

Reject otherwise.

---

## 4. Highlight Creation — Pseudocode

```ts
onTextSelection(range) {
  if (!isValid(range)) return;

  showSelectionToolbar(range.getBoundingClientRect());
}

onHighlightSelect(type) {
  const anchor = createAnchor(range);

  saveHighlight({
    documentId,
    type,
    text: range.toString(),
    anchor,
    createdAt: now()
  });

  clearSelection();
}
```

No highlight is created without explicit user action.

---

## 5. Highlight Rendering Pipeline

### 5.1 Render Rules

- Rendering is **pure**
- Highlights never alter underlying DOM/text
- HighlightLayer recalculates positions on:
  - Scroll
  - Resize
  - Font size change

---

### 5.2 Rendering Algorithm

```
for each highlight:
  resolve anchor → bounding boxes
  for each box:
    draw shape beneath text
```

Shapes are **CSS-based overlays**, not canvas.

---

## 6. Anchor Data Model (Unified)

```ts
Anchor {
  type: 'pdf' | 'html'
  startOffset: number
  endOffset: number
  context: string

  // PDF only
  pageNumber?: number

  // HTML only
  xpath?: string
}
```

Offsets always refer to **text-node character positions**, never DOM indices.

---

## 7. HTML Anchoring Strategy (Web Articles)

### 7.1 Anchor Creation

Steps:
1. Capture selection Range
2. Identify nearest stable container element
3. Generate XPath for container
4. Record:
   - XPath
   - Start offset
   - End offset
   - Context snippet (±30 chars)

```ts
createHtmlAnchor(range) {
  return {
    type: 'html',
    xpath: getXPath(range.startContainer),
    startOffset: range.startOffset,
    endOffset: range.endOffset,
    context: extractContext(range)
  };
}
```

---

### 7.2 Anchor Resolution (Rehydration)

```
node = resolveXPath(anchor.xpath)
if node.text includes context:
  apply offsets
else:
  attempt fuzzy match using context
```

Rules:
- Never guess silently
- If resolution fails → hide highlight gracefully

---

## 8. PDF Anchoring Strategy

### 8.1 Constraints

- PDF text is page-based
- Layout may change with zoom
- Text nodes are fragmented

Therefore: **page-scoped anchoring is mandatory**.

---

### 8.2 Anchor Creation (PDF)

Steps:
1. Determine page number
2. Extract concatenated text stream for page
3. Map selection offsets into page text
4. Save:
   - Page number
   - Start offset
   - End offset
   - Context snippet

```ts
createPdfAnchor(selection) {
  return {
    type: 'pdf',
    pageNumber: selection.page,
    startOffset,
    endOffset,
    context
  };
}
```

---

### 8.3 Anchor Resolution (PDF)

```
load page text
if context matches expected window:
  compute bounding boxes
else:
  suppress highlight
```

No attempt to relocate across pages.

---

## 9. Bounding Box Calculation

### HTML
- Use `Range.getClientRects()`
- Normalize to ReaderPane coordinates

### PDF
- Use pdf.js text item positioning
- Map text spans → viewport coordinates

All shapes render **beneath text layer**.

---

## 10. Shape Rendering Logic

Each highlight type maps to a shape function:

```ts
renderHighlight(type, rect) {
  switch(type) {
    case 'insight': return ovalUnderline(rect)
    case 'definition': return rectUnderline(rect)
    case 'question': return brokenUnderline(rect)
  }
}
```

Opacity fixed via CSS tokens.

---

## 11. Scroll & Resize Handling

- HighlightLayer listens to:
  - scroll
  - resize
  - font size changes

Debounce recalculation.

Never store pixel positions persistently.

---

## 12. Margin Notes Interaction

- Clicking highlight emits highlightId
- MarginNotesPanel loads note for highlightId
- No bi-directional mutation

---

## 13. Failure Modes (Handled Explicitly)

| Case | Behavior |
|----|---------|
| Anchor cannot resolve | Hide highlight |
| Context mismatch | Suppress rendering |
| PDF text reflow | Recalculate on zoom |

No console spam.
No UI alerts.

---

## 14. Anti-Hallucination Rules

- Never auto-create highlights
- Never infer anchors
- Never modify document text
- Never render if confidence < 100%

If uncertain → **do nothing**.

---

## 15. Mental Model Check

Highlights are **coordinates + intent**, not decorations.

If this invariant breaks, the system becomes fragile.

