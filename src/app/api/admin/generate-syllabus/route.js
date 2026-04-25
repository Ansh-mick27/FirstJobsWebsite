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
 * POST /api/admin/generate-syllabus
 * Body: { companyName: string, roleName: string, roundTypes?: string[] }
 * Returns: { overview, topics[] } — rich SyllabusTab format
 */
export async function POST(request) {
    const unauthorized = checkAdminKey(request);
    if (unauthorized) return unauthorized;

    try {
        const { companyName, roleName, roundTypes = [] } = await request.json();
        if (!companyName?.trim() || !roleName?.trim()) {
            return NextResponse.json({ error: 'companyName and roleName are required' }, { status: 400 });
        }

        const roundContext = roundTypes.length > 0
            ? `The interview process for this role includes: ${roundTypes.join(', ')} rounds.`
            : '';

        const prompt = `You are a senior placement consultant for Indian campus placements with deep knowledge of hiring patterns.

Company: ${companyName}
Role: ${roleName}
${roundContext}

Generate a comprehensive study syllabus for students preparing for this role at ${companyName}.

Return ONLY a valid JSON object (no markdown, no prose) with this exact structure:
{
  "overview": "2-3 sentence overview of what areas a student needs to master for this role at this company",
  "topics": [
    {
      "id": "unique-id-string",
      "name": "Topic Name",
      "icon": "emoji",
      "prepHours": number (realistic hours to prepare this topic),
      "importance": "must" | "good" | "optional",
      "subtopics": [
        {
          "name": "Subtopic name",
          "importance": "must" | "good" | "optional",
          "note": "💡 optional quick tip or resource hint"
        }
      ]
    }
  ]
}

Rules:
- Include 5-8 main topics relevant to this role and company
- Each topic must have 3-6 subtopics
- Use relevant emojis for icons (e.g., 🧮 for Math, 💡 for Aptitude, 🖥️ for DSA, 🗄️ for DBMS)
- Importance "must" = crucial, asked almost always; "good" = frequently asked; "optional" = bonus
- prepHours should be realistic (10-40 hours per topic)
- Focus on what'${roleName}' candidates at '${companyName}' are actually tested on in Indian campus placements
- Return only JSON, nothing else.`;

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.5,
            max_tokens: 3000,
        });

        const raw = completion.choices[0].message.content || '';
        const parsed = extractJson(raw);

        // Normalise topics
        const topics = (parsed.topics || []).map((t, i) => ({
            id: t.id || `topic-${Date.now()}-${i}`,
            name: t.name || '',
            icon: t.icon || '📌',
            prepHours: parseInt(t.prepHours) || 10,
            importance: ['must', 'good', 'optional'].includes(t.importance) ? t.importance : 'must',
            subtopics: (t.subtopics || []).map(s => ({
                name: s.name || '',
                importance: ['must', 'good', 'optional'].includes(s.importance) ? s.importance : 'good',
                note: s.note || '',
            })),
        }));

        return NextResponse.json({
            overview: parsed.overview || '',
            topics,
        });
    } catch (error) {
        console.error('[POST /api/admin/generate-syllabus]', error);
        return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
    }
}
