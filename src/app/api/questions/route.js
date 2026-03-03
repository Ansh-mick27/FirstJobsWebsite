import { adminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

/**
 * GET /api/questions
 * Query params: ?companyId=<id>&round=<oa|technical|hr>&type=<mcq|coding|subjective>
 *
 * Returns questions from /companies/{companyId}/questions subcollection.
 * correctAnswer and solution are NEVER returned — only sent after test submission.
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const round = searchParams.get('round') || '';
    const type = searchParams.get('type') || '';

    if (!companyId) {
        return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    try {
        let query = adminDb.collection('companies').doc(companyId).collection('questions');

        if (round) query = query.where('round', '==', round);
        if (type) query = query.where('type', '==', type);

        const snapshot = await query.get();

        const questions = snapshot.docs.map((doc) => {
            const q = { id: doc.id, ...doc.data() };
            // Strip sensitive fields — never expose to client before submission
            delete q.correctAnswer;
            delete q.solution;
            return q;
        });

        return NextResponse.json(questions);
    } catch (error) {
        console.error('[GET /api/questions]', error);
        return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }
}
