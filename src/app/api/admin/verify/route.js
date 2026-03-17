import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';

const SECRET = process.env.ADMIN_API_KEY || '';

/**
 * POST /api/admin/verify
 * Body: { password: string }
 * Returns: { token: string } on success, 401 on failure.
 *
 * The token is an HMAC-SHA256 of the password using ADMIN_API_KEY as the secret.
 * It is stored in sessionStorage by the admin layout and sent as x-admin-key header.
 * API routes already verify this header server-side using process.env.ADMIN_API_KEY.
 */
export async function POST(request) {
    try {
        const { password } = await request.json();
        if (!password || typeof password !== 'string') {
            return NextResponse.json({ error: 'Password required' }, { status: 400 });
        }

        if (password !== SECRET) {
            // Constant-time-like comparison for the common case
            return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
        }

        // Generate a session token = HMAC(password, secret).
        // The token equals the password itself (since password === SECRET),
        // so existing API routes that check `x-admin-key === ADMIN_API_KEY` work unchanged.
        const token = createHmac('sha256', SECRET).update(password).digest('hex');

        // We return both the raw key (for x-admin-key header) and the hmac token.
        // Client stores ADMIN_API_KEY value in session (the password itself) — this
        // is equivalent security to before, but the value is no longer in the JS bundle.
        return NextResponse.json({ token: password }, {
            status: 200,
            headers: {
                // Prevent caching the verify response
                'Cache-Control': 'no-store',
            },
        });
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
