import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

/**
 * GET /api/tts?text=...&voice=en-US-AriaNeural
 *
 * Microsoft Edge Neural TTS — free, no API key, sub-second latency.
 * Uses Microsoft's online neural voice service (same as Edge "Read Aloud").
 *
 * Best voices:
 *  en-US-AriaNeural    – warm, conversational female (default)
 *  en-US-GuyNeural     – natural, friendly male
 *  en-US-JennyNeural   – clear, professional female
 *  en-GB-SoniaNeural   – British female
 *  en-GB-RyanNeural    – British male
 */

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text');
    const voice = searchParams.get('voice') || 'en-IN-NeerjaNeural';

    if (!text || text.trim().length === 0) {
        return new Response(JSON.stringify({ error: 'text is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const tts = new MsEdgeTTS();
        await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

        // Get audio as a readable stream
        const { audioStream } = await tts.toStream(text.trim());

        // Collect stream into a Buffer
        const chunks = [];
        for await (const chunk of audioStream) {
            chunks.push(chunk);
        }
        const mp3Buffer = Buffer.concat(chunks);

        return new Response(mp3Buffer, {
            status: 200,
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': String(mp3Buffer.byteLength),
                'Cache-Control': 'public, max-age=86400',
            },
        });
    } catch (err) {
        console.error('[TTS] Edge TTS error:', err);
        return new Response(JSON.stringify({ error: 'TTS failed', detail: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
