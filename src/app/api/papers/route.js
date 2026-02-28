import prisma from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const company = searchParams.get('company') || '';
        const year = searchParams.get('year') || '';

        const where = {};
        if (company) where.company = { slug: company };
        if (year) where.year = parseInt(year);

        const papers = await prisma.paper.findMany({
            where,
            orderBy: [{ year: 'desc' }, { title: 'asc' }],
            include: { company: { select: { name: true, slug: true, logo: true } } },
        });

        return NextResponse.json(papers);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
