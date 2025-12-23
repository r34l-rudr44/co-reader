'use client';

import { useState, useCallback, useEffect } from 'react';
import { Document } from '@/lib/types';
import {
  getAllDocuments,
  createDocument,
  deleteDocument,
  getStorageUsageString,
  clearAllData,
} from '@/lib/documents';
import { storePdf, deletePdf } from '@/lib/cloudStorage';
import { fetchAndStoreArticle, deleteArticle } from '@/lib/articles';
import { deleteHighlightsByDocument } from '@/lib/highlights';
import { deleteVocabularyByDocument } from '@/lib/vocabulary';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [storageUsage, setStorageUsage] = useState('');
  const [showStorageWarning, setShowStorageWarning] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const router = useRouter();

  useEffect(() => {
    setDocuments(getAllDocuments());
    setStorageUsage(getStorageUsageString());
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.includes('pdf')) {
      alert('Please upload a PDF file');
      return;
    }

    setIsLoading(true);
    setUploadProgress('Uploading to cloud...');

    try {
      // Generate document ID first
      const title = file.name.replace('.pdf', '');
      const doc = createDocument(title, 'pdf', ''); // Create with empty path first

      // Upload PDF to cloud storage
      setUploadProgress('Uploading PDF...');
      const pdfUrl = await storePdf(file, doc.id);

      // Update document with the storage URL
      const documents = getAllDocuments();
      const index = documents.findIndex(d => d.id === doc.id);
      if (index !== -1) {
        documents[index].sourcePath = pdfUrl;
        localStorage.setItem('coreader_documents', JSON.stringify(documents));
      }

      setDocuments(getAllDocuments());
      setStorageUsage(getStorageUsageString());

      // Navigate to reader
      router.push(`/reader/${doc.id}`);
    } catch (error: any) {
      console.error('Failed to upload PDF:', error);
      alert(error.message || 'Failed to upload PDF. Please try again.');
    } finally {
      setIsLoading(false);
      setUploadProgress('');
    }
  }, [router]);

  const handleUrlSubmit = useCallback(async () => {
    if (!urlInput.trim()) return;

    setIsLoading(true);
    let docId: string | null = null;

    try {
      // Create document record first
      const doc = createDocument(urlInput, 'url', urlInput);
      docId = doc.id;

      // Fetch and store article content
      await fetchAndStoreArticle(doc.id, urlInput);

      setDocuments(getAllDocuments());
      setUrlInput('');
      setShowUrlInput(false);

      // Navigate to reader
      router.push(`/reader/${doc.id}`);
    } catch (error: any) {
      console.error('Failed to fetch article:', error);
      alert(error.message || 'Failed to fetch article. Please check the URL.');
      // Clean up the failed document
      if (docId) {
        deleteDocument(docId);
      }
    } finally {
      setIsLoading(false);
    }
  }, [urlInput, router]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(f => f.type === 'application/pdf');

    if (pdfFile) {
      handleFileUpload(pdfFile);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleDeleteDocument = useCallback(async (id: string, sourceType: string, sourcePath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this document and all its data?')) {
      // Delete the document record
      deleteDocument(id);

      // Clean up associated data
      if (sourceType === 'pdf' && sourcePath) {
        try {
          await deletePdf(sourcePath);
        } catch (err) {
          console.warn('Failed to delete PDF from storage:', err);
        }
      } else if (sourceType === 'url') {
        deleteArticle(id);
      }

      // Delete highlights and vocabulary for this document
      deleteHighlightsByDocument(id);
      deleteVocabularyByDocument(id);

      // Refresh state
      setDocuments(getAllDocuments());
      setStorageUsage(getStorageUsageString());
    }
  }, []);

  const handleClearAllData = useCallback(() => {
    if (confirm('⚠️ This will delete ALL documents, highlights, notes, and vocabulary. This cannot be undone. Continue?')) {
      clearAllData();
      setDocuments([]);
      setStorageUsage(getStorageUsageString());
      setShowStorageWarning(false);
    }
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="home-container">
      {/* Header */}
      <header className="home-header">
        <h1 className="home-title">Co-Reader</h1>
        <p className="home-subtitle">A private intellectual workspace</p>
        <div className="header-links">
          <button
            className="library-link"
            onClick={() => router.push('/library')}
          >
            Highlights Library
          </button>
          <button
            className="library-link"
            onClick={() => router.push('/vocabulary')}
          >
            Vocabulary
          </button>
        </div>
      </header>

      {/* Storage Management */}
      <div className="storage-info">
        <span className="storage-usage">Storage: {storageUsage}</span>
        <button
          className="storage-clear"
          onClick={handleClearAllData}
          title="Clear all data to free up storage"
        >
          Clear All Data
        </button>
      </div>

      {/* Upload Zone */}
      <div
        className={`upload-zone ${isDragging ? 'dragover' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {isLoading ? (
          <>
            <div className="upload-zone-icon">⏳</div>
            <div className="upload-zone-text">{uploadProgress || 'Processing...'}</div>
          </>
        ) : (
          <>
            <div className="upload-zone-icon">📄</div>
            <div className="upload-zone-text">
              Drop a PDF here, or click to select
            </div>
            <div className="upload-zone-hint">
              Your documents are stored locally
            </div>
          </>
        )}
      </div>

      {/* URL Input Section */}
      <div className="url-section">
        {showUrlInput ? (
          <div className="url-input-container">
            <input
              type="url"
              className="url-input"
              placeholder="https://example.com/article"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
              autoFocus
              disabled={isLoading}
            />
            <button
              className="url-submit-btn"
              onClick={handleUrlSubmit}
              disabled={isLoading || !urlInput.trim()}
            >
              {isLoading ? 'Loading...' : 'Add'}
            </button>
            <button
              className="url-cancel-btn"
              onClick={() => {
                setShowUrlInput(false);
                setUrlInput('');
              }}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="url-toggle-btn"
            onClick={() => setShowUrlInput(true)}
          >
            + Add article from URL
          </button>
        )}
      </div>

      {/* Document Library */}
      {documents.length > 0 && (
        <section className="library-section">
          <h2 className="library-title">Your Documents</h2>
          <div className="library-grid">
            {documents.map((doc) => (
              <article
                key={doc.id}
                className="library-card"
                onClick={() => router.push(`/reader/${doc.id}`)}
              >
                <h3 className="library-card-title">{doc.title}</h3>
                <div className="library-card-meta">
                  {doc.sourceType.toUpperCase()} · {formatDate(doc.createdAt)}
                </div>
                <button
                  className="library-card-delete"
                  onClick={(e) => handleDeleteDocument(doc.id, doc.sourceType, doc.sourcePath, e)}
                  aria-label="Delete document"
                >
                  ×
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      <style jsx>{`
        .home-container {
          max-width: 800px;
          margin: 0 auto;
          padding: var(--spacing-2xl) var(--spacing-lg);
          min-height: 100vh;
        }

        .home-header {
          text-align: center;
          margin-bottom: var(--spacing-2xl);
        }

        .home-title {
          font-family: var(--font-reader);
          font-size: 32px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 var(--spacing-xs) 0;
        }

        .home-subtitle {
          font-family: var(--font-reader);
          font-size: 16px;
          color: var(--text-muted);
          margin: 0;
        }

        .header-links {
          display: flex;
          gap: var(--spacing-sm);
          margin-top: var(--spacing-md);
        }

        .library-link {
          padding: var(--spacing-sm) var(--spacing-lg);
          font-family: var(--font-reader);
          font-size: 14px;
          color: var(--text-secondary);
          background: transparent;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .library-link:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
          border-color: var(--text-muted);
        }

        .storage-info {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
          padding: var(--spacing-sm) var(--spacing-lg);
          background: var(--bg-secondary);
          border-radius: 6px;
          font-size: 13px;
        }

        .storage-usage {
          color: var(--text-muted);
        }

        .storage-clear {
          padding: var(--spacing-xs) var(--spacing-sm);
          font-size: 12px;
          color: var(--hl-question-solid);
          background: transparent;
          border: 1px solid var(--hl-question-solid);
          border-radius: 4px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .storage-clear:hover {
          background: var(--hl-question);
        }

        .library-section {
          margin-top: var(--spacing-2xl);
        }

        .library-title {
          font-family: var(--font-reader);
          font-size: 14px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          margin-bottom: var(--spacing-lg);
        }

        .library-card {
          position: relative;
        }

        .library-card-delete {
          position: absolute;
          top: var(--spacing-sm);
          right: var(--spacing-sm);
          width: 24px;
          height: 24px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-size: 18px;
          cursor: pointer;
          border-radius: 4px;
          opacity: 0;
          transition: opacity var(--transition-fast), background var(--transition-fast);
        }

        .library-card:hover .library-card-delete {
          opacity: 1;
        }

        .library-card-delete:hover {
          background: var(--hl-question);
          color: var(--hl-question-solid);
        }

        .url-section {
          margin-top: var(--spacing-lg);
          text-align: center;
        }

        .url-toggle-btn {
          padding: var(--spacing-sm) var(--spacing-lg);
          font-family: var(--font-reader);
          font-size: 14px;
          color: var(--text-secondary);
          background: transparent;
          border: 1px dashed var(--border-color);
          border-radius: 6px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .url-toggle-btn:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
          border-color: var(--text-muted);
        }

        .url-input-container {
          display: flex;
          gap: var(--spacing-sm);
          justify-content: center;
          align-items: center;
        }

        .url-input {
          flex: 1;
          max-width: 400px;
          padding: var(--spacing-sm) var(--spacing-md);
          font-family: var(--font-reader);
          font-size: 14px;
          color: var(--text-primary);
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          outline: none;
          transition: border-color var(--transition-fast);
        }

        .url-input:focus {
          border-color: var(--hl-definition-solid);
        }

        .url-input::placeholder {
          color: var(--text-muted);
        }

        .url-submit-btn {
          padding: var(--spacing-sm) var(--spacing-lg);
          font-family: var(--font-reader);
          font-size: 14px;
          color: white;
          background: var(--hl-definition-solid);
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: opacity var(--transition-fast);
        }

        .url-submit-btn:hover:not(:disabled) {
          opacity: 0.85;
        }

        .url-submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .url-cancel-btn {
          padding: var(--spacing-sm) var(--spacing-md);
          font-family: var(--font-reader);
          font-size: 14px;
          color: var(--text-muted);
          background: transparent;
          border: none;
          cursor: pointer;
        }

        .url-cancel-btn:hover:not(:disabled) {
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}
