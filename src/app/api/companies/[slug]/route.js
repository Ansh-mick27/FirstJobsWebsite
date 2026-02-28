import prisma from '@/lib/db';
import { NextResponse } from 'next/server';
import { generateTestimonials, generateInterviewQuestions } from '@/lib/aiService';

export async function GET(request, { params }) {
    try {
        const { slug } = await params;

        const company = await prisma.company.findUnique({
            where: { slug },
            include: {
                testimonials: { orderBy: { createdAt: 'desc' } },
                interviewQuestions: { orderBy: { difficulty: 'asc' } },
                papers: { orderBy: { year: 'desc' } },
            },
        });

        if (!company) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        // If no testimonials exist, auto-generate with AI
        if (company.testimonials.length === 0) {
            try {
                const aiTestimonials = await generateTestimonials(company.name);
                if (aiTestimonials.length > 0) {
                    const created = await Promise.all(
                        aiTestimonials.map((t) =>
                            prisma.testimonial.create({
                                data: {
                                    companyId: company.id,
                                    name: t.name,
                                    role: t.role,
                                    content: t.content,
                                    rating: t.rating || 5,
                                    isAiGenerated: true,
                                },
                            })
                        )
                    );
                    company.testimonials = created;
                }
            } catch (aiError) {
                console.error('AI testimonial generation failed:', aiError);
            }
        }

        // If no interview questions, auto-generate
        if (company.interviewQuestions.length === 0) {
            try {
                const aiQuestions = await generateInterviewQuestions(company.name);
                if (aiQuestions.length > 0) {
                    const created = await Promise.all(
                        aiQuestions.map((q) =>
                            prisma.interviewQuestion.create({
                                data: {
                                    companyId: company.id,
                                    category: q.category || 'Technical',
                                    question: q.question,
                                    answer: q.answer,
                                    difficulty: q.difficulty || 'Medium',
                                },
                            })
                        )
                    );
                    company.interviewQuestions = created;
                }
            } catch (aiError) {
                console.error('AI interview question generation failed:', aiError);
            }
        }

        return NextResponse.json(company);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
