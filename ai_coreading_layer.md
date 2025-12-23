# AI Co‑Reading Layer — Strict Specification

> **Purpose**: Define a *controlled, non-intrusive AI layer* that augments thinking **after** reading actions.
>
> AI is a tool for *sense‑making*, not a narrator, tutor, or chatbot.
> If AI output risks interrupting reading flow, it is disallowed.

---

## 1. Foundational Principle

**AI is downstream of human intent.**

This means:
- AI is never proactive
- AI is never ambient
- AI is never always-on

AI only acts **after** the user has:
1. Selected text
2. Highlighted it
3. Optionally added a note

Highlights are the *contract*.

---

## 2. Explicit AI Roles (Only These)

AI is permitted to act in the following narrowly defined roles:

### 2.1 Clarifier
- Rephrase a highlighted passage in simpler language
- Preserve meaning, not tone

### 2.2 Assumption Extractor
- Identify implicit assumptions in a highlighted paragraph
- No moral judgement, no extrapolation

### 2.3 Question Generator
- Generate 2–4 discussion or reflection questions
- Questions must reference the highlighted text directly

### 2.4 Synthesizer (End-of-Document)
- Produce a synthesis *only from user highlights*
- Never use unhighlighted content

No other roles are allowed.

---

## 3. Explicitly Disallowed AI Behaviors

AI must never:
- Summarize the entire document by default
- Introduce new claims or facts
- Use rhetorical or motivational language
- Speculate beyond the highlighted text
- Address the user conversationally ("you should", "you might")

If a requested action violates these rules → **AI must refuse silently**.

---

## 4. AI Invocation Triggers

AI may be invoked only via:

- Context menu on a highlight
- Button inside MarginNotesPanel
- Explicit "Synthesize" action at document end

AI must **never** trigger:
- On scroll
- On page load
- On highlight creation

---

## 5. AI Input Contract

Every AI call must include:

```json
{
  "highlight_text": "string",
  "user_note": "string | null",
  "document_title": "string",
  "highlight_type": "insight | definition | question",
  "instruction": "explicit task"
}
```

No raw document text allowed.

---

## 6. Prompt Templates (Locked)

### 6.1 Clarify Highlight

**System Prompt**:
> You are a precise analytical assistant. You do not speculate, embellish, or persuade.

**User Prompt**:
> Clarify the following passage in simpler terms without changing its meaning:
>
> Passage: {{highlight_text}}
>
> User note (if any): {{user_note}}

---

### 6.2 Extract Assumptions

**System Prompt**:
> Identify implicit assumptions. Do not evaluate their truth or desirability.

**User Prompt**:
> List the implicit assumptions in the following passage:
>
> Passage: {{highlight_text}}

---

### 6.3 Generate Questions

**System Prompt**:
> Generate reflective questions grounded strictly in the provided text.

**User Prompt**:
> Generate 2–4 discussion questions based only on the following passage:
>
> Passage: {{highlight_text}}

---

### 6.4 Synthesize Highlights (Document-Level)

**System Prompt**:
> You synthesize ideas without introducing new information.

**User Prompt**:
> Using only the following highlights, produce a coherent synthesis of the document’s core ideas.
>
> Highlights:
> {{list_of_highlights}}

---

## 7. Output Constraints

AI responses must:
- Be concise
- Use neutral academic tone
- Avoid second-person address
- Avoid metaphors and flourish

Max lengths:
- Clarification: ≤ 120 words
- Assumptions: ≤ 6 bullets
- Questions: ≤ 4 items
- Synthesis: ≤ 300 words

---

## 8. UI Integration Rules

- AI output appears **only inside MarginNotesPanel**
- Never overlay reader text
- Never auto-scroll reader

UI must clearly indicate:
- This is AI-generated
- Which highlight it is tied to

No chat bubbles. No typing animations.

---

## 9. Failure & Uncertainty Handling

If AI is unsure or input is insufficient:
- Return: "Insufficient information in the selected text."
- Do not guess

If AI violates constraints:
- Suppress output
- Log internally

---

## 10. State & Persistence Rules

- AI outputs are ephemeral by default
- User may explicitly save output as a note
- Saved AI text is immutable unless deleted

---

## 11. Anti‑Hallucination Guardrails

- No chain-of-thought exposure
- No hidden reasoning
- No context expansion
- No cross-highlight inference unless user requests synthesis

---

## 12. Mental Model Check

AI is a **footnote generator**, not a co-author.

If AI ever feels like it is “leading” the reading — the design has failed.

