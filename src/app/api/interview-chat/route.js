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
4. Adaptive Learning: Explicitly evaluate the user's previous answer. If the user answered well, make the next question harder or dive deeper. If they struggled, make the next question slightly easier or focus on fundamental concepts.
5. Topics should cover data structures, system design, common behavioral questions, or company-specific values.
6. Start the interview by welcoming them to the ${companyName || 'company'} interview and asking the first question.`
        };

        const apiMessages = [systemPrompt, ...messages];
        let aiMessage = '';

        try {
            // Attempt Primary: Groq API
            const chatCompletion = await groq.chat.completions.create({
                messages: apiMessages,
                model: "llama-3.3-70b-versatile",
                temperature: 0.7,
                max_tokens: 500,
                stream: false,
            });
            aiMessage = chatCompletion.choices[0]?.message?.content;
        } catch (groqError) {
            console.warn('Groq API failed. Falling back to Cerebras API...', groqError.message);

            // Fallback: Cerebras API
            const cerebrasRes = await fetch("https://api.cerebras.ai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.CEREBRAS_API_KEY}`
                },
                body: JSON.stringify({
                    messages: apiMessages,
                    model: "llama3.1-8b",
                    temperature: 0.7,
                    max_tokens: 500,
                })
            });

            if (!cerebrasRes.ok) {
                const errText = await cerebrasRes.text();
                throw new Error(`Cerebras API also failed: ${cerebrasRes.status} ${errText}`);
            }

            const cerebrasData = await cerebrasRes.json();
            aiMessage = cerebrasData.choices[0]?.message?.content;
        }

        if (!aiMessage) {
            aiMessage = "I'm sorry, I didn't catch that. Could you repeat?";
        }

        return NextResponse.json({ reply: aiMessage });

    } catch (error) {
        console.error('Global API Error:', error);
        return NextResponse.json({ error: 'Failed to process interview chat' }, { status: 500 });
    }
}
