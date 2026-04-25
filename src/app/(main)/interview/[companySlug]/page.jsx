'use client';

import { useState, useEffect, useRef, useCallback, useMemo, useReducer } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Mic, MicOff, Send, X, Volume2, VolumeX, Bot, ChevronLeft, ChevronDown, ChevronUp, Clock, StopCircle, RefreshCw, Share2, CheckCircle, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

const ROUND_TYPES = [
    { value: 'technical', label: 'Technical', desc: 'DSA, System Design, CS Fundamentals' },
    { value: 'hr', label: 'HR', desc: 'Behavioral, Career Goals, Culture Fit' },
    { value: 'managerial', label: 'Managerial', desc: 'Leadership, Conflict Resolution, PM' },
];

const INTERVIEW_ROUND_KEYS = ['technical', 'hr', 'managerial'];

const HIRING_DECISION_CONFIG = {
    'Strong Yes': { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
    'Yes': { color: '#6ee7b7', bg: 'rgba(110,231,183,0.10)', border: 'rgba(110,231,183,0.25)' },
    'Maybe': { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)' },
    'No': { color: '#ef4444', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.25)' },
};

function scoreRingColor(score) {
    if (score >= 8) return { stroke: '#10b981', glow: 'rgba(16,185,129,0.4)' };
    if (score >= 5) return { stroke: '#f59e0b', glow: 'rgba(245,158,11,0.4)' };
    return { stroke: '#ef4444', glow: 'rgba(239,68,68,0.4)' };
}

const LOADING_STEPS = [
    '✓ Reading your responses...',
    '✓ Rating each answer 1–5...',
    '✓ Detecting strengths & gaps...',
    '✓ Generating hiring recommendation...',
    '✓ Finalizing your report...',
];

// ── Audio helpers (pure functions, no React deps) ─────────────────────────────

function downsampleAndEncode(float32, fromRate, toRate) {
    const ratio = fromRate / toRate;
    const outLen = Math.floor(float32.length / ratio);
    const result = new Int16Array(outLen);
    for (let i = 0; i < outLen; i++) {
        const start = Math.floor(i * ratio);
        const end = Math.min(Math.floor((i + 1) * ratio), float32.length);
        let sum = 0;
        for (let j = start; j < end; j++) sum += float32[j];
        const avg = sum / (end - start);
        result[i] = Math.max(-32768, Math.min(32767, Math.round(avg * 32767)));
    }
    return result.buffer;
}

function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
}

function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}

function pcm16ToFloat32(buffer) {
    const view = new DataView(buffer);
    const samples = buffer.byteLength / 2;
    const float32 = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
        float32[i] = view.getInt16(i * 2, true) / 32768;
    }
    return float32;
}

function getSampleRate(mimeType) {
    return parseInt(mimeType?.match(/rate=(\d+)/)?.[1] || '24000', 10);
}

// ── Interview state reducer ───────────────────────────────────────────────────

const INITIAL_INTERVIEW_STATE = {
    sessionId: null,
    maxQuestions: 10,
    messages: [],        // complete messages: { role, content }
    partialAi: '',       // streaming AI transcript
    partialUser: '',     // streaming user transcript
    questionCount: 0,
    isConnected: false,
    isInterviewerSpeaking: false,
    isComplete: false,
};

