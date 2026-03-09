import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

/**
 * POST /api/feedback
 * Body: { category, message }
 * Auth: Bearer <Firebase ID token>
 * Saves feedback to the `feedback` Firestore collection.
 */
export async function POST(req) {
    try {
        const authHeader = req.headers.get('Authorization') || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

        let userId = 'anonymous';
        let email = '';

        if (token) {
            try {
                const decoded = await adminAuth.verifyIdToken(token);
                userId = decoded.uid;
                email = decoded.email || '';
            } catch {
                // token invalid — still save feedback, just anonymously
            }
        }

        const { category, message } = await req.json();

        if (!message?.trim()) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        await adminDb.collection('feedback').add({
            userId,
            email,
            category: category || 'General',
            message: message.trim(),
            createdAt: new Date().toISOString(),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[POST /api/feedback]', error);
        return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
    }
}
