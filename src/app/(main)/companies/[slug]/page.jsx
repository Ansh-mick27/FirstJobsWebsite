'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, BrainCircuit, Terminal, BookOpen, Clock, LayoutList, ChevronLeft, Loader2 } from 'lucide-react';
import StudyMaterial from '@/components/StudyMaterial';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';
import useContentProtection from '@/hooks/useContentProtection';

// Static tab definitions — icons created once at module load, never re-created per render
const ALL_TABS = [
    { id: 'study', label: 'Study Material', icon: <BookOpen size={16} /> },
    { id: 'test', label: 'Mock Test', icon: <Terminal size={16} /> },
    { id: 'interview', label: 'Mock Interview', icon: <BrainCircuit size={16} /> },
];

export default function CompanyDetail() {
    // ─── ALL HOOKS FIRST — never below an early return ───────────────────────
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading, isSubscribed, demoUsed } = useAuth();
    useContentProtection({ blockCopy: true, blockRightClick: true, blockPrint: true });
    const slug = params?.slug || '';

    const initialRoleId = searchParams?.get('roleId') || '';

    const [activeTab, setActiveTab] = useState('study');
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedRoleId, setSelectedRoleId] = useState(initialRoleId);

    // Auth guard — redirect unauthenticated users to login
    useEffect(() => {
        if (!authLoading && !user) {
            router.push(`/login?next=${encodeURIComponent(`/companies/${slug}`)}`);
        }
    }, [authLoading, user, router, slug]);

    // Paywall guard — redirect demo-used unpaid users to pricing
    useEffect(() => {
        if (!authLoading && user && !isSubscribed && demoUsed) {
            router.push('/pricing');
        }
    }, [authLoading, user, isSubscribed, demoUsed, router]);

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, []);

    // Fetch company data
    useEffect(() => {
        if (!slug) return;
        async function fetchCompany() {
            // Check session storage first (after mount)
            const cached = sessionStorage.getItem(`company_${slug}`);
            if (cached) {
                setCompany(JSON.parse(cached));
                setLoading(false);
            }

            try {
                const res = await fetch(`/api/companies/${slug}`);
                if (!res.ok) {
                    if (res.status === 404) throw new Error('Company not found');
                    throw new Error('Failed to load company data');
                }
                const data = await res.json();
                sessionStorage.setItem(`company_${slug}`, JSON.stringify(data));
                setCompany(data);
                setLoading(false);
            } catch (err) {
                if (!cached) setError(err.message || 'Failed to load company data');
                setLoading(false);
            }
        }
        
        fetchCompany();
    }, [slug]);

    // Derived state — safe to useMemo here because it handles null company
    const roles = useMemo(() => company?.roles || [], [company]);
    const selectedRole = useMemo(() => roles.find(r => r.id === selectedRoleId) || null, [roles, selectedRoleId]);

    // Available tabs filtered by selected role's roundTypes
    const availableTabs = useMemo(() => {
        if (!selectedRole || roles.length === 0) return ALL_TABS;
        const rt = selectedRole.roundTypes || [];
        return ALL_TABS.filter(tab => {
            if (tab.id === 'study') return true;
            if (tab.id === 'test') return rt.includes('oa') || rt.includes('technical');
            if (tab.id === 'interview') return rt.includes('technical') || rt.includes('hr') || rt.includes('managerial');
            return false;
        });
    }, [selectedRole, roles.length]);

    // Round badges for the hero banner
    const roundKeys = useMemo(() => {
        if (!company?.rounds) return [];
        return Array.isArray(company.rounds)
            ? company.rounds
            : Object.keys(company.rounds).filter(k => company.rounds[k]);
    }, [company?.rounds]);

    // Navigation helpers
    const handleStartTest = () => {
        const url = selectedRoleId ? `/test/${slug}?roleId=${selectedRoleId}` : `/test/${slug}`;
        router.push(url);
    };
    const handleStartInterview = () => {
        const url = selectedRoleId ? `/interview/${slug}?roleId=${selectedRoleId}` : `/interview/${slug}`;
        router.push(url);
    };

    // ─── EARLY RETURNS — only AFTER every hook ────────────────────────────────
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

    // ─── RENDER ───────────────────────────────────────────────────────────────
    return (
        <div className={styles.page}>
            <div className="container">
                {/* Back button */}
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

                {/* Role Selector Pills */}
                {roles.length > 0 && (
                    <div className={styles.roleSelectorRow}>
                        <span className={styles.roleSelectorLabel}>Role:</span>
                        <div className={styles.rolePills}>
                            <button
                                className={`${styles.rolePill} ${selectedRoleId === '' ? styles.rolePillActive : ''}`}
                                onClick={() => { setSelectedRoleId(''); setActiveTab('study'); }}
                            >
                                All Roles
                            </button>
                            {roles.map(role => (
                                <button
                                    key={role.id}
                                    className={`${styles.rolePill} ${selectedRoleId === role.id ? styles.rolePillActive : ''}`}
                                    onClick={() => { setSelectedRoleId(role.id); setActiveTab('study'); }}
                                >
                                    {role.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tab Bar */}
                <div className={styles.tabContainer}>
                    <div className={styles.tabList}>
                        {availableTabs.map((tab) => (
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
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
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
                                {selectedRoleId === '' || !selectedRole
                                    ? (
                                        // All-Roles: pass roles array so StudyMaterial renders grouped view
                                        <StudyMaterial
                                            slug={slug}
                                            companyName={company.name}
                                            roles={roles}
                                        />
                                    ) : (
                                        // Single role: pass role name so StudyMaterial resolves rich ROLE_SYLLABI
                                        <StudyMaterial
                                            slug={slug}
                                            companyName={company.name}
                                            roleName={selectedRole.name}
                                            syllabus={selectedRole.syllabus}
                                        />
                                    )
                                }
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
                                {/* Show available interview round types for the selected role */}
                                {selectedRole?.roundTypes?.length > 0 && (
                                    <div className={styles.configRoundPills}>
                                        <span className={styles.configRoundLabel}>Available rounds:</span>
                                        {selectedRole.roundTypes
                                            .filter(rt => ['technical', 'hr', 'managerial'].includes(rt))
                                            .map(rt => (
                                                <span key={rt} className={styles.configRoundPill}>
                                                    {rt.charAt(0).toUpperCase() + rt.slice(1)}
                                                </span>
                                            ))
                                        }
                                    </div>
                                )}
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
