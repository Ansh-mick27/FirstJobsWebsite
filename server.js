// Custom Next.js server with WebSocket support for Gemini Live interview proxy.
// This replaces the default `next dev` / `next start` entry point.
// Run with: node server.js (scripts updated in package.json)

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { WebSocketServer, WebSocket: WS } = require('ws');
const crypto = require('crypto');

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

const GEMINI_LIVE_HOST = 'generativelanguage.googleapis.com';
const GEMINI_LIVE_PATH = '/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

function getGeminiUrl() {
    const key = process.env.GOOGLE_API_KEY;
    if (!key) throw new Error('GOOGLE_API_KEY is not set in .env.local');
    return `wss://${GEMINI_LIVE_HOST}${GEMINI_LIVE_PATH}?key=${key}`;
}

function getSessionSecret() {
    return process.env.SESSION_SECRET || 'default-secret-please-change';
}

function verifySessionToken(token) {
    try {
        const dotIndex = token.lastIndexOf('.');
        if (dotIndex === -1) return null;
        const payload = token.slice(0, dotIndex);
        const sig = token.slice(dotIndex + 1);
        const expected = crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
        if (sig !== expected) return null;
        const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
        if (data.exp < Date.now()) return null;
        return data;
    } catch {
        return null;
    }
}

