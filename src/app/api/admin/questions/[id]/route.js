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
 * PUT /api/admin/questions/[id]
 * Body must include companyId to locate the subcollection document.
 */
export async function PUT(request, { params }) {
    const unauthorized = checkAdminKey(request);
    if (unauthorized) return unauthorized;

    try {
        const { id } = await params;
        const body = await request.json();
        const { companyId, ...updates } = body;

        if (!companyId) {
            return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
        }

        // Remove id field if accidentally included
        delete updates.id;
        delete updates.createdAt;
        updates.updatedAt = FieldValue.serverTimestamp();

        const docRef = adminDb
            .collection('companies')
            .doc(companyId)
            .collection('questions')
            .doc(id);

        const existing = await docRef.get();
        if (!existing.exists) {
            return NextResponse.json({ error: 'Question not found' }, { status: 404 });
        }

        await docRef.update(updates);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[PUT /api/admin/questions/[id]]', error);
        return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/questions/[id]
 * Body must include companyId.
 */
export async function DELETE(request, { params }) {
    const unauthorized = checkAdminKey(request);
    if (unauthorized) return unauthorized;

    try {
        const { id } = await params;
        const body = await request.json();
        const { companyId } = body;

        if (!companyId) {
            return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
        }

        const docRef = adminDb
            .collection('companies')
            .doc(companyId)
            .collection('questions')
            .doc(id);

        const existing = await docRef.get();
        if (!existing.exists) {
            return NextResponse.json({ error: 'Question not found' }, { status: 404 });
        }

        await docRef.delete();

        // Decrement question count on company
        await adminDb.collection('companies').doc(companyId).update({
            questionCount: FieldValue.increment(-1),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[DELETE /api/admin/questions/[id]]', error);
        return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
    }
}
