import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * POST /api/interview-feedback
 * Body: { sessionId, userId, messages }
 *
 * Generates structured AI feedback for a completed interview session
 * and saves it to /users/{userId}/interviewSessions/{sessionId}.
 *
 * Returns: { feedback: AIFeedback }
 */
export async function POST(request) {
    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { sessionId, userId, messages } = body;

    if (!sessionId || !userId || !messages?.length) {
        return NextResponse.json(
            { error: 'sessionId, userId, and messages are required' },
            { status: 400 }
        );
    }

    // Build a readable transcript for the AI
    const transcript = messages
        .filter((m) => m.role !== 'system')
        .map((m) => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`)
        .join('\n');

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `You are an expert interview coach reviewing a campus placement interview transcript.
Analyze the candidate's performance and return a structured JSON feedback object with exactly these fields:
{
  "score": <number 1-10>,
  "strengths": [<string>, ...],
  "weaknesses": [<string>, ...],
  "suggestions": [<string>, ...],
  "overallSummary": "<2-3 sentence summary>"
}
Be specific, constructive, and actionable. Return ONLY valid JSON, no markdown.`,
                },
                {
                    role: 'user',
                    content: `Here is the interview transcript:\n\n${transcript}\n\nProvide detailed feedback.`,
                },
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.5,
            max_tokens: 1000,
            response_format: { type: 'json_object' },
        });

        let feedback;
        try {
            feedback = JSON.parse(completion.choices[0]?.message?.content || '{}');
        } catch {
            return NextResponse.json({ error: 'AI returned invalid JSON feedback' }, { status: 502 });
        }

        // Save feedback + mark session complete in Firestore
        const sessionRef = adminDb
            .collection('users')
            .doc(userId)
            .collection('interviewSessions')
            .doc(sessionId);

        await sessionRef.update({
            aiFeedback: feedback,
            isComplete: true,
            completedAt: new Date(),
        });

        return NextResponse.json({ feedback });
    } catch (error) {
        console.error('[POST /api/interview-feedback]', error);
        return NextResponse.json({ error: 'Failed to generate interview feedback' }, { status: 500 });
    }
}
