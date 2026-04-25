import { NextResponse } from 'next/server';
import { buildSystemPrompt } from '@/lib/gemini-live-prompt';
import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'default-secret-please-change';

function createSessionToken(data) {
    const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
    const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
    return `${payload}.${sig}`;
}

/**
 * POST /api/interview-session
 * Body: { companySlug, roleId, roundType, userId, companyId, companyName }
 * Returns: { sessionToken, maxQuestions, voiceName }
 */
export async function POST(req) {
    try {
        const { companySlug, roleId, roundType = 'technical', userId, companyId, companyName } = await req.json();

        const { systemPrompt, maxQuestions } = await buildSystemPrompt({
            companyName,
            roundType,
            companyId,
            roleId,
            userId,
            companySlug,
        });

        const tokenData = {
            systemPrompt,
            userId: userId || null,
            companyId: companyId || '',
            companyName: companyName || '',
            companySlug: companySlug || '',
            roundType,
            roleId: roleId || null,
            maxQuestions,
            voiceName: 'Kore',
            exp: Date.now() + 3 * 60 * 1000, // 3-minute expiry to connect
        };

        const sessionToken = createSessionToken(tokenData);

        return NextResponse.json({ sessionToken, maxQuestions, voiceName: 'Kore' });
    } catch (error) {
        console.error('[POST /api/interview-session]', error);
        return NextResponse.json({ error: 'Failed to create interview session' }, { status: 500 });
    }
}
