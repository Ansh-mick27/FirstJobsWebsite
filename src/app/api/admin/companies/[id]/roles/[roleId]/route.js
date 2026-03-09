import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

function checkAdminKey(req) {
    const key = req.headers.get('x-admin-key');
    if (key !== process.env.ADMIN_API_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return null;
}

/**
 * GET /api/admin/companies/[id]/roles/[roleId]
 * Returns a single role doc (including its syllabus).
 */
export async function GET(req, { params }) {
    const unauthorized = checkAdminKey(req);
    if (unauthorized) return unauthorized;

    try {
        const { id, roleId } = await params;
        const doc = await adminDb
            .collection('companies')
            .doc(id)
            .collection('roles')
            .doc(roleId)
            .get();

        if (!doc.exists) return NextResponse.json({ error: 'Role not found' }, { status: 404 });
        return NextResponse.json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error('[GET /api/admin/companies/[id]/roles/[roleId]]', error);
        return NextResponse.json({ error: 'Failed to fetch role' }, { status: 500 });
    }
}

/**
 * PUT /api/admin/companies/[id]/roles/[roleId]
 * Body: { name?, roundTypes?, description?, syllabus? }
 * Updates a role doc (all fields are optional).
 */
export async function PUT(req, { params }) {
    const unauthorized = checkAdminKey(req);
    if (unauthorized) return unauthorized;

    try {
        const { id, roleId } = await params;
        const body = await req.json();

        const data = { updatedAt: new Date().toISOString() };
        if (body.name !== undefined) data.name = body.name.trim();
        if (body.roundTypes !== undefined) data.roundTypes = body.roundTypes;
        if (body.description !== undefined) data.description = body.description.trim();
        if (body.syllabus !== undefined) data.syllabus = body.syllabus;

        await adminDb
            .collection('companies')
            .doc(id)
            .collection('roles')
            .doc(roleId)
            .update(data);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[PUT /api/admin/companies/[id]/roles/[roleId]]', error);
        return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/companies/[id]/roles/[roleId]
 * Deletes the role document.
 */
export async function DELETE(req, { params }) {
    const unauthorized = checkAdminKey(req);
    if (unauthorized) return unauthorized;

    try {
        const { id, roleId } = await params;

        await adminDb
            .collection('companies')
            .doc(id)
            .collection('roles')
            .doc(roleId)
            .delete();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[DELETE /api/admin/companies/[id]/roles/[roleId]]', error);
        return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
    }
}
