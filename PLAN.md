# Co-Reader — Master Implementation Plan

> **A private intellectual workspace where reading turns into structured thought.**

---

## 📋 Project Summary

Build a **personal co-reading and sense-making application** inspired by Kindle-like reading experiences, augmented with active thinking tools. This is editorial software, not a dashboard — the UI should disappear into the reading experience.

### Core Philosophy (Non-Negotiable)
1. **Reader first, AI second** — Reading flow must never be interrupted
2. **Marking > Summarizing** — Highlights and annotations are the source of truth
3. **Local, simple, durable** — Prefer local storage, avoid over-engineering
4. **Thinking artifacts > content consumption** — Highlights, notes, vocabulary are the real outputs

---

## 🏗️ Technical Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js (App Router), React |
| Styling | CSS Modules with Design Tokens |
| PDF Rendering | pdf.js |
| Text Selection | Native Selection API |
| Backend | Next.js API Routes |
| Database | SQLite (local-first) |
| Auth | Single user (minimal) |

---

## 📁 Project Structure

```
/app
 ├─ layout.tsx
 ├─ page.tsx                      # Homepage / Library
 ├─ reader/
 │   ├─ page.tsx                  # Reader entry
 │   ├─ ReaderLayout.tsx          # Grid layout (70/30)
 │   ├─ ReaderPane.tsx            # Scroll container + selection
 │   ├─ DocumentRenderer.tsx      # Immutable content render
 │   ├─ HighlightLayer.tsx        # Pure overlay render
 │   ├─ SelectionToolbar.tsx      # Floating contextual toolbar
 │   ├─ MarginNotesPanel.tsx      # Collapsible side panel
 │   └─ VocabularyInlineCard.tsx  # Inline word card
 ├─ library/
 │   └─ page.tsx                  # Highlights Library view

/lib
 ├─ selection.ts                  # Selection utilities
 ├─ anchoring.ts                  # Anchor creation/resolution
 ├─ highlights.ts                 # Highlight CRUD operations
 ├─ vocabulary.ts                 # Vocabulary management
 └─ ai.ts                         # AI prompt templates & calls

/styles
 ├─ tokens.css                    # Design tokens
 └─ reader.css                    # Reader-specific styles
```

---

## 🎨 Design System

### Layout Grid
```
┌───────────────────────────────────────────────┐
│ Top Bar (auto-hide, height ≤ 48px)            │
├───────────────┬───────────────────────────────┤
│ Margin Notes  │        Reader Pane            │
│ (20–30%)      │        (70–80%)               │
│ collapsible   │        primary surface        │
└───────────────┴───────────────────────────────┘
```

### Typography
- **Font**: Literata → Charter → Georgia → serif
- **Body size**: 17–19px (user adjustable)
- **Line height**: 1.6–1.8
- **Line length**: 60–70 characters

### Color Themes
| Element | Light | Dark |
|---------|-------|------|
| Background | `#FBF6F3` | `#121212` |
| Text | `#1A1A1A` | `#EDEDED` |

### Highlight Colors (10–18% opacity)
| Type | Token | Shape |
|------|-------|-------|
| Insight | `--hl-insight: rgba(255, 214, 102, 0.14)` | Soft oval underline |
| Definition | `--hl-definition: rgba(102, 170, 255, 0.14)` | Thin rectangular underline |
| Question | `--hl-question: rgba(255, 120, 120, 0.14)` | Broken/angled underline |

---

## 📊 Data Schema

### Document
```sql
Document {
  id TEXT PRIMARY KEY,
  title TEXT,
  source_type TEXT,        -- pdf | url
  source_path TEXT,        -- file path or URL
  created_at TIMESTAMP
}
```

### Highlight
```sql
Highlight {
  id TEXT PRIMARY KEY,
  document_id TEXT,
  type TEXT,               -- insight | definition | question
  text TEXT,
  anchor JSON,             -- { type, startOffset, endOffset, context, pageNumber?, xpath? }
  created_at TIMESTAMP
}
```

### Note
```sql
Note {
  id TEXT PRIMARY KEY,
  highlight_id TEXT,
  content TEXT,
  created_at TIMESTAMP
}
```

### VocabularyEntry
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

### AIOutput (Optional, User-Saved Only)
```sql
AIOutput {
  id TEXT PRIMARY KEY,
  highlight_id TEXT,
  type TEXT,               -- clarify | assumptions | questions | synthesis
  content TEXT,
  created_at TIMESTAMP
}
```

---

## 🔧 Build Phases

### Phase 1 — Reading Works ✅
> **Goal**: Upload PDF, render content, basic reader UI

