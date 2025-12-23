// Cloud Storage for PDFs using Vercel Blob
// Falls back to localStorage if Vercel Blob is not configured

import { v4 as uuidv4 } from 'uuid';

// ============================================
// Storage Mode Detection
// ============================================

/**
 * Check if cloud storage is available (Vercel Blob configured)
 */
export function isCloudStorageAvailable(): boolean {
    // Cloud storage is available if we can make API calls
    // It will be configured on Vercel with BLOB_READ_WRITE_TOKEN
    return true; // We always try cloud first, fallback to local on error
}

// ============================================
// Cloud Storage (Vercel Blob)
// ============================================

/**
 * Upload PDF to Vercel Blob
 */
export async function uploadPdfToCloud(file: File, documentId: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentId', documentId);

    const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload PDF');
    }

    const data = await response.json();
    return data.url;
}

/**
 * Delete PDF from Vercel Blob
 */
export async function deletePdfFromCloud(url: string): Promise<void> {
    const response = await fetch(`/api/upload-pdf?url=${encodeURIComponent(url)}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        console.error('Failed to delete PDF from cloud');
    }
}

// ============================================
// Local Storage (Fallback)
// ============================================

const PDF_LOCAL_KEY = 'coreader_pdf_files';

/**
 * Store PDF locally as base64
 */
export async function storePdfLocally(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        // Check file size (5MB limit for localStorage)
        const MAX_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            reject(new Error(`PDF too large for local storage. Maximum: 5MB`));
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            const base64 = reader.result as string;
            const id = uuidv4();

            try {
                const pdfFiles = getLocalPdfFiles();
                pdfFiles[id] = base64;
                localStorage.setItem(PDF_LOCAL_KEY, JSON.stringify(pdfFiles));
                resolve(`local:${id}`);
            } catch (e) {
                reject(new Error('Local storage full'));
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Get PDF data from local storage
 */
export function getLocalPdfData(id: string): string | null {
    const pdfFiles = getLocalPdfFiles();
    return pdfFiles[id] || null;
}

/**
 * Delete PDF from local storage
 */
export function deleteLocalPdf(id: string): void {
    const pdfFiles = getLocalPdfFiles();
    delete pdfFiles[id];
    localStorage.setItem(PDF_LOCAL_KEY, JSON.stringify(pdfFiles));
}

function getLocalPdfFiles(): Record<string, string> {
    if (typeof window === 'undefined') return {};

    const stored = localStorage.getItem(PDF_LOCAL_KEY);
    if (!stored) return {};

    try {
        return JSON.parse(stored);
    } catch {
        return {};
    }
}

// ============================================
// Unified Storage Interface
// ============================================

/**
 * Store PDF - tries cloud first, falls back to local
 */
export async function storePdf(file: File, documentId: string): Promise<string> {
    try {
        // Try cloud storage first
        const url = await uploadPdfToCloud(file, documentId);
        return url;
    } catch (cloudError: any) {
        console.warn('Cloud upload failed, trying local:', cloudError.message);

        // Fallback to local storage
        try {
            const localUrl = await storePdfLocally(file);
            return localUrl;
        } catch (localError: any) {
            throw new Error(`Failed to store PDF: ${localError.message}`);
        }
    }
}

/**
 * Get PDF data URL - handles both cloud and local URLs
 */
export async function getPdfUrl(storedUrl: string): Promise<string> {
    if (storedUrl.startsWith('local:')) {
        // Local storage - return base64 data
        const id = storedUrl.replace('local:', '');
        const data = getLocalPdfData(id);
        if (!data) throw new Error('PDF not found in local storage');
        return data;
    } else {
        // Cloud storage - return URL directly
        return storedUrl;
    }
}

/**
 * Delete PDF - handles both cloud and local
 */
export async function deletePdf(storedUrl: string): Promise<void> {
    if (storedUrl.startsWith('local:')) {
        const id = storedUrl.replace('local:', '');
        deleteLocalPdf(id);
    } else {
        await deletePdfFromCloud(storedUrl);
    }
}

/**
 * Check if URL is a cloud URL (vs local)
 */
export function isCloudUrl(url: string): boolean {
    return !url.startsWith('local:') && !url.startsWith('data:');
}
