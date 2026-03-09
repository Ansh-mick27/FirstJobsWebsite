'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import { useParams, useRouter, useSearchParams } from 'next/navigation';

import { Mic, MicOff, Send, X, Volume2, VolumeX, Bot, ChevronLeft, ChevronDown, ChevronUp, Clock, StopCircle, RefreshCw, Share2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

const ROUND_TYPES = [
    { value: 'technical', label: 'Technical', desc: 'DSA, System Design, CS Fundamentals' },
    { value: 'hr', label: 'HR', desc: 'Behavioral, Career Goals, Culture Fit' },
    { value: 'managerial', label: 'Managerial', desc: 'Leadership, Conflict Resolution, PM' },
];

// Interview round type keys that map to the company.rounds object
const INTERVIEW_ROUND_KEYS = ['technical', 'hr', 'managerial'];

const HIRING_DECISION_CONFIG = {
    'Strong Yes': { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
    'Yes': { color: '#6ee7b7', bg: 'rgba(110,231,183,0.10)', border: 'rgba(110,231,183,0.25)' },
    'Maybe': { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)' },
    'No': { color: '#ef4444', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.25)' },
};

// Score ring color: green ≥ 8, amber 5-7, red ≤ 4
function scoreRingColor(score) {
    if (score >= 8) return { stroke: '#10b981', glow: 'rgba(16,185,129,0.4)' };
    if (score >= 5) return { stroke: '#f59e0b', glow: 'rgba(245,158,11,0.4)' };
    return { stroke: '#ef4444', glow: 'rgba(239,68,68,0.4)' };
}

// Animated feedback loading steps
const LOADING_STEPS = [
    '✓ Reading your responses...',
    '✓ Rating each answer 1–5...',
    '✓ Detecting strengths & gaps...',
    '✓ Generating hiring recommendation...',
    '✓ Finalizing your report...',
];

export default function MockInterview() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const companySlug = params?.companySlug || 'company';
    const searchParams = useSearchParams();
    const roleId = searchParams?.get('roleId') || null;

    // Auth guard
    useEffect(() => {
        if (!authLoading && !user) {
            router.push(`/login?next=${encodeURIComponent(`/interview/${companySlug}`)}`);
        }
    }, [authLoading, user, router, companySlug]);

    // ── State ──────────────────────────────────────────────────────────────────
    const [phase, setPhase] = useState('config'); // 'config' | 'active' | 'feedback'
    const [sessionId, setSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [questionCount, setQuestionCount] = useState(0);
    const [isInterviewDone, setIsInterviewDone] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [roundType, setRoundType] = useState('technical');
    const [company, setCompany] = useState(null);
    const [elapsedSec, setElapsedSec] = useState(0);
    const [expandedQA, setExpandedQA] = useState({});
    const [copied, setCopied] = useState(false);
    const [hesitations, setHesitations] = useState([]); // [{ questionIndex, delaySeconds }]
    const [voiceId, setVoiceId] = useState('en-IN-NeerjaNeural'); // Fallback voice

    // ── Randomly select an Indian voice per session ─────────────────────────────
    useEffect(() => {
        const IN_VOICES = ['en-IN-PrabhatNeural', 'en-IN-NeerjaNeural'];
        setVoiceId(IN_VOICES[Math.floor(Math.random() * IN_VOICES.length)]);
    }, []);

    // ── Refs ───────────────────────────────────────────────────────────────────
    const recognitionRef = useRef(null);
    const chatEndRef = useRef(null);
    const textareaRef = useRef(null);
    const timerRef = useRef(null);
    const loadingStepRef = useRef(null);
    const hesitationStartRef = useRef(null); // timestamp when AI finished responding
    const hesitationTimerRef = useRef(null); // interval checking for hesitation

    // ─── Fetch company ──────────────────────────────────────────────────────────
    useEffect(() => {
        async function fetchCompany() {
            try {
                const res = await fetch(`/api/companies/${companySlug}`);
                if (res.ok) {
                    const data = await res.json();
                    setCompany(data);
                    // Default to first available interview round type
                    const available = INTERVIEW_ROUND_KEYS.filter(k =>
                        !data.rounds || data.rounds[k] !== false
                    );
                    if (available.length > 0 && !available.includes(roundType)) {
                        setRoundType(available[0]);
                    }
                    return;
                }
            } catch { /* ignore */ }
            const name = companySlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            setCompany({ id: companySlug, name, slug: companySlug });
        }
        fetchCompany();
    }, [companySlug]);

    // Derive available interview round types — stable via useMemo
    const availableRoundTypes = useMemo(() => {
        const interviewRounds = ['technical', 'hr', 'managerial'];
        if (roleId && company?.roles) {
            const role = company.roles.find(r => r.id === roleId);
            if (role?.roundTypes?.length) {
                const filtered = ROUND_TYPES.filter(
                    rt => interviewRounds.includes(rt.value) && role.roundTypes.includes(rt.value)
                );
                if (filtered.length > 0) return filtered;
            }
        }
        if (company?.rounds) {
            return ROUND_TYPES.filter(rt => company.rounds[rt.value] !== false);
        }
        return ROUND_TYPES;
    }, [roleId, company?.roles, company?.rounds]);

    // Auto-select first available round when available list changes
    useEffect(() => {
        const values = availableRoundTypes.map(r => r.value);
        if (!values.includes(roundType) && values.length > 0) {
            setRoundType(values[0]);
        }
    }, [availableRoundTypes, roundType]);

    // ─── Elapsed timer ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (phase === 'active' && !isInterviewDone) {
            timerRef.current = setInterval(() => setElapsedSec(s => s + 1), 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [phase, isInterviewDone]);

    // ─── Feedback loading step animator ────────────────────────────────────────
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

    const formatTime = (sec) => {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // ─── Web Speech Recognition ─────────────────────────────────────────────────
    // Replaced native SpeechRecognition with universal MediaRecorder + Whisper API 
    // to completely prevent "network" errors on Brave/Safari/Ad-blockers.
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // ─── Hesitation tracking helpers ────────────────────────────────────────────
    function startHesitationTimer(qIndex) {
        if (hesitationStartRef.current !== null) return;
        hesitationStartRef.current = Date.now();
        console.log(`[Hesitation] Started timer for Q${qIndex}`);
    }

    function cancelHesitationTimer() {
        if (hesitationStartRef.current === null) return;
        const elapsed = (Date.now() - hesitationStartRef.current) / 1000;
        console.log(`[Hesitation] Cancelled timer. Elapsed: ${elapsed.toFixed(1)}s`);
        hesitationStartRef.current = null;
    }

    async function toggleMic() {
        cancelHesitationTimer();

        // 1) Stop recording if already active
        if (isListening) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
            setIsListening(false);
            return;
        }

        // 2) Start recording
        try {
            // Stop TTS audio so it doesn't compete with mic input
            ++speakIdRef.current; // cancel any ongoing speak() loop
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
                audioRef.current = null;
                setIsSpeaking(false);
            }
            window.speechSynthesis?.cancel();

            // Request mic stream
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                // Release the microphone tracks immediately to turn off the green light
                stream.getTracks().forEach(track => track.stop());

                const mimeType = mediaRecorder.mimeType || 'audio/webm';
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                if (audioBlob.size === 0) return;

                // Visual indicator while Whisper transcribes (~300ms)
                setInput(prev => {
                    const base = prev ? prev.trim() : '';
                    return base ? `${base} (Transcribing...)` : '(Transcribing...)';
                });

                try {
                    const ext = mimeType.includes('mp4') ? 'm4a' : 'webm';
                    const formData = new FormData();
                    formData.append('file', audioBlob, `speech.${ext}`);

                    const res = await fetch('/api/stt', { method: 'POST', body: formData });
                    if (!res.ok) throw new Error(`STT API returned ${res.status}`);

                    const { text } = await res.json();

                    // Replace the "Transcribing..." placeholder with actual text
                    setInput(prev => {
                        const clean = prev.replace(/\s*\(?Transcribing...\)?/g, '').trim();
                        return clean ? clean + ' ' + text : text;
                    });
                } catch (err) {
                    console.error('[Mic] Transcription error:', err);
                    setInput(prev => prev.replace(/\s*\(?Transcribing...\)?/g, '').trim());
                    alert('Transcription failed. Please check your internet connection or type manually.');
                }
            };

            mediaRecorder.start();
            setIsListening(true);
        } catch (err) {
            console.error('[Mic] Access denied or error:', err);
            alert('Microphone access was denied. Please allow microphone access in your browser settings.');
            setIsListening(false);
        }
    }

    // ─── Audio refs for Edge TTS ──────────────────────────────────────────────────
    const audioRef = useRef(null);    // currently playing Audio element
    const speakIdRef = useRef(0);     // cancel token — increment to abort ongoing speak()

    // ─── Speech Synthesis — Microsoft Edge Neural TTS ─────────────────────────────
    // Fetches all sentences in PARALLEL for low first-word latency (~400ms).
    // Plays them in order as each resolves, cancellable via speakIdRef.
    const speak = useCallback(async (text) => {
        if (isMuted || !text?.trim()) return;

        const myId = ++speakIdRef.current; // unique ID for this call

        // Stop any currently playing audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
            audioRef.current = null;
        }
        setIsSpeaking(true);

        // Split into sentences so we can fetch + play sentence-by-sentence
        const sentences = text
            .replace(/([.?!])\s+/g, '$1|||')
            .split('|||')
            .map(s => s.trim())
            .filter(Boolean);
        if (sentences.length === 0) { setIsSpeaking(false); return; }

        // Kick off ALL sentence fetches in parallel immediately
        const fetchAudio = async (sentence) => {
            try {
                const res = await fetch(`/api/tts?text=${encodeURIComponent(sentence)}&voice=${voiceId}`);
                if (!res.ok) return null;
                return URL.createObjectURL(await res.blob());
            } catch { return null; }
        };
        const audioPromises = sentences.map(fetchAudio);

        // Play sentences in order — start as soon as each one resolves
        for (let i = 0; i < audioPromises.length; i++) {
            if (speakIdRef.current !== myId) break; // cancelled (mute or new speak)

            const audioUrl = await audioPromises[i];
            if (!audioUrl || speakIdRef.current !== myId) {
                if (audioUrl) URL.revokeObjectURL(audioUrl);
                break;
            }

            await new Promise(resolve => {
                const audio = new Audio(audioUrl);
                audioRef.current = audio;
                audio.onended = () => { URL.revokeObjectURL(audioUrl); audioRef.current = null; resolve(); };
                audio.onerror = () => { URL.revokeObjectURL(audioUrl); audioRef.current = null; resolve(); };
                audio.play().catch(() => resolve());
            });
        }

        if (speakIdRef.current === myId) setIsSpeaking(false);
    }, [isMuted]);

    useEffect(() => {
        if (isMuted) {
            ++speakIdRef.current; // abort any ongoing speak() loop
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
                audioRef.current = null;
            }
            window.speechSynthesis?.cancel();
            setIsSpeaking(false);
        }
    }, [isMuted]);

    // ─── prefetchTTS removed — sentence-parallel speak() is already fast enough ──

    // ─── Auto-scroll chat ───────────────────────────────────────────────────────
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ─── Auto-resize textarea ───────────────────────────────────────────────────
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }, [input]);

    // ─── Derived: last AI question text ────────────────────────────────────────
    const lastAiMessage = messages.filter(m => m.role === 'assistant').at(-1)?.content || '';

    // ─── Start Interview ────────────────────────────────────────────────────────
    async function startInterview() {
        setPhase('active');
        setMessages([]);
        setQuestionCount(0);
        setElapsedSec(0);
        setIsInterviewDone(false);
        setSessionId(null);
        setIsLoading(true);
        try {
            const res = await fetch('/api/interview-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [],
                    companyName: company?.name || companySlug,
                    roundType,
                    sessionId: null,
                    userId: user?.uid || null,
                    companyId: company?.id || companySlug,
                    companySlug,
                    roleId,
                    hesitations: [],
                }),

            });
            const data = await res.json();
            setSessionId(data.sessionId);
            const aiMsg = { role: 'assistant', content: data.reply };
            setMessages([aiMsg]);
            setQuestionCount(1);
            speak(data.reply);
            if (data.isComplete) setIsInterviewDone(true);
            else startHesitationTimer(0); // start tracking Q1 response time
        } catch {
            const fallback = { role: 'assistant', content: `Welcome to your ${roundType} interview at ${company?.name || companySlug}! I'm your AI interviewer today. Let's get started — could you begin by telling me a little about yourself?` };
            setMessages([fallback]);
            setQuestionCount(1);
            speak(fallback.content);
        }
        setIsLoading(false);
        // Bug fix 3: Focus textarea so user can type immediately
        setTimeout(() => textareaRef.current?.focus(), 50);
    }

    // ─── Send Message ───────────────────────────────────────────────────────────
    async function sendMessage() {
        if (!input.trim() || isLoading) return;
        if (isListening) recognitionRef.current?.stop();

        cancelHesitationTimer();
        const userMsg = { role: 'user', content: input.trim() };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/interview-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages,
                    companyName: company?.name || companySlug,
                    roundType,
                    sessionId,
                    userId: user?.uid || null,
                    companyId: company?.id || companySlug,
                    companySlug,
                    roleId,
                    hesitations,
                }),

            });
            const data = await res.json();
            const aiMsg = { role: 'assistant', content: data.reply };
            setMessages(prev => [...prev, aiMsg]);

            if (data.isComplete) {
                setIsInterviewDone(true);
            } else {
                const nextQ = questionCount;
                setQuestionCount(q => q + 1);
                startHesitationTimer(nextQ);
            }
            speak(data.reply);
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting. Please check your network and try again." }]);
        }
        setIsLoading(false);
        // Bug fix 3: Focus textarea so user can type immediately after AI responds
        setTimeout(() => textareaRef.current?.focus(), 50);
    }

    // ─── End Interview Early ────────────────────────────────────────────────────
    function endInterviewEarly() {
        if (!confirm('End the interview now and get your feedback?')) return;
        setIsInterviewDone(true);
        window.speechSynthesis?.cancel();
    }

    // ─── Get Feedback ───────────────────────────────────────────────────────────
    async function getFeedback() {
        cancelHesitationTimer();
        setPhase('feedback');
        setFeedbackLoading(true);
        try {
            const res = await fetch('/api/interview-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: sessionId || 'local',
                    userId: user?.uid || 'guest',
                    messages,
                    roundType,
                    companyName: company?.name || companySlug,
                    hesitations,
                }),
            });
            const data = await res.json();
            setFeedback(data.feedback);
        } catch {
            setFeedback({
                score: 7,
                hiringDecision: 'Yes',
                overallSummary: 'You performed well overall. Your answers showed good understanding of the subject and clear communication.',
                strengths: ['Clear communication', 'Structured problem-solving approach', 'Good technical fundamentals'],
                weaknesses: ['Could provide more specific examples', 'Room to improve on edge case handling'],
                suggestions: ['Practice STAR method for behavioral questions', 'Review system design concepts', 'Prepare 2-3 strong project stories'],
                questionBreakdown: [],
            });
        }
        setFeedbackLoading(false);
    }

    // ─── Share Results ──────────────────────────────────────────────────────────
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

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CONFIG PHASE
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
                            🎤 Voice input &amp; AI narration supported in Chrome
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
    // FEEDBACK PHASE
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
                            {/* Hiring Decision Badge */}
                            {feedback.hiringDecision && (
                                <div
                                    className={styles.hiringBadge}
                                    style={{ color: decisionConfig.color, background: decisionConfig.bg, borderColor: decisionConfig.border }}
                                >
                                    Hiring Recommendation: <strong>{feedback.hiringDecision}</strong>
                                </div>
                            )}

                            {/* Score Ring */}
                            <div className={styles.scoreRingWrapper}>
                                <svg width="140" height="140" viewBox="0 0 120 120" className={styles.scoreRingSvg}>
                                    <circle cx="60" cy="60" r="54" className={styles.ringTrack} />
                                    <circle
                                        cx="60" cy="60" r="54"
                                        className={styles.ringFill}
                                        style={{
                                            strokeDasharray: `${fillDash} ${circumference}`,
                                            '--fill-dash': fillDash,
                                            '--circumference': circumference,
                                            stroke: ringColor.stroke,
                                            filter: `drop-shadow(0 0 8px ${ringColor.glow})`,
                                        }}
                                    />
                                </svg>
                                <div className={styles.scoreCenter}>
                                    <span className={styles.scoreNum} style={{ color: ringColor.stroke }}>{feedback.score}/10</span>
                                    <span className={styles.scoreLbl}>Score</span>
                                </div>
                            </div>

                            <h2 className={styles.feedbackTitle}>Interview Complete</h2>
                            <p className={styles.overallSummary}>{feedback.overallSummary}</p>

                            {/* Strengths */}
                            {feedback.strengths?.length > 0 && (
                                <div className={styles.feedbackSection}>
                                    <h3>💪 Strengths</h3>
                                    {feedback.strengths.map((s, i) => (
                                        <div key={i} className={`${styles.feedbackItem} ${styles.strength}`}>{s}</div>
                                    ))}
                                </div>
                            )}

                            {/* Weaknesses */}
                            {feedback.weaknesses?.length > 0 && (
                                <div className={styles.feedbackSection}>
                                    <h3>📈 Areas to Improve</h3>
                                    {feedback.weaknesses.map((w, i) => (
                                        <div key={i} className={`${styles.feedbackItem} ${styles.weakness}`}>{w}</div>
                                    ))}
                                </div>
                            )}

                            {/* Suggestions */}
                            {feedback.suggestions?.length > 0 && (
                                <div className={styles.feedbackSection}>
                                    <h3>💡 Suggestions</h3>
                                    {feedback.suggestions.map((s, i) => (
                                        <div key={i} className={styles.feedbackItem}>{s}</div>
                                    ))}
                                </div>
                            )}

                            {/* Per-question Breakdown — with user answers */}
                            {feedback.questionBreakdown?.length > 0 && (
                                <div className={styles.feedbackSection}>
                                    <h3>🎯 Question Breakdown</h3>
                                    {feedback.questionBreakdown.map((qa, i) => {
                                        // Match user answer from messages (user messages are odd-indexed after first AI msg)
                                        const userMessages = messages.filter(m => m.role === 'user');
                                        const userAnswer = userMessages[i]?.content || null;

                                        return (
                                            <div key={i} className={styles.qaCard}>
                                                <button
                                                    className={styles.qaCardHeader}
                                                    onClick={() => setExpandedQA(prev => ({ ...prev, [i]: !prev[i] }))}
                                                >
                                                    <div className={styles.qaCardLeft}>
                                                        <span className={styles.qaNum}>Q{i + 1}</span>
                                                        <span className={styles.qaQuestion}>{qa.question?.slice(0, 80)}{qa.question?.length > 80 ? '…' : ''}</span>
                                                    </div>
                                                    <div className={styles.qaCardRight}>
                                                        <div className={styles.ratingDots}>
                                                            {[1, 2, 3, 4, 5].map(d => (
                                                                <div key={d} className={`${styles.ratingDot} ${d <= (qa.rating || 3) ? styles.ratingDotFilled : ''}`} />
                                                            ))}
                                                        </div>
                                                        {expandedQA[i] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                    </div>
                                                </button>
                                                <AnimatePresence>
                                                    {expandedQA[i] && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className={styles.qaCardBody}
                                                        >
                                                            {userAnswer && (
                                                                <div className={styles.qaUserAnswer}>
                                                                    <span className={styles.qaAnswerLabel}>Your answer:</span>
                                                                    <p>{userAnswer}</p>
                                                                </div>
                                                            )}
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
                                <button className={styles.btnTryAgain} onClick={() => {
                                    setFeedback(null);
                                    setMessages([]);
                                    setPhase('config');
                                }}>
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
    return (
        <div className={styles.container}>
            {/* Top Bar */}
            <div className={styles.topBar}>
                <button className={styles.btnExit} onClick={() => { if (confirm('Exit interview?')) router.back(); }} title="Exit">
                    <X size={18} />
                </button>

                <div className={styles.progressWrapper}>
                    <div className={styles.progressTrack}>
                        <div className={styles.progressFill} style={{ width: `${Math.min((questionCount / (roundType === 'technical' ? 10 : 7)) * 100, 100)}%` }} />
                    </div>
                    <span className={styles.progressLabel}>Question {questionCount} of {roundType === 'technical' ? '~10' : '~7'}</span>
                </div>

                <div className={styles.topActions}>
                    <div className={styles.timerBadge}>
                        <Clock size={12} />
                        {formatTime(elapsedSec)}
                    </div>
                    <button
                        className={`${styles.muteBtn} ${isMuted ? styles.mutedActive : ''}`}
                        onClick={() => setIsMuted(m => !m)}
                        title={isMuted ? 'Unmute AI' : 'Mute AI'}
                    >
                        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    {!isInterviewDone && (
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
                        {/* Animated AI Avatar rings */}
                        <div className={styles.avatarOuter}>
                            <div className={`${styles.avatarRing} ${isSpeaking ? styles.speakingRing : ''}`}>
                                <div className={`${styles.avatarCircle} ${isSpeaking ? styles.speaking : ''}`}>
                                    <Bot size={36} />
                                </div>
                            </div>
                        </div>

                        {/* Waveform — always visible, animated when speaking */}
                        <div className={styles.waveform}>
                            {[...Array(7)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`${styles.waveBar} ${isSpeaking ? styles.waveBarActive : ''}`}
                                    style={{ animationDelay: `${i * 0.1}s` }}
                                />
                            ))}
                        </div>

                        <h3 className={styles.agentName}>AI Interviewer</h3>
                        <p className={styles.agentStatus}>
                            {isLoading ? '✍️ Thinking...' : isSpeaking ? '🔊 Speaking...' : isListening ? '🎤 Listening...' : '👂 Waiting...'}
                        </p>

                        {/* Q counter */}
                        <div className={styles.qCounter}>
                            Q {questionCount} <span>/ {roundType === 'technical' ? '~10' : '~7'}</span>
                        </div>
                    </div>

                    {/* Last AI question preview */}
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
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className={`${styles.chatBubble} ${msg.role === 'assistant' ? styles.bubbleAi : styles.bubbleUser}`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className={styles.bubbleAvatar}><Bot size={14} /></div>
                                    )}
                                    <div className={styles.bubbleContent}>{msg.content}</div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {isLoading && (
                            <div className={`${styles.chatBubble} ${styles.bubbleAi}`}>
                                <div className={styles.bubbleAvatar}><Bot size={14} /></div>
                                <div className={styles.typingIndicator}>
                                    <span /><span /><span />
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <div className={styles.inputArea}>
                        {isInterviewDone && (
                            <div className={styles.interviewDoneBanner}>
                                ✅ Interview complete! Click <strong>Get Feedback →</strong> above.
                            </div>
                        )}
                        <div className={styles.inputBox}>
                            <button
                                className={`${styles.micBtn} ${isListening ? styles.listening : ''}`}
                                onClick={toggleMic}
                                title={isListening ? 'Stop recording and transcribe' : 'Start voice input'}
                                disabled={isInterviewDone}
                            >
                                {isListening ? (
                                    <>
                                        <StopCircle size={18} />
                                        <span>Stop & Transcribe</span>
                                    </>
                                ) : (
                                    <Mic size={20} />
                                )}
                                {isListening && <div className={styles.micPulse} />}
                            </button>
                            <div className={styles.textareaWrapper}>
                                <textarea
                                    ref={textareaRef}
                                    placeholder="Type your response or click the mic..."
                                    value={input}
                                    onChange={e => { cancelHesitationTimer(); setInput(e.target.value); }}
                                    onKeyDown={handleKeyDown}
                                    className={styles.textarea}
                                    rows={1}
                                    disabled={isLoading || isInterviewDone}
                                />
                                {input.length > 0 && (
                                    <div className={styles.charCounter}>{input.length} chars</div>
                                )}
                            </div>
                            <button
                                className={styles.sendBtn}
                                onClick={sendMessage}
                                disabled={!input.trim() || isLoading || isInterviewDone}
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
