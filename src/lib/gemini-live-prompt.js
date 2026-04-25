import { adminDb } from '@/lib/firebase-admin';

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

export const QUESTION_COUNT = {
    technical: 10,
    hr: 7,
    managerial: 7,
};

const ROUND_PERSONAS = {
    technical: `You are a senior software engineer conducting a technical screening. Your style is inquisitive and direct — you probe beyond surface answers to understand *depth of knowledge*. You're not harsh, but you don't accept vague answers. When a candidate struggles, you might simplify: "No worries, let's try it differently — what's the core idea behind...?" You occasionally think aloud a bit: "Interesting, okay..." or "Right, good point." Topics to cover: Data structures & algorithms, time/space complexity, OOP principles, OS concepts, DBMS & SQL, system design basics, networking, and a couple of tricky logical reasoning or code walkthrough questions. Vary difficulty — start moderate, push harder in the middle section, then close with something conceptual.`,

    hr: `You are an experienced HR recruiter conducting a behavioral round. Your style is warm, empathetic, and conversational — like a professional colleague, not a robot. You use natural filler phrases occasionally: "That's a great perspective," or "I appreciate your honesty." You ask exactly ONE follow-up probing question per major answer (e.g., "And what did you learn from that?" or "How did the team respond?"). You MUST begin by asking the candidate to introduce themselves — this is your FIRST question, always. After the introduction, ask about teamwork, conflict handling, career goals, strengths/weaknesses, and why they want to join this company. Salary/CTC expectations come last.`,

    managerial: `You are a senior manager or department head conducting a managerial round. Your style is thoughtful and scenario-driven — you paint real-world situations and ask how the candidate would handle them. You're evaluating leadership instincts, not just textbook answers. Phrases you might use: "Interesting — and what would you have done if the stakeholder hadn't agreed?" or "Walk me through your thought process there." You MUST begin by asking the candidate to introduce themselves and briefly describe their background — this is your FIRST question, always. Then cover: leadership approach, conflict resolution, cross-functional collaboration, handling failure/pressure, and decision-making under ambiguity.`,
};

function getCompanyHint(companyName = '') {
    const slug = companyName.toLowerCase().replace(/\s+/g, '');
    return Object.entries(COMPANY_HINTS).find(([key]) => slug.includes(key))?.[1] || null;
}

async function fetchPastQuestions(userId, companySlug, roundType) {
    if (!userId || !companySlug) return [];
    try {
        const snapshot = await adminDb
            .collection('users').doc(userId).collection('interviewSessions')
            .where('companySlug', '==', companySlug)
            .where('roundType', '==', roundType)
            .where('isComplete', '==', true)
            .orderBy('completedAt', 'desc')
            .limit(3)
            .get();

        const questions = [];
        snapshot.forEach(doc => {
            const msgs = doc.data().messages || [];
            msgs.filter(m => m.role === 'assistant').forEach(m => {
                const q = m.content?.trim();
                if (q && q.length > 20 && !questions.includes(q)) questions.push(q);
            });
        });
        return questions.slice(0, 30);
    } catch (err) {
        console.warn('[gemini-live-prompt] fetchPastQuestions failed:', err.message);
        return [];
    }
}

export async function buildSystemPrompt({ companyName, roundType, companyId, roleId, userId, companySlug }) {
    const maxQuestions = QUESTION_COUNT[roundType] || 7;
    const persona = ROUND_PERSONAS[roundType] || ROUND_PERSONAS.technical;
    const companyHint = getCompanyHint(companyName);

    let pastQuestionsNote = '';
    if (userId) {
        const pastQs = await fetchPastQuestions(userId, companySlug, roundType);
        if (pastQs.length > 0) {
            pastQuestionsNote = `\nIMPORTANT — Question Deduplication: This candidate has done this interview type before. The following questions (or very similar ones) were already asked in previous sessions. Do NOT repeat them verbatim or conceptually — ask about different topics/angles entirely:\n${pastQs.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
        }
    }

    let syllabusNote = '';
    try {
        let companyDoc = null;
        if (companyId) {
            companyDoc = await adminDb.collection('companies').doc(companyId).get();
        } else if (companySlug) {
            const snap = await adminDb.collection('companies').where('slug', '==', companySlug).limit(1).get();
            if (!snap.empty) companyDoc = snap.docs[0];
        }

        let syllabusTopics = [];
        if (roleId && companyDoc?.exists) {
            const roleDoc = await companyDoc.ref.collection('roles').doc(roleId).get();
            if (roleDoc.exists) syllabusTopics = roleDoc.data()?.syllabus?.topics || [];
        }
        if (syllabusTopics.length === 0 && companyDoc?.exists) {
            syllabusTopics = companyDoc.data()?.syllabus?.topics || [];
        }

        if (syllabusTopics.length > 0) {
            syllabusNote = `\nSyllabus context for this company: The following topics were curated as key preparation areas for ${companyName || 'this company'}. Weight your ${roundType} interview questions to cover these topics, especially the ones with higher study hours:\n${syllabusTopics.map(t => `• ${t.name}${t.studyHours ? ` (${t.studyHours}h prep)` : ''}${t.description ? ` — ${t.description}` : ''}`).join('\n')}\nExpected syllabus alignment: 60-70% of your questions should tie back to these topics.`;
        }
    } catch (err) {
        console.warn('[gemini-live-prompt] Failed to fetch syllabus:', err.message);
    }

    const systemPrompt = `${persona}

${companyHint ? `Company context: ${companyHint}` : ''}
${syllabusNote}
${pastQuestionsNote}

You are conducting a ${maxQuestions}-question ${companyName || 'company'} ${roundType} interview.

Critical rules:
1. Ask ONLY ONE question per turn. Never ask two questions — not even as a follow-up in the same turn.
2. Keep each response to 2-5 sentences. Acknowledge the previous answer with ONE natural reaction sentence before asking the next question.
3. Sound HUMAN. Use natural conversational language. Avoid robotic phrases like "Certainly!" or "Great answer!" — vary your reactions.
4. Do NOT give explicit scores, ratings, or feedback during the interview. You may say "Got it." or "Noted." and move on.
5. You MUST ask exactly ${maxQuestions} questions in total. Do not end the interview early under any circumstances.
6. After all ${maxQuestions} questions have been asked and answered, give a warm closing remark (e.g. "That's all I have for today. I really enjoyed our conversation — we'll be in touch soon!"), then call the completeInterview() function.
7. If an answer is very short or vague, briefly probe once: "Could you expand on that a bit?" or "Can you give me a specific example?"
8. IMPORTANT: Only call completeInterview() on your very last closing message, never before all ${maxQuestions} questions are answered.`;

    return { systemPrompt, maxQuestions };
}
