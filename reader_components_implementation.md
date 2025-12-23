# Reader Components — Concrete Implementation Guide (Next.js)

> **Purpose**: Provide implementation-ready structure and code-level guidance for the core reader system.
> This document is intentionally explicit to prevent Cursor from hallucinating abstractions.

---

## 1. File & Folder Structure (Minimal, Enforced)

```
/app
 ├─ layout.tsx
 ├─ page.tsx
 ├─ reader/
 │   ├─ page.tsx
 │   ├─ ReaderLayout.tsx
 │   ├─ ReaderPane.tsx
 │   ├─ DocumentRenderer.tsx
 │   ├─ HighlightLayer.tsx
 │   ├─ SelectionToolbar.tsx
 │   ├─ MarginNotesPanel.tsx
 │   └─ VocabularyInlineCard.tsx

/lib
 ├─ selection.ts
 ├─ anchoring.ts
 ├─ highlights.ts

/styles
 ├─ tokens.css
 └─ reader.css
```

Rules:
- No shared UI library
- No global state managers initially
- Use React context sparingly

---

## 2. ReaderLayout.tsx

### Responsibility
- Defines grid layout
- Handles margin toggle

```tsx
export function ReaderLayout({ children }) {
  return (
    <div className="reader-layout">
      <aside className="margin-notes" />
      <main className="reader-pane">{children}</main>
    </div>
  );
}
```

CSS handles proportions (70/30).

---

## 3. ReaderPane.tsx

### Responsibility
- Owns scroll container
- Listens to selection events

```tsx
export function ReaderPane({ document }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => handleSelection(ref.current);
    document.addEventListener('selectionchange', handler);
    return () => document.removeEventListener('selectionchange', handler);
  }, []);

  return (
    <div ref={ref} className="reader-pane">
      <DocumentRenderer document={document} />
      <HighlightLayer />
      <SelectionToolbar />
    </div>
  );
}
```

No highlight logic here.

---

## 4. DocumentRenderer.tsx

### Responsibility
- Render immutable content

```tsx
export function DocumentRenderer({ document }) {
  if (document.type === 'pdf') {
    return <PdfRenderer src={document.src} />;
  }

  return <HtmlRenderer html={document.html} />;
}
```

No mutation. No overlays.

---

## 5. SelectionToolbar.tsx

### Responsibility
- Show contextual toolbar
- Emit intent

```tsx
export function SelectionToolbar({ selection }) {
  if (!selection) return null;

  return (
    <div className="selection-toolbar" style={selection.position}>
      <button data-type="insight">◯</button>
      <button data-type="definition">▭</button>
      <button data-type="question">☐</button>
      <button data-type="word">+ Word</button>
    </div>
  );
}
```

Toolbar is ephemeral.

---

## 6. HighlightLayer.tsx

### Responsibility
- Render highlights only

```tsx
export function HighlightLayer({ highlights }) {
  return (
    <div className="highlight-layer">
      {highlights.map(h => (
        <HighlightShape key={h.id} highlight={h} />
      ))}
    </div>
  );
}
```

No selection logic.

---

## 7. HighlightShape.tsx

```tsx
function HighlightShape({ highlight }) {
  const rects = resolveAnchorToRects(highlight.anchor);

  return rects.map((r, i) => (
    <div
      key={i}
      className={`hl ${highlight.type}`}
      style={rectToStyle(r)}
    />
  ));
}
```

CSS controls shape appearance.

---

## 8. Anchoring Utilities (/lib/anchoring.ts)

```ts
export function createAnchor(range, type) {
  return type === 'pdf'
    ? createPdfAnchor(range)
    : createHtmlAnchor(range);
}

export function resolveAnchorToRects(anchor) {
  if (anchor.type === 'html') return resolveHtml(anchor);
  return resolvePdf(anchor);
}
```

No guessing logic allowed.

---

## 9. MarginNotesPanel.tsx

```tsx
export function MarginNotesPanel({ highlightId }) {
  if (!highlightId) return null;

  return (
    <aside className="margin-notes">
      <blockquote>{highlight.text}</blockquote>
      <textarea placeholder="Your note…" />
    </aside>
  );
}
```

Plain text only.

---

## 10. VocabularyInlineCard.tsx

```tsx
export function VocabularyInlineCard({ word }) {
  if (!word) return null;

  return (
    <div className="vocab-card">
      <strong>{word.term}</strong>
      <p>{word.definition}</p>
      <small>{word.context}</small>
    </div>
  );
}
```

Appears near margin.

---

## 11. State Management Rules

- Highlights stored as array
- Selected highlight ID stored separately
- Vocabulary entries stored independently

No Redux.
No Zustand initially.

---

## 12. CSS Enforcement

- All visuals must reference tokens
- No inline colors except positioning
- Highlight opacity fixed

---

## 13. Implementation Checklist

- [ ] Reader renders content
- [ ] Selection triggers toolbar
- [ ] Highlight persists & rehydrates
- [ ] Shapes render beneath text
- [ ] Margin notes load on click
- [ ] Vocabulary card inline

If all checked → Phase complete.

