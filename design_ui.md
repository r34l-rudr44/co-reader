# Co‑Reading App — Design & UI Instructions

> **Purpose**: This document is a *single source of truth* for UI, UX, interaction logic, and visual design.  
> Cursor / AI assistants must follow this strictly.  
> If a choice is ambiguous, **default to minimalism and removal**.

---

## 1. Design Intent (Lock This In)

- The UI must **disappear into the reading experience**
- Text is the primary interface
- All controls are **contextual, transient, and quiet**
- The user should feel like they are *marking a physical book*, not using software

This is **editorial software**, not a dashboard.

---

## 2. Layout Specification

### 2.1 Global Layout Grid

```
┌───────────────────────────────────────────────┐
│ Top Bar (auto‑hide, height ≤ 48px)             │
├───────────────┬───────────────────────────────┤
│ Margin Notes  │        Reader Pane             │
│ (20–30%)      │        (70–80%)                │
│ collapsible   │        primary surface         │
└───────────────┴───────────────────────────────┘
```

Rules:
- Reader pane is always the visual center
- Margin notes collapse entirely when unused
- No right sidebar
- No bottom panels

---

## 3. Reader Pane (Primary Surface)

### 3.1 Typography

**Font (serif, one only):**
- Preferred: Literata
- Fallbacks: Charter, Georgia, serif

**Font sizes:**
- Body: 17–19px (user adjustable)
- Line height: 1.6–1.8
- Line length: 60–70 characters

No bold paragraphs. Emphasis only via italics or highlights.

---

### 3.2 Backgrounds & Themes

#### Light Mode
- Background: `#FBF6F3`
- Text: `#1A1A1A`

#### Dark Mode
- Background: `#121212`
- Text: `#EDEDED`

Rules:
- Never pure white or pure black
- No gradients
- No textures

---

## 4. Highlighting System (Core Interaction)

### 4.1 Text Selection Behavior

- Native text selection only
- On selection end → show floating toolbar near selection
- Toolbar disappears on:
  - Click elsewhere
  - Scroll
  - Selection clear

No persistent highlight toolbar.

---

### 4.2 Highlight Toolbar (Floating)

```
[ ◯ ]  [ ▭ ]  [ ☐ ]   |   [+ Word]
```

**No text labels. Shapes only.**

| Shape | Meaning | Color Token |
|------|--------|------------|
| ◯ | Insight | `--hl‑insight` |
| ▭ | Definition | `--hl‑definition` |
| ☐ | Question / Disagreement | `--hl‑question` |

---

### 4.3 Shape‑Based Highlight Rendering

Highlights must NOT be rectangular blocks.

Rules:
- Render as underline‑anchored shapes
- Opacity: **10–18% max**
- Text remains fully readable

Examples:
- Insight → soft oval underline
- Definition → thin rectangular underline
- Question → broken / angled underline

---

## 5. Margin Notes Panel

### 5.1 Behavior

- Opens only when:
  - Clicking a highlight
  - Adding a note
- Collapses automatically otherwise

### 5.2 Content Structure

- Highlighted text (quoted, muted)
- User note (plain text)

No rich text editor.
No markdown.

### 5.3 Visual Rules

- Same background family as reader
- Slight contrast shift only
- Single thin vertical divider
- No cards, no boxes

---

## 6. Vocabulary Feature (Dynamic, Inline)

### 6.1 Interaction

- Only enabled for **single‑word selection**
- Triggered via `+ Word` in toolbar

### 6.2 Inline Vocabulary Card

Appears near margin, not center.

Contains:
- Word
- One‑line definition
- Context sentence
- Optional user note

Rules:
- No modal
- No navigation
- Saves silently

Vocabulary grows organically.

---

## 7. Top Bar (Almost Invisible)

### Contents (Only These)
- Document title
- Light/Dark toggle
- Margin toggle

Rules:
- Height ≤ 48px
- Auto‑hide on scroll
- Reappear on cursor movement

No icons beyond essentials.

---

## 8. Dark / Light Mode Rules

- System preference by default
- Manual toggle allowed
- No layout shift on toggle

### Highlight Adjustments
- Dark mode highlights slightly more saturated
- Maintain WCAG AA contrast

---

## 9. CSS Design Tokens

```css
:root {
  /* Typography */
  --font‑reader: 'Literata', 'Charter', 'Georgia', serif;

  /* Backgrounds */
  --bg‑light: #FBF6F3;
  --bg‑dark: #121212;

  /* Text */
  --text‑light: #1A1A1A;
  --text‑dark: #EDEDED;

  /* Highlights */
  --hl‑insight: rgba(255, 214, 102, 0.14);
  --hl‑definition: rgba(102, 170, 255, 0.14);
  --hl‑question: rgba(255, 120, 120, 0.14);

  /* UI */
  --divider: rgba(0,0,0,0.08);
}
```

---

## 10. Component Tree (Strict)

```
<App>
 ├─ <ThemeProvider>
 ├─ <TopBar />
 ├─ <ReaderLayout>
 │   ├─ <MarginNotesPanel />
 │   └─ <ReaderPane>
 │       ├─ <DocumentRenderer />
 │       ├─ <HighlightLayer />
 │       └─ <SelectionToolbar />
 └─ <VocabularyInlineCard />
```

Rules:
- No global state explosion
- Highlights stored separately from rendering
- Vocabulary card mounts conditionally

---

## 11. Interaction Logic (Anti‑Hallucination)

### Highlight Creation
1. User selects text
2. Toolbar appears
3. User chooses shape
4. Store:
   - Text
   - Anchor data
   - Color type

### Highlight Rendering
- Rendering logic must be **pure**
- No mutation of source text

### Anchor Strategy
- PDF: page + character offsets
- HTML: DOM path + offsets

---

## 12. Dark Mode Contrast Audit (Rules)

- Text contrast ≥ 4.5:1
- Highlight overlay never reduces readability
- Divider lines barely visible

---

## 13. Explicit Non‑Goals (Do Not Add)

- ❌ Cards
- ❌ Chat bubbles
- ❌ Persistent toolbars
- ❌ Animations
- ❌ Emojis
- ❌ Multiple fonts

If unsure → **remove**.

---

## 14. Final UX Test

The UI passes if:

> “I can read for 30 minutes and forget this is software.”

If not — simplify.

