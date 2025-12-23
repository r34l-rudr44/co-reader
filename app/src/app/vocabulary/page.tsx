'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { VocabularyEntry, Document } from '@/lib/types';
import {
    getAllVocabulary,
    deleteVocabularyEntry,
    updateVocabularyEntry,
    getVocabularyStats,
    exportVocabularyAsCsv,
} from '@/lib/vocabulary';
import { getDocumentById } from '@/lib/documents';

export default function VocabularyPage() {
    const router = useRouter();
    const [entries, setEntries] = useState<VocabularyEntry[]>([]);
    const [stats, setStats] = useState({ total: 0, withDefinitions: 0, withNotes: 0, documentsCount: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editNote, setEditNote] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setEntries(getAllVocabulary().sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
        setStats(getVocabularyStats());
    };

    const filteredEntries = entries.filter(entry => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            entry.word.toLowerCase().includes(q) ||
            entry.contextSentence.toLowerCase().includes(q) ||
            entry.definition?.toLowerCase().includes(q) ||
            entry.userNote?.toLowerCase().includes(q)
        );
    });

    const handleDelete = useCallback((id: string) => {
        if (confirm('Delete this word from vocabulary?')) {
            deleteVocabularyEntry(id);
            loadData();
        }
    }, []);

    const handleEditNote = useCallback((entry: VocabularyEntry) => {
        setEditingId(entry.id);
        setEditNote(entry.userNote || '');
    }, []);

    const handleSaveNote = useCallback(() => {
        if (editingId) {
            updateVocabularyEntry(editingId, { userNote: editNote || undefined });
            setEditingId(null);
            setEditNote('');
            loadData();
        }
    }, [editingId, editNote]);

    const handleExport = useCallback(() => {
        const csv = exportVocabularyAsCsv();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vocabulary-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, []);

    const getDocumentTitle = (documentId: string) => {
        const doc = getDocumentById(documentId);
        return doc?.title || 'Unknown Document';
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        }).format(new Date(date));
    };

    return (
        <div className="vocabulary-container">
            {/* Header */}
            <header className="vocabulary-header">
                <div className="vocabulary-nav">
                    <button className="back-btn" onClick={() => router.push('/')}>
                        ← Back
                    </button>
                </div>
                <h1 className="vocabulary-title">Vocabulary</h1>
                <div className="vocabulary-stats">
                    <span>{stats.total} words</span>
                    <span>•</span>
                    <span>{stats.withDefinitions} with definitions</span>
                    <span>•</span>
                    <span>from {stats.documentsCount} documents</span>
                </div>
            </header>

            {/* Actions */}
            <div className="vocabulary-actions">
                <input
                    type="search"
                    className="vocabulary-search"
                    placeholder="Search words..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                    className="vocabulary-export"
                    onClick={handleExport}
                    disabled={entries.length === 0}
                >
                    Export CSV
                </button>
            </div>

            {/* Word List */}
            {filteredEntries.length === 0 ? (
                <div className="empty-state">
                    <p>
                        {entries.length === 0
                            ? 'No words in vocabulary yet.'
                            : 'No words match your search.'}
                    </p>
                    <p className="empty-hint">
                        {entries.length === 0
                            ? 'Select a word while reading and click "Add Word" to build your vocabulary.'
                            : 'Try a different search term.'}
                    </p>
                </div>
            ) : (
                <div className="vocabulary-list">
                    {filteredEntries.map((entry) => (
                        <article key={entry.id} className="vocabulary-entry">
                            <div className="entry-header">
                                <h2 className="entry-word">{entry.word}</h2>
                                <span className="entry-date">{formatDate(entry.createdAt)}</span>
                            </div>

                            {entry.definition && (
                                <p className="entry-definition">{entry.definition}</p>
                            )}

                            <blockquote className="entry-context">
                                "{entry.contextSentence}"
                            </blockquote>

                            {editingId === entry.id ? (
                                <div className="entry-note-edit">
                                    <textarea
                                        value={editNote}
                                        onChange={(e) => setEditNote(e.target.value)}
                                        placeholder="Add a personal note..."
                                        rows={2}
                                        autoFocus
                                    />
                                    <div className="note-edit-actions">
                                        <button onClick={() => setEditingId(null)}>Cancel</button>
                                        <button onClick={handleSaveNote}>Save</button>
                                    </div>
                                </div>
                            ) : entry.userNote ? (
                                <p className="entry-note" onClick={() => handleEditNote(entry)}>
                                    📝 {entry.userNote}
                                </p>
                            ) : (
                                <button
                                    className="add-note-btn"
                                    onClick={() => handleEditNote(entry)}
                                >
                                    + Add note
                                </button>
                            )}

                            <div className="entry-footer">
                                <span
                                    className="entry-source"
                                    onClick={() => router.push(`/reader/${entry.documentId}`)}
                                >
                                    {getDocumentTitle(entry.documentId)}
                                </span>
                                <button
                                    className="entry-delete"
                                    onClick={() => handleDelete(entry.id)}
                                >
                                    Delete
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            <style jsx>{`
                .vocabulary-container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: var(--spacing-2xl) var(--spacing-lg);
                    min-height: 100vh;
                }

                .vocabulary-header {
                    margin-bottom: var(--spacing-xl);
                }

                .vocabulary-nav {
                    margin-bottom: var(--spacing-md);
                }

                .back-btn {
                    padding: var(--spacing-xs) var(--spacing-sm);
                    font-family: var(--font-reader);
                    font-size: 14px;
                    color: var(--text-secondary);
                    background: transparent;
                    border: none;
                    cursor: pointer;
                }

                .back-btn:hover {
                    color: var(--text-primary);
                }

                .vocabulary-title {
                    font-family: var(--font-reader);
                    font-size: 28px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin: 0 0 var(--spacing-xs) 0;
                }

                .vocabulary-stats {
                    display: flex;
                    gap: var(--spacing-sm);
                    font-size: 14px;
                    color: var(--text-muted);
                }

                .vocabulary-actions {
                    display: flex;
                    gap: var(--spacing-md);
                    margin-bottom: var(--spacing-xl);
                }

                .vocabulary-search {
                    flex: 1;
                    padding: var(--spacing-sm) var(--spacing-md);
                    font-family: var(--font-reader);
                    font-size: 14px;
                    color: var(--text-primary);
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    outline: none;
                }

                .vocabulary-search:focus {
                    border-color: var(--hl-definition-solid);
                }

                .vocabulary-export {
                    padding: var(--spacing-sm) var(--spacing-lg);
                    font-family: var(--font-reader);
                    font-size: 14px;
                    color: var(--text-secondary);
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    cursor: pointer;
                }

                .vocabulary-export:hover:not(:disabled) {
                    background: var(--bg-panel);
                }

                .vocabulary-export:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .empty-state {
                    text-align: center;
                    padding: var(--spacing-2xl);
                    color: var(--text-muted);
                }

                .empty-hint {
                    font-size: 14px;
                    margin-top: var(--spacing-sm);
                }

                .vocabulary-list {
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-md);
                }

                .vocabulary-entry {
                    padding: var(--spacing-lg);
                    background: var(--bg-secondary);
                    border-radius: 8px;
                }

                .entry-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;
                    margin-bottom: var(--spacing-sm);
                }

                .entry-word {
                    font-family: var(--font-reader);
                    font-size: 18px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin: 0;
                }

                .entry-date {
                    font-size: 12px;
                    color: var(--text-muted);
                }

                .entry-definition {
                    font-size: 14px;
                    color: var(--text-primary);
                    margin: 0 0 var(--spacing-sm) 0;
                    line-height: 1.5;
                }

                .entry-context {
                    font-size: 13px;
                    font-style: italic;
                    color: var(--text-secondary);
                    margin: 0 0 var(--spacing-sm) 0;
                    padding-left: var(--spacing-md);
                    border-left: 2px solid var(--border-color);
                    line-height: 1.5;
                }

                .entry-note {
                    font-size: 14px;
                    color: var(--text-secondary);
                    margin: var(--spacing-sm) 0;
                    padding: var(--spacing-sm);
                    background: var(--bg-primary);
                    border-radius: 4px;
                    cursor: pointer;
                }

                .entry-note:hover {
                    background: var(--bg-panel);
                }

                .add-note-btn {
                    font-size: 13px;
                    color: var(--text-muted);
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    padding: 0;
                }

                .add-note-btn:hover {
                    color: var(--text-primary);
                }

                .entry-note-edit {
                    margin: var(--spacing-sm) 0;
                }

                .entry-note-edit textarea {
                    width: 100%;
                    padding: var(--spacing-sm);
                    font-family: var(--font-reader);
                    font-size: 14px;
                    color: var(--text-primary);
                    background: var(--bg-primary);
                    border: 1px solid var(--hl-definition-solid);
                    border-radius: 4px;
                    resize: vertical;
                    outline: none;
                }

                .note-edit-actions {
                    display: flex;
                    gap: var(--spacing-sm);
                    justify-content: flex-end;
                    margin-top: var(--spacing-xs);
                }

                .note-edit-actions button {
                    padding: var(--spacing-xs) var(--spacing-md);
                    font-size: 13px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }

                .note-edit-actions button:first-child {
                    color: var(--text-muted);
                    background: transparent;
                }

                .note-edit-actions button:last-child {
                    color: white;
                    background: var(--hl-definition-solid);
                }

                .entry-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: var(--spacing-md);
                    padding-top: var(--spacing-sm);
                    border-top: 1px solid var(--border-color);
                }

                .entry-source {
                    font-size: 12px;
                    color: var(--text-muted);
                    cursor: pointer;
                }

                .entry-source:hover {
                    color: var(--hl-definition-solid);
                    text-decoration: underline;
                }

                .entry-delete {
                    font-size: 12px;
                    color: var(--hl-question-solid);
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    opacity: 0;
                    transition: opacity var(--transition-fast);
                }

                .vocabulary-entry:hover .entry-delete {
                    opacity: 1;
                }

                .entry-delete:hover {
                    text-decoration: underline;
                }
            `}</style>
        </div>
    );
}
