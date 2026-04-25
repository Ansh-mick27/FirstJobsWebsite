import Groq from 'groq-sdk';
import { NextResponse } from 'next/server';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function checkAdminKey(request) {
    const key = request.headers.get('x-admin-key');
    if (key !== process.env.ADMIN_API_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return null;
}

function extractJson(raw = '') {
    const stripped = raw.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1').trim();
    const start = stripped.search(/[{[]/);
    if (start === -1) throw new Error('No JSON found in model response');
    const opener = stripped[start];
    const closer = opener === '{' ? '}' : ']';
    let depth = 0, end = -1;
    for (let i = start; i < stripped.length; i++) {
        if (stripped[i] === opener) depth++;
        else if (stripped[i] === closer) { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end === -1) throw new Error('Unterminated JSON in model response');
    return JSON.parse(stripped.slice(start, end + 1));
}

/**
 * POST /api/admin/parse-questions
 * Converts natural-language questions (plain text) into the rich JSON schema
 * used by the questions API. Admin reviews and selects before saving.
 *
 * Body:
 *   raw          — plain-text questions (one or more)
 *   round        — "oa" | "technical" | "hr" | "managerial"
 *   category     — "test" | "interview"
 *   companyId    — string
 *   companyName  — string
 */
export async function POST(request) {
    const unauthorized = checkAdminKey(request);
    if (unauthorized) return unauthorized;

    try {
        const { raw, round, category, companyId, companyName } = await request.json();

        if (!raw?.trim()) {
            return NextResponse.json({ error: 'raw text is required' }, { status: 400 });
        }
        if (!companyId || !companyName) {
            return NextResponse.json({ error: 'companyId and companyName are required' }, { status: 400 });
        }

        const safeRound = round || 'technical';
        const roundLabel = safeRound === 'oa' ? 'Verbal/Aptitude' : safeRound.charAt(0).toUpperCase() + safeRound.slice(1);
        const isInterview = category === 'interview';

        // Build type-specific schema instructions
        const schemaInstructions = isInterview
            ? `Each question object must have:
- "text": string — the question text
- "type": "subjective"
- "round": "${safeRound}"
- "difficulty": "Easy" | "Medium" | "Hard" (infer from the question if possible, default "Medium")
- "explanation": string — what a good answer looks like (produce one if not in the input)
- "tags": string[] — topic tags`
            : safeRound === 'oa'
                ? `Each question object must have:
- "text": string — the question text
- "type": "mcq"
- "round": "oa"
- "difficulty": "Easy" | "Medium" | "Hard" (infer, default "Medium")
- "options": string[] — exactly 4 options (no A/B/C/D labels)
- "correctAnswer": number — 0-based index of the correct option
- "explanation": string — why that option is correct (generate one if not given)
- "tags": string[]`
                : `Each question object must have:
- "text": string — the question text
- "type": string — "mcq" or "coding" (infer from the question; if it has options it's mcq)
- "round": "technical"
- "difficulty": "Easy" | "Medium" | "Hard" (infer, default "Medium")
For MCQ: also include "options" (4 strings), "correctAnswer" (0-based index), "explanation"
For coding: also include "solution" (Python), "testCases" ([{input, output, isHidden}])
- "tags": string[]`;

        const prompt = `You are a placement question structurer. Your job is to parse raw, human-written questions and convert them into a structured JSON format for a placement prep platform.

Company: ${companyName}
Round: ${roundLabel}

The admin has typed the following questions in natural language:
---
${raw.trim()}
---

Parse ALL questions from the text above and return them as a JSON object {"questions": [...]} where each element follows this schema:

${schemaInstructions}

IMPORTANT RULES:
1. Parse EVERY question present in the input — don't skip any
2. If an MCQ has options inline (e.g. "a) ... b) ..."), extract them; otherwise generate 4 plausible options
3. If no correct answer is indicated for an MCQ, choose the most likely correct one
4. If a question is incomplete, do your best to complete it sensibly
5. Do NOT include JSON comments
6. Return ONLY the JSON object — no markdown, no prose`;

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3, // Low temperature for faithful parsing
            max_tokens: 8000,
        });

        const rawResponse = completion.choices[0].message.content || '';
        const parsed = extractJson(rawResponse);
        const questions = (parsed.questions || []).map((q) => ({
            ...q,
            companyId,
            round: safeRound,
            year: new Date().getFullYear(),
            isReal: true, // Assumed to be real questions typed by admin
            difficulty: q.difficulty || 'Medium',
            tags: q.tags || [],
            // Null-out fields that don't apply
            options: q.type === 'mcq' ? (q.options || []) : null,
            correctAnswer: q.type === 'mcq' ? (q.correctAnswer ?? 0) : null,
            explanation: q.type !== 'coding' ? (q.explanation || '') : null,
            solution: q.type === 'coding' ? (q.solution || '') : null,
            testCases: q.type === 'coding' ? (q.testCases || []) : null,
            starterCode: null,
        }));

        return NextResponse.json({ questions });
    } catch (error) {
        console.error('[POST /api/admin/parse-questions]', error);
        return NextResponse.json({ error: error.message || 'Parsing failed' }, { status: 500 });
    }
}
