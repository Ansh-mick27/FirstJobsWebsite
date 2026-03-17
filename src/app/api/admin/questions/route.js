import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';

function checkAdminKey(request) {
    const key = request.headers.get('x-admin-key');
    if (key !== process.env.ADMIN_API_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return null;
}

/**
 * POST /api/admin/questions
 * Body: full question object including companyId
 */
export async function POST(request) {
    const unauthorized = checkAdminKey(request);
    if (unauthorized) return unauthorized;

    try {
        const body = await request.json();
        const { companyId, text, type, round, year, difficulty, tags, isReal,
            options, correctAnswer, explanation, roleId,
            starterCode, solution, testCases } = body;

        if (!companyId || !text || !type || !round || !difficulty) {
            return NextResponse.json(
                { error: 'companyId, text, type, round, and difficulty are required' },
                { status: 400 }
            );
        }

        const questionData = {
            text,
            type,
            round,
            roleId: roleId || '',  // '' = all roles (legacy-compatible)
            year: year || new Date().getFullYear(),
            difficulty,
            tags: tags || [],
            isReal: isReal ?? true,
            // MCQ
            options: type === 'mcq' ? (options || []) : null,
            correctAnswer: type === 'mcq' ? (correctAnswer ?? null) : null,
            explanation: (type === 'mcq' || type === 'subjective') ? (explanation || null) : null,
            // Coding
            starterCode: type === 'coding' ? (starterCode || null) : null,
            solution: type === 'coding' ? (solution || null) : null,
            testCases: type === 'coding' ? (testCases || []) : null,
            createdAt: FieldValue.serverTimestamp(),
        };

        const docRef = await adminDb
            .collection('companies')
            .doc(companyId)
            .collection('questions')
            .add(questionData);

        // Increment question count on company
        await adminDb.collection('companies').doc(companyId).update({
            questionCount: FieldValue.increment(1),
        });

        return NextResponse.json({ id: docRef.id }, { status: 201 });
    } catch (error) {
        console.error('[POST /api/admin/questions]', error);
        return NextResponse.json({ error: 'Failed to add question' }, { status: 500 });
    }
}

/**
 * GET /api/admin/questions?companyId=xxx  → questions for one company
 * GET /api/admin/questions                → ALL questions (collectionGroup)
 * Returns ALL question fields (including correctAnswer/solution) for admin use.
 */
export async function GET(request) {
    const unauthorized = checkAdminKey(request);
    if (unauthorized) return unauthorized;

    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get('companyId');

        if (companyId) {
            // Single-company query
            const snapshot = await adminDb
                .collection('companies')
                .doc(companyId)
                .collection('questions')
                .get();
            const questions = snapshot.docs.map((doc) => ({ id: doc.id, companyId, ...doc.data() }));
            return NextResponse.json(questions);
        } else {
            // Global query across all companies via collection group
            const snapshot = await adminDb.collectionGroup('questions').get();
            const questions = snapshot.docs.map((doc) => {
                // Path: companies/{companyId}/questions/{questionId}
                const pathParts = doc.ref.path.split('/');
                const resolvedCompanyId = pathParts[1] || '';
                return { id: doc.id, companyId: resolvedCompanyId, ...doc.data() };
            });
            return NextResponse.json(questions);
        }
    } catch (error) {
        console.error('[GET /api/admin/questions]', error);
        return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }
}
