import prisma from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const industry = searchParams.get('industry') || '';

        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { industry: { contains: search } },
            ];
        }
        if (industry) {
            where.industry = industry;
        }

        const companies = await prisma.company.findMany({
            where,
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { testimonials: true, interviewQuestions: true, papers: true },
                },
            },
        });

        return NextResponse.json(companies);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
