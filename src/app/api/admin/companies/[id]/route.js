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
 * GET /api/admin/companies/[id]
 */
export async function GET(request, { params }) {
    const unauthorized = checkAdminKey(request);
    if (unauthorized) return unauthorized;

    try {
        const { id } = await params;
        const doc = await adminDb.collection('companies').doc(id).get();
        if (!doc.exists) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }
        return NextResponse.json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error('[GET /api/admin/companies/[id]]', error);
        return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 });
    }
}

/**
 * PUT /api/admin/companies/[id]
 * Body: { name, industry, description, hiringStatus, rounds, tags, logo }
 */
export async function PUT(request, { params }) {
    const unauthorized = checkAdminKey(request);
    if (unauthorized) return unauthorized;

    try {
        const { id } = await params;
        const body = await request.json();
        const { name, industry, description, hiringStatus, rounds, tags, logo } = body;

        const docRef = adminDb.collection('companies').doc(id);
        const existing = await docRef.get();
        if (!existing.exists) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        const updates = {
            industry,
            description,
            hiringStatus,
            rounds,
            tags: tags || [],
            logo: logo || null,
            updatedAt: FieldValue.serverTimestamp(),
        };

        // Regenerate slug if name changed
        const currentData = existing.data();
        if (name && name.trim() !== currentData.name) {
            const newSlug = generateSlug(name);
            // Check slug uniqueness (exclude current doc)
            const slugCheck = await adminDb.collection('companies').where('slug', '==', newSlug).get();
            const conflict = slugCheck.docs.find((d) => d.id !== id);
            if (conflict) {
                return NextResponse.json({ error: `Slug "${newSlug}" is already taken` }, { status: 409 });
            }
            updates.name = name.trim();
            updates.slug = newSlug;
        } else if (name) {
            updates.name = name.trim();
        }

        await docRef.update(updates);
        return NextResponse.json({ success: true, slug: updates.slug || currentData.slug });
    } catch (error) {
        console.error('[PUT /api/admin/companies/[id]]', error);
        return NextResponse.json({ error: 'Failed to update company' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/companies/[id]
 * Batch-deletes all questions subcollection docs first, then the company doc.
 */
export async function DELETE(request, { params }) {
    const unauthorized = checkAdminKey(request);
    if (unauthorized) return unauthorized;

    try {
        const { id } = await params;
        const companyRef = adminDb.collection('companies').doc(id);

        // Batch-delete all questions in subcollection
        const questionsSnap = await companyRef.collection('questions').get();
        if (!questionsSnap.empty) {
            const batch = adminDb.batch();
            questionsSnap.docs.forEach((doc) => batch.delete(doc.ref));
            await batch.commit();
        }

        await companyRef.delete();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[DELETE /api/admin/companies/[id]]', error);
        return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 });
    }
}