async function handleInterviewWs(ws, req, adminDb) {
    const { query } = parse(req.url, true);
    const sessionConfig = verifySessionToken(query.token || '');

    if (!sessionConfig) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid or expired session token' }));
        ws.close(1008, 'Invalid token');
        return;
    }

    const { systemPrompt, userId, companyId, companyName, companySlug, roundType, roleId, maxQuestions, voiceName } = sessionConfig;

    // Per-session state — all mutations are synchronous on the Node.js event loop, no races.
    const state = {
        messages: [],
        sessionId: null,
        hesitations: [],
        aiTurnEndAt: null,        // timestamp when AI last finished speaking (for hesitation calc)
        userAudioStarted: false,  // first audio chunk received after AI turn
        currentAiText: '',        // accumulates output transcription text
        currentUserText: '',      // accumulates input transcription text
        isComplete: false,
        geminiReady: false,
        pendingQueue: [],         // audio messages queued before Gemini setup completes
        silenceNudgeTimer: null,  // setTimeout handle for 15s silence nudge
    };

    // Create Firestore session document upfront so we have an ID to send to the client.
    if (userId && adminDb) {
        try {
            const ref = await adminDb
                .collection('users').doc(userId)
                .collection('interviewSessions').add({
                    companyId: companyId || '',
                    companyName: companyName || '',
                    companySlug: companySlug || '',
                    roundType,
                    roleId: roleId || null,
                    messages: [],
                    hesitations: [],
                    aiFeedback: null,
                    isComplete: false,
                    completedAt: null,
                    startedAt: new Date().toISOString(),
                });
            state.sessionId = ref.id;
        } catch (err) {
            console.error('[server.js] Firestore create session failed:', err.message);
        }
    }

    ws.send(JSON.stringify({ type: 'sessionStart', sessionId: state.sessionId, maxQuestions }));

    // ── Open Gemini Live WebSocket ──────────────────────────────────────────────
    let geminiWs;
    try {
        geminiWs = new WS(getGeminiUrl());
    } catch (err) {
        console.error('[server.js] Cannot open Gemini WS:', err.message);
        if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'error', message: err.message }));
            ws.close(1011, err.message);
        }
        return;
    }

    geminiWs.on('open', () => {
        geminiWs.send(JSON.stringify({
            setup: {
                model: 'models/gemini-3.1-flash-live-preview',
                generationConfig: {
                    responseModalities: ['AUDIO'],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: voiceName || 'Kore',
                            },
                        },
                    },
                },
                realtimeInputConfig: {
                    automaticActivityDetection: {
                        // Low sensitivity = waits longer before declaring end-of-speech,
                        // reducing false "user turn complete" detections during silence.
                        startOfSpeechSensitivity: 'START_SENSITIVITY_LOW',
                        endOfSpeechSensitivity: 'END_SENSITIVITY_LOW',
                    },
                },
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                systemInstruction: {
                    parts: [{ text: systemPrompt }],
                },
                tools: [{
                    functionDeclarations: [{
                        name: 'completeInterview',
                        description: 'Call this function after delivering the closing remark, when all questions have been asked and answered.',
                        parameters: { type: 'OBJECT', properties: {}, required: [] },
                    }],
                }],
            },
        }));
    });

    geminiWs.on('message', (rawData) => {
        let msg;
        try { msg = JSON.parse(rawData.toString()); } catch { return; }

        // ── Setup complete ──────────────────────────────────────────────────────
        if (msg.setupComplete !== undefined) {
            state.geminiReady = true;
            if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: 'connected' }));
            for (const pending of state.pendingQueue) {
                if (geminiWs.readyState === WS.OPEN) geminiWs.send(pending);
            }
            state.pendingQueue = [];
            // Auto-trigger the AI's opening greeting so the interview starts without
            // the user needing to speak first.
            if (geminiWs.readyState === WS.OPEN) {
                geminiWs.send(JSON.stringify({
                    clientContent: {
                        turns: [{ role: 'user', parts: [{ text: 'begin' }] }],
                        turnComplete: true,
                    },
                }));
            }
            return;
        }

        // ── Server content ──────────────────────────────────────────────────────
        if (msg.serverContent) {
            const sc = msg.serverContent;

            // Audio output chunks → forward to browser
            if (sc.modelTurn?.parts) {
                for (const part of sc.modelTurn.parts) {
                    if (part.inlineData?.data && ws.readyState === ws.OPEN) {
                        ws.send(JSON.stringify({
                            type: 'audio',
                            data: part.inlineData.data,
                            mimeType: part.inlineData.mimeType || 'audio/pcm;rate=24000',
                        }));
                        state.aiTurnEndAt = null; // AI is actively producing audio
                    }
                }
            }

            // Output transcription (text of what AI said)
            if (sc.outputTranscription?.text) {
                state.currentAiText += sc.outputTranscription.text;
                if (ws.readyState === ws.OPEN) {
                    ws.send(JSON.stringify({ type: 'aiTranscript', text: sc.outputTranscription.text }));
                }
            }

            // Input transcription (text of what user said)
            if (sc.inputTranscription) {
                const { text = '', finished = false } = sc.inputTranscription;
                // Drop non-ASCII chunks — Gemini can mis-transcribe short English phonemes
                // (e.g. "hi" → Japanese "はい"). Only apply to the text content, not the
                // finished flag, so the turn still closes properly.
                const hasNonAscii = text && /[^\x00-\x7F]/.test(text);
                const cleanText = hasNonAscii ? '' : text;
                if (hasNonAscii) {
                    console.warn('[server.js] Dropping non-ASCII user transcript chunk:', JSON.stringify(text));
                }
                if (cleanText) state.currentUserText += cleanText;
                if (ws.readyState === ws.OPEN) {
                    ws.send(JSON.stringify({ type: 'userTranscript', text: cleanText, finished }));
                }
                if (finished && state.currentUserText.trim()) {
                    state.messages.push({ role: 'user', content: state.currentUserText.trim(), timestamp: new Date().toISOString() });
                    state.currentUserText = '';
                }
            }

            // Turn complete
            if (sc.turnComplete) {
                // Flush any user transcription that never received finished=true
                if (state.currentUserText.trim()) {
                    state.messages.push({ role: 'user', content: state.currentUserText.trim(), timestamp: new Date().toISOString() });
                    if (ws.readyState === ws.OPEN) {
                        ws.send(JSON.stringify({ type: 'userTranscript', text: '', finished: true }));
                    }
                    state.currentUserText = '';
                }

                state.aiTurnEndAt = Date.now();
                state.userAudioStarted = false; // reset for next hesitation window
                if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: 'turnComplete' }));

                if (state.currentAiText.trim()) {
                    state.messages.push({ role: 'assistant', content: state.currentAiText.trim(), timestamp: new Date().toISOString() });
                    state.currentAiText = '';
                }

                // F5: 15s silence nudge — if candidate doesn't respond, inject a gentle cue
                clearTimeout(state.silenceNudgeTimer);
                state.silenceNudgeTimer = null;
                if (!state.isComplete) {
                    const SILENCE_NUDGES = [
                        "Take your time, there's no rush.",
                        'Feel free to think out loud if that helps.',
                        'No worries — take a moment to gather your thoughts.',
                    ];
                    state.silenceNudgeTimer = setTimeout(() => {
                        if (state.isComplete || !state.geminiReady || geminiWs.readyState !== WS.OPEN) return;
                        const nudge = SILENCE_NUDGES[Math.floor(Math.random() * SILENCE_NUDGES.length)];
                        geminiWs.send(JSON.stringify({
                            clientContent: {
                                turns: [{ role: 'user', parts: [{ text: `[System: Candidate is silent. Gently say: "${nudge}" and then wait for them to respond.]` }] }],
                                turnComplete: true,
                            },
                        }));
                    }, 15000);
                }
            }

            // Interrupted (user spoke over AI)
            if (sc.interrupted) {
                if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: 'interrupted' }));
            }
        }

        // ── Gemini API-level error (wrong model name, auth, quota, etc.) ──────────
        if (msg.error) {
            const detail = msg.error.message || msg.error.status || JSON.stringify(msg.error);
            console.error('[Gemini WS] API error:', detail);
            if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({ type: 'error', message: `Gemini API error: ${detail}` }));
            }
            return;
        }

        // ── Tool call: completeInterview ────────────────────────────────────────
        if (msg.toolCall?.functionCalls) {
            for (const call of msg.toolCall.functionCalls) {
                if (call.name === 'completeInterview' && !state.isComplete) {
                    state.isComplete = true;

                    // Acknowledge the function call to Gemini
                    if (geminiWs.readyState === WS.OPEN) {
                        geminiWs.send(JSON.stringify({
                            toolResponse: {
                                functionResponses: [{
                                    id: call.id,
                                    name: call.name,
                                    response: { output: 'Interview session ended successfully.' },
                                }],
                            },
                        }));
                    }

                    finalizeSession(state, userId, adminDb).catch(console.error);

                    if (ws.readyState === ws.OPEN) {
                        ws.send(JSON.stringify({
                            type: 'interviewComplete',
                            sessionId: state.sessionId,
                            messages: state.messages,
                            hesitations: state.hesitations,
                        }));
                    }
                }
            }
        }
    });

    geminiWs.on('error', (err) => {
        console.error('[Gemini WS] Error:', err.message);
        if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'error', message: 'Connection error with AI service. Please retry.' }));
        }
    });

    geminiWs.on('close', (code, reason) => {
        const reasonStr = reason?.length ? reason.toString() : '';
        console.error(`[Gemini WS] Closed: code=${code}${reasonStr ? ` reason="${reasonStr}"` : ''}`);
        if (!state.isComplete && ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'geminiClosed', code, reason: reasonStr }));
            ws.close();
        }
    });

    // ── Browser → server ────────────────────────────────────────────────────────
    ws.on('message', (rawData) => {
        let msg;
        try { msg = JSON.parse(rawData.toString()); } catch { return; }

        if (msg.type === 'audio') {
            // Cancel silence nudge timer as soon as user sends any audio
            clearTimeout(state.silenceNudgeTimer);
            state.silenceNudgeTimer = null;

            // Hesitation: time from AI turn-complete to first user audio chunk
            if (state.aiTurnEndAt !== null && !state.userAudioStarted) {
                state.userAudioStarted = true;
                const delaySec = (Date.now() - state.aiTurnEndAt) / 1000;
                if (delaySec > 12) {
                    const qIndex = Math.max(0, state.messages.filter(m => m.role === 'assistant').length - 1);
                    state.hesitations.push({ questionIndex: qIndex, delaySeconds: Math.round(delaySec) });
                }
            }

            const audioMsg = JSON.stringify({
                realtimeInput: { audio: { data: msg.data, mimeType: 'audio/pcm;rate=16000' } },
            });

            if (state.geminiReady && geminiWs.readyState === WS.OPEN) {
                geminiWs.send(audioMsg);
            } else {
                state.pendingQueue.push(audioMsg);
            }
        }

        if (msg.type === 'history') {
            // Replay conversation history into Gemini after a reconnect
            if (Array.isArray(msg.messages) && msg.messages.length > 0 && geminiWs.readyState === WS.OPEN) {
                geminiWs.send(JSON.stringify({
                    clientContent: {
                        turns: msg.messages.map(m => ({
                            role: m.role === 'user' ? 'user' : 'model',
                            parts: [{ text: m.content }],
                        })),
                        turnComplete: true,
                    },
                }));
            }
        }

        if (msg.type === 'text') {
            // Cancel silence nudge when user submits text
            clearTimeout(state.silenceNudgeTimer);
            state.silenceNudgeTimer = null;
            // Text fallback: user typed and submitted manually
            const textMsg = JSON.stringify({
                clientContent: {
                    turns: [{ role: 'user', parts: [{ text: msg.content }] }],
                    turnComplete: true,
                },
            });
            state.messages.push({ role: 'user', content: msg.content, timestamp: new Date().toISOString() });
            state.userAudioStarted = false; // reset hesitation for next turn
            if (state.geminiReady && geminiWs.readyState === WS.OPEN) {
                geminiWs.send(textMsg);
            }
        }

        if (msg.type === 'endSession') {
            if (!state.isComplete) {
                state.isComplete = true;
                finalizeSession(state, userId, adminDb).catch(console.error);
                if (ws.readyState === ws.OPEN) {
                    ws.send(JSON.stringify({ type: 'interviewComplete', sessionId: state.sessionId, messages: state.messages, hesitations: state.hesitations }));
                }
            }
            if (geminiWs.readyState === WS.OPEN || geminiWs.readyState === WS.CONNECTING) {
                geminiWs.close(1000, 'Session ended by user');
            }
        }
    });

    ws.on('close', () => {
        clearTimeout(state.silenceNudgeTimer);
        state.silenceNudgeTimer = null;
        if (geminiWs.readyState === WS.OPEN || geminiWs.readyState === WS.CONNECTING) {
            geminiWs.close(1000, 'Browser disconnected');
        }
    });

    ws.on('error', (err) => {
        console.error('[Browser WS] Error:', err.message);
    });
}

