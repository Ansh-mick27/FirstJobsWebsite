'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, BrainCircuit, Terminal, BookOpen, Clock, LayoutList, ChevronLeft, Loader2 } from 'lucide-react';
import StudyMaterial from '@/components/StudyMaterial';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

const tabs = [
    { id: 'study', label: 'Study Material', icon: <BookOpen size={16} /> },
    { id: 'test', label: 'Mock Test', icon: <Terminal size={16} /> },
    { id: 'interview', label: 'Mock Interview', icon: <BrainCircuit size={16} /> }
];

export default function CompanyDetail() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const slug = params?.slug || '';
    const [activeTab, setActiveTab] = useState('study');
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Scroll to top on page load
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, []);

    // Fetch company data from API
    useEffect(() => {
        if (!slug) return;
        async function fetchCompany() {
            setLoading(true);
            setError('');
            try {
                const res = await fetch(`/api/companies/${slug}`);
                if (!res.ok) {
                    if (res.status === 404) throw new Error('Company not found');
                    throw new Error('Failed to load company data');
                }
                const data = await res.json();
                setCompany(data);
            } catch (err) {
                setError(err.message || 'Failed to load company data');
            }
            setLoading(false);
        }
        fetchCompany();
    }, [slug]);

    const handleStartTest = () => router.push(`/test/${slug}`);
    const handleStartInterview = () => router.push(`/interview/${slug}`);

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.loadingScreen}>
                    <Loader2 size={32} className={styles.spinner} />
                    <p>Loading company profile...</p>
                </div>
            </div>
        );
    }

    if (error || !company) {
        return (
            <div className={styles.page}>
                <div className={styles.loadingScreen}>
                    <p className={styles.errorMsg}>{error || 'Company not found'}</p>
                    <button className={styles.btnBack} onClick={() => router.back()}>
                        <ChevronLeft size={18} /> Back to Companies
                    </button>
                </div>
            </div>
        );
    }

    const userEmail = user?.email || 'student@placeprep.com';
    // All questions for study material tab
    const allQuestions = company.questions || [];
    // Rounds from Firestore (could be an object or array)
    const roundKeys = company.rounds
        ? (Array.isArray(company.rounds)
            ? company.rounds
            : Object.keys(company.rounds).filter(k => company.rounds[k]))
        : [];

    return (
        <div className={styles.page}>
            <div className="container">
                {/* Back button — above banner */}
                <button className={styles.btnBack} onClick={() => router.back()}>
                    <ChevronLeft size={14} /> Back to Companies
                </button>

                {/* Compact Hero Banner */}
                <div className={styles.heroBanner}>
                    <div className={styles.heroGlow} />
                    <div className={styles.heroContent}>
                        <div className={styles.logoBox}>
                            {company.name?.charAt(0) || '?'}
                        </div>
                        <div className={styles.info}>
                            <h1 className={styles.title}>{company.name}</h1>
                            <p className={styles.industry}>{company.industry}</p>
                            <div className={styles.badges}>
                                {company.status && (
                                    <span className={`${styles.statusLabel} ${company.status === 'Active' ? styles.active : ''}`}>
                                        {company.status}
                                    </span>
                                )}
                                {roundKeys.map(round => (
                                    <span key={round} className={styles.roundBadge}>{round.toUpperCase()}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Custom Tabs */}
                <div className={styles.tabContainer}>
                    <div className={styles.tabList}>
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                className={`${styles.tabBtn} ${activeTab === tab.id ? styles.activeTabBtn : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <span className={styles.tabIcon}>{tab.icon}</span>
                                {tab.label}
                                {activeTab === tab.id && (
                                    <motion.div
                                        className={styles.tabIndicator}
                                        layoutId="tabIndicator"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className={styles.tabContentArea}>
                    <AnimatePresence mode="wait">
                        {activeTab === 'study' && (
                            <motion.div
                                key="study"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <StudyMaterial
                                    slug={slug}
                                    companyName={company.name}
                                />
                            </motion.div>
                        )}

                        {activeTab === 'test' && (
                            <motion.div
                                key="test"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className={styles.configCard}
                            >
                                <div className={styles.configIcon}><Terminal size={32} /></div>
                                <h2>Configure Mock Test</h2>
                                <p>Simulate the exact test environment for {company.name}.</p>

                                <div className={styles.configFeatures}>
                                    <span><Clock size={14} /> Timed Assessment</span>
                                    <span><LayoutList size={14} /> Strict Evaluation</span>
                                </div>

                                <button className={styles.btnStart} onClick={handleStartTest}>
                                    Launch Test <ArrowRight size={18} />
                                </button>
                            </motion.div>
                        )}

                        {activeTab === 'interview' && (
                            <motion.div
                                key="interview"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className={styles.configCard}
                            >
                                <div className={styles.configIcon}><BrainCircuit size={32} /></div>
                                <h2>AI Interviewer Config</h2>
                                <p>Face our specialized AI agent trained on {company.name}&apos;s interview patterns.</p>

                                <div className={styles.configFeatures}>
                                    <span><Clock size={14} /> 30-45 Minute Session</span>
                                    <span><BrainCircuit size={14} /> Adaptive Feedback</span>
                                </div>

                                <button className={styles.btnStart} onClick={handleStartInterview}>
                                    Start AI Interview <ArrowRight size={18} />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </div>
        </div>
    );
}
