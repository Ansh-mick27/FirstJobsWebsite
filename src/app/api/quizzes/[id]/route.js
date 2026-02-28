import prisma from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    try {
        const { id } = await params;

        const quiz = await prisma.quiz.findUnique({
            where: { id: parseInt(id) },
            include: {
                questions: true,
                company: { select: { name: true, slug: true } },
            },
        });

        if (!quiz) {
            return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
        }

        return NextResponse.json(quiz);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