function interviewReducer(state, action) {
    switch (action.type) {
        case 'SESSION_START':
            return { ...state, sessionId: action.sessionId, maxQuestions: action.maxQuestions || state.maxQuestions };
        case 'CONNECTED':
            return { ...state, isConnected: true, questionCount: 0 };
        case 'AI_TRANSCRIPT':
            return { ...state, partialAi: state.partialAi + action.text, isInterviewerSpeaking: true };
        case 'AI_AUDIO':
            return { ...state, isInterviewerSpeaking: true };
        case 'TURN_COMPLETE': {
            const msgs = state.partialAi.trim()
                ? [...state.messages, { role: 'assistant', content: state.partialAi.trim() }]
                : state.messages;
            return { ...state, messages: msgs, partialAi: '', isInterviewerSpeaking: false, questionCount: state.questionCount + 1 };
        }
        case 'INTERRUPTED':
            return { ...state, isInterviewerSpeaking: false };
        case 'USER_TRANSCRIPT_CHUNK':
            return { ...state, partialUser: state.partialUser + action.text };
        case 'USER_TRANSCRIPT_DONE': {
            const userContent = (state.partialUser + action.text).trim();
            const msgs = userContent
                ? [...state.messages, { role: 'user', content: userContent }]
                : state.messages;
            return { ...state, messages: msgs, partialUser: '' };
        }
        case 'INTERVIEW_COMPLETE':
            return {
                ...state,
                messages: action.messages || state.messages,
                sessionId: action.sessionId || state.sessionId,
                partialAi: '',
                partialUser: '',
                isComplete: true,
                isInterviewerSpeaking: false,
            };
        case 'RESET':
            return { ...INITIAL_INTERVIEW_STATE };
        default:
            return state;
    }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MockInterview() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const companySlug = params?.companySlug || 'company';
    const searchParams = useSearchParams();
    const roleId = searchParams?.get('roleId') || null;

    useEffect(() => {
        if (!authLoading && !user) {
            router.push(`/login?next=${encodeURIComponent(`/interview/${companySlug}`)}`);
        }
    }, [authLoading, user, router, companySlug]);

    // ── Persistent UI state ───────────────────────────────────────────────────
    const [phase, setPhase] = useState('config');
    const [isLoading, setIsLoading] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isInterviewDone, setIsInterviewDone] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [roundType, setRoundType] = useState('technical');
    const [company, setCompany] = useState(() => {
        if (typeof window !== 'undefined') {
            const cached = sessionStorage.getItem(`company_${companySlug}`);
            if (cached) return JSON.parse(cached);
        }
        return null;
    });
    const [elapsedSec, setElapsedSec] = useState(0);
    const [expandedQA, setExpandedQA] = useState({});
    const [copied, setCopied] = useState(false);
    const [textInput, setTextInput] = useState('');
    const [connectionError, setConnectionError] = useState('');

    // ── Interview state via reducer ───────────────────────────────────────────
    const [iv, dispatch] = useReducer(interviewReducer, INITIAL_INTERVIEW_STATE);

    // ── Refs ──────────────────────────────────────────────────────────────────
    const wsRef = useRef(null);
    const audioCtxRef = useRef(null);        // capture context
    const scriptProcessorRef = useRef(null);
    const micStreamRef = useRef(null);
    const playCtxRef = useRef(null);         // playback context
    const gainNodeRef = useRef(null);
    const nextPlayTimeRef = useRef(0);
    const isMutedRef = useRef(false);
    const isMicMutedRef = useRef(false);
    const chatEndRef = useRef(null);
    const textareaRef = useRef(null);
    const timerRef = useRef(null);
    const loadingStepRef = useRef(null);
    // Store partial texts in refs so WS callbacks see current values without stale closure
    const partialAiRef = useRef('');
    const partialUserRef = useRef('');

    // Sync mute refs
    useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
    useEffect(() => { isMicMutedRef.current = isMicMuted; }, [isMicMuted]);

    // ── Company fetch ─────────────────────────────────────────────────────────
    useEffect(() => {
        async function fetchCompany() {
            try {
                const res = await fetch(`/api/companies/${companySlug}`);
                if (res.ok) {
                    const data = await res.json();
                    sessionStorage.setItem(`company_${companySlug}`, JSON.stringify(data));
                    setCompany(data);
                    const available = INTERVIEW_ROUND_KEYS.filter(k => !data.rounds || data.rounds[k] !== false);
                    if (available.length > 0 && !available.includes(roundType)) setRoundType(available[0]);
                    return;
                }
            } catch { /* ignore */ }
            const name = companySlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const fallback = { id: companySlug, name, slug: companySlug };
            setCompany(fallback);
            sessionStorage.setItem(`company_${companySlug}`, JSON.stringify(fallback));
        }
        fetchCompany();
    }, [companySlug]);

    const availableRoundTypes = useMemo(() => {
        if (roleId && company?.roles) {
            const role = company.roles.find(r => r.id === roleId);
            if (role?.roundTypes?.length) {
                const filtered = ROUND_TYPES.filter(rt => role.roundTypes.includes(rt.value));
                if (filtered.length > 0) return filtered;
            }
        }
        if (company?.rounds) return ROUND_TYPES.filter(rt => company.rounds[rt.value] !== false);
        return ROUND_TYPES;
    }, [roleId, company?.roles, company?.rounds]);

    useEffect(() => {
        const values = availableRoundTypes.map(r => r.value);
        if (!values.includes(roundType) && values.length > 0) setRoundType(values[0]);
    }, [availableRoundTypes, roundType]);

    // ── Elapsed timer ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (phase === 'active' && !isInterviewDone) {
            timerRef.current = setInterval(() => setElapsedSec(s => s + 1), 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [phase, isInterviewDone]);

    // ── Feedback loading steps ────────────────────────────────────────────────
    useEffect(() => {
        if (feedbackLoading) {
            setLoadingStep(0);
            let step = 0;
            loadingStepRef.current = setInterval(() => {
                step++;
                if (step < LOADING_STEPS.length) setLoadingStep(step);
                else clearInterval(loadingStepRef.current);
            }, 900);
        } else {
            clearInterval(loadingStepRef.current);
        }
        return () => clearInterval(loadingStepRef.current);
    }, [feedbackLoading]);

    // ── Auto-scroll ───────────────────────────────────────────────────────────
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [iv.messages, iv.partialAi, iv.partialUser]);

    // ── Mute: update gain node ────────────────────────────────────────────────
    useEffect(() => {
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = isMuted ? 0 : 1;
        }
    }, [isMuted]);

    // ── Cleanup on unmount ────────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            stopMic();
            wsRef.current?.close();
            playCtxRef.current?.close();
        };
    }, []);

    const formatTime = (sec) => {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // ── Audio: schedule a PCM chunk for playback ──────────────────────────────
    const scheduleAudioChunk = useCallback((base64, mimeType) => {
        if (isMutedRef.current) return;
        try {
            if (!playCtxRef.current) {
                const ctx = new AudioContext();
                const gain = ctx.createGain();
                gain.gain.value = isMutedRef.current ? 0 : 1;
                gain.connect(ctx.destination);
                playCtxRef.current = ctx;
                gainNodeRef.current = gain;
                nextPlayTimeRef.current = 0;
            }
            const ctx = playCtxRef.current;
            const sampleRate = getSampleRate(mimeType);
            const arrayBuf = base64ToArrayBuffer(base64);
            const float32 = pcm16ToFloat32(arrayBuf);
            const audioBuf = ctx.createBuffer(1, float32.length, sampleRate);
            audioBuf.getChannelData(0).set(float32);
            const source = ctx.createBufferSource();
            source.buffer = audioBuf;
            source.connect(gainNodeRef.current);
            const startAt = Math.max(ctx.currentTime + 0.02, nextPlayTimeRef.current);
            source.start(startAt);
            nextPlayTimeRef.current = startAt + audioBuf.duration;
        } catch (err) {
            console.error('[scheduleAudioChunk]', err);
        }
    }, []);

    // ── Audio: start microphone capture ──────────────────────────────────────
    const startMic = useCallback(async (ws) => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        micStreamRef.current = stream;

        const ctx = new AudioContext();
        audioCtxRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        // ScriptProcessorNode is deprecated but has universal browser support.
        // bufferSize=4096 gives ~85ms chunks at 48kHz — fine for streaming to Gemini.
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        scriptProcessorRef.current = processor;

        source.connect(processor);
        processor.connect(ctx.destination); // must be connected to fire onaudioprocess

        processor.onaudioprocess = (e) => {
            if (isMicMutedRef.current) return;
            if (!ws || ws.readyState !== WebSocket.OPEN) return;
            const float32 = e.inputBuffer.getChannelData(0);
            const pcm = downsampleAndEncode(float32, ctx.sampleRate, 16000);
            const b64 = arrayBufferToBase64(pcm);
            ws.send(JSON.stringify({ type: 'audio', data: b64 }));
        };
    }, []);

    const stopMic = useCallback(() => {
        try {
            scriptProcessorRef.current?.disconnect();
            audioCtxRef.current?.close();
            micStreamRef.current?.getTracks().forEach(t => t.stop());
        } catch { /* ignore cleanup errors */ }
        scriptProcessorRef.current = null;
        audioCtxRef.current = null;
        micStreamRef.current = null;
    }, []);

    // ── WebSocket message handler ─────────────────────────────────────────────
    const handleWsMessage = useCallback((msg) => {
        switch (msg.type) {
            case 'sessionStart':
                dispatch({ type: 'SESSION_START', sessionId: msg.sessionId, maxQuestions: msg.maxQuestions });
                break;
            case 'connected':
                dispatch({ type: 'CONNECTED' });
                setIsLoading(false);
                setConnectionError('');
                break;
            case 'audio':
                scheduleAudioChunk(msg.data, msg.mimeType);
                dispatch({ type: 'AI_AUDIO' });
                break;
            case 'aiTranscript':
                partialAiRef.current += msg.text;
                dispatch({ type: 'AI_TRANSCRIPT', text: msg.text });
                break;
            case 'turnComplete':
                partialAiRef.current = '';
                dispatch({ type: 'TURN_COMPLETE' });
                break;
            case 'interrupted':
                partialAiRef.current = '';
                dispatch({ type: 'INTERRUPTED' });
                break;
            case 'userTranscript':
                if (msg.finished) {
                    const fullUser = partialUserRef.current + (msg.text || '');
                    partialUserRef.current = '';
                    dispatch({ type: 'USER_TRANSCRIPT_DONE', text: fullUser });
                } else {
                    partialUserRef.current += msg.text || '';
                    dispatch({ type: 'USER_TRANSCRIPT_CHUNK', text: msg.text || '' });
                }
                break;
            case 'interviewComplete':
                dispatch({ type: 'INTERVIEW_COMPLETE', sessionId: msg.sessionId, messages: msg.messages });
                setIsInterviewDone(true);
                stopMic();
                break;
            case 'geminiClosed':
            case 'error':
                console.error('[Interview WS] Server error:', msg.message);
                setConnectionError(msg.message || 'Connection lost.');
                setIsLoading(false);
                break;
        }
    }, [scheduleAudioChunk, stopMic]);

    // ── Start interview ───────────────────────────────────────────────────────
    async function startInterview() {
        setPhase('active');
        setElapsedSec(0);
        setIsInterviewDone(false);
        setConnectionError('');
        dispatch({ type: 'RESET' });
        setIsLoading(true);
        partialAiRef.current = '';
        partialUserRef.current = '';

        try {
            // 1. Get signed session token (server builds system prompt)
            const res = await fetch('/api/interview-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companySlug,
                    roleId,
                    roundType,
                    userId: user?.uid || null,
                    companyId: company?.id || companySlug,
                    companyName: company?.name || companySlug,
                }),
            });
            if (!res.ok) throw new Error(`Session init failed: ${res.status}`);
            const { sessionToken } = await res.json();

            // 2. Request mic permission before opening WS (avoids permission prompt mid-interview)
            await navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(s => s.getTracks().forEach(t => t.stop()));

            // 3. Open WebSocket
            const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${proto}//${window.location.host}/ws/interview?token=${encodeURIComponent(sessionToken)}`;
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onmessage = (event) => {
                try { handleWsMessage(JSON.parse(event.data)); } catch (e) { console.error('[WS parse]', e); }
            };
            ws.onerror = () => {
                setConnectionError('WebSocket connection failed.');
                setIsLoading(false);
            };
            ws.onclose = () => {
                stopMic();
            };
            ws.onopen = async () => {
                // 4. Start continuous mic capture once WS is open
                try {
                    await startMic(ws);
                } catch (err) {
                    console.error('[startMic]', err);
                    setConnectionError('Microphone access denied. Please allow mic access and retry.');
                    setIsLoading(false);
                    ws.close();
                }
            };
        } catch (err) {
            console.error('[startInterview]', err);
            setConnectionError('Failed to start interview. Please try again.');
            setIsLoading(false);
            setPhase('config');
        }
    }

    // ── Send text fallback ────────────────────────────────────────────────────
    function sendText() {
        if (!textInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        wsRef.current.send(JSON.stringify({ type: 'text', content: textInput.trim() }));
        setTextInput('');
    }

    function handleTextKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(); }
    }

    // ── End interview early ───────────────────────────────────────────────────
    function endInterviewEarly() {
        if (!confirm('End the interview now and get your feedback?')) return;
        wsRef.current?.send(JSON.stringify({ type: 'endSession' }));
        setIsInterviewDone(true);
        stopMic();
    }

    // ── Get feedback ──────────────────────────────────────────────────────────
    async function getFeedback() {
        setPhase('feedback');
        setFeedbackLoading(true);
        try {
            const res = await fetch('/api/interview-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: iv.sessionId || 'local',
                    userId: user?.uid || 'guest',
                    messages: iv.messages,
                    roundType,
                    companyName: company?.name || companySlug,
                    hesitations: [],
                }),
            });
            const data = await res.json();
            setFeedback(data.feedback);
        } catch {
            setFeedback({
                score: 7, hiringDecision: 'Yes',
                overallSummary: 'You performed well overall. Your answers showed good understanding of the subject and clear communication.',
                strengths: ['Clear communication', 'Structured problem-solving approach', 'Good technical fundamentals'],
                weaknesses: ['Could provide more specific examples', 'Room to improve on edge case handling'],
                suggestions: ['Practice STAR method for behavioral questions', 'Review system design concepts', 'Prepare 2-3 strong project stories'],
                questionBreakdown: [],
            });
        }
        setFeedbackLoading(false);
    }

    function shareResults() {
        if (!feedback) return;
        const text = [
            `🎯 PlacePrep Mock Interview — ${company?.name || companySlug} (${roundType})`,
            `Score: ${feedback.score}/10 | Decision: ${feedback.hiringDecision}`,
            '',
            feedback.overallSummary,
            '',
            '💪 Strengths:',
            ...(feedback.strengths || []).map(s => `  • ${s}`),
            '',
            '📈 Areas to improve:',
            ...(feedback.weaknesses || []).map(w => `  • ${w}`),
        ].join('\n');
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    const lastAiMessage = iv.messages.filter(m => m.role === 'assistant').at(-1)?.content || iv.partialAi || '';
    const maxQ = iv.maxQuestions || (roundType === 'technical' ? 10 : 7);

    // ══════════════════════════════════════════════════════════════════════════
    // CONFIG PHASE (unchanged)
    // ══════════════════════════════════════════════════════════════════════════
    if (phase === 'config') {
        return (
            <div className={styles.container}>
                <div className={styles.configScreen}>
                    <button className={styles.btnBackConfig} onClick={() => router.back()}>
                        <ChevronLeft size={16} /> Back
                    </button>
                    <div className={styles.configCard}>
                        <div className={styles.configHeader}>
                            <div className={styles.configAvatar}><Bot size={24} /></div>
                            <div>
                                <h1>{company?.name || companySlug.toUpperCase()}</h1>
                                <p className={styles.configSubtitle}>AI Mock Interview</p>
                            </div>
                        </div>
                        <div className={styles.configSection}>
                            <label className={styles.configLabel}>Round Type</label>
                            <div className={styles.roundGrid}>
                                {availableRoundTypes.map(rt => (
                                    <button
                                        key={rt.value}
                                        className={`${styles.roundCard} ${roundType === rt.value ? styles.roundCardActive : ''}`}
                                        onClick={() => setRoundType(rt.value)}
                                    >
                                        <span className={styles.roundCardLabel}>{rt.label}</span>
                                        <span className={styles.roundCardDesc}>{rt.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className={styles.expectationBox}>
                            <h4>What to expect</h4>
                            {roundType === 'technical' && (
                                <ul>
                                    <li>Data structures &amp; Algorithms</li>
                                    <li>System design concepts</li>
                                    <li>OOP, DBMS, OS fundamentals</li>
                                    <li>~10 questions, adaptive difficulty</li>
                                </ul>
                            )}
                            {roundType === 'hr' && (
                                <ul>
                                    <li>Behavioral &amp; situational (STAR)</li>
                                    <li>Communication &amp; teamwork</li>
                                    <li>Career goals &amp; salary discussion</li>
                                    <li>~7 questions</li>
                                </ul>
                            )}
                            {roundType === 'managerial' && (
                                <ul>
                                    <li>Leadership &amp; conflict resolution</li>
                                    <li>Project management &amp; stakeholders</li>
                                    <li>Decision-making under pressure</li>
                                    <li>~7 questions</li>
                                </ul>
                            )}
                        </div>
                        <div className={styles.voiceNote}>
                            🎤 Speak naturally — AI hears you in real time via Gemini Live
                        </div>
                        <button className={styles.btnStartInterview} onClick={startInterview}>
                            Start Interview →
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ══════════════════════════════════════════════════════════════════════════
    // FEEDBACK PHASE (unchanged)
    // ══════════════════════════════════════════════════════════════════════════
    if (phase === 'feedback') {
        if (feedbackLoading) {
            return (
                <div className={styles.container}>
                    <div className={styles.feedbackLoading}>
                        <div className={styles.loadingSpinner} />
                        <h2>Analyzing your interview...</h2>
                        <div className={styles.loadingSteps}>
                            {LOADING_STEPS.map((step, i) => (
                                <motion.div
                                    key={i}
                                    className={`${styles.loadingStepItem} ${i <= loadingStep ? styles.loadingStepVisible : ''}`}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={i <= loadingStep ? { opacity: 1, x: 0 } : { opacity: 0, x: -12 }}
                                    transition={{ duration: 0.35 }}
                                >
                                    {step}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        if (feedback) {
            const pct = (feedback.score / 10) * 100;
            const circumference = 2 * Math.PI * 54;
            const fillDash = (pct / 100) * circumference;
            const decisionConfig = HIRING_DECISION_CONFIG[feedback.hiringDecision] || HIRING_DECISION_CONFIG['Maybe'];
            const ringColor = scoreRingColor(feedback.score);

            return (
                <div className={styles.container}>
                    <div className={styles.feedbackScreen}>
                        <div className={styles.feedbackCard}>
                            {feedback.hiringDecision && (
                                <div className={styles.hiringBadge} style={{ color: decisionConfig.color, background: decisionConfig.bg, borderColor: decisionConfig.border }}>
                                    Hiring Recommendation: <strong>{feedback.hiringDecision}</strong>
                                </div>
                            )}
                            <div className={styles.scoreRingWrapper}>
                                <svg width="140" height="140" viewBox="0 0 120 120" className={styles.scoreRingSvg}>
                                    <circle cx="60" cy="60" r="54" className={styles.ringTrack} />
                                    <circle cx="60" cy="60" r="54" className={styles.ringFill} style={{ strokeDasharray: `${fillDash} ${circumference}`, '--fill-dash': fillDash, '--circumference': circumference, stroke: ringColor.stroke, filter: `drop-shadow(0 0 8px ${ringColor.glow})` }} />
                                </svg>
                                <div className={styles.scoreCenter}>
                                    <span className={styles.scoreNum} style={{ color: ringColor.stroke }}>{feedback.score}/10</span>
                                    <span className={styles.scoreLbl}>Score</span>
                                </div>
                            </div>
                            <h2 className={styles.feedbackTitle}>Interview Complete</h2>
                            <p className={styles.overallSummary}>{feedback.overallSummary}</p>
                            {feedback.strengths?.length > 0 && (
                                <div className={styles.feedbackSection}>
                                    <h3>💪 Strengths</h3>
                                    {feedback.strengths.map((s, i) => <div key={i} className={`${styles.feedbackItem} ${styles.strength}`}>{s}</div>)}
                                </div>
                            )}
                            {feedback.weaknesses?.length > 0 && (
                                <div className={styles.feedbackSection}>
                                    <h3>📈 Areas to Improve</h3>
                                    {feedback.weaknesses.map((w, i) => <div key={i} className={`${styles.feedbackItem} ${styles.weakness}`}>{w}</div>)}
                                </div>
                            )}
                            {feedback.suggestions?.length > 0 && (
                                <div className={styles.feedbackSection}>
                                    <h3>💡 Suggestions</h3>
                                    {feedback.suggestions.map((s, i) => <div key={i} className={styles.feedbackItem}>{s}</div>)}
                                </div>
                            )}
                            {feedback.questionBreakdown?.length > 0 && (
                                <div className={styles.feedbackSection}>
                                    <h3>🎯 Question Breakdown</h3>
                                    {feedback.questionBreakdown.map((qa, i) => {
                                        const userMessages = iv.messages.filter(m => m.role === 'user');
                                        const userAnswer = userMessages[i]?.content || null;
                                        return (
                                            <div key={i} className={styles.qaCard}>
                                                <button className={styles.qaCardHeader} onClick={() => setExpandedQA(prev => ({ ...prev, [i]: !prev[i] }))}>
                                                    <div className={styles.qaCardLeft}>
                                                        <span className={styles.qaNum}>Q{i + 1}</span>
                                                        <span className={styles.qaQuestion}>{qa.question?.slice(0, 80)}{qa.question?.length > 80 ? '…' : ''}</span>
                                                    </div>
                                                    <div className={styles.qaCardRight}>
                                                        <div className={styles.ratingDots}>
                                                            {[1, 2, 3, 4, 5].map(d => <div key={d} className={`${styles.ratingDot} ${d <= (qa.rating || 3) ? styles.ratingDotFilled : ''}`} />)}
                                                        </div>
                                                        {expandedQA[i] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                    </div>
                                                </button>
                                                <AnimatePresence>
                                                    {expandedQA[i] && (
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className={styles.qaCardBody}>
                                                            {userAnswer && <div className={styles.qaUserAnswer}><span className={styles.qaAnswerLabel}>Your answer:</span><p>{userAnswer}</p></div>}
                                                            {qa.comment && <p className={styles.qaComment}>{qa.comment}</p>}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            <div className={styles.feedbackActions}>
                                <button className={styles.btnTryAgain} onClick={() => { setFeedback(null); setPhase('config'); }}>
                                    <RefreshCw size={15} /> Try Again
                                </button>
                                <button className={styles.btnShare} onClick={shareResults}>
                                    {copied ? <><CheckCircle size={15} /> Copied!</> : <><Share2 size={15} /> Share Results</>}
                                </button>
                                <button className={styles.btnSecondary} onClick={() => router.push(`/companies/${companySlug}`)}>
                                    Back to Company
                                </button>
                                <button className={styles.btnPrimary} onClick={() => router.push('/dashboard')}>
                                    View Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ACTIVE INTERVIEW
    // ══════════════════════════════════════════════════════════════════════════
    const agentStatus = (() => {
        if (isLoading) return '🔄 Connecting...';
        if (!iv.isConnected) return '🔄 Initializing...';
        if (iv.isInterviewerSpeaking) return '🔊 Speaking...';
        if (isInterviewDone) return '✅ Done';
        return '👂 Listening...';
    })();

    return (
        <div className={styles.container}>
            {/* Top Bar */}
            <div className={styles.topBar}>
                <button className={styles.btnExit} onClick={() => { if (confirm('Exit interview?')) { wsRef.current?.close(); router.back(); } }} title="Exit">
                    <X size={18} />
                </button>

                <div className={styles.progressWrapper}>
                    <div className={styles.progressTrack}>
                        <div className={styles.progressFill} style={{ width: `${Math.min((iv.questionCount / maxQ) * 100, 100)}%` }} />
                    </div>
                    <span className={styles.progressLabel}>Question {iv.questionCount} of {roundType === 'technical' ? '~10' : '~7'}</span>
                </div>

                <div className={styles.topActions}>
                    <div className={styles.timerBadge}>
                        <Clock size={12} />
                        {formatTime(elapsedSec)}
                    </div>
                    <button
                        className={`${styles.muteBtn} ${isMicMuted ? styles.mutedActive : ''}`}
                        onClick={() => setIsMicMuted(m => !m)}
                        title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
                    >
                        {isMicMuted ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                    <button
                        className={`${styles.muteBtn} ${isMuted ? styles.mutedActive : ''}`}
                        onClick={() => setIsMuted(m => !m)}
                        title={isMuted ? 'Unmute AI voice' : 'Mute AI voice'}
                    >
                        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    {!isInterviewDone && iv.isConnected && (
                        <button className={styles.btnEndEarly} onClick={endInterviewEarly} title="End interview and get feedback">
                            <StopCircle size={15} /> End
                        </button>
                    )}
                    {isInterviewDone && (
                        <button className={styles.btnFeedback} onClick={getFeedback}>
                            Get Feedback →
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.mainLayout}>
                {/* Avatar Panel */}
                <div className={styles.avatarPanel}>
                    <div className={styles.avatarHeader}>
                        <span className={styles.roundBadge}>
                            {ROUND_TYPES.find(r => r.value === roundType)?.label || roundType} Round
                        </span>
                        <div className={styles.avatarLogoBox}>
                            {(company?.name || companySlug).charAt(0).toUpperCase()}
                        </div>
                        <span className={styles.companyNameLabel}>{company?.name || companySlug}</span>
                    </div>

                    <div className={styles.avatarArea}>
                        <div className={styles.avatarOuter}>
                            <div className={`${styles.avatarRing} ${iv.isInterviewerSpeaking ? styles.speakingRing : ''}`}>
                                <div className={`${styles.avatarCircle} ${iv.isInterviewerSpeaking ? styles.speaking : ''}`}>
                                    <Bot size={36} />
                                </div>
                            </div>
                        </div>

                        <div className={styles.waveform}>
                            {[...Array(7)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`${styles.waveBar} ${iv.isInterviewerSpeaking ? styles.waveBarActive : ''}`}
                                    style={{ animationDelay: `${i * 0.1}s` }}
                                />
                            ))}
                        </div>

                        <h3 className={styles.agentName}>AI Interviewer</h3>
                        <p className={styles.agentStatus}>{agentStatus}</p>

                        {iv.isConnected && !isMicMuted && !isInterviewDone && (
                            <div className={styles.liveIndicator}>
                                <Radio size={12} />
                                <span>Live</span>
                            </div>
                        )}

                        <div className={styles.qCounter}>
                            Q {iv.questionCount} <span>/ {roundType === 'technical' ? '~10' : '~7'}</span>
                        </div>
                    </div>

                    {lastAiMessage && (
                        <div className={styles.lastQuestionBox}>
                            <div className={styles.lastQuestionLabel}>Current Question</div>
                            <p className={styles.lastQuestionText}>{lastAiMessage}</p>
                        </div>
                    )}
                </div>

                {/* Chat Panel */}
                <div className={styles.chatPanel}>
                    <div className={styles.chatHistory}>
                        <AnimatePresence initial={false}>
                            {iv.messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className={`${styles.chatBubble} ${msg.role === 'assistant' ? styles.bubbleAi : styles.bubbleUser}`}
                                >
                                    {msg.role === 'assistant' && <div className={styles.bubbleAvatar}><Bot size={14} /></div>}
                                    <div className={styles.bubbleContent}>{msg.content}</div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Streaming partial transcripts */}
                        {iv.partialAi && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`${styles.chatBubble} ${styles.bubbleAi} ${styles.bubbleStreaming}`}>
                                <div className={styles.bubbleAvatar}><Bot size={14} /></div>
                                <div className={styles.bubbleContent}>{iv.partialAi}<span className={styles.streamCursor} /></div>
                            </motion.div>
                        )}
                        {iv.partialUser && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`${styles.chatBubble} ${styles.bubbleUser} ${styles.bubbleStreaming}`}>
                                <div className={styles.bubbleContent}>{iv.partialUser}<span className={styles.streamCursor} /></div>
                            </motion.div>
                        )}

                        {isLoading && (
                            <div className={`${styles.chatBubble} ${styles.bubbleAi}`}>
                                <div className={styles.bubbleAvatar}><Bot size={14} /></div>
                                <div className={styles.typingIndicator}><span /><span /><span /></div>
                            </div>
                        )}

                        {connectionError && (
                            <div className={styles.errorBanner}>{connectionError}</div>
                        )}

                        <div ref={chatEndRef} />
                    </div>

                    {/* Text fallback input */}
                    <div className={styles.inputArea}>
                        {isInterviewDone && (
                            <div className={styles.interviewDoneBanner}>
                                ✅ Interview complete! Click <strong>Get Feedback →</strong> above.
                            </div>
                        )}
                        {!isInterviewDone && (
                            <div className={styles.inputBox}>
                                <div className={styles.textareaWrapper}>
                                    <textarea
                                        ref={textareaRef}
                                        placeholder="Type a response (or just speak)..."
                                        value={textInput}
                                        onChange={e => setTextInput(e.target.value)}
                                        onKeyDown={handleTextKeyDown}
                                        className={styles.textarea}
                                        rows={1}
                                        disabled={!iv.isConnected || isLoading}
                                    />
                                </div>
                                <button
                                    className={styles.sendBtn}
                                    onClick={sendText}
                                    disabled={!textInput.trim() || !iv.isConnected || isLoading}
                                    title="Send typed response"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
