import { adminAuth } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

function checkAdminKey(request) {
    const key = request.headers.get('x-admin-key');
    if (key !== process.env.ADMIN_API_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return null;
}

/**
 * GET /api/admin/users-count
 * Returns total number of registered Firebase Auth users.
 * Uses listUsers with pagination to handle more than 1000 users.
 */
export async function GET(request) {
    const unauthorized = checkAdminKey(request);
    if (unauthorized) return unauthorized;

    try {
        let count = 0;
        let pageToken;

        do {
            const result = await adminAuth.listUsers(1000, pageToken);
            count += result.users.length;
            pageToken = result.pageToken;
        } while (pageToken);

        return NextResponse.json({ count });
    } catch (error) {
        console.error('[GET /api/admin/users-count]', error);
        return NextResponse.json({ error: 'Failed to count users' }, { status: 500 });
    }
}