- [x] Project setup (Next.js App Router)
- [x] Design tokens CSS (`tokens.css`)
- [x] `ReaderLayout.tsx` with 70/30 grid
- [x] `TopBar.tsx` (title, theme toggle, margin toggle)
- [x] PDF upload functionality
- [x] `DocumentRenderer.tsx` with pdf.js integration
- [x] Basic scroll/paginated mode toggle
- [x] Theme switching (light/dark)
- [x] Font size adjustment

**Exit Criteria**: Can upload and read a PDF with adjustable settings. ✅

---

### Phase 2 — Marking Works ✅
> **Goal**: Text selection, highlight persistence, highlight rendering

- [x] `SelectionToolbar.tsx` (floating, ephemeral)
- [x] Selection event handling in `ReaderPane.tsx`
- [x] Anchor creation logic (`/lib/anchoring.ts`)
  - [x] PDF: page number + character offsets
  - [x] HTML: XPath + offsets + context
- [x] Highlight storage (localStorage for MVP)
- [x] `HighlightLayer.tsx` (pure overlay)
- [x] Highlight shape rendering in PdfRenderer
- [x] Anchor resolution on page load
- [x] Scroll/resize recalculation (debounced)

**Exit Criteria**: Can create highlights that persist and re-render accurately on reload. ✅

---

### Phase 3 — Thinking Works ✅
> **Goal**: Notes on highlights, Highlights Library view

- [x] `MarginNotesPanel.tsx` (collapsible)
- [x] Note attachment to highlights
- [x] Highlight click → open margin panel
- [x] Highlights Library page (`/library`)
  - [x] List all highlights
  - [x] Filter by document
  - [x] Filter by color/type
  - [x] Click to jump to context
- [x] URL article support (fetch + render)
  - [x] API route for fetching articles
  - [x] Article storage utilities
  - [x] HtmlRenderer component

**Exit Criteria**: Full annotation workflow and library for revisiting ideas. ✅

---

### Phase 4 — Intelligence Layer ✅
> **Goal**: Vocabulary system, controlled AI features

#### 4a — Vocabulary System ✅
- [x] Single-word detection in toolbar (shows "Add to Vocabulary" for 1-3 words)
- [x] `VocabularyCard.tsx` (inline vocabulary card with definition)
- [x] Vocabulary storage (`/lib/vocabulary.ts`)
- [x] Vocabulary Library page (`/vocabulary`)
- [x] Optional definition lookup (Free Dictionary API)
- [x] CSV export for vocabulary

#### 4b — AI Co-Reader (Strictly Controlled) ✅
- [x] AI invocation triggers (from margin panel per-highlight)
- [x] **Clarifier**: Rephrase highlighted passage
- [x] **Assumption Extractor**: Identify implicit assumptions
- [x] **Question Generator**: 2–4 discussion questions
- [x] Prompt templates (locked, no chain-of-thought)
- [x] AI output in MarginNotesPanel only
- [x] Optional save as note
- [ ] **Synthesizer**: Document-level synthesis from highlights (future)
- [ ] OpenAI API integration (requires user API key)

**Exit Criteria**: Vocabulary grows organically. AI augments thinking without interrupting reading. ✅

---

### Phase 5 — Export & Polish
> **Goal**: Durability, edge cases, portability

- [ ] Markdown export (highlights grouped by type)
- [ ] Vocabulary export
- [ ] Synthesis export (labeled as AI-generated)
- [ ] Obsidian/PKM compatibility (one doc = one file)
- [ ] Edge case handling:
  - Multi-line highlights → multiple shapes, single ID
  - Font/zoom changes → recalculate geometry
  - Corrupt anchors → graceful hide
  - Overlapping highlights → z-index stacking

**Exit Criteria**: All data portable. All edge cases deterministic.

---

## 🚦 Success Criteria

| Metric | What It Means |
|--------|---------------|
| Frictionless reading | Can read for 30 min and forget this is software |
| Effortless highlights | Selection → highlight in <2 clicks |
| Fast idea revisiting | Highlights Library faster than re-reading |
| Thinking habit | App becomes daily intellectual tool |

---

## ⛔ Explicit Non-Goals

- ❌ EPUB / MOBI / DOCX support
- ❌ Audio / video content
- ❌ Collaborative reading
- ❌ Rich text editor in notes
- ❌ Automatic AI summaries
- ❌ Chat-style AI interface
- ❌ Cards, chat bubbles, persistent toolbars
- ❌ Animations, emojis, multiple fonts
- ❌ Mobile-first optimization

---

## 🛡️ Anti-Hallucination Rules

1. **Never auto-create highlights**
2. **Never infer anchors**
3. **Never modify document text**
4. **Never render if confidence < 100%**
5. **If uncertain → do nothing**
6. **AI output never interrupts reading flow**
7. **AI only acts after user has highlighted + optionally noted**

---

## 📝 Final Reminder

> This is **not** a startup, SaaS product, or social platform.
> 
> This is a **private intellectual gym**.
> 
> Build for clarity, durability, and thought — nothing else.