async function finalizeSession(state, userId, adminDb) {
    if (!userId || !state.sessionId || !adminDb) return;
    try {
        await adminDb
            .collection('users').doc(userId)
            .collection('interviewSessions').doc(state.sessionId)
            .update({
                messages: state.messages,
                hesitations: state.hesitations,
                isComplete: true,
                completedAt: new Date().toISOString(),
            });
    } catch (err) {
        console.error('[server.js] Firestore finalize failed:', err.message);
    }
}

// ── Start server ───────────────────────────────────────────────────────────────
nextApp.prepare().then(() => {
    // Firebase Admin is initialized after Next.js loads env vars from .env.local
    let adminDb = null;
    try {
        const admin = require('firebase-admin');
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                }),
            });
        }
        adminDb = admin.firestore();
        console.log('> Firebase Admin initialized');
    } catch (err) {
        console.error('[server.js] Firebase Admin init failed — Firestore persistence disabled:', err.message);
    }

    const server = createServer((req, res) => {
        handle(req, res, parse(req.url, true));
    });

    // Next.js provides getUpgradeHandler() so HMR WebSocket (/_next/webpack-hmr)
    // is forwarded correctly instead of being destroyed.
    const nextUpgradeHandler = typeof nextApp.getUpgradeHandler === 'function'
        ? nextApp.getUpgradeHandler()
        : null;

    const wss = new WebSocketServer({ noServer: true });
    wss.on('connection', (ws, req) => {
        handleInterviewWs(ws, req, adminDb).catch((err) => {
            console.error('[handleInterviewWs] Unhandled error:', err);
            if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({ type: 'error', message: 'Internal server error' }));
                ws.close();
            }
        });
    });

    server.on('upgrade', (req, socket, head) => {
        const { pathname } = parse(req.url);
        if (pathname === '/ws/interview') {
            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit('connection', ws, req);
            });
            return;
        }
        // Forward all other WebSocket upgrades (HMR, etc.) to Next.js
        if (nextUpgradeHandler) {
            nextUpgradeHandler(req, socket, head);
            return;
        }
        socket.destroy();
    });

    const port = parseInt(process.env.PORT || '3000', 10);
    server.listen(port, () => {
        console.log(`> Ready on http://localhost:${port} [${dev ? 'dev' : 'prod'}]`);
    });
}).catch((err) => {
    console.error('[server.js] Next.js prepare failed:', err);
    process.exit(1);
});
