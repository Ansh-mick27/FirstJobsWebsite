import { adminDb } from '@/lib/firebase-admin';
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
 * POST /api/admin/companies/[id]/materials
 * Body: { name, url, type, size, storagePath }
 * Appends a new study material object to the company's studyMaterials array.
 */
export async function POST(request, { params }) {
    const unauthorized = checkAdminKey(request);
    if (unauthorized) return unauthorized;

    try {
        const { id } = await params;
        const { name, url, type, size, storagePath } = await request.json();

        if (!name || !url || !storagePath) {
            return NextResponse.json({ error: 'name, url, storagePath are required' }, { status: 400 });
        }

        const material = {
            id: Date.now().toString(),
            name,
            url,
            type: type || 'application/octet-stream',
            size: size || 0,
            storagePath,
            uploadedAt: new Date().toISOString(),
        };

        await adminDb.collection('companies').doc(id).update({
            studyMaterials: FieldValue.arrayUnion(material),
            updatedAt: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ success: true, material });
    } catch (error) {
        console.error('[POST /api/admin/companies/[id]/materials]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/companies/[id]/materials
 * Body: { material } — the exact material object to remove from the array.
 */
export async function DELETE(request, { params }) {
    const unauthorized = checkAdminKey(request);
    if (unauthorized) return unauthorized;

    try {
        const { id } = await params;
        const { material } = await request.json();

        await adminDb.collection('companies').doc(id).update({
            studyMaterials: FieldValue.arrayRemove(material),
            updatedAt: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[DELETE /api/admin/companies/[id]/materials]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
