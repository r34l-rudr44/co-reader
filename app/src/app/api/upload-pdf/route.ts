import { put, del } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const documentId = formData.get('documentId') as string;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        if (!documentId) {
            return NextResponse.json(
                { error: 'No document ID provided' },
                { status: 400 }
            );
        }

        // Validate file type
        if (!file.type.includes('pdf')) {
            return NextResponse.json(
                { error: 'Only PDF files are allowed' },
                { status: 400 }
            );
        }

        // Check file size (10MB limit for Vercel Blob free tier)
        const MAX_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { error: `File too large. Maximum size is 10MB.` },
                { status: 400 }
            );
        }

        // Upload to Vercel Blob
        const blob = await put(`pdfs/${documentId}.pdf`, file, {
            access: 'public',
            addRandomSuffix: false,
        });

        return NextResponse.json({
            success: true,
            url: blob.url,
            documentId,
        });
    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to upload file' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const url = searchParams.get('url');

        if (!url) {
            return NextResponse.json(
                { error: 'No URL provided' },
                { status: 400 }
            );
        }

        await del(url);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete file' },
            { status: 500 }
        );
    }
}
