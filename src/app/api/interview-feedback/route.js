import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * POST /api/interview-feedback
 * Body: { sessionId, userId, messages, roundType, companyName, hesitations }
 * Returns: { feedback: AIFeedback }
 */
export async function POST(request) {
    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const {
        sessionId,
        userId,
        messages,
        roundType = 'technical',
        companyName = 'the company',
        hesitations = [],   // [{ questionIndex, delaySeconds }]
    } = body;

    if (!messages?.length) {
        return NextResponse.json({ error: 'messages are required' }, { status: 400 });
    }

    // Build clean Q&A pairs
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

    // Build hesitation context for the AI
    const hesitationContext = hesitations.length > 0
        ? `\n\nHesitation data (time from AI question to candidate's first response action):\n${hesitations.map(h => `- Question #${h.questionIndex + 1}: ${Math.round(h.delaySeconds)} seconds before responding`).join('\n')
        }\nA delay >12 seconds typically indicates the candidate was uncertain or needed to think. Factor this into your analysis — significant hesitation on multiple questions should reduce the score. Note it explicitly in the overallSummary or weaknesses if relevant.`
        : '';

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `You are a senior interview coach at a top tech company reviewing a ${roundType} round campus placement interview at ${companyName}.
Analyze the candidate's performance holistically and return a structured JSON feedback object with EXACTLY these fields:
{
  "score": <integer 1-10>,
  "communicationScore": <integer 1-10>,
  "communicationFeedback": "<2-3 sentences analyzing HOW the candidate communicated: answer structure (did they use STAR or clear frameworks?), conciseness vs. rambling, confidence indicators (direct statements vs. constant hedging like 'I think maybe...'), and vocabulary clarity. Be specific — reference actual patterns from the transcript>",
  "hiringDecision": <"Strong Yes" | "Yes" | "Maybe" | "No">,
  "overallSummary": "<2-3 sentence honest, specific, human-sounding summary — reference what the candidate actually said>",
  "strengths": ["<specific, concrete strength referenced from the interview>", ...],
  "weaknesses": ["<specific, actionable area to improve>", ...],
  "suggestions": ["<specific, practical advice the candidate can act on before their next interview>", ...],
  "questionBreakdown": [
    { "question": "<interviewer question>", "rating": <1-5>, "comment": "<one specific sentence about this answer — be honest, not generic>", "expectedAnswer": "<2-3 sentence ideal answer a strong candidate would give for this question>" },
    ...
  ]
}
Content scoring guide (score field):
- 9-10 → Strong Yes (exceptional answers, confident, specific)
- 7-8 → Yes (solid answers with minor gaps)
- 5-6 → Maybe (some good points but significant gaps or vague answers)
- 1-4 → No (consistently weak, vague, or off-topic answers)

Communication scoring guide (communicationScore field):
- 9-10: Structured, concise, specific — clear frameworks, direct confident statements
- 7-8: Mostly clear with minor wandering or occasional hedging
- 5-6: Noticeable structure issues — answers wander, key points buried, frequent hedging
- 1-4: Very hard to follow, extensively vague or rambling

Rules:
- questionBreakdown must include every Q&A pair from the transcript. Each entry must include expectedAnswer.
- Be SPECIFIC — reference the candidate's actual words/answers, not generic platitudes.
- If hesitation data is provided, factor it into your score and mention it where relevant.
- Strengths and weaknesses should each have 2-4 items.
- Suggestions should be 2-4 practical, specific actions.
- Return ONLY valid JSON. No markdown, no explanation, no code fences.`,
                },
                {
                    role: 'user',
                    content: `Interview transcript:\n\n${transcript}${hesitationContext}\n\nProvide detailed structured feedback.`,
                },
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.35,
            max_tokens: 2400,
            response_format: { type: 'json_object' },
        });

        let feedback;
        try {
            feedback = JSON.parse(completion.choices[0]?.message?.content || '{}');
        } catch {
            return NextResponse.json({ error: 'AI returned invalid JSON feedback' }, { status: 502 });
        }

        // Persist to Firestore
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
                    completedAt: new Date().toISOString(),
                    hesitations,
                });
            } catch (firestoreErr) {
                console.warn('[interview-feedback] Firestore update failed:', firestoreErr.message);
            }
        }

        // F7: Fetch past scores for performance trend (last 3 completed sessions, same company+round)
        let previousScores = [];
        if (userId && userId !== 'guest' && companyName && roundType && sessionId !== 'local') {
            try {
                const snap = await adminDb
                    .collection('users').doc(userId)
                    .collection('interviewSessions')
                    .where('companyName', '==', companyName)
                    .where('roundType', '==', roundType)
                    .where('isComplete', '==', true)
                    .orderBy('completedAt', 'desc')
                    .limit(8)
                    .get();
                snap.forEach(doc => {
                    if (doc.id !== sessionId && previousScores.length < 3) {
                        const s = doc.data()?.aiFeedback?.score;
                        if (typeof s === 'number') previousScores.push(s);
                    }
                });
                previousScores.reverse(); // oldest → newest
            } catch { /* non-critical — trend is optional */ }
        }
        feedback.previousScores = previousScores;

        return NextResponse.json({ feedback });
    } catch (error) {
        console.error('[POST /api/interview-feedback]', error);
        return NextResponse.json({ error: 'Failed to generate interview feedback' }, { status: 500 });
    }
}
