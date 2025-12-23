# Data Schema, Edge Cases & Export Layer — Final System Specification

> **Purpose**: This document completes the system by defining
> 1) durable data models,
> 2) explicit edge‑case behavior, and
> 3) clean export pathways.
>
> Together with previous docs, this forms a *closed system* with no undefined behavior.

---

## PART I — DATA SCHEMA & PERSISTENCE

### 1. Core Design Principles

- Data must outlive UI changes
- Anchors are first‑class citizens
- Reading artifacts > AI artifacts
- Everything should be exportable as plain text

No binary blobs. No opaque formats.

---

## 2. Database Tables (Logical Schema)

### 2.1 Document

```sql
Document {
  id TEXT PRIMARY KEY,
  title TEXT,
  source_type TEXT,        -- pdf | url
  source_path TEXT,        -- file path or URL
  created_at TIMESTAMP
}
```

---

### 2.2 Highlight

```sql
Highlight {
  id TEXT PRIMARY KEY,
  document_id TEXT,
  type TEXT,               -- insight | definition | question
  text TEXT,
  anchor JSON,
  created_at TIMESTAMP
}
```

Anchor stored as JSON exactly as defined earlier.

---

### 2.3 Note

```sql
Note {
  id TEXT PRIMARY KEY,
  highlight_id TEXT,
  content TEXT,
  created_at TIMESTAMP
}
```

Notes are immutable unless explicitly edited.

---

### 2.4 VocabularyEntry

```sql
VocabularyEntry {
  id TEXT PRIMARY KEY,
  word TEXT,
  context_sentence TEXT,
  document_id TEXT,
  user_note TEXT,
  created_at TIMESTAMP
}
```

---

### 2.5 AIOutput (Optional, Saved Only)

```sql
AIOutput {
  id TEXT PRIMARY KEY,
  highlight_id TEXT,
  type TEXT,               -- clarify | assumptions | questions | synthesis
  content TEXT,
  created_at TIMESTAMP
}
```

AI output is **never auto‑persisted**.

---

## 3. Data Lifecycle Rules

- Deleting a document cascades highlights, notes, vocab, AI outputs
- Deleting a highlight deletes:
  - Notes
  - AI outputs
- Vocabulary entries are independent (never auto‑deleted)

---

## PART II — EDGE CASES & FAILURE MODES

### 4. Multi‑Line & Cross‑Paragraph Highlights

Behavior:
- Each visual line renders its own shape
- All shapes map to a single Highlight ID

No merging across paragraphs.

---

### 5. Font Size / Line Height Changes

Rules:
- Anchors are re‑resolved
- Bounding boxes recalculated
- No persistence of pixel data

If re‑resolution fails → hide highlight

---

### 6. Window Resize / Orientation Change

- Debounced re‑render
- Never recompute anchors
- Only recompute geometry

---

### 7. PDF Zoom & Reflow

Rules:
- Zoom triggers bounding box recalculation
- Page number anchoring remains fixed
- No attempt to "relocate" text

If mismatch → suppress rendering

---

### 8. Overlapping Highlights

Allowed but constrained:
- Visual stacking via z‑index
- Shapes must not obscure text

No conflict resolution logic.

---

### 9. Corrupt or Unresolvable Anchors

Behavior:
- Highlight not rendered
- Highlight still visible in library
- No warning to user

Silence > incorrect rendering.

---

### 10. Mobile & Small Screens (Non‑Primary)

Rules:
- Margin panel becomes bottom sheet
- Reader pane remains primary
- Highlighting still supported

No mobile‑first optimization required.

---

## PART III — EXPORT & INTEROPERABILITY

### 11. Export Philosophy

Exports are:
- Human‑readable
- Plain text / Markdown
- Structured by thought, not layout

No proprietary formats.

---

## 12. Markdown Export — Highlights

### Structure

```md
# {{Document Title}}

## Highlights

### Insight
- "{{highlight_text}}"
  - Note: {{note_if_any}}

### Definition
- "{{highlight_text}}"

### Question
- "{{highlight_text}}"
```

---

## 13. Markdown Export — Vocabulary

```md
## Vocabulary

- **{{word}}**  
  Context: {{sentence}}  
  Note: {{user_note}}
```

---

## 14. Synthesis Export

Only user‑initiated.

```md
## Synthesis

{{AI_generated_text}}
```

AI text must be labeled clearly.

---

## 15. Obsidian / PKM Compatibility

Rules:
- One document → one markdown file
- Stable filenames
- No embeds

Optional:
- Tag highlights by type

---

## 16. Export Invocation

Export is:
- Explicit user action
- Never automatic
- Never background

---

## 17. Final Failure Rule

If exporting requires guessing structure → abort export.

Incorrect structure is worse than no export.

---

## 18. System Closure Statement

At this point:
- All data entities are defined
- All edge cases have deterministic outcomes
- All outputs are portable

This system is now *conceptually complete*.

