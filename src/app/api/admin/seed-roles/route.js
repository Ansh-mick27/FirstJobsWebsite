import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';

// One-shot seed route — delete this file after running once!
// GET /api/admin/seed-roles

const COMPANY_ROLES = {
    tcs: {
        roles: [
            {
                name: 'Software Engineer',
                roundTypes: ['oa', 'technical', 'hr'],
                description: 'NQT-based hiring for SE roles. Aptitude → Technical → HR.',
            },
            {
                name: 'BDE',
                roundTypes: ['hr', 'managerial'],
                description: 'Business Development Executive. No OA. Communication & sales focused.',
            },
        ],
    },
    'bajaj-finserv': {
        roles: [
            {
                name: 'Software Engineer',
                roundTypes: ['oa', 'technical', 'hr'],
                description: 'Tech role — DSA, SQL, BFSI domain. OA → Technical → HR.',
            },
            {
                name: 'Business Analyst',
                roundTypes: ['oa', 'technical', 'hr'],
                description: 'Analytics + finance. SQL, Excel, BFSI KPIs.',
            },
        ],
    },
    consultadd: {
        roles: [
            {
                name: 'Java Developer',
                roundTypes: ['oa', 'technical', 'hr'],
                description: 'Java/OOP, Spring Boot, DSA. Aptitude → GD → 2 Tech rounds → HR.',
            },
            {
                name: '.NET Developer',
                roundTypes: ['oa', 'technical', 'hr'],
                description: 'C#, ASP.NET Core, Entity Framework. Aptitude → GD → 2 Tech rounds → HR.',
            },
        ],
    },
    deqode: {
        roles: [
            {
                name: 'Full Stack Developer',
                roundTypes: ['technical', 'hr'],
                description: 'React, Node.js, MongoDB, REST APIs. Technical → HR. No OA.',
            },
            {
                name: 'React Developer',
                roundTypes: ['technical', 'hr'],
                description: 'Advanced React, JS internals, performance. Technical → HR.',
            },
        ],
    },
};

export async function GET(request) {
    // Simple key check to prevent accidental calls
    const { searchParams } = new URL(request.url);
    if (searchParams.get('key') !== 'seed2024') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const log = [];

    try {
        const companiesRef = adminDb.collection('companies');

        for (const [slug, config] of Object.entries(COMPANY_ROLES)) {
            const snap = await companiesRef.where('slug', '==', slug).limit(1).get();
            if (snap.empty) {
                log.push(`SKIP — no company doc for slug="${slug}"`);
                continue;
            }

            const companyDoc = snap.docs[0];
            const rolesRef = companyDoc.ref.collection('roles');

            const existingSnap = await rolesRef.get();
            const existingByName = {};
            existingSnap.docs.forEach(d => {
                existingByName[d.data().name] = d;
            });

            for (const role of config.roles) {
                const existing = existingByName[role.name];
                if (existing) {
                    await existing.ref.update({
                        roundTypes: role.roundTypes,
                        description: role.description,
                        updatedAt: FieldValue.serverTimestamp(),
                    });
                    log.push(`UPDATED — ${slug}/${role.name} (${role.roundTypes.join(',')})`);
                } else {
                    await rolesRef.add({
                        name: role.name,
                        roundTypes: role.roundTypes,
                        description: role.description,
                        createdAt: FieldValue.serverTimestamp(),
                        updatedAt: FieldValue.serverTimestamp(),
                    });
                    log.push(`CREATED — ${slug}/${role.name} (${role.roundTypes.join(',')})`);
                }
            }
        }

        return NextResponse.json({ success: true, log });
    } catch (err) {
        console.error('[seed-roles]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
