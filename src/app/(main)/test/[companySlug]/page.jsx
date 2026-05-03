'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import { useParams, useRouter, useSearchParams } from 'next/navigation';

import { Play, Send, ChevronRight, ChevronLeft, X, Bookmark, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';
import useContentProtection from '@/hooks/useContentProtection';
import useFullscreen from '@/hooks/useFullscreen';
import Watermark from '@/components/Watermark';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatTime = (secs) => {
    if (secs == null || secs < 0) return '00:00';
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

const LANGUAGES = ['javascript', 'python', 'cpp', 'java'];
const LANG_LABELS = { javascript: 'JavaScript', python: 'Python 3', cpp: 'C++17', java: 'Java' };
// Maps UI language key → what we send to /api/execute (which handles Piston mapping internally)
const PISTON_LANG = { javascript: 'javascript', python: 'python', cpp: 'cpp', java: 'java' };

const STARTER_CODE = {
    javascript: '// Write your code here\nfunction solution() {\n  \n}\n',
    python: '# Write your code here\ndef solution():\n  pass\n',
    cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  // Write your code here\n  return 0;\n}\n',
    java: 'import java.util.*;\n\npublic class Solution {\n  public static void main(String[] args) {\n    // Write your code here\n  }\n}\n',
};

const getPerformanceLabel = (pct) => {
    if (pct >= 85) return { text: 'Excellent 🔥', cls: 'excellent' };
    if (pct >= 60) return { text: 'Good 👍', cls: 'good' };
    return { text: 'Keep Practicing 💪', cls: 'practice' };
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function MockTest() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const companySlug = params?.companySlug || 'company';
    const searchParams = useSearchParams();
    const roleId = searchParams?.get('roleId') || '';

    // Auth guard
    useEffect(() => {
        if (!authLoading && !user) {
            router.push(`/login?next=${encodeURIComponent(`/test/${companySlug}`)}`);
        }
    }, [authLoading, user, router, companySlug]);

    // ── Phases & Questions ──
    const [phase, setPhase] = useState('config'); // 'config' | 'active' | 'submitting' | 'results'
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [company, setCompany] = useState(null);

    // ── Config ──
    const [roundType, setRoundType] = useState('oa'); // 'oa' | 'technical'
    const [numQuestions, setNumQuestions] = useState(10);

    // ── Answers & Code ──
    const [answers, setAnswers] = useState({});
    const [markedForReview, setMarkedForReview] = useState({});
    const [code, setCode] = useState({});
    const [codeResults, setCodeResults] = useState({});
    const [isRunning, setIsRunning] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('javascript');
    const [showCodeResults, setShowCodeResults] = useState(false);

    // ── Timer ──
    const [timeLeft, setTimeLeft] = useState(null);
    const [timeTaken, setTimeTaken] = useState(0);
    const totalTime = useRef(null);

    // ── Warnings & Results ──
    const [warnings, setWarnings] = useState(0);
    const [showWarning, setShowWarning] = useState(false);
    const [warningMsg, setWarningMsg] = useState('');
    const [results, setResults] = useState(null);
    const [devtoolsOpen, setDevtoolsOpen] = useState(false);

    const handleSubmitRef = useRef(null);

    const userEmail = user?.email || '';

    useContentProtection({
        blockCopy: true,
        blockPrint: true,
        blockRightClick: true,
        blockDevtools: phase === 'active',
        onDevtoolsOpen: () => setDevtoolsOpen(true),
        enabled: phase === 'active' || phase === 'results',
    });

    const { isFullscreen, exitCount: fsExits, requestFullscreen } = useFullscreen({
        enabled: phase === 'active',
        onExitAttempt: () => {
            setWarnings(w => w + 1);
            setWarningMsg(`⚠️ Fullscreen exit detected. 3 exits will auto-submit.`);
            setShowWarning(true);
            setTimeout(() => setShowWarning(false), 4000);
        },
        maxExits: 3,
        onMaxExitsReached: () => {
            setWarningMsg('⚠️ 3 fullscreen exits detected. Auto-submitting...');
            setShowWarning(true);
            setTimeout(() => handleSubmitRef.current?.(), 2000);
        },
    });

    // ─── Fetch company info ──────────────────────────────────────────────────────
    useEffect(() => {
        async function fetchCompany() {
            try {
                const res = await fetch(`/api/companies/${companySlug}`);
                if (res.ok) {
                    const data = await res.json();
                    setCompany(data);
                } else {
                    setCompany({ id: companySlug, name: companySlug.toUpperCase(), slug: companySlug });
                }
            } catch {
                setCompany({ id: companySlug, name: companySlug.toUpperCase(), slug: companySlug });
            }
        }
        fetchCompany();
    }, [companySlug]);

    // Derive allowed test round types from the selected role (if any) — stable via useMemo
    const allowedTestRounds = useMemo(() => {
        if (!roleId || !company?.roles) return ['oa', 'technical'];
        const role = company.roles.find(r => r.id === roleId);
        if (!role?.roundTypes) return ['oa', 'technical'];
        const testRounds = role.roundTypes.filter(rt => rt === 'oa' || rt === 'technical');
        return testRounds.length > 0 ? testRounds : ['oa', 'technical'];
    }, [roleId, company?.roles]);

    // Auto-select the first allowed round type if current one isn't in the list
    useEffect(() => {
        if (!allowedTestRounds.includes(roundType)) {
            setRoundType(allowedTestRounds[0]);
        }
    }, [allowedTestRounds, roundType]);

    // ─── Submit handler (stable ref so timer effect can call it) ──────────────
    const handleSubmit = useCallback(async () => {
        if (phase === 'submitting' || phase === 'results') return;
        setPhase('submitting');

        try {
            const token = user ? await user.getIdToken() : null;
            const response = await fetch('/api/test-submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    userId: user?.uid || 'guest',
                    companyId: company?.id || companySlug,
                    companySlug,
                    companyName: company?.name || companySlug,
                    roundType,
                    answers,
                    codeSubmissions: code,
                    timeTaken: totalTime.current ? totalTime.current - (timeLeft || 0) : timeTaken,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setResults(data);
            } else {
                // Fallback: calculate score locally if questions available
                const mcqQs = questions.filter(q => q.type === 'mcq');
                const answered = mcqQs.filter(q => answers[q.id] !== undefined).length;
                setResults({ score: answered, totalQuestions: mcqQs.length || questions.length, results: [] });
            }
        } catch {
            const mcqQs = questions.filter(q => q.type === 'mcq');
            const answered = mcqQs.filter(q => answers[q.id] !== undefined).length;
            setResults({ score: answered, totalQuestions: mcqQs.length || questions.length, results: [] });
        }
        setPhase('results');
    }, [phase, user, company, companySlug, roundType, answers, code, timeLeft, timeTaken, questions]);

    useEffect(() => { handleSubmitRef.current = handleSubmit; }, [handleSubmit]);

    // ─── Timer ────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (phase !== 'active' || timeLeft === null) return;
        if (timeLeft === 0) { handleSubmitRef.current?.(); return; }
        const interval = setInterval(() => {
            setTimeLeft(t => t > 0 ? t - 1 : 0);
            setTimeTaken(t => t + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [phase, timeLeft]);

    // ─── Tab-switch anti-cheat ────────────────────────────────────────────────
    useEffect(() => {
        if (phase !== 'active') return;
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setWarnings(w => {
                    const newCount = w + 1;
                    if (newCount >= 3) {
                        setWarningMsg('⚠️ 3 tab switches detected. Auto-submitting...');
                        setShowWarning(true);
                        setTimeout(() => handleSubmitRef.current?.(), 2000);
                    } else {
                        setWarningMsg(`⚠️ Tab switch detected (${newCount}/3). Third switch will auto-submit.`);
                        setShowWarning(true);
                        setTimeout(() => setShowWarning(false), 4000);
                    }
                    return newCount;
                });
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [phase]);

    // ─── Config — Start Test ──────────────────────────────────────────────────
    const mcqCount = roundType === 'oa' ? numQuestions : Math.ceil(numQuestions * 0.7);
    const codingCount = roundType === 'oa' ? 0 : Math.floor(numQuestions * 0.3);
    const calcTime = mcqCount * 90 + codingCount * 1200; // seconds

    async function startTest() {
        try {
            const qUrl = `/api/questions?companyId=${company?.id || companySlug}&round=${roundType}&limit=${numQuestions}${roleId ? `&roleId=${roleId}` : ''}`;
            const res = await fetch(qUrl);
            let qs = [];
            if (res.ok) qs = await res.json();

            if (!qs || qs.length === 0) {
                // No DB questions — use full sample set
                qs = getSampleQuestions(roundType, numQuestions);
            } else if (qs.length < numQuestions) {
                // Pad with sample questions to reach requested count
                const samples = getSampleQuestions(roundType, numQuestions);
                const existingIds = new Set(qs.map(q => q.id));
                const extras = samples.filter(q => !existingIds.has(q.id));
                qs = [...qs, ...extras].slice(0, numQuestions);
            } else {
                qs = qs.slice(0, numQuestions);
            }

            setQuestions(qs);
            const t = calcTime;
            totalTime.current = t;
            setTimeLeft(t);
            setTimeTaken(0);
            setCurrentIndex(0);
            setAnswers({});
            setCode({});
            setCodeResults({});
            setPhase('active');
            requestFullscreen();
        } catch {
            const qs = getSampleQuestions(roundType, numQuestions);
            setQuestions(qs);
            const t = calcTime;
            totalTime.current = t;
            setTimeLeft(t);
            setPhase('active');
            requestFullscreen();
        }
    }

    // ─── Run Code ─────────────────────────────────────────────────────────────
    async function runCode(submitAll = false) {
        const q = questions[currentIndex];
        if (!q || q.type !== 'coding') return;
        setIsRunning(true);
        setShowCodeResults(true);

        const testCases = submitAll
            ? (q.testCases || q.visibleTestCases || getDefaultTestCases())
            : (q.visibleTestCases || getDefaultTestCases());

        try {
            const res = await fetch('/api/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language: PISTON_LANG[selectedLanguage] || selectedLanguage,
                    code: code[q.id] || STARTER_CODE[selectedLanguage],
                    testCases,
                }),
            });
            const data = await res.json();
            setCodeResults(prev => ({ ...prev, [q.id]: data.results || [] }));
            if (submitAll) {
                const allPassed = data.results?.every(r => r.passed);
                setAnswers(prev => ({ ...prev, [q.id]: allPassed ? 'passed' : 'attempted' }));
            }
        } catch (err) {
            const errMsg = err?.message || 'Unknown error';
            setCodeResults(prev => ({
                ...prev,
                [q.id]: [{
                    passed: false,
                    input: '',
                    expected: '',
                    actual: '',
                    stderr: errMsg.includes('timeout') || errMsg.includes('abort')
                        ? '⏱ Execution timed out. The code runner is busy — please try again in a moment.'
                        : `Execution failed: ${errMsg}`,
                }],
            }));
        }
        setIsRunning(false);
    }

    // ─── Timer color class ─────────────────────────────────────────────────────
    const timerColorClass = timeLeft !== null && totalTime.current
        ? timeLeft <= totalTime.current * 0.1
            ? styles.timerRed
            : timeLeft <= totalTime.current * 0.2
                ? styles.timerAmber
                : ''
        : '';

    const q = questions[currentIndex];
    const mcqQuestions = questions.filter(q => q.type === 'mcq');
    const codingQuestions = questions.filter(q => q.type === 'coding');

    // ─── CONFIG PHASE ─────────────────────────────────────────────────────────
    if (phase === 'config') {
        return (
            <div className={styles.testContainer}>
                <div className={styles.configScreen}>
                    <button className={styles.btnBack} onClick={() => router.back()}>
                        <ChevronLeft size={18} /> Back
                    </button>
                    <div className={styles.configCard}>
                        <div className={styles.configHeader}>
                            <div className={styles.configCompanyBadge}>
                                {(company?.name || companySlug).charAt(0).toUpperCase()}
                            </div>
                            <h1>{company?.name || companySlug.toUpperCase()}</h1>
                            <p className={styles.configSubtitle}>Mock Test Configuration</p>
                        </div>

                        <div className={styles.configSection}>
                            <label className={styles.configLabel}>Round Type</label>
                            <div className={styles.toggleGroup}>
                                {allowedTestRounds.includes('oa') && (
                                    <button
                                        className={`${styles.toggleBtn} ${roundType === 'oa' ? styles.toggleActive : ''}`}
                                        onClick={() => setRoundType('oa')}
                                    >
                                        Verbal/Aptitude
                                    </button>
                                )}
                                {allowedTestRounds.includes('technical') && (
                                    <button
                                        className={`${styles.toggleBtn} ${roundType === 'technical' ? styles.toggleActive : ''}`}
                                        onClick={() => setRoundType('technical')}
                                    >
                                        Technical Round
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className={styles.configSection}>
                            <label className={styles.configLabel}>Number of Questions</label>
                            <div className={styles.pillGroup}>
                                {[10, 20, 30].map(n => (
                                    <button
                                        key={n}
                                        className={`${styles.pillBtn} ${numQuestions === n ? styles.pillActive : ''}`}
                                        onClick={() => setNumQuestions(n)}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.configInfo}>
                            <div className={styles.infoRow}>
                                <span>Questions</span>
                                <span className={styles.infoVal}>
                                    {mcqCount} MCQ {codingCount > 0 ? `+ ${codingCount} Coding` : ''}
                                </span>
                            </div>
                            <div className={styles.infoRow}>
                                <span>Time Limit</span>
                                <span className={styles.infoVal}>{formatTime(calcTime)}</span>
                            </div>
                        </div>

                        <button className={styles.btnStartTest} onClick={startTest}>
                            Start Test →
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── SUBMITTING ────────────────────────────────────────────────────────────
    if (phase === 'submitting') {
        return (
            <div className={styles.testContainer}>
                <div className={styles.submittingScreen}>
                    <div className={styles.submittingSpinner} />
                    <h2>Submitting your answers...</h2>
                    <p>Please wait while we evaluate your responses.</p>
                </div>
            </div>
        );
    }

    // ─── RESULTS PHASE ────────────────────────────────────────────────────────
    if (phase === 'results' && results) {
        const pct = results.totalQuestions > 0
            ? Math.round((results.score / results.totalQuestions) * 100)
            : 0;
        const circumference = 2 * Math.PI * 54;
        const fillDash = (pct / 100) * circumference;
        const perf = getPerformanceLabel(pct);

        return (
            <div className={styles.testContainer} style={{ position: 'relative' }}>
                <Watermark email={userEmail} />
                <div className={styles.resultsScreen}>
                    <div className={styles.resultsCard}>
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
                                    }}
                                />
                            </svg>
                            <div className={styles.scoreCenter}>
                                <span className={styles.scoreNum}>{results.score}/{results.totalQuestions}</span>
                                <span className={styles.scorePct}>{pct}%</span>
                            </div>
                        </div>

                        <div className={`${styles.perfLabel} ${styles[perf.cls]}`}>
                            {perf.text}
                        </div>

                        <div className={styles.resultsMeta}>
                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>Time Taken</span>
                                <span className={styles.metaVal}>{formatTime(timeTaken)}</span>
                            </div>
                            <div className={styles.metaDivider} />
                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>Correct</span>
                                <span className={styles.metaVal}>{results.score} / {results.totalQuestions}</span>
                            </div>
                        </div>

                        {/* Review Accordion */}
                        {results.results && results.results.length > 0 && (
                            <div className={styles.reviewSection}>
                                <h3>Review Answers</h3>
                                <div className={styles.reviewList}>
                                    {results.results.map((r, i) => {
                                        const origQ = questions.find(q => q.id === r.questionId);
                                        return (
                                            <ReviewItem
                                                key={r.questionId}
                                                index={i}
                                                result={r}
                                                question={origQ}
                                                userAnswer={answers[r.questionId]}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className={styles.resultsActions}>
                            <button className={styles.btnSecondary} onClick={() => { setPhase('config'); setResults(null); }}>
                                <RefreshCw size={16} /> Try Again
                            </button>
                            <button className={styles.btnSecondary} onClick={() => router.push(`/companies/${companySlug}`)}>
                                Back to Company
                            </button>
                            <button className={styles.btnPrimary} onClick={() => router.push('/dashboard')}>
                                Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ─── ACTIVE TEST ──────────────────────────────────────────────────────────
    return (
        <div className={styles.testContainer}>
            {/* Fullscreen enforcement overlay */}
            {!isFullscreen && (
                <div className="fullscreen-blocker">
                    <h2>Fullscreen Required</h2>
                    <p>You exited fullscreen. Violation {fsExits}/3 — 3 exits will auto-submit the test.</p>
                    <button onClick={requestFullscreen}>Return to Fullscreen</button>
                </div>
            )}

            {/* DevTools blocker overlay */}
            {devtoolsOpen && (
                <div className="devtools-blocker">
                    <h2>Developer Tools Detected</h2>
                    <p>Please close DevTools to continue the test.</p>
                </div>
            )}

            {/* Warning Toast */}
            {showWarning && (
                <div className={styles.warningToast}>
                    <AlertTriangle size={16} />
                    {warningMsg}
                </div>
            )}

            {/* Top Bar */}
            <div className={styles.topBar}>
                <div className={styles.companyInfo}>
                    <button className={styles.btnExit} onClick={() => { if (confirm('Exit test? Progress will be lost.')) router.back(); }}>
                        <X size={18} />
                    </button>
                    <h2>{company?.name || companySlug.toUpperCase()}</h2>
                    <span className={styles.roundPill}>{roundType === 'oa' ? 'Verbal/Aptitude' : 'Technical Round'}</span>
                </div>
                <div className={styles.timerBox}>
                    <span className={`${styles.timerText} ${timerColorClass}`}>
                        {formatTime(timeLeft)}
                    </span>
                    <button className={styles.btnSubmit} onClick={() => { if (confirm('Submit test?')) handleSubmit(); }}>
                        Submit Test
                    </button>
                </div>
            </div>

            <div className={styles.mainLayout}>
                {/* Left Navigator Panel */}
                <div className={styles.leftPanel}>
                    <div className={styles.panelHeader}>
                        <span className={styles.panelTitle}>Questions</span>
                        <span className={styles.panelProgress}>
                            {Object.keys(answers).length}/{questions.length}
                        </span>
                    </div>

                    {mcqQuestions.length > 0 && (
                        <>
                            <p className={styles.sectionLabel}>MCQ ({mcqQuestions.length})</p>
                            <div className={styles.qGrid}>
                                {mcqQuestions.map((question) => {
                                    const idx = questions.indexOf(question);
                                    const isCurrent = currentIndex === idx;
                                    const isAnswered = answers[question.id] !== undefined;
                                    const isMarked = markedForReview[question.id];
                                    return (
                                        <button
                                            key={question.id}
                                            onClick={() => setCurrentIndex(idx)}
                                            className={`${styles.qBox} ${isCurrent ? styles.current : ''} ${isAnswered ? styles.answered : ''} ${isMarked ? styles.marked : ''}`}
                                        >
                                            {idx + 1}
                                            {isMarked && <span className={styles.reviewDot} />}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {codingQuestions.length > 0 && (
                        <>
                            <p className={styles.sectionLabel}>Coding ({codingQuestions.length})</p>
                            <div className={styles.qGrid}>
                                {codingQuestions.map((question) => {
                                    const idx = questions.indexOf(question);
                                    const isCurrent = currentIndex === idx;
                                    const isAnswered = answers[question.id] !== undefined;
                                    return (
                                        <button
                                            key={question.id}
                                            onClick={() => setCurrentIndex(idx)}
                                            className={`${styles.qBox} ${styles.codingQ} ${isCurrent ? styles.current : ''} ${isAnswered ? styles.answered : ''}`}
                                        >
                                            C{codingQuestions.indexOf(question) + 1}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* Status Legend */}
                    <div className={styles.legend}>
                        <div className={styles.legendItem}>
                            <span className={`${styles.legendDot} ${styles.legendAnswered}`} />
                            <span>Answered</span>
                        </div>
                        <div className={styles.legendItem}>
                            <span className={`${styles.legendDot} ${styles.legendCurrent}`} />
                            <span>Current</span>
                        </div>
                        <div className={styles.legendItem}>
                            <span className={`${styles.legendDot} ${styles.legendMarked}`} />
                            <span>Marked</span>
                        </div>
                        <div className={styles.legendItem}>
                            <span className={`${styles.legendDot} ${styles.legendUnanswered}`} />
                            <span>Not answered</span>
                        </div>
                    </div>
                </div>

                {/* Test Area */}
                <div className={styles.testArea}>
                    {q?.type === 'mcq' ? (
                        <div className={styles.mcqCard}>
                            <div className={styles.questionHeader}>
                                <h3 className={styles.qTitle}>Question {currentIndex + 1} of {questions.length}</h3>
                                <button
                                    className={`${styles.markBtn} ${markedForReview[q.id] ? styles.markActive : ''}`}
                                    onClick={() => setMarkedForReview(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                                >
                                    <Bookmark size={16} />
                                    {markedForReview[q.id] ? 'Marked' : 'Mark for Review'}
                                </button>
                            </div>

                            <p className={styles.qText}>{q.text || q.question}</p>

                            <div className={styles.optionsList}>
                                {(q.options || []).map((opt, i) => (
                                    <button
                                        key={i}
                                        className={`${styles.optionRow} ${answers[q.id] === i ? styles.optionSelected : ''}`}
                                        onClick={() => setAnswers(prev => ({ ...prev, [q.id]: i }))}
                                    >
                                        <div className={styles.optionLetter}>{String.fromCharCode(65 + i)}</div>
                                        <span>{opt}</span>
                                    </button>
                                ))}
                            </div>

                            <div className={styles.navigationBar}>
                                <button
                                    className={styles.btnNav}
                                    disabled={currentIndex === 0}
                                    onClick={() => setCurrentIndex(i => i - 1)}
                                >
                                    <ChevronLeft size={16} /> Previous
                                </button>
                                <button
                                    className={styles.btnNav}
                                    disabled={currentIndex === questions.length - 1}
                                    onClick={() => setCurrentIndex(i => i + 1)}
                                >
                                    Next <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    ) : q?.type === 'coding' ? (
                        <div className={styles.codingLayout}>
                            {/* Problem Statement */}
                            <div className={styles.codingProblem}>
                                <h3>{q.title}</h3>
                                <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', marginTop: '12px', lineHeight: 1.7 }}>
                                    {q.text || q.description}
                                </p>
                                {q.visibleTestCases && (
                                    <div className={styles.examplesSection}>
                                        <h4>Examples</h4>
                                        {q.visibleTestCases.map((tc, i) => (
                                            <div key={i} className={styles.exampleBox}>
                                                <div><span className={styles.exLabel}>Input:</span> <code>{tc.input}</code></div>
                                                <div><span className={styles.exLabel}>Output:</span> <code>{tc.output}</code></div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Editor Area */}
                            <div className={styles.editorArea}>
                                <div className={styles.editorHeader}>
                                    <div className={styles.langPills}>
                                        {LANGUAGES.map(lang => (
                                            <button
                                                key={lang}
                                                className={`${styles.langPill} ${selectedLanguage === lang ? styles.langActive : ''}`}
                                                onClick={() => setSelectedLanguage(lang)}
                                            >
                                                {LANG_LABELS[lang]}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className={styles.editorWrapper}>
                                    <Editor
                                        height="65vh"
                                        language={selectedLanguage}
                                        value={code[q.id] || q.starterCode?.[selectedLanguage] || STARTER_CODE[selectedLanguage]}
                                        onChange={(value) => setCode(prev => ({ ...prev, [q.id]: value }))}
                                        theme="vs-dark"
                                        options={{
                                            fontSize: 14,
                                            minimap: { enabled: false },
                                            scrollBeyondLastLine: false,
                                            padding: { top: 16 },
                                            fontLigatures: true,
                                            contextmenu: false,
                                        }}
                                        onMount={(editor, monaco) => {
                                            editor.addCommand(
                                                monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV,
                                                () => {}
                                            );
                                        }}
                                    />
                                </div>

                                <div className={styles.editorFooter}>
                                    <button
                                        className={styles.btnRun}
                                        onClick={() => runCode(false)}
                                        disabled={isRunning}
                                    >
                                        <Play size={16} />
                                        {isRunning ? 'Running...' : 'Run Code'}
                                    </button>
                                    <button
                                        className={styles.btnSubmitCode}
                                        onClick={() => runCode(true)}
                                        disabled={isRunning}
                                    >
                                        <Send size={16} /> Submit Code
                                    </button>
                                </div>

                                {/* Code Results Panel */}
                                {showCodeResults && codeResults[q.id] && (
                                    <div className={styles.codeResultsPanel}>
                                        <div className={styles.resultsHeader}>
                                            <span>Test Results</span>
                                            <button className={styles.closeResults} onClick={() => setShowCodeResults(false)}>
                                                <X size={14} />
                                            </button>
                                        </div>
                                        {codeResults[q.id].map((r, i) => (
                                            <div key={i} className={`${styles.testCaseRow} ${r.passed ? styles.tcPass : styles.tcFail}`}>
                                                <div className={styles.tcIcon}>
                                                    {r.passed ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                                </div>
                                                <div className={styles.tcDetails}>
                                                    <div><span>Input:</span> <code>{r.input || 'N/A'}</code></div>
                                                    <div><span>Expected:</span> <code>{r.expected}</code></div>
                                                    <div><span>Got:</span> <code>{r.actual || (r.stderr ? 'Error' : '')}</code></div>
                                                    {r.stderr && <div className={styles.tcError}>{r.stderr}</div>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className={styles.loadingState}>
                            <p>Loading questions...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Review Item (accordion) ──────────────────────────────────────────────────
function ReviewItem({ index, result, question, userAnswer }) {
    const [open, setOpen] = useState(false);
    return (
        <div className={styles.reviewItem}>
            <button className={styles.reviewHeader} onClick={() => setOpen(o => !o)}>
                <div className={styles.reviewMeta}>
                    {result.correct
                        ? <CheckCircle size={16} className={styles.iconCorrect} />
                        : <XCircle size={16} className={styles.iconWrong} />}
                    <span>Q{index + 1}: {question?.title || question?.text?.slice(0, 60) || `Question ${index + 1}`}</span>
                </div>
                <ChevronRight size={16} className={`${styles.expandIcon} ${open ? styles.expanded : ''}`} />
            </button>
            {open && (
                <div className={styles.reviewBody}>
                    {question && (
                        <>
                            <p className={styles.reviewQuestion}>{question.text || question.question}</p>
                            {question.options && question.options.map((opt, i) => {
                                const isUser = userAnswer === i;
                                const isCorrect = result.correctAnswer === i;
                                return (
                                    <div key={i} className={`${styles.reviewOpt} ${isUser && isCorrect ? styles.correctOpt : isUser ? styles.wrongOpt : isCorrect ? styles.correctOpt : ''}`}>
                                        {String.fromCharCode(65 + i)}. {opt}
                                        {isCorrect && <span className={styles.correctBadge}>✓ Correct</span>}
                                        {isUser && !isCorrect && <span className={styles.wrongBadge}>✗ Your answer</span>}
                                    </div>
                                );
                            })}
                            {result.explanation && (
                                <p className={styles.reviewExplanation}><strong>Explanation:</strong> {result.explanation}</p>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Sample questions (fallback when DB is empty) ─────────────────────────────
function getSampleQuestions(roundType, count) {
    const mcq = [
        { id: 'sq1', type: 'mcq', title: 'OS Basics', text: 'What is a deadlock in operating systems?', options: ['A state where two processes wait for each other indefinitely', 'A memory overflow error', 'A CPU scheduling algorithm', 'A disk fragmentation issue'], correctAnswer: 0 },
        { id: 'sq2', type: 'mcq', title: 'Data Structures', text: 'What is the time complexity of searching in a balanced BST?', options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], correctAnswer: 1 },
        { id: 'sq3', type: 'mcq', title: 'Networking', text: 'Which protocol operates at the Transport layer?', options: ['HTTP', 'IP', 'TCP', 'Ethernet'], correctAnswer: 2 },
        { id: 'sq4', type: 'mcq', title: 'DBMS', text: 'Which SQL clause is used to filter grouped results?', options: ['WHERE', 'HAVING', 'GROUP BY', 'ORDER BY'], correctAnswer: 1 },
        { id: 'sq5', type: 'mcq', title: 'OOP', text: 'Which OOP principle allows a class to have multiple forms?', options: ['Encapsulation', 'Inheritance', 'Polymorphism', 'Abstraction'], correctAnswer: 2 },
        { id: 'sq6', type: 'mcq', title: 'Sorting', text: 'Which sorting algorithm has the best average-case time complexity?', options: ['Bubble Sort', 'Insertion Sort', 'Merge Sort', 'Selection Sort'], correctAnswer: 2 },
        { id: 'sq7', type: 'mcq', title: 'Bit Manipulation', text: 'What does x & (x-1) compute?', options: ['x with its LSB cleared', 'x XOR 1', 'x shifted right by 1', 'None of the above'], correctAnswer: 0 },
        { id: 'sq8', type: 'mcq', title: 'Graphs', text: 'Which algorithm finds the shortest path in an unweighted graph?', options: ['DFS', 'BFS', 'Dijkstra', 'Bellman-Ford'], correctAnswer: 1 },
        { id: 'sq9', type: 'mcq', title: 'Memory', text: 'Stack memory grows in which direction typically?', options: ['Upward', 'Downward', 'Sideways', 'No specific direction'], correctAnswer: 1 },
        { id: 'sq10', type: 'mcq', title: 'Process Scheduling', text: 'In Round Robin scheduling, what is the key parameter?', options: ['Priority', 'Time Quantum', 'Burst Time', 'Arrival Time'], correctAnswer: 1 },
        { id: 'sq11', type: 'mcq', title: 'Recursion', text: 'What is required for a valid recursive function?', options: ['Infinite loop', 'Base case', 'Multiple return values', 'Global variable'], correctAnswer: 1 },
        { id: 'sq12', type: 'mcq', title: 'Complexity', text: 'What is the space complexity of an iterative Fibonacci calculation?', options: ['O(n)', 'O(n²)', 'O(1)', 'O(log n)'], correctAnswer: 2 },
        { id: 'sq13', type: 'mcq', title: 'Trees', text: 'What is a complete binary tree?', options: ['Every node has 2 children', 'All levels full except possibly last', 'Height is log n always', 'Root has no parent'], correctAnswer: 1 },
        { id: 'sq14', type: 'mcq', title: 'Hashing', text: 'What is a hash collision?', options: ['Two keys map to the same hash value', 'A hash table that is full', 'An incorrect hash function', 'A hash with no values'], correctAnswer: 0 },
        { id: 'sq15', type: 'mcq', title: 'SQL', text: 'What does ACID stand for in databases?', options: ['Atomicity, Consistency, Isolation, Durability', 'Access, Control, Identity, Data', 'Automated, Cached, Indexed, Distributed', 'None of the above'], correctAnswer: 0 },
        { id: 'sq16', type: 'mcq', title: 'Arrays', text: 'Accessing an element in an array by index is O(?)', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], correctAnswer: 2 },
        { id: 'sq17', type: 'mcq', title: 'Concurrency', text: 'What is a mutex used for?', options: ['Memory allocation', 'Mutual exclusion for shared resources', 'Message passing', 'Multi-threading creation'], correctAnswer: 1 },
        { id: 'sq18', type: 'mcq', title: 'HTTP', text: 'Which HTTP method is idempotent and used to retrieve data?', options: ['POST', 'PUT', 'GET', 'PATCH'], correctAnswer: 2 },
        { id: 'sq19', type: 'mcq', title: 'System Design', text: 'What is a CDN used for?', options: ['Database caching', 'Serving static content from edge nodes', 'Load balancing servers', 'Storing application code'], correctAnswer: 1 },
        { id: 'sq20', type: 'mcq', title: 'Pointers', text: 'What is a dangling pointer?', options: ['A pointer to NULL', 'A pointer to deallocated memory', 'A pointer initialized to 0', 'A global pointer'], correctAnswer: 1 },
        { id: 'sq21', type: 'mcq', title: 'Virtual Memory', text: 'What is page fault?', options: ['Hardware error', 'OS exception when a page is not in RAM', 'Disk read failure', 'Cache miss'], correctAnswer: 1 },
        { id: 'sq22', type: 'mcq', title: 'Linked List', text: 'What is the time complexity of deleting the head of a linked list?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], correctAnswer: 2 },
        { id: 'sq23', type: 'mcq', title: 'Stack', text: 'Which data structure uses LIFO order?', options: ['Queue', 'Stack', 'Heap', 'Deque'], correctAnswer: 1 },
        { id: 'sq24', type: 'mcq', title: 'Heap', text: 'In a max-heap, what is the root value?', options: ['Minimum', 'Maximum', 'Median', 'Random'], correctAnswer: 1 },
        { id: 'sq25', type: 'mcq', title: 'Networking', text: 'What is the default port for HTTPS?', options: ['80', '21', '443', '8080'], correctAnswer: 2 },
        { id: 'sq26', type: 'mcq', title: 'Binary Search', text: 'Binary search requires the array to be?', options: ['Unsorted', 'Sorted', 'Distinct', 'Indexed'], correctAnswer: 1 },
        { id: 'sq27', type: 'mcq', title: 'DP', text: 'Dynamic programming involves?', options: ['Recursion only', 'Memoization or tabulation of subproblems', 'Greedy selection', 'Backtracking'], correctAnswer: 1 },
        { id: 'sq28', type: 'mcq', title: 'Inheritance', text: 'In OOP, which keyword enables inheritance in Java?', options: ['implements', 'extends', 'inherits', 'super'], correctAnswer: 1 },
        { id: 'sq29', type: 'mcq', title: 'REST', text: 'REST APIs are typically?', options: ['Stateful', 'Stateless', 'Connection-oriented', 'Binary-only'], correctAnswer: 1 },
        { id: 'sq30', type: 'mcq', title: 'Git', text: 'What does git rebase do?', options: ['Merges branches with a merge commit', 'Rewrites commit history onto another branch', 'Deletes a branch', 'Resets the working directory'], correctAnswer: 1 },
    ];

    const coding = [
        {
            id: 'cq1', type: 'coding', title: 'Two Sum',
            text: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
            visibleTestCases: [{ input: '2 7 11 15\n9', output: '0 1' }],
        },
        {
            id: 'cq2', type: 'coding', title: 'Reverse String',
            text: 'Write a function that reverses a string. The input string is given as an array of characters s.\n\nModify the array in-place with O(1) extra memory.',
            visibleTestCases: [{ input: 'hello', output: 'olleh' }],
        },
    ];

    const totalMcq = Math.min(count, mcq.length);
    const qs = mcq.slice(0, totalMcq);
    if (roundType === 'technical' && count >= 10) {
        qs.push(...coding.slice(0, Math.min(2, coding.length)));
    }
    return qs;
}

function getDefaultTestCases() {
    return [{ input: '', output: '' }];
}
