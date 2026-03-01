import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req) {
    try {
        const { messages, companyName } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Valid messages array is required' }, { status: 400 });
        }

        const systemPrompt = {
            role: 'system',
            content: `You are an expert, strict but fair technical interviewer at ${companyName || 'a top tech company'}.
Your goal is to conduct a technical and behavioral mock interview with the user.
Rules:
1. Ask ONLY ONE question at a time.
2. Wait for the user to answer. DO NOT answer your own question.
3. Keep your responses concise (1-3 sentences max).
4. When the user answers, briefly evaluate their answer (point out what was good or missing), and then immediately ask the next question.
5. Topics should cover data structures, system design, common behavioral questions, or company-specific values.
6. Start the interview by welcoming them to the ${companyName || 'company'} interview and asking the first question.`
        };

        const chatCompletion = await groq.chat.completions.create({
            messages: [systemPrompt, ...messages],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 500,
            stream: false,
        });

        const aiMessage = chatCompletion.choices[0]?.message?.content || "I'm sorry, I didn't catch that. Could you repeat?";

        return NextResponse.json({ reply: aiMessage });

    } catch (error) {
        console.error('Groq Chat Error:', error);
        return NextResponse.json({ error: 'Failed to process interview chat' }, { status: 500 });
    }
}
