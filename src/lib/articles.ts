// Article Storage and Management
// Stores HTML content for URL-based documents

const ARTICLES_KEY = 'coreader_articles';

export interface StoredArticle {
    id: string;
    url: string;
    title: string;
    content: string;
    author?: string;
    publishedDate?: string;
    fetchedAt: string;
}

/**
 * Get all stored articles
 */
export function getAllArticles(): StoredArticle[] {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(ARTICLES_KEY);
    if (!stored) return [];

    try {
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

/**
 * Get article by document ID
 */
export function getArticleById(id: string): StoredArticle | null {
    return getAllArticles().find(a => a.id === id) || null;
}

/**
 * Store article content
 */
export function storeArticle(article: StoredArticle): void {
    if (typeof window === 'undefined') return;

    const articles = getAllArticles();

    // Remove existing article with same ID
    const filtered = articles.filter(a => a.id !== article.id);
    filtered.push(article);

    try {
        localStorage.setItem(ARTICLES_KEY, JSON.stringify(filtered));
    } catch (e) {
        console.error('Failed to store article:', e);
        throw new Error('Storage full. Please remove some documents.');
    }
}

/**
 * Delete stored article
 */
export function deleteArticle(id: string): void {
    if (typeof window === 'undefined') return;

    const articles = getAllArticles();
    const filtered = articles.filter(a => a.id !== id);
    localStorage.setItem(ARTICLES_KEY, JSON.stringify(filtered));
}

/**
 * Fetch and store article from URL
 */
export async function fetchAndStoreArticle(
    documentId: string,
    url: string
): Promise<StoredArticle> {
    // Call the API route to fetch and parse the article
    const response = await fetch('/api/fetch-article', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch article');
    }

    const data = await response.json();

    const article: StoredArticle = {
        id: documentId,
        url: data.url,
        title: data.title,
        content: data.content,
        author: data.author,
        publishedDate: data.publishedDate,
        fetchedAt: data.fetchedAt,
    };

    storeArticle(article);
    return article;
}
