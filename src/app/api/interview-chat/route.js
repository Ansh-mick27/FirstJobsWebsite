import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Company-specific interview focus areas
const COMPANY_HINTS = {
    tcs: 'TCS focuses heavily on CGPA, logical reasoning, and basic CS fundamentals. They care about communication and culture fit.',
    infosys: 'Infosys emphasizes logical reasoning, DBMS, and system design basics. They look for problem-solving mindset.',
    wipro: 'Wipro tests verbal ability, logical reasoning, and basic programming. Communication skills are key.',
    accenture: 'Accenture focuses on aptitude, communication, and cloud/technology awareness.',
    cognizant: 'Cognizant (CTS) tests reasoning, coding basics, and teamwork-oriented behavioral questions.',
    capgemini: 'Capgemini focuses on pseudo-code, logical reasoning, and cloud concepts.',
    amazon: 'Amazon uses Leadership Principles heavily. Expect behavioral STAR questions and DSA problems.',
    google: 'Google focuses on algorithmic problem-solving, time/space complexity, and system design at senior levels.',
    microsoft: 'Microsoft tests DSA, OOP design, and behavioral questions tied to growth mindset and collaboration.',
    flipkart: 'Flipkart focuses on DSA (graphs, DP), system design, and product sense.',
    bajaj: 'Bajaj Finserv focuses on finance/analytics awareness, SQL, and communication.',
};

function getCompanyHint(companyName = '') {
    const slug = companyName.toLowerCase().replace(/\s+/g, '');
    return Object.entries(COMPANY_HINTS).find(([key]) => slug.includes(key))?.[1] || null;
}

const ROUND_INSTRUCTIONS = {
    technical:
        'Ask about DSA, system design, OOP, OS, DBMS, and CS fundamentals. Start easy and increase difficulty based on candidate responses. Always follow up weak answers with a simpler clarifying question before moving on.',
    hr:
        'Ask behavioral and situational questions using the STAR method (Situation, Task, Action, Result). Focus on communication, teamwork, leadership, career goals, and salary expectations.',
    managerial:
        'Ask about leadership experience, conflict resolution, project management, stakeholder communication, and decision-making under pressure. Focus on real-world scenarios from their experience.',
};

/**
 * POST /api/interview-chat
 * Body: { messages, companyName, roundType, sessionId, userId, companyId, companySlug, isComplete }
 * Returns: { reply: string, sessionId: string, isComplete: boolean }
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

        const companyHint = getCompanyHint(companyName);
        const questionCount = messages.filter(m => m.role === 'assistant').length;

        // ── Build system prompt ─────────────────────────────────────────────────
        const systemPrompt = {
            role: 'system',
            content: `You are a professional interviewer at ${companyName || 'a top tech company'} conducting a ${roundType} round campus placement interview.

${companyHint ? `Company context: ${companyHint}` : ''}

Rules:
1. Ask ONE question at a time. Never ask multiple questions in one message.
2. Keep responses concise (2-4 sentences max). Acknowledge the candidate's answer briefly before asking the next question.
3. You are on question ${questionCount + 1} of 7. After exactly 7 questions (when you have asked 7 questions total), end the interview by saying EXACTLY: "That concludes our interview. Thank you for your time!" — do not ask any more questions after this.
4. Do NOT give feedback during the interview.
5. ${ROUND_INSTRUCTIONS[roundType] || ROUND_INSTRUCTIONS.technical}
6. On your first message, warmly welcome the candidate to the ${companyName || 'company'} interview and ask your first question immediately.
7. IMPORTANT: After your final closing statement, add this hidden marker at the very end: [INTERVIEW_COMPLETE]`,
        };

        const apiMessages = [systemPrompt, ...messages];

        // ── Call Groq (with Cerebras fallback) ─────────────────────────────────
        let aiMessage = '';

        try {
            const chatCompletion = await groq.chat.completions.create({
                messages: apiMessages,
                model: 'llama-3.3-70b-versatile',
                temperature: 0.7,
                max_tokens: 400,
                stream: false,
            });
            aiMessage = chatCompletion.choices[0]?.message?.content || '';
        } catch (groqError) {
            console.warn('[interview-chat] Groq failed, trying Cerebras:', groqError.message);
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
                    max_tokens: 400,
                }),
            });
            if (!cerebrasRes.ok) {
                throw new Error(`Cerebras fallback failed: ${cerebrasRes.status}`);
            }
            const cerebrasData = await cerebrasRes.json();
            aiMessage = cerebrasData.choices[0]?.message?.content || '';
        }

        if (!aiMessage) {
            aiMessage = "I'm sorry, I didn't catch that. Could you please repeat your answer?";
        }

        // ── Detect interview completion via marker ──────────────────────────────
        const interviewComplete = aiMessage.includes('[INTERVIEW_COMPLETE]');
        // Strip the marker from the displayed text
        const cleanReply = aiMessage.replace('[INTERVIEW_COMPLETE]', '').trim();

        // ── Persist session to Firestore ────────────────────────────────────────
        let resolvedSessionId = sessionId;

        if (userId) {
            const sessionsRef = adminDb.collection('users').doc(userId).collection('interviewSessions');
            const newMessage = {
                role: 'assistant',
                content: cleanReply,
                timestamp: new Date().toISOString(),
            };

            if (!resolvedSessionId) {
                const docRef = await sessionsRef.add({
                    companyId: companyId || '',
                    companyName: companyName || '',
                    companySlug: companySlug || '',
                    roundType,
                    messages: [
                        ...messages.slice(-1).map(m => ({ ...m, timestamp: new Date().toISOString() })),
                        { ...newMessage, timestamp: new Date().toISOString() },
                    ],
                    aiFeedback: null,
                    isComplete: false,
                    completedAt: null,
                    startedAt: new Date().toISOString(),
                });
                resolvedSessionId = docRef.id;
            } else {
                const sessionRef = sessionsRef.doc(resolvedSessionId);
                const updates = {
                    messages: FieldValue.arrayUnion(
                        ...messages.slice(-1).map(m => ({ ...m, timestamp: new Date().toISOString() })),
                        { ...newMessage, timestamp: new Date().toISOString() }
                    ),
                };
                if (interviewComplete || isComplete) {
                    updates.isComplete = true;
                    updates.completedAt = FieldValue.serverTimestamp();
                }
                await sessionRef.update(updates);
            }
        }

        return NextResponse.json({ reply: cleanReply, sessionId: resolvedSessionId, isComplete: interviewComplete });
    } catch (error) {
        console.error('[POST /api/interview-chat]', error);
        return NextResponse.json({ error: 'Failed to process interview chat' }, { status: 500 });
    }
}
