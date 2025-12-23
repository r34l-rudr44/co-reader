// Vocabulary Storage and Management
// Stores words collected from reading sessions

import { VocabularyEntry } from './types';
import { v4 as uuidv4 } from 'uuid';

const VOCABULARY_KEY = 'coreader_vocabulary';

/**
 * Get all vocabulary entries
 */
export function getAllVocabulary(): VocabularyEntry[] {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(VOCABULARY_KEY);
    if (!stored) return [];

    try {
        const entries = JSON.parse(stored);
        return entries.map((e: VocabularyEntry) => ({
            ...e,
            createdAt: new Date(e.createdAt),
        }));
    } catch {
        return [];
    }
}

/**
 * Get vocabulary entries for a specific document
 */
export function getVocabularyByDocument(documentId: string): VocabularyEntry[] {
    return getAllVocabulary().filter(v => v.documentId === documentId);
}

/**
 * Get a single vocabulary entry by ID
 */
export function getVocabularyById(id: string): VocabularyEntry | null {
    return getAllVocabulary().find(v => v.id === id) || null;
}

/**
 * Check if a word already exists in vocabulary
 */
export function wordExists(word: string): boolean {
    const normalized = word.toLowerCase().trim();
    return getAllVocabulary().some(v => v.word.toLowerCase() === normalized);
}

/**
 * Create a new vocabulary entry
 */
export function createVocabularyEntry(
    word: string,
    contextSentence: string,
    documentId: string,
    userNote?: string
): VocabularyEntry {
    const entry: VocabularyEntry = {
        id: uuidv4(),
        word: word.trim(),
        contextSentence,
        documentId,
        userNote,
        createdAt: new Date(),
    };

    const entries = getAllVocabulary();
    entries.push(entry);
    saveVocabulary(entries);

    return entry;
}

/**
 * Update vocabulary entry with definition or note
 */
export function updateVocabularyEntry(
    id: string,
    updates: Partial<Pick<VocabularyEntry, 'userNote' | 'definition'>>
): VocabularyEntry | null {
    const entries = getAllVocabulary();
    const index = entries.findIndex(e => e.id === id);

    if (index === -1) return null;

    entries[index] = { ...entries[index], ...updates };
    saveVocabulary(entries);

    return entries[index];
}

/**
 * Delete vocabulary entry
 */
export function deleteVocabularyEntry(id: string): boolean {
    const entries = getAllVocabulary();
    const filtered = entries.filter(e => e.id !== id);

    if (filtered.length === entries.length) return false;

    saveVocabulary(filtered);
    return true;
}

/**
 * Delete all vocabulary entries for a document
 */
export function deleteVocabularyByDocument(documentId: string): number {
    const entries = getAllVocabulary();
    const filtered = entries.filter(e => e.documentId !== documentId);
    const deleted = entries.length - filtered.length;

    if (deleted > 0) {
        saveVocabulary(filtered);
    }

    return deleted;
}

/**
 * Get vocabulary statistics
 */
export function getVocabularyStats(): {
    total: number;
    withDefinitions: number;
    withNotes: number;
    documentsCount: number;
} {
    const entries = getAllVocabulary();
    const documentIds = new Set(entries.map(e => e.documentId));

    return {
        total: entries.length,
        withDefinitions: entries.filter(e => e.definition).length,
        withNotes: entries.filter(e => e.userNote).length,
        documentsCount: documentIds.size,
    };
}

/**
 * Search vocabulary entries
 */
export function searchVocabulary(query: string): VocabularyEntry[] {
    const normalized = query.toLowerCase().trim();
    if (!normalized) return [];

    return getAllVocabulary().filter(entry =>
        entry.word.toLowerCase().includes(normalized) ||
        entry.contextSentence.toLowerCase().includes(normalized) ||
        entry.userNote?.toLowerCase().includes(normalized) ||
        entry.definition?.toLowerCase().includes(normalized)
    );
}

/**
 * Export vocabulary as CSV
 */
export function exportVocabularyAsCsv(): string {
    const entries = getAllVocabulary();
    const headers = ['Word', 'Context', 'Definition', 'Note', 'Date'];
    const rows = entries.map(e => [
        escapeCsv(e.word),
        escapeCsv(e.contextSentence),
        escapeCsv(e.definition || ''),
        escapeCsv(e.userNote || ''),
        e.createdAt.toISOString().split('T')[0],
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

function escapeCsv(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

function saveVocabulary(entries: VocabularyEntry[]): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(VOCABULARY_KEY, JSON.stringify(entries));
    } catch (e) {
        console.error('Failed to save vocabulary:', e);
    }
}
