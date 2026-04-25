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
    let depth = 0;
    let end = -1;
    for (let i = start; i < stripped.length; i++) {
        if (stripped[i] === opener) depth++;
        else if (stripped[i] === closer) { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end === -1) throw new Error('Unterminated JSON in model response');
    return JSON.parse(stripped.slice(start, end + 1));
}

/**
 * POST /api/admin/generate-company-profile
 * Body: { companyName: string }
 * Returns: { industry, description, tags, rounds }
 */
export async function POST(request) {
    const unauthorized = checkAdminKey(request);
    if (unauthorized) return unauthorized;

    try {
        const { companyName } = await request.json();
        if (!companyName?.trim()) {
            return NextResponse.json({ error: 'companyName is required' }, { status: 400 });
        }

        const prompt = `You are a knowledgeable assistant about Indian companies and campus placements.

Given the company name "${companyName}", generate a structured profile for a placement preparation app.

Return ONLY a valid JSON object (no markdown, no prose) with these exact fields:
{
  "industry": one of ["IT Services", "Product", "Consulting", "BFSI", "Core", "Other"],
  "description": "2-3 sentence description about the company — what it does, its scale, and why it's a sought-after employer in India",
  "tags": ["array", "of", "5-8", "relevant", "lowercase", "tags", "like", "product", "startup", "mnc", "service-based", "data-engineering", "fintech", "etc"],
  "rounds": {
    "oa": true or false (does this company typically conduct an online assessment / aptitude test?),
    "technical": true (almost always true),
    "hr": true (almost always true)
  },
  "hiringStatus": "Active"
}

Return only JSON, nothing else.`;

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.4,
            max_tokens: 800,
        });

        const raw = completion.choices[0].message.content || '';
        const parsed = extractJson(raw);

        const VALID_INDUSTRIES = ['IT Services', 'Product', 'Consulting', 'BFSI', 'Core', 'Other'];
        const industry = VALID_INDUSTRIES.includes(parsed.industry) ? parsed.industry : 'IT Services';

        return NextResponse.json({
            industry,
            description: parsed.description || '',
            tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8) : [],
            rounds: {
                oa: !!parsed.rounds?.oa,
                technical: parsed.rounds?.technical !== false,
                hr: parsed.rounds?.hr !== false,
            },
            hiringStatus: 'Active',
        });
    } catch (error) {
        console.error('[POST /api/admin/generate-company-profile]', error);
        return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
    }
}
