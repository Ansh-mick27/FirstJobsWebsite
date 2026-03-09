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
 * GET /api/admin/companies/[id]/roles
 * Returns all job roles for the given company.
 *
 * POST /api/admin/companies/[id]/roles
 * Body: { name, roundTypes, description }
 * Creates a new job role.
 */
export async function GET(req, { params }) {
    const unauthorized = checkAdminKey(req);
    if (unauthorized) return unauthorized;

    try {
        const { id } = await params;
        const rolesSnap = await adminDb
            .collection('companies')
            .doc(id)
            .collection('roles')
            .orderBy('name')
            .get();

        const roles = rolesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(roles);
    } catch (error) {
        console.error('[GET /api/admin/companies/[id]/roles]', error);
        return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
    }
}

export async function POST(req, { params }) {
    const unauthorized = checkAdminKey(req);
    if (unauthorized) return unauthorized;

    try {
        const { id } = await params;
        const { name, roundTypes = [], description = '' } = await req.json();

        if (!name?.trim()) {
            return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
        }

        const docRef = await adminDb
            .collection('companies')
            .doc(id)
            .collection('roles')
            .add({
                name: name.trim(),
                roundTypes,       // e.g. ['oa', 'technical', 'hr']
                description: description.trim(),
                syllabus: null,   // will be set separately
                createdAt: new Date().toISOString(),
            });

        return NextResponse.json({ id: docRef.id, name: name.trim(), roundTypes, description: description.trim() }, { status: 201 });
    } catch (error) {
        console.error('[POST /api/admin/companies/[id]/roles]', error);
        return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
    }
}
