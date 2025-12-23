// Cloud Document Storage using Vercel Postgres
// Falls back to localStorage if database is not configured

import { Document, SourceType } from './types';

// ============================================
// Cloud Storage (Vercel Postgres via API)
// ============================================

/**
 * Get all documents from cloud
 */
export async function getCloudDocuments(): Promise<Document[]> {
    try {
        const response = await fetch('/api/documents');
        if (!response.ok) throw new Error('Failed to fetch documents');

        const data = await response.json();
        return data.map((row: any) => ({
            id: row.id,
            title: row.title,
            sourceType: row.source_type as SourceType,
            sourcePath: row.source_path,
            createdAt: new Date(row.created_at),
        }));
    } catch (error) {
        console.warn('Cloud fetch failed, falling back to localStorage');
        return getLocalDocuments();
    }
}

/**
 * Get single document by ID from cloud
 */
export async function getCloudDocumentById(id: string): Promise<Document | null> {
    try {
        const response = await fetch(`/api/documents?id=${id}`);
        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error('Failed to fetch document');
        }

        const row = await response.json();
        return {
            id: row.id,
            title: row.title,
            sourceType: row.source_type as SourceType,
            sourcePath: row.source_path,
            createdAt: new Date(row.created_at),
        };
    } catch (error) {
        console.warn('Cloud fetch failed, falling back to localStorage');
        return getLocalDocumentById(id);
    }
}

/**
 * Create document in cloud
 */
export async function createCloudDocument(
    title: string,
    sourceType: SourceType,
    sourcePath: string
): Promise<Document> {
    try {
        const response = await fetch('/api/documents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, sourceType, sourcePath }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create document');
        }

        const row = await response.json();
        const doc: Document = {
            id: row.id,
            title: row.title,
            sourceType: row.source_type as SourceType,
            sourcePath: row.source_path,
            createdAt: new Date(row.created_at),
        };

        // Also save to localStorage for offline access
        saveDocumentLocally(doc);

        return doc;
    } catch (error: any) {
        console.warn('Cloud create failed, falling back to localStorage:', error.message);
        return createLocalDocument(title, sourceType, sourcePath);
    }
}

/**
 * Update document source path in cloud (for when PDF is uploaded)
 */
export async function updateCloudDocument(id: string, updates: { title?: string; sourcePath?: string }): Promise<void> {
    try {
        const response = await fetch('/api/documents', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...updates }),
        });

        if (!response.ok) {
            throw new Error('Failed to update document');
        }

        // Update localStorage too
        updateLocalDocument(id, updates);
    } catch (error) {
        console.warn('Cloud update failed, updating localStorage only');
        updateLocalDocument(id, updates);
    }
}

/**
 * Delete document from cloud
 */
export async function deleteCloudDocument(id: string): Promise<void> {
    try {
        const response = await fetch(`/api/documents?id=${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete document');
        }
    } catch (error) {
        console.warn('Cloud delete failed');
    }

    // Always delete from localStorage too
    deleteLocalDocument(id);
}

// ============================================
// Local Storage (Fallback)
// ============================================

const LOCAL_DOCUMENTS_KEY = 'coreader_documents';

function getLocalDocuments(): Document[] {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(LOCAL_DOCUMENTS_KEY);
    if (!stored) return [];

    try {
        const docs = JSON.parse(stored);
        return docs.map((d: any) => ({
            ...d,
            createdAt: new Date(d.createdAt),
        }));
    } catch {
        return [];
    }
}

function getLocalDocumentById(id: string): Document | null {
    return getLocalDocuments().find(d => d.id === id) || null;
}

function createLocalDocument(title: string, sourceType: SourceType, sourcePath: string): Document {
    const { v4: uuidv4 } = require('uuid');

    const doc: Document = {
        id: uuidv4(),
        title,
        sourceType,
        sourcePath,
        createdAt: new Date(),
    };

    saveDocumentLocally(doc);
    return doc;
}

function saveDocumentLocally(doc: Document): void {
    if (typeof window === 'undefined') return;

    const docs = getLocalDocuments();
    const existing = docs.findIndex(d => d.id === doc.id);

    if (existing >= 0) {
        docs[existing] = doc;
    } else {
        docs.push(doc);
    }

    localStorage.setItem(LOCAL_DOCUMENTS_KEY, JSON.stringify(docs));
}

function updateLocalDocument(id: string, updates: { title?: string; sourcePath?: string }): void {
    if (typeof window === 'undefined') return;

    const docs = getLocalDocuments();
    const index = docs.findIndex(d => d.id === id);

    if (index >= 0) {
        if (updates.title) docs[index].title = updates.title;
        if (updates.sourcePath) docs[index].sourcePath = updates.sourcePath;
        localStorage.setItem(LOCAL_DOCUMENTS_KEY, JSON.stringify(docs));
    }
}

function deleteLocalDocument(id: string): void {
    if (typeof window === 'undefined') return;

    const docs = getLocalDocuments().filter(d => d.id !== id);
    localStorage.setItem(LOCAL_DOCUMENTS_KEY, JSON.stringify(docs));
}

// ============================================
// Unified Interface
// ============================================

export const cloudDocs = {
    getAll: getCloudDocuments,
    getById: getCloudDocumentById,
    create: createCloudDocument,
    update: updateCloudDocument,
    delete: deleteCloudDocument,
};
