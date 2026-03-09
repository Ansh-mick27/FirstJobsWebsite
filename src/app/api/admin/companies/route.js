import { adminDb } from '@/lib/firebase-admin';
import { generateSlug } from '@/lib/utils';
import { FieldValue } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';

function checkAdminKey(request) {
    const key = request.headers.get('x-admin-key');
    if (key !== process.env.ADMIN_API_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return null;
}

/**
 * GET /api/admin/companies
 * Returns all companies with id, name, slug, industry, hiringStatus, rounds, questionCount, tags
 */
export async function GET(request) {
    const unauthorized = checkAdminKey(request);
    if (unauthorized) return unauthorized;

    try {
        const snapshot = await adminDb.collection('companies').get();
        const companies = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        companies.sort((a, b) => a.name.localeCompare(b.name));
        return NextResponse.json(companies);
    } catch (error) {
        console.error('[GET /api/admin/companies]', error);
        return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
    }
}

/**
 * POST /api/admin/companies
 * Body: { name, industry, description, hiringStatus, rounds, tags, logo }
 */
export async function POST(request) {
    const unauthorized = checkAdminKey(request);
    if (unauthorized) return unauthorized;

    try {
        const body = await request.json();
        const { name, industry, description, hiringStatus, rounds, tags, logo } = body;

        if (!name || !industry || !description) {
            return NextResponse.json({ error: 'name, industry, and description are required' }, { status: 400 });
        }

        const slug = generateSlug(name);

        // Check slug uniqueness
        const existing = await adminDb.collection('companies').where('slug', '==', slug).get();
        if (!existing.empty) {
            return NextResponse.json({ error: `Company with slug "${slug}" already exists` }, { status: 409 });
        }

        const docRef = await adminDb.collection('companies').add({
            name: name.trim(),
            slug,
            logo: logo || null,
            industry,
            description,
            hiringStatus: hiringStatus || 'Active',
            rounds: rounds || { oa: false, technical: false, hr: false },
            tags: tags || [],
            questionCount: 0,
            createdAt: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ id: docRef.id, slug }, { status: 201 });
    } catch (error) {
        console.error('[POST /api/admin/companies]', error);
        return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
    }
}
