import { adminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimiter';

/**
 * GET /api/companies
 * Query params: ?search=<string>&round=<oa|technical|hr>
 * Returns all companies, filtered and sorted alphabetically.
 * Filtering is done client-side since Firestore free tier lacks full-text search.
 */
export async function GET(request) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
        || request.headers.get('x-real-ip')
        || '127.0.0.1';
    const { allowed, retryAfter } = checkRateLimit(ip, 'companies');
    if (!allowed) {
        return NextResponse.json({ error: 'Too many requests' }, {
            status: 429,
            headers: { 'Retry-After': String(retryAfter) },
        });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const roundFilter = searchParams.get('round') || '';

    try {
        const snapshot = await adminDb.collection('companies').get();

        let companies = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        // Client-side filtering (Firestore free tier has no full-text search)
        if (search) {
            companies = companies.filter(
                (c) =>
                    c.name?.toLowerCase().includes(search) ||
                    c.industry?.toLowerCase().includes(search)
            );
        }

        if (roundFilter) {
            companies = companies.filter((c) => c.rounds?.[roundFilter] === true);
        }

        companies.sort((a, b) => a.name.localeCompare(b.name));

        return NextResponse.json(companies);
    } catch (error) {
        console.error('[GET /api/companies]', error);
        return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
    }
}
