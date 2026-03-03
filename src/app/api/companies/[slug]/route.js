import { adminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

/**
 * GET /api/companies/[slug]
 * Returns company data + questions array grouped by round type.
 * Questions are returned WITHOUT correctAnswer (security — only returned post-submission).
 */
export async function GET(request, { params }) {
    try {
        const { slug } = await params;

        // Firestore doesn't support unique-by-field lookups natively — query by slug field
        const companiesRef = adminDb.collection('companies');
        const snapshot = await companiesRef.where('slug', '==', slug).limit(1).get();

        if (snapshot.empty) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        const companyDoc = snapshot.docs[0];
        const company = { id: companyDoc.id, ...companyDoc.data() };

        // Fetch all questions in the subcollection
        const questionsSnapshot = await companyDoc.ref.collection('questions').get();

        const questions = questionsSnapshot.docs.map((doc) => {
            const q = { id: doc.id, ...doc.data() };
            // Strip correctAnswer — never send to client
            delete q.correctAnswer;
            delete q.solution;
            return q;
        });

        // Group questions by round
        const questionsByRound = {
            oa: questions.filter((q) => q.round === 'oa'),
            technical: questions.filter((q) => q.round === 'technical'),
            hr: questions.filter((q) => q.round === 'hr'),
        };

        return NextResponse.json({ ...company, questions, questionsByRound });
    } catch (error) {
        console.error('[GET /api/companies/[slug]]', error);
        return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 });
    }
}
