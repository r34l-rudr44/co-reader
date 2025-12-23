'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Document } from '@/lib/types';
import { getDocumentById } from '@/lib/documents';
import { cloudDocs } from '@/lib/cloudDocuments';
import { getArticleById } from '@/lib/articles';
import { getPdfUrl, isCloudUrl } from '@/lib/cloudStorage';
import ReaderLayout from './ReaderLayout';

export default function ReaderPage() {
    const params = useParams();
    const router = useRouter();
    const [document, setDocument] = useState<Document | null>(null);
    const [pdfData, setPdfData] = useState<string | Uint8Array | null>(null);
    const [htmlContent, setHtmlContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadDocument() {
            const docId = params.id as string;

            if (!docId) {
                setError('No document ID provided');
                setLoading(false);
                return;
            }

            // Try to get from cloud first, then local fallback (handled by cloudDocs)
            const doc = await cloudDocs.getById(docId);

            if (!doc) {
                setError('Document not found');
                setLoading(false);
                return;
            }

            setDocument(doc);

            // Load content based on document type
            if (doc.sourceType === 'pdf') {
                try {
                    // Get PDF URL (handles both cloud and local storage)
                    const pdfUrl = await getPdfUrl(doc.sourcePath);

                    // If it's a cloud URL, fetch the PDF and convert to ArrayBuffer
                    if (isCloudUrl(doc.sourcePath)) {
                        try {
                            const response = await fetch(pdfUrl, {
                                mode: 'cors',
                                credentials: 'omit',
                            });

                            if (!response.ok) {
                                throw new Error(`HTTP ${response.status}: Failed to fetch PDF`);
                            }

                            const arrayBuffer = await response.arrayBuffer();
                            setPdfData(new Uint8Array(arrayBuffer));
                            setLoading(false);
                        } catch (fetchErr: any) {
                            console.error('Cloud PDF fetch error:', fetchErr);
                            setError(`Failed to load PDF from cloud: ${fetchErr.message}`);
                            setLoading(false);
                        }
                    } else {
                        // Local storage - pdfUrl is base64 string
                        setPdfData(pdfUrl);
                        setLoading(false);
                    }
                } catch (err: any) {
                    console.error('PDF load error:', err);
                    setError(err.message || 'PDF data not found');
                    setLoading(false);
                }
            } else if (doc.sourceType === 'url') {
                const article = getArticleById(doc.id);
                if (!article) {
                    setError('Article content not found');
                    setLoading(false);
                    return;
                }
                setHtmlContent(article.content);
                // Update document title if it was the URL
                if (doc.title === doc.sourcePath && article.title) {
                    doc.title = article.title;
                    setDocument({ ...doc, title: article.title });
                }
                setLoading(false);
            } else {
                setLoading(false);
            }
        }

        loadDocument();
    }, [params.id]);

    if (loading) {
        return (
            <div className="reader-loading">
                <div className="reader-loading-text">Loading document...</div>
                <style jsx>{`
          .reader-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: var(--bg-primary);
          }
          .reader-loading-text {
            font-family: var(--font-reader);
            color: var(--text-muted);
          }
        `}</style>
            </div>
        );
    }

    if (error || !document) {
        return (
            <div className="reader-error">
                <div className="reader-error-text">{error || 'Unknown error'}</div>
                <button className="reader-error-btn" onClick={() => router.push('/')}>
                    Back to Library
                </button>
                <style jsx>{`
          .reader-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: var(--spacing-lg);
            min-height: 100vh;
            background: var(--bg-primary);
          }
          .reader-error-text {
            font-family: var(--font-reader);
            color: var(--text-secondary);
          }
          .reader-error-btn {
            padding: var(--spacing-sm) var(--spacing-lg);
            font-family: var(--font-reader);
            font-size: 14px;
            color: var(--text-primary);
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            cursor: pointer;
          }
          .reader-error-btn:hover {
            background: var(--bg-panel);
          }
        `}</style>
            </div>
        );
    }

    return (
        <ReaderLayout
            document={document}
            pdfData={pdfData}
            htmlContent={htmlContent}
        />
    );
}
