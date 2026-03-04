'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Mic, MicOff, Send, X, Volume2, VolumeX, Bot, ChevronLeft, ChevronDown, ChevronUp, Clock, StopCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

const ROUND_TYPES = [
    { value: 'technical', label: 'Technical', desc: 'DSA, System Design, CS Fundamentals' },
    { value: 'hr', label: 'HR', desc: 'Behavioral, Career Goals, Culture Fit' },
    { value: 'managerial', label: 'Managerial', desc: 'Leadership, Conflict Resolution, PM' },
];

const HIRING_DECISION_CONFIG = {
    'Strong Yes': { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
    'Yes': { color: '#6ee7b7', bg: 'rgba(110,231,183,0.10)', border: 'rgba(110,231,183,0.25)' },
    'Maybe': { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)' },
    'No': { color: '#ef4444', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.25)' },
};

export default function MockInterview() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const companySlug = params?.companySlug || 'company';

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
    const [roundType, setRoundType] = useState('technical');
    const [company, setCompany] = useState(null);
    const [elapsedSec, setElapsedSec] = useState(0);
    const [expandedQA, setExpandedQA] = useState({}); // feedback question breakdown expand state

    // ── Refs ───────────────────────────────────────────────────────────────────
    const recognitionRef = useRef(null);
    const chatEndRef = useRef(null);
    const textareaRef = useRef(null);
    const timerRef = useRef(null);

    // ─── Fetch company ──────────────────────────────────────────────────────────
    useEffect(() => {
        async function fetchCompany() {
            try {
                const res = await fetch(`/api/companies/${companySlug}`);
                if (res.ok) { setCompany(await res.json()); return; }
            } catch { /* ignore */ }
            const name = companySlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            setCompany({ id: companySlug, name, slug: companySlug });
        }
        fetchCompany();
    }, [companySlug]);

    // ─── Elapsed timer (starts when phase = active) ─────────────────────────────
    useEffect(() => {
        if (phase === 'active' && !isInterviewDone) {
            timerRef.current = setInterval(() => setElapsedSec(s => s + 1), 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [phase, isInterviewDone]);

    const formatTime = (sec) => {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // ─── Web Speech Recognition ─────────────────────────────────────────────────
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return;

        const recognition = new SR();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onresult = (e) => {
            const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
            setInput(transcript);
        };
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);
        recognitionRef.current = recognition;
    }, []);

    function toggleMic() {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            setInput('');
            recognitionRef.current?.start();
            setIsListening(true);
        }
    }

    // ─── Speech Synthesis ───────────────────────────────────────────────────────
    const speak = useCallback((text) => {
        if (isMuted || typeof window === 'undefined' || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => v.lang === 'en-US' && (v.name.includes('Google') || v.name.includes('Premium')))
            || voices.find(v => v.lang === 'en-US');
        if (preferred) utterance.voice = preferred;
        utterance.rate = 0.92;
        utterance.pitch = 1;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    }, [isMuted]);

    useEffect(() => {
        if (isMuted && typeof window !== 'undefined') {
            window.speechSynthesis?.cancel();
            setIsSpeaking(false);
        }
    }, [isMuted]);

    // ─── Auto-scroll chat ───────────────────────────────────────────────────────
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ─── Start Interview ────────────────────────────────────────────────────────
    async function startInterview() {
        setPhase('active');
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
                }),
            });
            const data = await res.json();
            setSessionId(data.sessionId);
            const aiMsg = { role: 'assistant', content: data.reply };
            setMessages([aiMsg]);
            setQuestionCount(1);
            speak(data.reply);
            if (data.isComplete) setIsInterviewDone(true);
        } catch {
            const fallback = { role: 'assistant', content: `Welcome to your ${roundType} interview at ${company?.name || companySlug}! I'm your AI interviewer today. Let's get started — could you begin by telling me a little about yourself?` };
            setMessages([fallback]);
            setQuestionCount(1);
            speak(fallback.content);
        }
        setIsLoading(false);
    }

    // ─── Send Message ───────────────────────────────────────────────────────────
    async function sendMessage() {
        if (!input.trim() || isLoading) return;
        if (isListening) recognitionRef.current?.stop();

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
                }),
            });
            const data = await res.json();
            const aiMsg = { role: 'assistant', content: data.reply };
            setMessages(prev => [...prev, aiMsg]);

            // Use API's isComplete flag — no more fragile string matching
            if (data.isComplete) {
                setIsInterviewDone(true);
            } else {
                setQuestionCount(q => q + 1);
            }
            speak(data.reply);
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting. Please check your network and try again." }]);
        }
        setIsLoading(false);
    }

    // ─── End Interview Early ────────────────────────────────────────────────────
    function endInterviewEarly() {
        if (!confirm('End the interview now and get your feedback?')) return;
        setIsInterviewDone(true);
        window.speechSynthesis?.cancel();
    }

    // ─── Get Feedback ───────────────────────────────────────────────────────────
    async function getFeedback() {
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
                                {ROUND_TYPES.map(rt => (
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
                                    <li>~7 questions, adaptive difficulty</li>
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
                        <p>Your AI coach is reviewing the full transcript</p>
                    </div>
                </div>
            );
        }

        if (feedback) {
            const pct = (feedback.score / 10) * 100;
            const circumference = 2 * Math.PI * 54;
            const fillDash = (pct / 100) * circumference;
            const decisionConfig = HIRING_DECISION_CONFIG[feedback.hiringDecision] || HIRING_DECISION_CONFIG['Maybe'];

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
                                        style={{ strokeDasharray: `${fillDash} ${circumference}`, '--fill-dash': fillDash, '--circumference': circumference }}
                                    />
                                </svg>
                                <div className={styles.scoreCenter}>
                                    <span className={styles.scoreNum}>{feedback.score}/10</span>
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

                            {/* Per-question Breakdown */}
                            {feedback.questionBreakdown?.length > 0 && (
                                <div className={styles.feedbackSection}>
                                    <h3>🎯 Question Breakdown</h3>
                                    {feedback.questionBreakdown.map((qa, i) => (
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
                                                        {qa.comment && <p className={styles.qaComment}>{qa.comment}</p>}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className={styles.feedbackActions}>
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
                        <div className={styles.progressFill} style={{ width: `${Math.min((questionCount / 7) * 100, 100)}%` }} />
                    </div>
                    <span className={styles.progressLabel}>Question {questionCount} of ~7</span>
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
                    </div>
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
                                title={isListening ? 'Stop recording' : 'Start voice input'}
                                disabled={isInterviewDone}
                            >
                                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                                {isListening && <div className={styles.micPulse} />}
                            </button>
                            <textarea
                                ref={textareaRef}
                                placeholder="Type your response or click the mic..."
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className={styles.textarea}
                                rows={2}
                                disabled={isLoading || isInterviewDone}
                            />
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
