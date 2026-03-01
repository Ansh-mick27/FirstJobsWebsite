import prisma from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    try {
        const id = parseInt((await params).id); // Await params in Next.js 15+

        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        const paper = await prisma.paper.findUnique({
            where: { id },
            include: {
                company: {
                    include: {
                        interviewQuestions: true // Important: Fetch the associated interview questions
                    }
                }
            }
        });

        if (!paper) {
            return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
        }

        return NextResponse.json(paper);
    } catch (error) {
        console.error("Failed to fetch paper:", error);
        return NextResponse.json({ error: 'Failed to fetch paper' }, { status: 500 });
    }
}
