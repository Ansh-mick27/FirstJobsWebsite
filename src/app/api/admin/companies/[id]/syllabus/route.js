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
 * PUT /api/admin/companies/[id]/syllabus
 * Body: { syllabus: { overview, topics[] } }
 * Saves the syllabus structure directly into the company Firestore doc.
 * StudyMaterial.jsx reads it from /api/companies/[slug] which returns the full company.
 */
export async function PUT(request, { params }) {
    const unauthorized = checkAdminKey(request);
    if (unauthorized) return unauthorized;

    try {
        const { id } = await params;
        const { syllabus } = await request.json();

        if (!syllabus || !Array.isArray(syllabus.topics)) {
            return NextResponse.json({ error: 'syllabus.topics must be an array' }, { status: 400 });
        }

        const syllabusWithMeta = {
            ...syllabus,
            lastUpdated: new Date().getFullYear().toString(),
        };

        await adminDb.collection('companies').doc(id).update({
            syllabus: syllabusWithMeta,
            updatedAt: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[PUT /api/admin/companies/[id]/syllabus]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/companies/[id]/syllabus
 * Removes the syllabus from the company doc.
 */
export async function DELETE(request, { params }) {
    const unauthorized = checkAdminKey(request);
    if (unauthorized) return unauthorized;

    try {
        const { id } = await params;
        await adminDb.collection('companies').doc(id).update({
            syllabus: FieldValue.delete(),
            updatedAt: FieldValue.serverTimestamp(),
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
