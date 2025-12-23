import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// GET all documents or single document by ID
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            // Get single document
            const result = await sql`
                SELECT id, title, source_type, source_path, created_at
                FROM documents 
                WHERE id = ${id}
            `;

            if (result.rows.length === 0) {
                return NextResponse.json({ error: 'Document not found' }, { status: 404 });
            }

            return NextResponse.json(result.rows[0]);
        } else {
            // Get all documents
            const result = await sql`
                SELECT id, title, source_type, source_path, created_at
                FROM documents 
                ORDER BY created_at DESC
            `;

            return NextResponse.json(result.rows);
        }
    } catch (error: any) {
        console.error('Get documents error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get documents' },
            { status: 500 }
        );
    }
}

// POST create new document
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, sourceType, sourcePath } = body;

        if (!title || !sourceType || !sourcePath) {
            return NextResponse.json(
                { error: 'Missing required fields: title, sourceType, sourcePath' },
                { status: 400 }
            );
        }

        const id = uuidv4();

        await sql`
            INSERT INTO documents (id, title, source_type, source_path)
            VALUES (${id}, ${title}, ${sourceType}, ${sourcePath})
        `;

        const result = await sql`
            SELECT id, title, source_type, source_path, created_at
            FROM documents 
            WHERE id = ${id}
        `;

        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error: any) {
        console.error('Create document error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create document' },
            { status: 500 }
        );
    }
}

// PUT update document
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, title, sourcePath } = body;

        if (!id) {
            return NextResponse.json({ error: 'Missing document ID' }, { status: 400 });
        }

        if (title) {
            await sql`UPDATE documents SET title = ${title} WHERE id = ${id}`;
        }

        if (sourcePath) {
            await sql`UPDATE documents SET source_path = ${sourcePath} WHERE id = ${id}`;
        }

        const result = await sql`
            SELECT id, title, source_type, source_path, created_at
            FROM documents 
            WHERE id = ${id}
        `;

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        return NextResponse.json(result.rows[0]);
    } catch (error: any) {
        console.error('Update document error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update document' },
            { status: 500 }
        );
    }
}

// DELETE document
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing document ID' }, { status: 400 });
        }

        await sql`DELETE FROM documents WHERE id = ${id}`;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete document error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete document' },
            { status: 500 }
        );
    }
}
