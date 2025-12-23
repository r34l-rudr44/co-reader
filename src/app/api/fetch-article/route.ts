import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route to fetch and parse article content from a URL
 * Extracts main content, removes navigation, ads, etc.
 */
export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url || typeof url !== 'string') {
            return NextResponse.json(
                { error: 'URL is required' },
                { status: 400 }
            );
        }

        // Validate URL
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(url);
        } catch {
            return NextResponse.json(
                { error: 'Invalid URL format' },
                { status: 400 }
            );
        }

        // Fetch the article
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch URL: ${response.status} ${response.statusText}` },
                { status: 400 }
            );
        }

        const html = await response.text();

        // Extract article content (simplified extraction)
        const { title, content, author, publishedDate } = extractArticleContent(html, parsedUrl.hostname);

        return NextResponse.json({
            url,
            title: title || parsedUrl.hostname,
            content,
            author,
            publishedDate,
            fetchedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Article fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch article' },
            { status: 500 }
        );
    }
}

interface ArticleData {
    title: string;
    content: string;
    author?: string;
    publishedDate?: string;
}

/**
 * Extract article content from HTML
 * This is a simplified extraction - production would use a proper 
 * library like Mozilla Readability or Postlight Mercury
 */
function extractArticleContent(html: string, hostname: string): ArticleData {
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    let title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : '';

    // Try to get OG title if available
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    if (ogTitleMatch) {
        title = decodeHtmlEntities(ogTitleMatch[1]);
    }

    // Try to extract author
    let author: string | undefined;
    const authorMatch = html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i);
    if (authorMatch) {
        author = decodeHtmlEntities(authorMatch[1]);
    }

    // Try to extract published date
    let publishedDate: string | undefined;
    const dateMatch = html.match(/<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i);
    if (dateMatch) {
        publishedDate = dateMatch[1];
    }

    // Extract main content
    let content = '';

    // Try to find article or main content
    const articlePatterns = [
        /<article[^>]*>([\s\S]*?)<\/article>/gi,
        /<main[^>]*>([\s\S]*?)<\/main>/gi,
        /<div[^>]*class=["'][^"']*(?:content|article|post|entry)[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
    ];

    for (const pattern of articlePatterns) {
        const match = pattern.exec(html);
        if (match && match[1]) {
            content = match[1];
            break;
        }
    }

    // If no article found, try body
    if (!content) {
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) {
            content = bodyMatch[1];
        }
    }

    // Clean up the content
    content = cleanHtmlContent(content);

    return {
        title,
        content,
        author,
        publishedDate,
    };
}

/**
 * Clean HTML content for reading
 */
function cleanHtmlContent(html: string): string {
    let cleaned = html;

    // Remove script and style tags with their content
    cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, '');
    cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, '');
    cleaned = cleaned.replace(/<noscript[\s\S]*?<\/noscript>/gi, '');

    // Remove comments
    cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

    // Remove common non-content elements
    const removePatterns = [
        /<nav[\s\S]*?<\/nav>/gi,
        /<header[\s\S]*?<\/header>/gi,
        /<footer[\s\S]*?<\/footer>/gi,
        /<aside[\s\S]*?<\/aside>/gi,
        /<form[\s\S]*?<\/form>/gi,
        /<iframe[\s\S]*?<\/iframe>/gi,
        /<svg[\s\S]*?<\/svg>/gi,
    ];

    for (const pattern of removePatterns) {
        cleaned = cleaned.replace(pattern, '');
    }

    // Remove inline styles and event handlers
    cleaned = cleaned.replace(/\s+style=["'][^"']*["']/gi, '');
    cleaned = cleaned.replace(/\s+on\w+=["'][^"']*["']/gi, '');

    // Remove empty elements
    cleaned = cleaned.replace(/<(\w+)[^>]*>\s*<\/\1>/g, '');

    // Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&nbsp;': ' ',
        '&mdash;': '—',
        '&ndash;': '–',
        '&hellip;': '…',
    };

    let decoded = text;
    for (const [entity, char] of Object.entries(entities)) {
        decoded = decoded.replace(new RegExp(entity, 'g'), char);
    }

    // Handle numeric entities
    decoded = decoded.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
    decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

    return decoded;
}
