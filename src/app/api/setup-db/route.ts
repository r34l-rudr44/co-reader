import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Create documents table
        await sql`
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                source_type TEXT NOT NULL,
                source_path TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `;

        // Create highlights table
        await sql`
            CREATE TABLE IF NOT EXISTS highlights (
                id TEXT PRIMARY KEY,
                document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
                type TEXT NOT NULL,
                text TEXT NOT NULL,
                anchor JSONB NOT NULL,
                note TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `;

        // Create vocabulary table
        await sql`
            CREATE TABLE IF NOT EXISTS vocabulary (
                id TEXT PRIMARY KEY,
                word TEXT NOT NULL,
                definition TEXT,
                context_sentence TEXT,
                document_id TEXT REFERENCES documents(id) ON DELETE SET NULL,
                user_note TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `;

        // Create indexes
        await sql`CREATE INDEX IF NOT EXISTS idx_highlights_document ON highlights(document_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_vocabulary_document ON vocabulary(document_id)`;

        return NextResponse.json({
            success: true,
            message: 'Database tables created successfully'
        });
    } catch (error: any) {
        console.error('Database setup error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to setup database' },
            { status: 500 }
        );
    }
}
