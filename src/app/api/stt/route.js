import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
        }

        const groqKey = process.env.GROQ_API_KEY;
        if (!groqKey) {
            return NextResponse.json({ error: 'GROQ_API_KEY is not configured' }, { status: 500 });
        }

        const groqFormData = new FormData();
        groqFormData.append('file', file);
        groqFormData.append('model', 'whisper-large-v3-turbo');

        const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqKey}`,
                // Do not explicitly set Content-Type; FormData will automatically generate the correct boundary.
            },
            body: groqFormData,
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error('[STT] Groq API Error:', response.status, errBody);
            return NextResponse.json({ error: 'Transcription failed' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json({ text: data.text });

    } catch (error) {
        console.error('[STT] Internal Error:', error);
        return NextResponse.json({ error: 'Internal server error while transcribing' }, { status: 500 });
    }
}
