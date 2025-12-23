'use client';

import { useState, useCallback, useEffect } from 'react';
import { VocabularyEntry } from '@/lib/types';
import {
    createVocabularyEntry,
    updateVocabularyEntry,
    wordExists,
} from '@/lib/vocabulary';

interface VocabularyCardProps {
    word: string;
    contextSentence: string;
    documentId: string;
    position: { top: number; left: number };
    onClose: () => void;
    onSaved?: (entry: VocabularyEntry) => void;
}

export default function VocabularyCard({
    word,
    contextSentence,
    documentId,
    position,
    onClose,
    onSaved,
}: VocabularyCardProps) {
    const [definition, setDefinition] = useState('');
    const [userNote, setUserNote] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [alreadyExists, setAlreadyExists] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check if word already exists
    useEffect(() => {
        setAlreadyExists(wordExists(word));
    }, [word]);

    // Fetch definition from free dictionary API
    const fetchDefinition = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
            );

            if (!response.ok) {
                if (response.status === 404) {
                    setError('No definition found');
                } else {
                    setError('Failed to fetch definition');
                }
                return;
            }

            const data = await response.json();

            // Extract the first definition
            if (data?.[0]?.meanings?.[0]?.definitions?.[0]?.definition) {
                const def = data[0].meanings[0].definitions[0].definition;
                const partOfSpeech = data[0].meanings[0].partOfSpeech;
                setDefinition(`(${partOfSpeech}) ${def}`);
            } else {
                setError('No definition found');
            }
        } catch (err) {
            setError('Failed to fetch definition');
        } finally {
            setIsLoading(false);
        }
    }, [word]);

    // Auto-fetch definition on mount
    useEffect(() => {
        fetchDefinition();
    }, [fetchDefinition]);

    const handleSave = useCallback(async () => {
        setIsSaving(true);

        try {
            const entry = createVocabularyEntry(
                word,
                contextSentence,
                documentId,
                userNote || undefined
            );

            // Update with definition if available
            if (definition) {
                updateVocabularyEntry(entry.id, { definition });
            }

            onSaved?.(entry);
            onClose();
        } catch (err) {
            setError('Failed to save word');
        } finally {
            setIsSaving(false);
        }
    }, [word, contextSentence, documentId, userNote, definition, onClose, onSaved]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.vocabulary-card')) {
                onClose();
            }
        };

        // Delay to prevent immediate close
        const timeout = setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 100);

        return () => {
            clearTimeout(timeout);
            document.removeEventListener('click', handleClickOutside);
        };
    }, [onClose]);

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div
            className="vocabulary-card"
            style={{
                position: 'fixed',
                top: `${position.top}px`,
                left: `${position.left}px`,
                transform: 'translateX(-50%)',
            }}
        >
            <div className="vocabulary-card-header">
                <h3 className="vocabulary-word">{word}</h3>
                <button className="vocabulary-close" onClick={onClose}>
                    ×
                </button>
            </div>

            {alreadyExists && (
                <div className="vocabulary-exists">
                    ✓ Already in vocabulary
                </div>
            )}

            <div className="vocabulary-definition">
                {isLoading ? (
                    <span className="vocabulary-loading">Loading definition...</span>
                ) : error ? (
                    <span className="vocabulary-error">{error}</span>
                ) : (
                    <p>{definition}</p>
                )}
            </div>

            <div className="vocabulary-context">
                <label>Context</label>
                <p>"{contextSentence}"</p>
            </div>

            <div className="vocabulary-note">
                <label htmlFor="vocab-note">Your note (optional)</label>
                <textarea
                    id="vocab-note"
                    value={userNote}
                    onChange={(e) => setUserNote(e.target.value)}
                    placeholder="Add a personal note..."
                    rows={2}
                />
            </div>

            <div className="vocabulary-actions">
                <button
                    className="vocabulary-cancel"
                    onClick={onClose}
                    disabled={isSaving}
                >
                    Cancel
                </button>
                <button
                    className="vocabulary-save"
                    onClick={handleSave}
                    disabled={isSaving || alreadyExists}
                >
                    {isSaving ? 'Saving...' : alreadyExists ? 'Already Saved' : 'Add to Vocabulary'}
                </button>
            </div>

            <style jsx>{`
                .vocabulary-card {
                    width: 320px;
                    max-width: 90vw;
                    padding: var(--spacing-lg);
                    background: var(--bg-panel);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    box-shadow: var(--shadow-lg);
                    z-index: var(--z-toolbar);
                    font-family: var(--font-reader);
                }

                .vocabulary-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: var(--spacing-sm);
                }

                .vocabulary-word {
                    font-size: 18px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin: 0;
                }

                .vocabulary-close {
                    width: 24px;
                    height: 24px;
                    padding: 0;
                    font-size: 18px;
                    line-height: 1;
                    color: var(--text-muted);
                    background: transparent;
                    border: none;
                    cursor: pointer;
                }

                .vocabulary-close:hover {
                    color: var(--text-primary);
                }

                .vocabulary-exists {
                    padding: var(--spacing-xs) var(--spacing-sm);
                    margin-bottom: var(--spacing-sm);
                    font-size: 12px;
                    color: var(--hl-insight-solid);
                    background: var(--hl-insight);
                    border-radius: 4px;
                }

                .vocabulary-definition {
                    margin-bottom: var(--spacing-md);
                    padding: var(--spacing-sm);
                    background: var(--bg-secondary);
                    border-radius: 4px;
                    min-height: 40px;
                }

                .vocabulary-definition p {
                    margin: 0;
                    font-size: 14px;
                    color: var(--text-primary);
                    line-height: 1.5;
                }

                .vocabulary-loading,
                .vocabulary-error {
                    font-size: 13px;
                    color: var(--text-muted);
                    font-style: italic;
                }

                .vocabulary-error {
                    color: var(--hl-question-solid);
                }

                .vocabulary-context {
                    margin-bottom: var(--spacing-md);
                }

                .vocabulary-context label,
                .vocabulary-note label {
                    display: block;
                    font-size: 11px;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--text-muted);
                    margin-bottom: var(--spacing-xs);
                }

                .vocabulary-context p {
                    margin: 0;
                    font-size: 13px;
                    font-style: italic;
                    color: var(--text-secondary);
                    line-height: 1.5;
                }

                .vocabulary-note {
                    margin-bottom: var(--spacing-md);
                }

                .vocabulary-note textarea {
                    width: 100%;
                    padding: var(--spacing-sm);
                    font-family: var(--font-reader);
                    font-size: 14px;
                    color: var(--text-primary);
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 4px;
                    resize: vertical;
                    outline: none;
                }

                .vocabulary-note textarea:focus {
                    border-color: var(--hl-definition-solid);
                }

                .vocabulary-actions {
                    display: flex;
                    gap: var(--spacing-sm);
                    justify-content: flex-end;
                }

                .vocabulary-cancel,
                .vocabulary-save {
                    padding: var(--spacing-sm) var(--spacing-md);
                    font-family: var(--font-reader);
                    font-size: 13px;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all var(--transition-fast);
                }

                .vocabulary-cancel {
                    color: var(--text-muted);
                    background: transparent;
                    border: none;
                }

                .vocabulary-cancel:hover:not(:disabled) {
                    color: var(--text-primary);
                }

                .vocabulary-save {
                    color: white;
                    background: var(--hl-definition-solid);
                    border: none;
                }

                .vocabulary-save:hover:not(:disabled) {
                    opacity: 0.9;
                }

                .vocabulary-save:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
}
