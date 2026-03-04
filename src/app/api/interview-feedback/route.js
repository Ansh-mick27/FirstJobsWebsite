import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * POST /api/interview-feedback
 * Body: { sessionId, userId, messages, roundType, companyName }
 * Returns: { feedback: AIFeedback }
 */
export async function POST(request) {
    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { sessionId, userId, messages, roundType = 'technical', companyName = 'the company' } = body;

    if (!messages?.length) {
        return NextResponse.json({ error: 'messages are required' }, { status: 400 });
    }

    // Build a clean readable transcript
    const qaExchanges = [];
    let currentQ = null;
    for (const m of messages.filter(m => m.role !== 'system')) {
        if (m.role === 'assistant') {
            currentQ = m.content;
        } else if (m.role === 'user' && currentQ) {
            qaExchanges.push({ question: currentQ, answer: m.content });
            currentQ = null;
        }
    }

    const transcript = messages
        .filter(m => m.role !== 'system')
        .map(m => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`)
        .join('\n');

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `You are an expert interview coach reviewing a ${roundType} round campus placement interview at ${companyName}.
Analyze the candidate's performance and return a structured JSON feedback object with EXACTLY these fields:
{
  "score": <integer 1-10>,
  "hiringDecision": <"Strong Yes" | "Yes" | "Maybe" | "No">,
  "overallSummary": "<2-3 sentence honest, specific summary>",
  "strengths": ["<specific strength>", ...],
  "weaknesses": ["<specific area to improve>", ...],
  "suggestions": ["<specific actionable advice>", ...],
  "questionBreakdown": [
    { "question": "<interviewer question>", "rating": <1-5>, "comment": "<one sentence feedback on the answer>" },
    ...
  ]
}
Rules:
- questionBreakdown must cover every question-answer pair in the transcript.
- Be specific and reference the candidate's actual answers, not generic advice.
- hiringDecision: "Strong Yes" = 9-10, "Yes" = 7-8, "Maybe" = 5-6, "No" = 1-4.
- Return ONLY valid JSON, no markdown, no explanation.`,
                },
                {
                    role: 'user',
                    content: `Interview transcript:\n\n${transcript}\n\nProvide detailed structured feedback.`,
                },
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.4,
            max_tokens: 1500,
            response_format: { type: 'json_object' },
        });

        let feedback;
        try {
            feedback = JSON.parse(completion.choices[0]?.message?.content || '{}');
        } catch {
            return NextResponse.json({ error: 'AI returned invalid JSON feedback' }, { status: 502 });
        }

        // Persist to Firestore if we have identifiers
        if (userId && sessionId && sessionId !== 'local') {
            try {
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
            } catch (firestoreErr) {
                console.warn('[interview-feedback] Firestore update failed:', firestoreErr.message);
            }
        }

        return NextResponse.json({ feedback });
    } catch (error) {
        console.error('[POST /api/interview-feedback]', error);
        return NextResponse.json({ error: 'Failed to generate interview feedback' }, { status: 500 });
    }
}
