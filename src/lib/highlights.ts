// Highlights Storage and Management
// Local storage based for MVP

import { Highlight, HighlightType, Anchor, Note } from './types';
import { v4 as uuidv4 } from 'uuid';

const HIGHLIGHTS_KEY = 'coreader_highlights';
const NOTES_KEY = 'coreader_notes';

// ============================================
// Highlight CRUD Operations
// ============================================

/**
 * Get all highlights
 */
export function getAllHighlights(): Highlight[] {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(HIGHLIGHTS_KEY);
    if (!stored) return [];

    try {
        const highlights = JSON.parse(stored);
        return highlights.map((h: Highlight) => ({
            ...h,
            createdAt: new Date(h.createdAt),
        }));
    } catch {
        return [];
    }
}

/**
 * Get highlights for a specific document
 */
export function getHighlightsByDocument(documentId: string): Highlight[] {
    return getAllHighlights().filter(h => h.documentId === documentId);
}

/**
 * Get a single highlight by ID
 */
export function getHighlightById(id: string): Highlight | null {
    return getAllHighlights().find(h => h.id === id) || null;
}

/**
 * Create a new highlight
 */
export function createHighlight(
    documentId: string,
    type: HighlightType,
    text: string,
    anchor: Anchor
): Highlight {
    const highlight: Highlight = {
        id: uuidv4(),
        documentId,
        type,
        text,
        anchor,
        createdAt: new Date(),
    };

    const highlights = getAllHighlights();
    highlights.push(highlight);
    saveHighlights(highlights);

    return highlight;
}

/**
 * Update highlight type
 */
export function updateHighlightType(id: string, type: HighlightType): Highlight | null {
    const highlights = getAllHighlights();
    const index = highlights.findIndex(h => h.id === id);

    if (index === -1) return null;

    highlights[index] = { ...highlights[index], type };
    saveHighlights(highlights);

    return highlights[index];
}

/**
 * Delete a highlight
 */
export function deleteHighlight(id: string): boolean {
    const highlights = getAllHighlights();
    const filtered = highlights.filter(h => h.id !== id);

    if (filtered.length === highlights.length) return false;

    saveHighlights(filtered);

    // Also delete associated notes
    deleteNotesByHighlight(id);

    return true;
}

/**
 * Delete all highlights for a document
 */
export function deleteHighlightsByDocument(documentId: string): void {
    const highlights = getAllHighlights();
    const filtered = highlights.filter(h => h.documentId !== documentId);
    saveHighlights(filtered);
}

function saveHighlights(highlights: Highlight[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(highlights));
}

// ============================================
// Note CRUD Operations
// ============================================

/**
 * Get all notes
 */
export function getAllNotes(): Note[] {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(NOTES_KEY);
    if (!stored) return [];

    try {
        const notes = JSON.parse(stored);
        return notes.map((n: Note) => ({
            ...n,
            createdAt: new Date(n.createdAt),
        }));
    } catch {
        return [];
    }
}

/**
 * Get note for a highlight
 */
export function getNoteByHighlight(highlightId: string): Note | null {
    return getAllNotes().find(n => n.highlightId === highlightId) || null;
}

/**
 * Create or update note for a highlight
 */
export function saveNote(highlightId: string, content: string): Note {
    const notes = getAllNotes();
    const existingIndex = notes.findIndex(n => n.highlightId === highlightId);

    if (existingIndex !== -1) {
        notes[existingIndex] = {
            ...notes[existingIndex],
            content,
        };
        saveNotes(notes);
        return notes[existingIndex];
    }

    const note: Note = {
        id: uuidv4(),
        highlightId,
        content,
        createdAt: new Date(),
    };

    notes.push(note);
    saveNotes(notes);

    return note;
}

/**
 * Delete note
 */
export function deleteNote(id: string): boolean {
    const notes = getAllNotes();
    const filtered = notes.filter(n => n.id !== id);

    if (filtered.length === notes.length) return false;

    saveNotes(filtered);
    return true;
}

/**
 * Delete notes for a highlight
 */
export function deleteNotesByHighlight(highlightId: string): void {
    const notes = getAllNotes();
    const filtered = notes.filter(n => n.highlightId !== highlightId);
    saveNotes(filtered);
}

function saveNotes(notes: Note[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

// ============================================
// Highlight Statistics
// ============================================

export function getHighlightStats(documentId?: string): {
    total: number;
    byType: Record<HighlightType, number>;
} {
    const highlights = documentId
        ? getHighlightsByDocument(documentId)
        : getAllHighlights();

    return {
        total: highlights.length,
        byType: {
            insight: highlights.filter(h => h.type === 'insight').length,
            definition: highlights.filter(h => h.type === 'definition').length,
            question: highlights.filter(h => h.type === 'question').length,
        },
    };
}
