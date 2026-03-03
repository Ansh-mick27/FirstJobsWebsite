'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Mic, MicOff, Send, X, Volume2, VolumeX, Bot, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function MockInterview() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const companySlug = params?.companySlug || 'company';

    // ── State ──
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

    // ── Refs ──
    const recognitionRef = useRef(null);
    const chatEndRef = useRef(null);
    const textareaRef = useRef(null);

    // ─── Fetch company ───────────────────────────────────────────────────────────
    useEffect(() => {
        async function fetchCompany() {
            try {
                const res = await fetch(`/api/companies/${companySlug}`);
                if (res.ok) {
                    const data = await res.json();
                    setCompany(data);
                } else {
                    setCompany({ id: companySlug, name: companySlug.charAt(0).toUpperCase() + companySlug.slice(1), slug: companySlug });
                }
            } catch {
                setCompany({ id: companySlug, name: companySlug.charAt(0).toUpperCase() + companySlug.slice(1), slug: companySlug });
            }
        }
        fetchCompany();
    }, [companySlug]);

    // ─── Web Speech Recognition setup ───────────────────────────────────────────
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return;

        const recognition = new SR();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(r => r[0].transcript)
                .join('');
            setInput(transcript);
        };

        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);
        recognitionRef.current = recognition;
    }, []);

    // ─── Toggle mic ──────────────────────────────────────────────────────────────
    function toggleMic() {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            setInput('');
            recognitionRef.current?.start();
            setIsListening(true);
        }
    }

    // ─── Speech synthesis ────────────────────────────────────────────────────────
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

    // Stop speech when muted
    useEffect(() => {
        if (isMuted && typeof window !== 'undefined') {
            window.speechSynthesis?.cancel();
            setIsSpeaking(false);
        }
    }, [isMuted]);

    // ─── Scroll chat to bottom ───────────────────────────────────────────────────
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ─── Start interview ─────────────────────────────────────────────────────────
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
        } catch {
            const fallback = { role: 'assistant', content: `Hello! Welcome to your ${roundType} interview at ${company?.name || companySlug}. I'm your AI interviewer today. Are you ready to begin?` };
            setMessages([fallback]);
            setQuestionCount(1);
            speak(fallback.content);
        }
        setIsLoading(false);
    }

    // ─── Send message ────────────────────────────────────────────────────────────
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

            const replyLower = data.reply.toLowerCase();
            if (replyLower.includes('concludes our interview') || replyLower.includes('thank you for your time')) {
                setIsInterviewDone(true);
            } else {
                setQuestionCount(q => q + 1);
            }

            speak(data.reply);
        } catch {
            const errMsg = { role: 'assistant', content: "I'm having trouble connecting right now. Please check your network and try again." };
            setMessages(prev => [...prev, errMsg]);
        }
        setIsLoading(false);
    }

    // ─── Get feedback ─────────────────────────────────────────────────────────────
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
                }),
            });
            const data = await res.json();
            setFeedback(data.feedback);
        } catch {
            setFeedback({
                score: 7,
                overallSummary: 'You performed well in your interview. Your answers showed good technical knowledge and communication skills.',
                strengths: ['Clear communication', 'Structured approach to problems', 'Good technical fundamentals'],
                weaknesses: ['Could elaborate more on specific examples', 'Room to improve on edge case handling'],
                suggestions: ['Practice mock interviews regularly', 'Review system design fundamentals', 'Prepare more concrete STAR stories'],
            });
        }
        setFeedbackLoading(false);
    }

    // ─── Handle textarea enter ────────────────────────────────────────────────────
    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    // ─── CONFIG PHASE ─────────────────────────────────────────────────────────────
    if (phase === 'config') {
        return (
            <div className={styles.container}>
                <div className={styles.configScreen}>
                    <button className={styles.btnBackConfig} onClick={() => router.back()}>
                        <ChevronLeft size={18} /> Back
                    </button>
                    <div className={styles.configCard}>
                        <div className={styles.configHeader}>
                            <div className={styles.configAvatar}>
                                <Bot size={28} />
                            </div>
                            <h1>{company?.name || companySlug.toUpperCase()}</h1>
                            <p className={styles.configSubtitle}>AI Mock Interview</p>
                        </div>

                        <div className={styles.configSection}>
                            <label className={styles.configLabel}>Round Type</label>
                            <div className={styles.toggleGroup}>
                                <button
                                    className={`${styles.toggleBtn} ${roundType === 'technical' ? styles.toggleActive : ''}`}
                                    onClick={() => setRoundType('technical')}
                                >
                                    Technical Round
                                </button>
                                <button
                                    className={`${styles.toggleBtn} ${roundType === 'hr' ? styles.toggleActive : ''}`}
                                    onClick={() => setRoundType('hr')}
                                >
                                    HR Round
                                </button>
                            </div>
                        </div>

                        <div className={styles.expectationBox}>
                            <h4>What to expect</h4>
                            {roundType === 'technical' ? (
                                <ul>
                                    <li>Data structures & Algorithms</li>
                                    <li>System design concepts</li>
                                    <li>OOP, DBMS, OS fundamentals</li>
                                    <li>Approximately 6-8 questions</li>
                                </ul>
                            ) : (
                                <ul>
                                    <li>Behavioral & situational questions</li>
                                    <li>Leadership, communication, teamwork</li>
                                    <li>Career goals and background</li>
                                    <li>Approximately 6-8 questions</li>
                                </ul>
                            )}
                        </div>

                        <div className={styles.voiceNote}>
                            🎤 Voice input & AI narration supported in Chrome
                        </div>

                        <button className={styles.btnStartInterview} onClick={startInterview}>
                            Start Interview →
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── FEEDBACK PHASE ───────────────────────────────────────────────────────────
    if (phase === 'feedback') {
        if (feedbackLoading) {
            return (
                <div className={styles.container}>
                    <div className={styles.feedbackLoading}>
                        <div className={styles.loadingSpinner} />
                        <h2>Analyzing your interview...</h2>
                        <p>Your AI coach is reviewing the transcript</p>
                    </div>
                </div>
            );
        }

        if (feedback) {
            const pct = (feedback.score / 10) * 100;
            const circumference = 2 * Math.PI * 54;
            const fillDash = (pct / 100) * circumference;

            return (
                <div className={styles.container}>
                    <div className={styles.feedbackScreen}>
                        <div className={styles.feedbackCard}>
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

                            {feedback.strengths?.length > 0 && (
                                <div className={styles.feedbackSection}>
                                    <h3>💪 Strengths</h3>
                                    {feedback.strengths.map((s, i) => (
                                        <div key={i} className={`${styles.feedbackItem} ${styles.strength}`}>{s}</div>
                                    ))}
                                </div>
                            )}

                            {feedback.weaknesses?.length > 0 && (
                                <div className={styles.feedbackSection}>
                                    <h3>📈 Areas to Improve</h3>
                                    {feedback.weaknesses.map((w, i) => (
                                        <div key={i} className={`${styles.feedbackItem} ${styles.weakness}`}>{w}</div>
                                    ))}
                                </div>
                            )}

                            {feedback.suggestions?.length > 0 && (
                                <div className={styles.feedbackSection}>
                                    <h3>💡 Suggestions</h3>
                                    {feedback.suggestions.map((s, i) => (
                                        <div key={i} className={styles.feedbackItem}>{s}</div>
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

    // ─── ACTIVE INTERVIEW ─────────────────────────────────────────────────────────
    return (
        <div className={styles.container}>
            {/* Top Bar */}
            <div className={styles.topBar}>
                <button className={styles.btnExit} onClick={() => { if (confirm('Exit interview?')) router.back(); }}>
                    <X size={18} />
                </button>

                <div className={styles.progressWrapper}>
                    <div className={styles.progressTrack}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${Math.min((questionCount / 8) * 100, 100)}%` }}
                        />
                    </div>
                    <span className={styles.progressLabel}>Question {questionCount} of ~8</span>
                </div>

                <div className={styles.topActions}>
                    <button
                        className={`${styles.muteBtn} ${isMuted ? styles.mutedActive : ''}`}
                        onClick={() => setIsMuted(m => !m)}
                        title={isMuted ? 'Unmute AI' : 'Mute AI'}
                    >
                        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    {isInterviewDone && (
                        <button className={styles.btnFeedback} onClick={getFeedback}>
                            Get Your Feedback →
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.mainLayout}>
                {/* Avatar Panel (1/3) */}
                <div className={styles.avatarPanel}>
                    <div className={styles.avatarHeader}>
                        <span className={styles.roundBadge}>
                            {roundType === 'technical' ? 'Technical Round' : 'HR Round'}
                        </span>
                        <div className={styles.avatarLogoBox}>
                            {(company?.name || companySlug).charAt(0).toUpperCase()}
                        </div>
                    </div>

                    <div className={styles.avatarArea}>
                        <div className={`${styles.avatarRing} ${isSpeaking ? styles.speakingRing : ''}`}>
                            <div className={`${styles.avatarCircle} ${isSpeaking ? styles.speaking : ''}`}>
                                <Bot size={36} />
                            </div>
                        </div>

                        {isSpeaking && (
                            <div className={styles.waveform}>
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className={styles.waveBar} style={{ animationDelay: `${i * 0.12}s` }} />
                                ))}
                            </div>
                        )}

                        <h3 className={styles.agentName}>AI Interviewer</h3>
                        <p className={styles.agentStatus}>
                            {isLoading ? '✍️ Thinking...' : isSpeaking ? '🔊 Speaking...' : isListening ? '🎤 Listening...' : '👂 Waiting...'}
                        </p>
                    </div>
                </div>

                {/* Chat Panel (2/3) */}
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
                                ✅ Interview complete! Click <strong>Get Your Feedback →</strong> above.
                            </div>
                        )}
                        <div className={styles.inputBox}>
                            <button
                                className={`${styles.micBtn} ${isListening ? styles.listening : ''}`}
                                onClick={toggleMic}
                                title={isListening ? 'Stop recording' : 'Start voice input'}
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
