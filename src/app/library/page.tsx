'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Highlight, HighlightType, Document } from '@/lib/types';
import { getAllHighlights, deleteHighlight, getNoteByHighlight } from '@/lib/highlights';
import { getAllDocuments, getDocumentById } from '@/lib/documents';

type FilterType = 'all' | HighlightType;

export default function LibraryPage() {
    const router = useRouter();
    const [highlights, setHighlights] = useState<Highlight[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [filterDocument, setFilterDocument] = useState<string>('all');

    useEffect(() => {
        setHighlights(getAllHighlights());
        setDocuments(getAllDocuments());
    }, []);

    const filteredHighlights = highlights.filter(h => {
        if (filterType !== 'all' && h.type !== filterType) return false;
        if (filterDocument !== 'all' && h.documentId !== filterDocument) return false;
        return true;
    });

    const handleHighlightClick = useCallback((highlight: Highlight) => {
        router.push(`/reader/${highlight.documentId}`);
    }, [router]);

    const handleDeleteHighlight = useCallback((id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Delete this highlight?')) {
            deleteHighlight(id);
            setHighlights(getAllHighlights());
        }
    }, []);

    const getDocumentTitle = (documentId: string) => {
        const doc = getDocumentById(documentId);
        return doc?.title || 'Unknown Document';
    };

    const getTypeLabel = (type: HighlightType) => {
        switch (type) {
            case 'insight': return 'Insight';
            case 'definition': return 'Definition';
            case 'question': return 'Question';
        }
    };

    const getTypeColor = (type: HighlightType) => {
        switch (type) {
            case 'insight': return 'var(--hl-insight-solid)';
            case 'definition': return 'var(--hl-definition-solid)';
            case 'question': return 'var(--hl-question-solid)';
        }
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        }).format(new Date(date));
    };

    return (
        <div className="library-container">
            {/* Header */}
            <header className="library-header">
                <div className="library-nav">
                    <button className="back-btn" onClick={() => router.push('/')}>
                        ← Back
                    </button>
                </div>
                <h1 className="library-title">Highlights Library</h1>
                <p className="library-subtitle">
                    {filteredHighlights.length} highlight{filteredHighlights.length !== 1 ? 's' : ''}
                </p>
            </header>

            {/* Filters */}
            <div className="filters">
                <div className="filter-group">
                    <label className="filter-label">Type</label>
                    <select
                        className="filter-select"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as FilterType)}
                    >
                        <option value="all">All Types</option>
                        <option value="insight">Insight</option>
                        <option value="definition">Definition</option>
                        <option value="question">Question</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label className="filter-label">Document</label>
                    <select
                        className="filter-select"
                        value={filterDocument}
                        onChange={(e) => setFilterDocument(e.target.value)}
                    >
                        <option value="all">All Documents</option>
                        {documents.map((doc) => (
                            <option key={doc.id} value={doc.id}>
                                {doc.title}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Highlights List */}
            {filteredHighlights.length === 0 ? (
                <div className="empty-state">
                    <p>No highlights found.</p>
                    <p className="empty-hint">
                        {highlights.length === 0
                            ? 'Start reading and highlighting to build your library.'
                            : 'Try adjusting your filters.'}
                    </p>
                </div>
            ) : (
                <div className="highlights-list">
                    {filteredHighlights.map((highlight) => {
                        const note = getNoteByHighlight(highlight.id);
                        return (
                            <article
                                key={highlight.id}
                                className="highlight-card"
                                onClick={() => handleHighlightClick(highlight)}
                            >
                                <div className="highlight-card-header">
                                    <span
                                        className="highlight-type"
                                        style={{ color: getTypeColor(highlight.type) }}
                                    >
                                        {getTypeLabel(highlight.type)}
                                    </span>
                                    <span className="highlight-date">
                                        {formatDate(highlight.createdAt)}
                                    </span>
                                </div>

                                <blockquote className="highlight-text">
                                    "{highlight.text}"
                                </blockquote>

                                {note && (
                                    <p className="highlight-note">
                                        📝 {note.content}
                                    </p>
                                )}

                                <div className="highlight-card-footer">
                                    <span className="highlight-source">
                                        {getDocumentTitle(highlight.documentId)}
                                    </span>
                                    <button
                                        className="highlight-delete"
                                        onClick={(e) => handleDeleteHighlight(highlight.id, e)}
                                        aria-label="Delete highlight"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            <style jsx>{`
        .library-container {
          max-width: 800px;
          margin: 0 auto;
          padding: var(--spacing-2xl) var(--spacing-lg);
          min-height: 100vh;
        }

        .library-header {
          margin-bottom: var(--spacing-2xl);
        }

        .library-nav {
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

        .library-title {
          font-family: var(--font-reader);
          font-size: 28px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 var(--spacing-xs) 0;
        }

        .library-subtitle {
          font-family: var(--font-reader);
          font-size: 14px;
          color: var(--text-muted);
          margin: 0;
        }

        .filters {
          display: flex;
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
          padding: var(--spacing-md);
          background: var(--bg-secondary);
          border-radius: 8px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .filter-label {
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }

        .filter-select {
          padding: var(--spacing-sm) var(--spacing-md);
          font-family: var(--font-reader);
          font-size: 14px;
          color: var(--text-primary);
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          cursor: pointer;
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

        .highlights-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .highlight-card {
          padding: var(--spacing-lg);
          background: var(--bg-secondary);
          border-radius: 8px;
          cursor: pointer;
          transition: background var(--transition-fast), transform var(--transition-fast);
        }

        .highlight-card:hover {
          background: var(--bg-panel);
          transform: translateY(-2px);
        }

        .highlight-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-sm);
        }

        .highlight-type {
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .highlight-date {
          font-size: 12px;
          color: var(--text-muted);
        }

        .highlight-text {
          font-family: var(--font-reader);
          font-size: 16px;
          font-style: italic;
          color: var(--text-primary);
          margin: 0 0 var(--spacing-sm) 0;
          padding-left: var(--spacing-md);
          border-left: 2px solid var(--border-color);
          line-height: 1.6;
        }

        .highlight-note {
          font-size: 14px;
          color: var(--text-secondary);
          margin: var(--spacing-sm) 0 0 0;
          padding: var(--spacing-sm);
          background: var(--bg-primary);
          border-radius: 4px;
        }

        .highlight-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: var(--spacing-md);
          padding-top: var(--spacing-sm);
          border-top: 1px solid var(--border-color);
        }

        .highlight-source {
          font-size: 12px;
          color: var(--text-muted);
        }

        .highlight-delete {
          padding: var(--spacing-xs) var(--spacing-sm);
          font-size: 12px;
          color: var(--hl-question-solid);
          background: transparent;
          border: none;
          cursor: pointer;
          opacity: 0;
          transition: opacity var(--transition-fast);
        }

        .highlight-card:hover .highlight-delete {
          opacity: 1;
        }

        .highlight-delete:hover {
          text-decoration: underline;
        }
      `}</style>
        </div>
    );
}
