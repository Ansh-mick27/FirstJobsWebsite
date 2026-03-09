import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Company-specific interview personality & focus
const COMPANY_HINTS = {
    tcs: 'TCS places a strong emphasis on CGPA, logical reasoning, and core CS fundamentals like DBMS, OS, and networks. The culture is collaborative and process-driven — interviewers tend to be warm and methodical.',
    infosys: 'Infosys values analytical thinking, DBMS knowledge, and a structured communication style. Interviewers are professional but approachable, often probing to understand *how* the candidate thinks.',
    wipro: 'Wipro looks for strong verbal communication, logical aptitude, and basic programming skills. The interview tone is conversational and friendly.',
    accenture: 'Accenture looks for communication skills, tech awareness (cloud, AI), and a consulting mindset. Interviewers are friendly and encourage candidates to think out loud.',
    cognizant: 'Cognizant (CTS) values teamwork, reasoning ability, and basic coding. The tone is professional but collaborative — they love candidates who ask clarifying questions.',
    capgemini: 'Capgemini emphasizes pseudo-code logic, cloud concepts, and problem-solving approach. They appreciate candidates who explain their thinking step by step.',
    amazon: 'Amazon uses the Leadership Principles framework (14 principles like Customer Obsession, Ownership, Bias for Action). Expect heavy STAR-format behavioral questions alongside DSA problems.',
    google: 'Google interviews are highly technical — expect algorithmic problems with time/space complexity analysis, and open-ended system design. Interviewers are curious and like to explore the limits of your knowledge.',
    microsoft: 'Microsoft values DSA, OOP design patterns, and behavioral questions around growth mindset and collaboration. Expect to be challenged but also supported.',
    flipkart: 'Flipkart is strong on DSA (especially graphs and DP), system design, and product intuition. They value candidates who are direct and quantitative about their decisions.',
    bajaj: 'Bajaj Finserv focuses on finance/analytics awareness, SQL proficiency, and business communication. The tone is professional and formal.',
};

function getCompanyHint(companyName = '') {
    const slug = companyName.toLowerCase().replace(/\s+/g, '');
    return Object.entries(COMPANY_HINTS).find(([key]) => slug.includes(key))?.[1] || null;
}

// Question counts per round type
const QUESTION_COUNT = {
    technical: 10,
    hr: 7,
    managerial: 7,
};

// Round-specific interviewer personas and instructions
const ROUND_PERSONAS = {
    technical: `You are a senior software engineer conducting a technical screening. Your style is inquisitive and direct — you probe beyond surface answers to understand *depth of knowledge*. You're not harsh, but you don't accept vague answers. When a candidate struggles, you might simplify: "No worries, let's try it differently — what's the core idea behind...?" You occasionally think aloud a bit: "Interesting, okay..." or "Right, good point." Topics to cover: Data structures & algorithms, time/space complexity, OOP principles, OS concepts, DBMS & SQL, system design basics, networking, and a couple of tricky logical reasoning or code walkthrough questions. Vary difficulty — start moderate, push harder in the middle section, then close with something conceptual.`,

    hr: `You are an experienced HR recruiter conducting a behavioral round. Your style is warm, empathetic, and conversational — like a professional colleague, not a robot. You use natural filler phrases occasionally: "That's a great perspective," or "I appreciate your honesty." You ask exactly ONE follow-up probing question per major answer (e.g., "And what did you learn from that?" or "How did the team respond?"). You MUST begin by asking the candidate to introduce themselves — this is your FIRST question, always. After the introduction, ask about teamwork, conflict handling, career goals, strengths/weaknesses, and why they want to join this company. Salary/CTC expectations come last.`,

    managerial: `You are a senior manager or department head conducting a managerial round. Your style is thoughtful and scenario-driven — you paint real-world situations and ask how the candidate would handle them. You're evaluating leadership instincts, not just textbook answers. Phrases you might use: "Interesting — and what would you have done if the stakeholder hadn't agreed?" or "Walk me through your thought process there." You MUST begin by asking the candidate to introduce themselves and briefly describe their background — this is your FIRST question, always. Then cover: leadership approach, conflict resolution, cross-functional collaboration, handling failure/pressure, and decision-making under ambiguity.`,
};

