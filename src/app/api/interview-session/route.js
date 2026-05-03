import { NextResponse } from 'next/server';
import { buildSystemPrompt } from '@/lib/gemini-live-prompt';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
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
        // Parse body first so companySlug is available for demo marking
        const { companySlug, roleId, roundType = 'technical', companyId, companyName, userName } = await req.json();

        // Verify Firebase ID token — also fixes the existing unauth gap
        const authHeader = req.headers.get('authorization');
        const idToken = authHeader?.split('Bearer ')[1];
        if (!idToken) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }
        const decoded = await adminAuth.verifyIdToken(idToken);
        const uid = decoded.uid; // authoritative — ignore body userId

        // Check subscription and demo status
        const userDoc = await adminDb.collection('users').doc(uid).get();
        const data = userDoc.data() ?? {};
        const subStatus = data.subscription?.status ?? 'free';
        const expiresAt = data.subscription?.expiresAt ?? null;
        const demoUsed = data.demo?.hasUsed ?? false;
        const isSubscribed = subStatus === 'active' && expiresAt?.toDate() > new Date();

        if (!isSubscribed && demoUsed) {
            return NextResponse.json({ error: 'subscription_required' }, { status: 403 });
        }

        // Mark demo as consumed on first interview
        if (!isSubscribed && !demoUsed) {
            await adminDb.collection('users').doc(uid).update({
                'demo.hasUsed': true,
                'demo.companySlug': companySlug || null,
            });
        }

        const { systemPrompt, maxQuestions } = await buildSystemPrompt({
            companyName,
            roundType,
            companyId,
            roleId,
            userId: uid,
            companySlug,
            userName,
        });

        const VOICES = ['Puck', 'Kore', 'Charon', 'Fenrir', 'Aoede', 'Leda', 'Orus', 'Zephyr'];
        const voiceName = VOICES[Math.floor(Math.random() * VOICES.length)];

        const tokenData = {
            systemPrompt,
            userId: uid,
            companyId: companyId || '',
            companyName: companyName || '',
            companySlug: companySlug || '',
            roundType,
            roleId: roleId || null,
            maxQuestions,
            voiceName,
            exp: Date.now() + 3 * 60 * 1000, // 3-minute expiry to connect
        };

        const sessionToken = createSessionToken(tokenData);

        return NextResponse.json({ sessionToken, maxQuestions, voiceName });
    } catch (error) {
        console.error('[POST /api/interview-session]', error);
        return NextResponse.json({ error: 'Failed to create interview session' }, { status: 500 });
    }
}
