import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * POST /api/test-submit
 * Body: { userId, companyId, companySlug, companyName, roundType, answers: {questionId: answer}, timeTaken }
 *
 * Requires Authorization: Bearer <idToken> header.
 *
 * Flow:
 * 1. Verify Firebase ID token
 * 2. Fetch all questions for the company+round from Firestore (with correctAnswer)
 * 3. Score client's submitted answers
 * 4. Save attempt to /users/{userId}/testAttempts
 * 5. Return: { score, totalQuestions, results: [{questionId, correct, correctAnswer, explanation}] }
 */
export async function POST(request) {
    // ── 1. Auth verification ──────────────────────────────────────────────────
    const authHeader = request.headers.get('Authorization') || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!idToken) {
        return NextResponse.json({ error: 'Missing Authorization token' }, { status: 401 });
    }

    let verifiedUid;
    try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        verifiedUid = decoded.uid;
    } catch {
        return NextResponse.json({ error: 'Invalid or expired auth token' }, { status: 401 });
    }

    // ── 2. Parse body ─────────────────────────────────────────────────────────
    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { userId, companyId, companySlug, companyName, roundType, answers = {}, timeTaken = 0 } = body;

    if (!userId || !companyId || !roundType) {
        return NextResponse.json({ error: 'userId, companyId, and roundType are required' }, { status: 400 });
    }

    // Token UID must match submitted userId
    if (verifiedUid !== userId) {
        return NextResponse.json({ error: 'Unauthorized: userId mismatch' }, { status: 403 });
    }

    try {
        // ── 3. Fetch questions (with correctAnswer) ───────────────────────────────
        const questionsSnapshot = await adminDb
            .collection('companies')
            .doc(companyId)
            .collection('questions')
            .where('round', '==', roundType)
            .where('type', '==', 'mcq') // only score MCQs automatically
            .get();

        const questions = questionsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        if (questions.length === 0) {
            return NextResponse.json({ error: 'No MCQ questions found for this round' }, { status: 404 });
        }

        // ── 4. Score answers ──────────────────────────────────────────────────────
        let score = 0;
        const results = questions.map((q) => {
            const submitted = answers[q.id];
            const correct = submitted !== undefined && submitted === q.correctAnswer;
            if (correct) score++;
            return {
                questionId: q.id,
                correct,
                correctAnswer: q.correctAnswer,  // now safe to reveal
                explanation: q.explanation || null,
                submittedAnswer: submitted ?? null,
            };
        });

        // ── 5. Save attempt to Firestore ─────────────────────────────────────────
        const attemptRef = adminDb
            .collection('users')
            .doc(userId)
            .collection('testAttempts')
            .doc();

        await attemptRef.set({
            companyId,
            companyName: companyName || '',
            companySlug: companySlug || '',
            roundType,
            score,
            totalQuestions: questions.length,
            timeTaken,
            answers,
            completedAt: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ score, totalQuestions: questions.length, results, attemptId: attemptRef.id });
    } catch (error) {
        console.error('[POST /api/test-submit]', error);
        return NextResponse.json({ error: 'Failed to submit test' }, { status: 500 });
    }
}
