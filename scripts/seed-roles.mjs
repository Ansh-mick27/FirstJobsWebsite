/**
 * Seed script: ensures all 4 Firebase companies have the correct roles
 * with proper `roundTypes` arrays.
 *
 * Run:  node scripts/seed-roles.mjs
 * Requires FIREBASE_PROJECT_ID + service account env or firebase-admin in path
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load service account
let serviceAccount;
try {
    const saPath = resolve(__dirname, '../service-account.json');
    serviceAccount = JSON.parse(readFileSync(saPath, 'utf8'));
} catch {
    console.error('❌  No service-account.json found. Export it from Firebase Console → Project Settings → Service Accounts.');
    process.exit(1);
}

if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

// ─── Role definitions per company slug ────────────────────────────────────────
const COMPANY_ROLES = {
    tcs: {
        name: 'TCS',
        roles: [
            {
                name: 'Software Engineer',
                roundTypes: ['oa', 'technical', 'hr'],
                description: 'NQT-based hiring for SDE roles. Aptitude → Technical → HR.',
            },
            {
                name: 'BDE',
                roundTypes: ['hr', 'managerial'],
                description: 'Business Development Executive. Communication & sales-focused. No OA.',
            },
        ],
    },
    'bajaj-finserv': {
        name: 'Bajaj Finserv',
        roles: [
            {
                name: 'Software Engineer',
                roundTypes: ['oa', 'technical', 'hr'],
                description: 'Tech role — DSA, SQL, BFSI domain. OA → Technical → HR.',
            },
            {
                name: 'Business Analyst',
                roundTypes: ['oa', 'technical', 'hr'],
                description: 'Analytics + finance domain. SQL, Excel, BFSI KPIs.',
            },
        ],
    },
    consultadd: {
        name: 'ConsultAdd',
        roles: [
            {
                name: 'Java Developer',
                roundTypes: ['oa', 'technical', 'hr'],
                description: 'Deep Java/OOP, Spring Boot, DSA. Aptitude → GD → 2 Tech rounds → HR.',
            },
            {
                name: '.NET Developer',
                roundTypes: ['oa', 'technical', 'hr'],
                description: 'C#, ASP.NET Core, Entity Framework. Aptitude → GD → 2 Tech rounds → HR.',
            },
        ],
    },
    deqode: {
        name: 'Deqode',
        roles: [
            {
                name: 'Full Stack Developer',
                roundTypes: ['technical', 'hr'],
                description: 'React, Node.js, MongoDB, REST APIs. Technical → HR. No OA.',
            },
            {
                name: 'React Developer',
                roundTypes: ['technical', 'hr'],
                description: 'Advanced React, JS internals, performance, state management. Technical → HR.',
            },
        ],
    },
};

async function seedRoles() {
    const companiesRef = db.collection('companies');

    for (const [slug, config] of Object.entries(COMPANY_ROLES)) {
        console.log(`\n📦 Processing: ${config.name} (${slug})`);

        // Find the company document by slug
        const snap = await companiesRef.where('slug', '==', slug).limit(1).get();
        if (snap.empty) {
            console.log(`  ⚠️  No company document found for slug="${slug}" — skipping.`);
            continue;
        }

        const companyDoc = snap.docs[0];
        const rolesRef = companyDoc.ref.collection('roles');

        // Read existing roles
        const existingSnap = await rolesRef.get();
        const existingByName = {};
        existingSnap.docs.forEach(d => {
            existingByName[d.data().name] = d;
        });

        for (const role of config.roles) {
            const existing = existingByName[role.name];
            if (existing) {
                // Update roundTypes if missing or wrong
                await existing.ref.update({
                    roundTypes: role.roundTypes,
                    description: role.description,
                    updatedAt: FieldValue.serverTimestamp(),
                });
                console.log(`  ✅  Updated: ${role.name} (roundTypes: ${role.roundTypes.join(', ')})`);
            } else {
                // Create new role
                await rolesRef.add({
                    name: role.name,
                    roundTypes: role.roundTypes,
                    description: role.description,
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                });
                console.log(`  ✨  Created: ${role.name} (roundTypes: ${role.roundTypes.join(', ')})`);
            }
        }
    }

    console.log('\n🎉  Seed complete!');
}

seedRoles().catch(err => {
    console.error('❌  Seed failed:', err);
    process.exit(1);
});
