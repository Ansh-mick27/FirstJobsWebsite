'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Terminal, BrainCircuit, Target, Building2, Clock, ArrowRight } from 'lucide-react';
import styles from './page.module.css';

// ─── Relative time helper ──────────────────────────────────────────────────────
function relativeTime(ts) {
    if (!ts) return '';
    const now = Date.now();
    const then = ts.seconds ? ts.seconds * 1000 : new Date(ts).getTime();
    const diff = now - then;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

export default function Dashboard() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();

    const [stats, setStats] = useState({
        testsAttempted: 0,
        interviewsDone: 0,
        avgScore: 0,
        companiesPracticed: 0,
    });
    const [companyProgress, setCompanyProgress] = useState({});
    const [recentActivity, setRecentActivity] = useState([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [barsReady, setBarsReady] = useState(false);

    // ─── Auth guard ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!loading && !user) {
            router.replace('/login');
        }
    }, [user, loading, router]);

    // ─── Fetch dashboard data ────────────────────────────────────────────────────
    useEffect(() => {
        if (!user) return;

        async function fetchDashboardData() {
            try {
                const [attemptsSnap, sessionsSnap] = await Promise.all([
                    getDocs(collection(db, 'users', user.uid, 'testAttempts')),
                    getDocs(collection(db, 'users', user.uid, 'interviewSessions')),
                ]);

                const attempts = attemptsSnap.docs.map(d => ({ _type: 'test', ...d.data() }));
                const sessions = sessionsSnap.docs.map(d => ({ _type: 'interview', ...d.data() }));

                // ── Stats ──
                const avgScore = attempts.length
                    ? Math.round(attempts.reduce((sum, a) => sum + (a.totalQuestions > 0 ? (a.score / a.totalQuestions) * 100 : 0), 0) / attempts.length)
                    : 0;

                // ── Company readiness ──
                const progress = {};
                attempts.forEach(a => {
                    const name = a.companyName || a.companySlug || 'Unknown';
                    if (!progress[name]) progress[name] = { tests: 0, totalScore: 0, slug: a.companySlug || '' };
                    progress[name].tests++;
                    progress[name].totalScore += a.totalQuestions > 0 ? (a.score / a.totalQuestions) * 100 : 0;
                });

                Object.keys(progress).forEach(k => {
                    progress[k].avgPct = Math.round(progress[k].totalScore / progress[k].tests);
                });

                // ── Recent activity ──
                const activity = [...attempts, ...sessions.filter(s => s.isComplete || s.messages?.length > 0)]
                    .filter(a => a.completedAt || a.startedAt)
                    .sort((a, b) => {
                        const ta = (a.completedAt || a.startedAt)?.seconds ?? 0;
                        const tb = (b.completedAt || b.startedAt)?.seconds ?? 0;
                        return tb - ta;
                    })
                    .slice(0, 10);

                setStats({
                    testsAttempted: attempts.length,
                    interviewsDone: sessions.filter(s => s.isComplete).length,
                    avgScore,
                    companiesPracticed: Object.keys(progress).length,
                });
                setCompanyProgress(progress);
                setRecentActivity(activity);
            } catch (err) {
                console.error('Dashboard fetch error:', err);
            }
            setDataLoading(false);
            // Trigger bar animation after a small delay
            setTimeout(() => setBarsReady(true), 100);
        }

        fetchDashboardData();
    }, [user]);

    // ─── Loading state ───────────────────────────────────────────────────────────
    if (loading || !user) {
        return (
            <div className={styles.page}>
                <div className={styles.loadingScreen}>
                    <div className={styles.spinner} />
                </div>
            </div>
        );
    }

    const firstName = profile?.name?.split(' ')[0] || user.displayName?.split(' ')[0] || 'there';
    const rollNo = profile?.rollNo || profile?.college || '';

    const statCards = [
        { label: 'Tests Taken', value: stats.testsAttempted, icon: <Terminal size={22} />, color: 'primary' },
        { label: 'Interviews', value: stats.interviewsDone, icon: <BrainCircuit size={22} />, color: 'info' },
        { label: 'Avg Score', value: stats.avgScore > 0 ? `${stats.avgScore}%` : '—', icon: <Target size={22} />, color: 'success' },
        { label: 'Companies', value: stats.companiesPracticed, icon: <Building2 size={22} />, color: 'accent' },
    ];

    const hasActivity = recentActivity.length > 0;

    return (
        <div className={styles.page}>
            <div className="container">
                {/* ── Header ── */}
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Welcome back, {firstName} 👋</h1>
                        {rollNo && <p className={styles.subtitle}>{rollNo}</p>}
                    </div>
                    <button className={styles.btnExplore} onClick={() => router.push('/companies')}>
                        Practice Sessions <ArrowRight size={16} />
                    </button>
                </div>

                {/* ── Stat Cards ── */}
                <div className={styles.statsGrid}>
                    {statCards.map((s, i) => (
                        <div key={i} className={`${styles.statCard} ${styles[`card_${s.color}`]}`}>
                            <div className={`${styles.statIcon} ${styles[s.color]}`}>{s.icon}</div>
                            <div className={styles.statDetails}>
                                <span className={styles.statValue}>{dataLoading ? '—' : s.value}</span>
                                <span className={styles.statLabel}>{s.label}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {!dataLoading && !hasActivity ? (
                    /* ── Empty State ── */
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>🚀</div>
                        <h2>Ready to start your prep?</h2>
                        <p>Complete your first mock test or interview to see your progress here.</p>
                        <button className={styles.btnCta} onClick={() => router.push('/companies')}>
                            Explore Companies →
                        </button>
                    </div>
                ) : (
                    <div className={styles.mainGrid}>
                        {/* ── Company Readiness ── */}
                        <div className={styles.readinessSection}>
                            <div className={styles.sectionHeader}>
                                <h2>Company Readiness</h2>
                                <p>Your prep progress by company</p>
                            </div>
                            <div className={styles.readinessCard}>
                                {Object.keys(companyProgress).length === 0 ? (
                                    <p className={styles.emptyHint}>No tests completed yet.</p>
                                ) : (
                                    Object.entries(companyProgress)
                                        .sort((a, b) => b[1].avgPct - a[1].avgPct)
                                        .map(([name, data]) => (
                                            <div key={name} className={styles.companyRow}>
                                                <div className={styles.companyMeta}>
                                                    <div className={styles.companyLogo}>{name.charAt(0).toUpperCase()}</div>
                                                    <div className={styles.companyInfo}>
                                                        <span className={styles.companyName}>{name}</span>
                                                        <span className={styles.companyTests}>{data.tests} test{data.tests !== 1 ? 's' : ''}</span>
                                                    </div>
                                                </div>
                                                <div className={styles.readinessBarWrapper}>
                                                    <div className={styles.readinessTrack}>
                                                        <div
                                                            className={styles.readinessFill}
                                                            style={{ width: barsReady ? `${data.avgPct}%` : '0%' }}
                                                        />
                                                    </div>
                                                    <span className={styles.readinessPct}>{data.avgPct}%</span>
                                                </div>
                                            </div>
                                        ))
                                )}
                            </div>
                        </div>

                        {/* ── Recent Activity ── */}
                        <div className={styles.activitySection}>
                            <div className={styles.sectionHeader}>
                                <h2>Recent Activity</h2>
                                <p>Your latest practice sessions</p>
                            </div>
                            <div className={styles.timeline}>
                                {recentActivity.map((item, i) => {
                                    const isTest = item._type === 'test';
                                    const label = isTest
                                        ? `${item.companyName || item.companySlug || 'Unknown'} ${item.roundType === 'oa' ? 'OA' : 'Technical'} Mock Test`
                                        : `${item.companyName || item.companySlug || 'Unknown'} ${item.roundType === 'hr' ? 'HR' : 'Technical'} Interview`;
                                    const score = isTest && item.totalQuestions > 0
                                        ? `${Math.round((item.score / item.totalQuestions) * 100)}%`
                                        : item.aiFeedback?.score
                                            ? `${item.aiFeedback.score}/10`
                                            : null;
                                    const ts = item.completedAt || item.startedAt;

                                    return (
                                        <div key={i} className={`${styles.timelineItem} ${isTest ? styles.dotTest : styles.dotInterview}`}>
                                            <div className={`${styles.activityDot} ${isTest ? styles.dotTestColor : styles.dotInterviewColor}`}>
                                                {isTest ? <Terminal size={12} /> : <BrainCircuit size={12} />}
                                            </div>
                                            <div className={styles.activityContent}>
                                                <p className={styles.activityTitle}>{label}</p>
                                                <div className={styles.activityMeta}>
                                                    {score && <span className={styles.activityScore}>{score}</span>}
                                                    <span className={styles.activityTime}>
                                                        <Clock size={11} /> {relativeTime(ts)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
