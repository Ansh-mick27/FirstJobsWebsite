import { adminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

/**
 * GET /api/questions
 * Query params: ?companyId=<id>&round=<oa|technical|hr>&type=<mcq|coding|subjective>&roleId=<id>
 *
 * Returns questions from /companies/{companyId}/questions subcollection.
 * If roleId is provided, returns questions for that specific role PLUS questions
 * with no roleId (legacy / "all-roles" questions).
 * correctAnswer and solution are NEVER returned — only sent after test submission.
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const round = searchParams.get('round') || '';
    const type = searchParams.get('type') || '';
    const roleId = searchParams.get('roleId') || '';

    if (!companyId) {
        return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    try {
        const questionsRef = adminDb.collection('companies').doc(companyId).collection('questions');

        // Build base query — filter by round and type first
        let baseQuery = questionsRef;
        if (round) baseQuery = baseQuery.where('round', '==', round);
        if (type) baseQuery = baseQuery.where('type', '==', type);

        let questions = [];

        if (roleId) {
            // Fetch role-specific questions + "all-roles" questions (roleId == null or missing)
            // Firestore doesn't support OR on different fields, so we run two queries and merge
            const [roleSnap, noRoleSnap] = await Promise.all([
                baseQuery.where('roleId', '==', roleId).get(),
                baseQuery.where('roleId', '==', '').get(),        // explicitly "all roles"
            ]);
            // Also get docs where roleId field doesn't exist (legacy questions)
            const allSnap = await baseQuery.get();
            const legacyDocs = allSnap.docs.filter(doc => doc.data().roleId === undefined);

            const seen = new Set();
            const merge = (docs) => docs.forEach(doc => {
                if (!seen.has(doc.id)) {
                    seen.add(doc.id);
                    const q = { id: doc.id, ...doc.data() };
                    delete q.correctAnswer;
                    delete q.solution;
                    questions.push(q);
                }
            });
            merge(roleSnap.docs);
            merge(noRoleSnap.docs);
            merge(legacyDocs);
        } else {
            // No roleId filter — return everything
            const snapshot = await baseQuery.get();
            questions = snapshot.docs.map(doc => {
                const q = { id: doc.id, ...doc.data() };
                delete q.correctAnswer;
                delete q.solution;
                return q;
            });
        }

        return NextResponse.json(questions);
    } catch (error) {
        console.error('[GET /api/questions]', error);
        return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }
}
