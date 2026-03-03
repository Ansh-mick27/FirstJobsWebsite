import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * POST /api/interview-chat
 * Body: {
 *   messages: { role, content }[],   — conversation so far
 *   companyName: string,
 *   roundType: "hr" | "technical",
 *   sessionId: string | null,        — null = create new session
 *   userId: string,
 *   companyId: string,
 *   companySlug: string,
 *   isComplete?: boolean,            — true = mark session done (triggers feedback)
 * }
 *
 * Returns: { reply: string, sessionId: string }
 */
export async function POST(req) {
    try {
        const {
            messages,
            companyName,
            roundType = 'technical',
            sessionId,
            userId,
            companyId,
            companySlug,
            isComplete = false,
        } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Valid messages array is required' }, { status: 400 });
        }

        // ── Build system prompt ───────────────────────────────────────────────────
        const systemPrompt = {
            role: 'system',
            content: `You are a professional interviewer at ${companyName || 'a top tech company'} conducting a ${roundType} round campus placement interview.

Rules:
1. Ask ONE question at a time. Wait for the candidate's response before asking the next.
2. Keep responses concise (2-4 sentences max).
3. After 6-8 questions, say exactly: "That concludes our interview. Thank you for your time!" and stop asking questions.
4. Do NOT give feedback during the interview — save evaluation for after.
5. ${roundType === 'technical'
                    ? 'Ask about DSA, system design, OOP, OS, DBMS, and CS fundamentals. Start with basics and increase difficulty based on answers.'
                    : 'Ask behavioral, situational, and background questions. Focus on communication, teamwork, leadership, and career goals.'}
6. Start by welcoming the candidate to the ${companyName || 'company'} interview.`,
        };

        const apiMessages = [systemPrompt, ...messages];

        // ── Call Groq (with Cerebras fallback) ────────────────────────────────────
        let aiMessage = '';

        try {
            const chatCompletion = await groq.chat.completions.create({
                messages: apiMessages,
                model: 'llama-3.3-70b-versatile',
                temperature: 0.7,
                max_tokens: 500,
                stream: false,
            });
            aiMessage = chatCompletion.choices[0]?.message?.content;
        } catch (groqError) {
            console.warn('[interview-chat] Groq failed, trying Cerebras fallback:', groqError.message);

            const cerebrasRes = await fetch('https://api.cerebras.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${process.env.CEREBRAS_API_KEY}`,
                },
                body: JSON.stringify({
                    messages: apiMessages,
                    model: 'llama3.1-8b',
                    temperature: 0.7,
                    max_tokens: 500,
                }),
            });

            if (!cerebrasRes.ok) {
                const errText = await cerebrasRes.text();
                throw new Error(`Cerebras fallback failed: ${cerebrasRes.status} ${errText}`);
            }

            const cerebrasData = await cerebrasRes.json();
            aiMessage = cerebrasData.choices[0]?.message?.content;
        }

        if (!aiMessage) {
            aiMessage = "I'm sorry, I didn't catch that. Could you please repeat?";
        }

        // ── Persist session to Firestore (if userId provided) ────────────────────
        let resolvedSessionId = sessionId;

        if (userId) {
            const sessionsRef = adminDb.collection('users').doc(userId).collection('interviewSessions');
            const newMessage = {
                role: 'assistant',
                content: aiMessage,
                timestamp: FieldValue.serverTimestamp(),
            };

            if (!resolvedSessionId) {
                // New session — create document
                const docRef = await sessionsRef.add({
                    companyId: companyId || '',
                    companyName: companyName || '',
                    companySlug: companySlug || '',
                    roundType,
                    messages: [
                        // Include the last user message + AI reply
                        ...messages.slice(-1).map((m) => ({ ...m, timestamp: FieldValue.serverTimestamp() })),
                        newMessage,
                    ],
                    aiFeedback: null,
                    isComplete: false,
                    completedAt: null,
                    startedAt: FieldValue.serverTimestamp(),
                });
                resolvedSessionId = docRef.id;
            } else {
                // Existing session — append messages
                const sessionRef = sessionsRef.doc(resolvedSessionId);
                const updates = {
                    messages: FieldValue.arrayUnion(
                        ...messages.slice(-1).map((m) => ({ ...m, timestamp: FieldValue.serverTimestamp() })),
                        newMessage
                    ),
                };

                if (isComplete) {
                    updates.isComplete = true;
                    updates.completedAt = FieldValue.serverTimestamp();
                }

                await sessionRef.update(updates);
            }
        }

        return NextResponse.json({ reply: aiMessage, sessionId: resolvedSessionId });
    } catch (error) {
        console.error('[POST /api/interview-chat]', error);
        return NextResponse.json({ error: 'Failed to process interview chat' }, { status: 500 });
    }
}