/**
 * Fetch questions already asked in past completed sessions for this user+company+roundType.
 * Returns an array of question strings (deduped, max 30).
 */
async function fetchPastQuestions(userId, companySlug, roundType) {
    if (!userId || !companySlug) return [];
    try {
        const sessionsRef = adminDb
            .collection('users')
            .doc(userId)
            .collection('interviewSessions');

        const snapshot = await sessionsRef
            .where('companySlug', '==', companySlug)
            .where('roundType', '==', roundType)
            .where('isComplete', '==', true)
            .orderBy('completedAt', 'desc')
            .limit(3)   // last 3 completed sessions
            .get();

        const questions = [];
        snapshot.forEach(doc => {
            const msgs = doc.data().messages || [];
            msgs
                .filter(m => m.role === 'assistant')
                .forEach(m => {
                    // Strip the opening/closing pleasantries — keep just the core question sentence
                    const q = m.content?.trim();
                    if (q && q.length > 20 && !questions.includes(q)) {
                        questions.push(q);
                    }
                });
        });

        return questions.slice(0, 30); // cap at 30 to keep prompt size reasonable
    } catch (err) {
        console.warn('[interview-chat] fetchPastQuestions failed:', err.message);
        return [];
    }
}

/**
 * POST /api/interview-chat
 * Body: { messages, companyName, roundType, sessionId, userId, companyId, companySlug, isComplete, hesitations }
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
            roleId,
            isComplete = false,
            hesitations = [],       // array of { questionIndex, delaySeconds }
        } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Valid messages array is required' }, { status: 400 });
        }

        const companyHint = getCompanyHint(companyName);
        const aiTurns = messages.filter(m => m.role === 'assistant').length;
        const maxQuestions = QUESTION_COUNT[roundType] || 7;
        const persona = ROUND_PERSONAS[roundType] || ROUND_PERSONAS.technical;

        // ── Fetch past questions (only on first message of a new session) ─────────
        let pastQuestionsNote = '';
        let syllabusNote = '';
        if (messages.length === 0) {
            if (userId) {
                const pastQs = await fetchPastQuestions(userId, companySlug, roundType);
                if (pastQs.length > 0) {
                    pastQuestionsNote = `
IMPORTANT — Question Deduplication: This candidate has done this interview type before. The following questions (or very similar ones) were already asked in previous sessions. Do NOT repeat them verbatim or conceptually — ask about different topics/angles entirely:
${pastQs.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
                }
            }

            // Fetch syllabus: prefer role-level syllabus, fall back to company-level
            try {
                let companyDoc = null;
                if (companyId) {
                    companyDoc = await adminDb.collection('companies').doc(companyId).get();
                } else if (companySlug) {
                    const snap = await adminDb.collection('companies').where('slug', '==', companySlug).limit(1).get();
                    if (!snap.empty) companyDoc = snap.docs[0];
                }

                let syllabusTopics = [];

                // 1. Try role-level syllabus if roleId is provided
                if (roleId && companyDoc && companyDoc.exists) {
                    const roleDoc = await companyDoc.ref.collection('roles').doc(roleId).get();
                    if (roleDoc.exists) {
                        syllabusTopics = roleDoc.data()?.syllabus?.topics || [];
                    }
                }

                // 2. Fallback to company-level syllabus
                if (syllabusTopics.length === 0 && companyDoc && companyDoc.exists) {
                    syllabusTopics = companyDoc.data()?.syllabus?.topics || [];
                }

                if (syllabusTopics.length > 0) {
                    syllabusNote = `
Syllabus context for this company: The following topics were curated by the admin as key preparation areas for ${companyName || 'this company'}. Weight your ${roundType} interview questions to cover these topics, especially the ones marked with higher study hours:
${syllabusTopics.map(t => `• ${t.name}${t.studyHours ? ` (${t.studyHours}h prep)` : ''}${t.description ? ` — ${t.description}` : ''}`).join('\n')}
Expected syllabus alignment: 60-70% of your questions should tie back to these topics.`;
                }
            } catch (err) {
                console.warn('[interview-chat] Failed to fetch syllabus:', err.message);
            }
        }

        // Build hesitation note
        const hesitationNote = hesitations.length > 0
            ? `\nNote: The candidate showed noticeable hesitation (>12 seconds before responding) on question(s): ${hesitations.map(h => `Q${h.questionIndex + 1} (${Math.round(h.delaySeconds)}s delay)`).join(', ')}. This may indicate uncertainty or under-preparation on those topics.`
            : '';

        // ── Build system prompt ─────────────────────────────────────────────────
        const systemPrompt = {
            role: 'system',
            content: `${persona}

${companyHint ? `Company context: ${companyHint}` : ''}
${hesitationNote}
${syllabusNote}
${pastQuestionsNote}

You are currently on question #${aiTurns + 1} of ${maxQuestions} for this ${companyName || 'company'} ${roundType} interview.

Critical rules:
1. Ask ONLY ONE question per message. Never ask two questions in one message — not even as a follow-up.
2. Keep each response to 2-5 sentences. Acknowledge the previous answer with ONE natural reaction sentence before asking the next question.
3. Sound HUMAN. Use natural conversational language. Avoid robotic phrases like "Certainly!" or "Great answer!" — vary your reactions. Sometimes just pivot: "Alright, let's switch gears a bit." or "That's a solid foundation. Let me push a little further —"
4. Do NOT give explicit scores, ratings, or feedback during the interview. You may say things like "Got it." or "Noted." and move on.
5. You MUST ask exactly ${maxQuestions} questions in total. Do not end the interview early under any circumstances.
6. After exactly ${maxQuestions} questions have been asked and answered, close the interview warmly and naturally — something like "That's all I have for today. I really enjoyed our conversation — we'll be in touch soon!" Then add [INTERVIEW_COMPLETE] hidden at the very end of your message.
7. If an answer is very short or vague, briefly probe once: "Could you expand on that a bit?" or "Can you give me a specific example?"
8. IMPORTANT: Add [INTERVIEW_COMPLETE] only on your very last closing message, never before.`,
        };

        const apiMessages = [systemPrompt, ...messages];

        // ── Call Groq (with Cerebras fallback) ─────────────────────────────────
        let aiMessage = '';

        try {
            const chatCompletion = await groq.chat.completions.create({
                messages: apiMessages,
                model: 'llama-3.3-70b-versatile',
                temperature: 0.85,
                max_tokens: 350,
                stream: false,
            });
            aiMessage = chatCompletion.choices[0]?.message?.content || '';
        } catch (groqError) {
            console.warn('[interview-chat] Groq failed, trying Cerebras:', groqError.message);
            try {
                const cerebrasRes = await fetch('https://api.cerebras.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${process.env.CEREBRAS_API_KEY}`,
                    },
                    body: JSON.stringify({
                        messages: apiMessages,
                        model: 'llama3.1-8b',
                        temperature: 0.85,
                        max_tokens: 350,
                    }),
                });
                if (!cerebrasRes.ok) {
                    throw new Error(`Cerebras fallback failed: ${cerebrasRes.status}`);
                }
                const cerebrasData = await cerebrasRes.json();
                aiMessage = cerebrasData.choices[0]?.message?.content || '';
            } catch (fallbackError) {
                console.error('[interview-chat] Fallback also failed:', fallbackError);
            }
        }

        if (!aiMessage) {
            aiMessage = "Hmm, give me just a second... Could you repeat your last point? I want to make sure I got it right.";
        }

        // ── Detect interview completion via marker ──────────────────────────────
        const interviewComplete = aiMessage.includes('[INTERVIEW_COMPLETE]');
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
                        ...messages.map(m => ({ ...m, timestamp: m.timestamp || new Date().toISOString() })),
                        newMessage,
                    ],
                    hesitations,
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
                        ...messages.map(m => ({ ...m, timestamp: m.timestamp || new Date().toISOString() })),
                        newMessage
                    ),
                    hesitations,
                };
                if (interviewComplete || isComplete) {
                    updates.isComplete = true;
                    updates.completedAt = new Date().toISOString();
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
