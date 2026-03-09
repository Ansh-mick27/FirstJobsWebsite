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

/**
 * Robustly extract the first JSON object or array from raw model text.
 * Handles: markdown code fences, leading prose, trailing prose.
 */
function extractJson(raw = '') {
    // 1. Strip ```json ... ``` or ``` ... ``` fences
    const stripped = raw.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1').trim();

    // 2. Find the first '{' or '[' and match to its closing counterpart
    const start = stripped.search(/[{[]/);
    if (start === -1) throw new Error('No JSON found in model response');

    const opener = stripped[start];
    const closer = opener === '{' ? '}' : ']';
    let depth = 0;
    let end = -1;

    for (let i = start; i < stripped.length; i++) {
        if (stripped[i] === opener) depth++;
        else if (stripped[i] === closer) {
            depth--;
            if (depth === 0) { end = i; break; }
        }
    }

    if (end === -1) throw new Error('Unterminated JSON in model response');

    return JSON.parse(stripped.slice(start, end + 1));
}

/**
 * POST /api/admin/generate-questions
 * Returns generated questions for PREVIEW — not saved to Firestore until admin confirms.
 */
export async function POST(request) {
    const unauthorized = checkAdminKey(request);
    if (unauthorized) return unauthorized;

    try {
        const { companyId, companyName, round, type, difficulty, count, seedQuestions } =
            await request.json();

        if (!companyId || !companyName || !round || !type || !difficulty || !count) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const safeCount = Math.min(Math.max(parseInt(count) || 5, 1), 10);

        const seedContext =
            seedQuestions?.length > 0
                ? `Here are actual previous year questions asked by ${companyName} in their ${round.toUpperCase()} round:\n${seedQuestions
                    .map((q, i) => `${i + 1}. ${q}`)
                    .join('\n')}\n\nGenerate questions in the SAME style, difficulty, and topic area.`
                : `Generate ${round.toUpperCase()} round questions typically asked by ${companyName} in Indian campus placements.`;

        const typeInstructions = {
            mcq: `Return a JSON object with a "questions" array. Each item has:
- text: string (the question)
- options: string[] (exactly 4 options, no labels like A/B/C/D)
- correctAnswer: number (0-based index of the correct option)
- explanation: string (why this answer is correct)
- tags: string[] (topic tags like ["arrays", "sorting"])`,

            coding: `Return a JSON object with a "questions" array. Each item has:
- text: string (full problem statement with constraints and examples, in markdown)
- solution: string (clean Python solution)
- testCases: array of {input: string, output: string, isHidden: boolean} (3 visible + 2 hidden)
- tags: string[] (topic tags like ["dynamic-programming", "graphs"])`,

            subjective: `Return a JSON object with a "questions" array. Each item has:
- text: string (the interview question)
- explanation: string (ideal answer / key points to cover)
- tags: string[] (topic tags like ["behavioral", "leadership"])`,
        };

        const prompt = `You are an expert placement preparation question creator for Indian campus placements.

${seedContext}

Generate exactly ${safeCount} ${difficulty} difficulty ${type} questions for the ${round.toUpperCase()} round of ${companyName}.

${typeInstructions[type]}

Also include for every question:
- difficulty: "${difficulty}"
- round: "${round}"

Return ONLY a raw JSON object — no markdown fences, no prose before or after.`;

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 6000,
            // NOTE: We intentionally omit response_format: { type: 'json_object' } because
            // Groq's server-side JSON validation throws 400 json_validate_failed when the
            // payload is large (many MCQ options/explanations). We parse manually instead.
        });

        const raw = completion.choices[0].message.content || '';
        const parsed = extractJson(raw);
        const questions = (parsed.questions || []).slice(0, safeCount);

        return NextResponse.json({
            questions: questions.map((q) => ({
                ...q,
                type,
                round,
                companyId,
                isReal: false,
                year: new Date().getFullYear(),
                // Null-out fields that don't apply to this type
                options: type === 'mcq' ? q.options : null,
                correctAnswer: type === 'mcq' ? q.correctAnswer : null,
                starterCode: null,
                solution: type === 'coding' ? q.solution : null,
                testCases: type === 'coding' ? q.testCases : null,
            })),
        });
    } catch (error) {
        console.error('[POST /api/admin/generate-questions]', error);
        return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
    }
}
