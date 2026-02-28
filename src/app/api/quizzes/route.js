import prisma from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category') || '';

        const where = {};
        if (category) where.category = category;

        const quizzes = await prisma.quiz.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                company: { select: { name: true, slug: true } },
                _count: { select: { questions: true } },
            },
        });

        return NextResponse.json(quizzes);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
