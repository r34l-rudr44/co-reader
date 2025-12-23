// Document Storage and Management
// Local storage based for MVP

import { Document, SourceType } from './types';
import { v4 as uuidv4 } from 'uuid';
import { deleteHighlightsByDocument } from './highlights';

const DOCUMENTS_KEY = 'coreader_documents';

// ============================================
// Document CRUD Operations
// ============================================

/**
 * Get all documents
 */
export function getAllDocuments(): Document[] {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(DOCUMENTS_KEY);
    if (!stored) return [];

    try {
        const documents = JSON.parse(stored);
        return documents.map((d: Document) => ({
            ...d,
            createdAt: new Date(d.createdAt),
        }));
    } catch {
        return [];
    }
}

/**
 * Get a single document by ID
 */
export function getDocumentById(id: string): Document | null {
    return getAllDocuments().find(d => d.id === id) || null;
}

/**
 * Create a new document
 */
export function createDocument(
    title: string,
    sourceType: SourceType,
    sourcePath: string
): Document {
    const document: Document = {
        id: uuidv4(),
        title,
        sourceType,
        sourcePath,
        createdAt: new Date(),
    };

    const documents = getAllDocuments();
    documents.push(document);
    saveDocuments(documents);

    return document;
}

/**
 * Update document title
 */
export function updateDocumentTitle(id: string, title: string): Document | null {
    const documents = getAllDocuments();
    const index = documents.findIndex(d => d.id === id);

    if (index === -1) return null;

    documents[index] = { ...documents[index], title };
    saveDocuments(documents);

    return documents[index];
}

/**
 * Delete a document (cascades to highlights and notes)
 */
export function deleteDocument(id: string): boolean {
    const documents = getAllDocuments();
    const filtered = documents.filter(d => d.id !== id);

    if (filtered.length === documents.length) return false;

    saveDocuments(filtered);

    // Cascade delete highlights
    deleteHighlightsByDocument(id);

    return true;
}

function saveDocuments(documents: Document[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(documents));
}

// ============================================
// PDF File Storage
// ============================================

const PDF_STORAGE_KEY = 'coreader_pdf_files';

/**
 * Store PDF as base64 in localStorage
 * Note: This is for MVP. Production should use IndexedDB or server storage.
 */
export async function storePdfFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        // Check file size limit (5MB for localStorage safety)
        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
        if (file.size > MAX_FILE_SIZE) {
            reject(new Error(`PDF is too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum size is 5MB.`));
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            const base64 = reader.result as string;
            const pdfFiles = getPdfFiles();
            const id = uuidv4();

            pdfFiles[id] = base64;

            if (typeof window !== 'undefined') {
                try {
                    // Check available storage before writing
                    const dataToStore = JSON.stringify(pdfFiles);
                    const estimatedSize = dataToStore.length * 2; // UTF-16 encoding

                    // Try to estimate available space (rough check)
                    const currentUsage = calculateStorageUsage();
                    const availableSpace = 5 * 1024 * 1024 - currentUsage; // Assume 5MB limit

                    if (estimatedSize > availableSpace) {
                        reject(new Error(`Not enough storage space. Try removing some documents first.`));
                        return;
                    }

                    localStorage.setItem(PDF_STORAGE_KEY, dataToStore);
                    resolve(id);
                } catch (e) {
                    // Storage quota exceeded
                    reject(new Error('Storage full. Please remove some documents to free up space.'));
                }
            } else {
                reject(new Error('localStorage not available'));
            }
        };

        reader.onerror = () => reject(new Error('Failed to read PDF file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Calculate approximate localStorage usage in bytes
 */
export function calculateStorageUsage(): number {
    if (typeof window === 'undefined') return 0;

    let total = 0;
    for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            total += localStorage[key].length * 2; // UTF-16 encoding
        }
    }
    return total;
}

/**
 * Get storage usage as a human-readable string
 */
export function getStorageUsageString(): string {
    const bytes = calculateStorageUsage();
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Clear all Co-Reader data from localStorage
 */
export function clearAllData(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(DOCUMENTS_KEY);
    localStorage.removeItem(PDF_STORAGE_KEY);
    localStorage.removeItem('coreader_highlights');
    localStorage.removeItem('coreader_notes');
    localStorage.removeItem('coreader_articles');
    localStorage.removeItem('coreader_vocabulary');
    localStorage.removeItem('coreader_ai_outputs');
}

/**
 * Get PDF base64 data by ID
 */
export function getPdfData(id: string): string | null {
    const pdfFiles = getPdfFiles();
    return pdfFiles[id] || null;
}

/**
 * Delete stored PDF
 */
export function deletePdfData(id: string): void {
    const pdfFiles = getPdfFiles();
    delete pdfFiles[id];

    if (typeof window !== 'undefined') {
        localStorage.setItem(PDF_STORAGE_KEY, JSON.stringify(pdfFiles));
    }
}

function getPdfFiles(): Record<string, string> {
    if (typeof window === 'undefined') return {};

    const stored = localStorage.getItem(PDF_STORAGE_KEY);
    if (!stored) return {};

    try {
        return JSON.parse(stored);
    } catch {
        return {};
    }
}
