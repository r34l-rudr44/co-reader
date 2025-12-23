'use client';

import { useState, useCallback, useEffect } from 'react';
import { Highlight, Note } from '@/lib/types';
import { getNoteByHighlight, saveNote, deleteHighlight } from '@/lib/highlights';
import AITools from './AITools';

interface MarginNotesPanelProps {
    isOpen: boolean;
    highlight: Highlight | null;
    onClose: () => void;
}

export default function MarginNotesPanel({
    isOpen,
    highlight,
    onClose,
}: MarginNotesPanelProps) {
    const [noteContent, setNoteContent] = useState('');
    const [existingNote, setExistingNote] = useState<Note | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Load existing note when highlight changes
    useEffect(() => {
        if (highlight) {
            const note = getNoteByHighlight(highlight.id);
            setExistingNote(note);
            setNoteContent(note?.content || '');
        } else {
            setExistingNote(null);
            setNoteContent('');
        }
    }, [highlight]);

    const handleSave = useCallback(() => {
        if (!highlight || !noteContent.trim()) return;

        setIsSaving(true);
        const note = saveNote(highlight.id, noteContent.trim());
        setExistingNote(note);
        setIsSaving(false);
    }, [highlight, noteContent]);

    const handleDelete = useCallback(() => {
        if (!highlight) return;

        if (confirm('Delete this highlight and its note?')) {
            deleteHighlight(highlight.id);
            onClose();
            // Trigger a refresh - in production, use context or state management
            window.location.reload();
        }
    }, [highlight, onClose]);

    const getHighlightTypeLabel = (type: string) => {
        switch (type) {
            case 'insight': return 'Insight';
            case 'definition': return 'Definition';
            case 'question': return 'Question';
            default: return type;
        }
    };

    const getHighlightTypeColor = (type: string) => {
        switch (type) {
            case 'insight': return 'var(--hl-insight-solid)';
            case 'definition': return 'var(--hl-definition-solid)';
            case 'question': return 'var(--hl-question-solid)';
            default: return 'var(--text-muted)';
        }
    };

    return (
        <aside className={`margin-panel ${isOpen ? 'open' : ''}`}>
            {highlight ? (
                <>
                    <div className="margin-panel-header">
                        <span
                            className="margin-panel-type"
                            style={{ color: getHighlightTypeColor(highlight.type) }}
                        >
                            {getHighlightTypeLabel(highlight.type)}
                        </span>
                        <button className="margin-close-btn" onClick={onClose} aria-label="Close panel">
                            ×
                        </button>
                    </div>

                    <blockquote className="margin-highlight-text">
                        "{highlight.text}"
                    </blockquote>

                    <textarea
                        className="margin-note-input"
                        placeholder="Your note..."
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        onBlur={handleSave}
                    />

                    <div className="margin-actions">
                        <span className="margin-timestamp">
                            {new Date(highlight.createdAt).toLocaleDateString()}
                        </span>
                        <button className="margin-delete-btn" onClick={handleDelete}>
                            Delete
                        </button>
                    </div>

                    <AITools highlight={highlight} />
                </>
            ) : (
                <div className="margin-empty">
                    <p className="margin-empty-text">
                        Click on a highlight to view or add notes.
                    </p>
                </div>
            )}

            <style jsx>{`
        .margin-close-btn {
          width: 28px;
          height: 28px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-size: 20px;
          cursor: pointer;
          border-radius: 4px;
          transition: background var(--transition-fast);
        }

        .margin-close-btn:hover {
          background: var(--bg-secondary);
        }

        .margin-panel-type {
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .margin-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: var(--spacing-md);
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--border-color);
        }

        .margin-timestamp {
          font-size: 12px;
          color: var(--text-muted);
        }

        .margin-delete-btn {
          padding: var(--spacing-xs) var(--spacing-sm);
          font-size: 12px;
          color: var(--hl-question-solid);
          background: transparent;
          border: 1px solid var(--hl-question-solid);
          border-radius: 4px;
          cursor: pointer;
          transition: background var(--transition-fast);
        }

        .margin-delete-btn:hover {
          background: var(--hl-question);
        }

        .margin-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
        }

        .margin-empty-text {
          font-family: var(--font-reader);
          font-size: 14px;
          color: var(--text-muted);
          text-align: center;
        }
      `}</style>
        </aside>
    );
}
