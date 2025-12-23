# Co‑Reading Mini Project — Context & Build Guide

## 1. Project Overview

This is a **personal co‑reading and sense‑making application**, inspired by Kindle‑like reading experiences but augmented with **active thinking tools**.

The goal is **not scale, monetization, or multi‑user complexity**.
The goal **is productivity, deep reading, and long‑term intellectual leverage**.

Think of this app as:
> *A private intellectual workspace where reading turns into structured thought.*

---

## 2. Core Philosophy (Non‑Negotiable Principles)

These principles should guide **every technical and UX decision**.

1. **Reader first, AI second**
   - Reading flow must never be interrupted
   - AI is invoked *only* on explicit user action

2. **Marking > Summarizing**
   - Highlights and annotations are the source of truth
   - No blind auto‑summaries of entire documents

3. **Local, simple, durable**
   - Prefer local storage or minimal backend
   - Avoid premature abstraction or over‑engineering

4. **Thinking artifacts > content consumption**
   - Highlights, notes, vocabulary, and synthesis are the real outputs

---

## 3. Supported Content Types (Initial Scope)

### In‑Scope (MVP)
- PDF uploads
- Web articles via URL (Substack, blogs, essays)

### Explicitly Out‑of‑Scope (for now)
- EPUB / MOBI
- DOCX
- Audio / video
- Collaborative reading

---

## 4. Core User Flows

### 4.1 Add a Document

User can:
- Upload a PDF file
- Paste a URL to a public article

System actions:
- Store document metadata
- Convert content into renderable format
- Assign unique `document_id`

---

### 4.2 Read a Document

Reader features:
- Scroll or paginated mode (toggle)
- Adjustable:
  - Font size
  - Line height
  - Theme (light / sepia / dark)
- Reading progress indicator

Non‑goals:
- Pixel‑perfect Kindle replication
- Fancy page‑flip animations

---

### 4.3 Highlight & Annotate

User can:
- Select text
- Apply highlight color:
  - Yellow → Insight
  - Blue → Definition
  - Red → Disagreement / Question
- Attach an optional note

System must:
- Persist highlights reliably across reloads
- Re‑render highlights accurately

Anchoring strategy:
- PDFs → page number + character offsets
- HTML → DOM path (XPath or equivalent) + offset

---

### 4.4 Highlights Library

A separate view that:
- Lists all highlights
- Allows filtering by:
  - Document
  - Color
- Clicking a highlight jumps back to its context

This view is **critical** — it converts reading into thinking.

---

## 5. Vocabulary System (Phase 2 Feature)

When a **single word** is selected:
- User can save it to Vocabulary
- System stores:
  - Word
  - Source sentence
  - Document reference
  - Optional user note

Optional enrichments:
- Definition (via API or static dictionary)
- Tags (philosophy, AI, economics, etc.)

Long‑term value:
- Builds a personal lexicon
- Enables cross‑document concept recall

---

## 6. AI Co‑Reader (Strictly Controlled)

AI is **not a chatbot by default**.
It acts as a **silent assistant**, invoked contextually.

Allowed AI actions:
- Explain a highlighted sentence in simpler terms
- Identify assumptions in a paragraph
- Generate discussion questions from selected highlights
- Create end‑of‑document synthesis *only from user highlights*

Disallowed behaviors:
- Automatic popups
- Whole‑document summaries without highlights
- Creative rewriting of the source text

AI prompts must always reference:
- Highlighted text
- User notes (if present)

---

## 7. Data Model (Conceptual)

### Document
- id
- title
- source_type (pdf | url)
- source_path / url
- created_at

### Highlight
- id
- document_id
- color
- text
- anchor_data
- created_at

### Note
- id
- highlight_id
- content
- created_at

### VocabularyEntry
- id
- word
- context_sentence
- document_id
- note (optional)

---

## 8. Technical Stack (Recommended)

### Frontend
- Next.js (App Router)
- React
- Tailwind CSS or CSS Modules
- PDF rendering via `pdf.js`
- Native Selection API for text selection

### Backend
- Next.js API routes or FastAPI
- SQLite or Postgres
- Minimal authentication (single user)

### Storage Philosophy
- Start simple
- JSON‑friendly schemas
- Avoid over‑normalization

---

## 9. Build Phases (Strict Order)

### Phase 1 — Reading Works
- Upload PDF
- Render content
- Basic reader UI

### Phase 2 — Marking Works
- Text selection
- Highlight persistence
- Highlight rendering on reload

### Phase 3 — Thinking Works
- Notes on highlights
- Highlights library

### Phase 4 — Intelligence Layer
- Vocabulary system
- AI explanations & synthesis

Skipping phases increases failure risk.

---

## 10. Success Criteria

This project is successful if:
- Reading feels frictionless
- Highlights are effortless
- Revisiting ideas is faster than re‑reading
- The app becomes a *thinking habit*, not a novelty

---

## 11. Final Reminder (Read This When Over‑Engineering)

This is not:
- A startup
- A SaaS product
- A social platform

This is:
> **A private intellectual gym.**

Build for clarity, durability, and thought — nothing else.

