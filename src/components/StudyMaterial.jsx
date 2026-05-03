'use client';

import { useState, useMemo } from 'react';
import {
    ChevronDown, ChevronUp, Clock, BookOpen, AlertCircle,
    CheckCircle2, Circle, Filter, Sparkles, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SYLLABI, ROLE_SYLLABI, IMPORTANCE_META, getRoleSyllabus } from '@/data/syllabi';
import styles from './StudyMaterial.module.css';
import { useAuth } from '@/context/AuthContext';
import useContentProtection from '@/hooks/useContentProtection';
import Watermark from '@/components/Watermark';

const FILTERS = [
    { id: 'all', label: 'All Topics' },
    { id: 'must', label: '🔴 Must Know' },
    { id: 'good', label: '🟡 Good to Know' },
    { id: 'optional', label: '⚪ Optional' },
];

// ─── Shared sub-components ────────────────────────────────────────────────────

function ImportanceBadge({ level, size = 'sm' }) {
    const meta = IMPORTANCE_META[level] || IMPORTANCE_META.optional;
    return (
        <span
            className={`${styles.badge} ${size === 'lg' ? styles.badgeLg : ''}`}
            style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}
        >
            {level === 'must' && <AlertCircle size={10} />}
            {level === 'good' && <CheckCircle2 size={10} />}
            {level === 'optional' && <Circle size={10} />}
            {meta.label}
        </span>
    );
}

function SubtopicRow({ sub }) {
    const [showNote, setShowNote] = useState(false);
    const meta = IMPORTANCE_META[sub.importance] || IMPORTANCE_META.optional;
    return (
        <div className={styles.subtopicRow}>
            <div className={styles.subtopicMain}>
                <span className={styles.importanceDot} style={{ background: meta.color }} title={meta.label} />
                <span className={styles.subtopicName}>{sub.name}</span>
                <div className={styles.subtopicRight}>
                    <ImportanceBadge level={sub.importance} />
                    {sub.note && (
                        <button className={styles.noteBtn} onClick={() => setShowNote(v => !v)} title="View tip">
                            <Sparkles size={13} /> Tip
                        </button>
                    )}
                </div>
            </div>
            {sub.note && showNote && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
                    className={styles.notePill}
                >
                    💡 {sub.note}
                </motion.div>
            )}
        </div>
    );
}

function TopicCard({ topic, isOpen, onToggle }) {
    const meta = IMPORTANCE_META[topic.importance] || IMPORTANCE_META.optional;
    const mustCount = (topic.subtopics || []).filter(s => s.importance === 'must').length;
    return (
        <div
            className={`${styles.topicCard} ${isOpen ? styles.topicOpen : ''}`}
            style={isOpen ? { borderColor: meta.color.replace('var(--', '#').replace(')', '') } : {}}
        >
            <button className={styles.topicHeader} onClick={onToggle}>
                <div className={styles.topicLeft}>
                    <span className={styles.topicIcon}>{topic.icon}</span>
                    <div className={styles.topicInfo}>
                        <span className={styles.topicName}>{topic.name}</span>
                        <div className={styles.topicMeta}>
                            <span className={styles.subtopicCount}>{(topic.subtopics || []).length} subtopics</span>
                            {mustCount > 0 && (
                                <span className={styles.mustCount}>
                                    <span style={{ color: IMPORTANCE_META.must.color }}>●</span>
                                    {mustCount} must know
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className={styles.topicRight}>
                    <ImportanceBadge level={topic.importance} size="lg" />
                    <span className={styles.hourBadge}><Clock size={12} />~{topic.prepHours}h</span>
                    {isOpen ? <ChevronUp size={18} className={styles.chevron} /> : <ChevronDown size={18} className={styles.chevron} />}
                </div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                        className={styles.subtopicsContainer}
                    >
                        {(topic.subtopics || []).map((sub, i) => <SubtopicRow key={i} sub={sub} />)}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Flat format (Firestore admin-saved format with only name + description)
function FlatTopicCard({ topic, idx }) {
    const [open, setOpen] = useState(false);
    const hours = topic.studyHours || topic.prepHours || null;
    return (
        <div className={styles.topicCard} style={{ borderRadius: '12px' }}>
            <button className={styles.topicHeader} onClick={() => setOpen(v => !v)}>
                <div className={styles.topicLeft}>
                    <span className={styles.topicIcon}>{idx + 1}.</span>
                    <div className={styles.topicInfo}><span className={styles.topicName}>{topic.name}</span></div>
                </div>
                <div className={styles.topicRight}>
                    {hours && <span className={styles.hourBadge}><Clock size={12} />{hours}h</span>}
                    {open ? <ChevronUp size={18} className={styles.chevron} /> : <ChevronDown size={18} className={styles.chevron} />}
                </div>
            </button>
            <AnimatePresence>
                {open && topic.description && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
                        className={styles.subtopicsContainer}
                    >
                        <p style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                            {topic.description}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function isFlatSyllabus(syllabus) {
    if (!syllabus?.topics?.length) return false;
    return !Array.isArray(syllabus.topics[0].subtopics);
}

// ─── Rich Syllabus View (single role or company-level) ────────────────────────
function RichSyllabusView({ syllabus, companyName }) {
    const [filter, setFilter] = useState('all');
    const [openIds, setOpenIds] = useState(new Set());

    const topics = useMemo(() => {
        if (!syllabus?.topics?.length) return [];
        if (filter === 'all') return syllabus.topics;
        return syllabus.topics.filter(t => t.importance === filter);
    }, [syllabus, filter]);

    const totalHours = useMemo(() =>
        (syllabus?.topics || []).reduce((s, t) => s + (t.prepHours || 0), 0),
        [syllabus]
    );
    const mustHours = useMemo(() =>
        (syllabus?.topics || []).filter(t => t.importance === 'must').reduce((s, t) => s + (t.prepHours || 0), 0),
        [syllabus]
    );

    function toggle(id) {
        setOpenIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    }

    return (
        <div className={styles.root}>
            <div className={styles.overviewCard}>
                <div className={styles.overviewLeft}>
                    <p className={styles.overviewLabel}>SYLLABUS OVERVIEW</p>
                    <p className={styles.overviewText}>{syllabus.overview}</p>
                </div>
                <div className={styles.overviewStats}>
                    <div className={styles.oStat}>
                        <span className={styles.oNum}>{syllabus.topics.length}</span>
                        <span className={styles.oLbl}>Topics</span>
                    </div>
                    <div className={styles.oStatDiv} />
                    <div className={styles.oStat}>
                        <span className={`${styles.oNum} ${styles.oRed}`}>{mustHours}h</span>
                        <span className={styles.oLbl}>Must Know</span>
                    </div>
                    <div className={styles.oStatDiv} />
                    <div className={styles.oStat}>
                        <span className={`${styles.oNum} ${styles.oAmber}`}>{totalHours}h</span>
                        <span className={styles.oLbl}>Full Prep</span>
                    </div>
                </div>
            </div>

            <div className={styles.legend}>
                {Object.entries(IMPORTANCE_META).map(([key, meta]) => (
                    <div key={key} className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ background: meta.color }} />
                        <span className={styles.legendLabel}>{meta.label}</span>
                        <span className={styles.legendHint}>
                            {key === 'must' && '— appears in every test/interview'}
                            {key === 'good' && '— gives you an edge'}
                            {key === 'optional' && '— only if you have extra time'}
                        </span>
                    </div>
                ))}
            </div>

            <div className={styles.filterBar}>
                <Filter size={14} className={styles.filterIcon} />
                {FILTERS.map(f => (
                    <button
                        key={f.id}
                        className={`${styles.filterPill} ${filter === f.id ? styles.filterActive : ''}`}
                        onClick={() => setFilter(f.id)}
                        style={filter === f.id && f.id !== 'all'
                            ? { color: IMPORTANCE_META[f.id]?.color, borderColor: IMPORTANCE_META[f.id]?.color }
                            : {}}
                    >
                        {f.label}
                        <span className={styles.filterCount}>
                            {f.id === 'all' ? syllabus.topics.length
                                : syllabus.topics.filter(t => t.importance === f.id).length}
                        </span>
                    </button>
                ))}
                <button className={styles.expandAllBtn} onClick={() => {
                    const allIds = new Set(topics.map(t => t.id));
                    setOpenIds(openIds.size === topics.length ? new Set() : allIds);
                }}>
                    {openIds.size === topics.length ? 'Collapse All' : 'Expand All'}
                </button>
            </div>

            {topics.length === 0
                ? <div className={styles.emptyFilter}><p>No topics with this importance level.</p></div>
                : (
                    <div className={styles.topicList}>
                        {topics.map(topic => (
                            <TopicCard
                                key={topic.id}
                                topic={topic}
                                isOpen={openIds.has(topic.id)}
                                onToggle={() => toggle(topic.id)}
                            />
                        ))}
                    </div>
                )
            }

            <p className={styles.lastUpdated}>
                Last updated: {syllabus.lastUpdated} · Topics are curated based on PYQs and student interview experiences.
            </p>
        </div>
    );
}

// ─── All-Roles Grouped View ───────────────────────────────────────────────────
function AllRolesSyllabusView({ slug, roles, companyName }) {
    const [expandedRoleId, setExpandedRoleId] = useState(null);

    if (!roles?.length) {
        return (
            <div className={styles.noSyllabus}>
                <BookOpen size={48} className={styles.emptyIcon} />
                <h3>No Roles Defined</h3>
                <p>The admin hasn&apos;t added roles for {companyName || 'this company'} yet.</p>
            </div>
        );
    }

    return (
        <div className={styles.root}>
            <div className={styles.overviewCard}>
                <div className={styles.overviewLeft}>
                    <p className={styles.overviewLabel}>ALL ROLES — COMBINED STUDY GUIDE</p>
                    <p className={styles.overviewText}>
                        Browse study material for each role at {companyName}. Select a role pill above to focus on just one role.
                    </p>
                </div>
                <div className={styles.overviewStats}>
                    <div className={styles.oStat}>
                        <span className={styles.oNum}>{roles.length}</span>
                        <span className={styles.oLbl}>Roles</span>
                    </div>
                </div>
            </div>

            <div className={styles.allRolesList}>
                {roles.map(role => {
                    const syllabus = getRoleSyllabus(slug, role.name);
                    const isOpen = expandedRoleId === role.id;
                    const topicCount = syllabus?.topics?.length || 0;
                    const totalH = (syllabus?.topics || []).reduce((s, t) => s + (t.prepHours || 0), 0);

                    return (
                        <div key={role.id} className={`${styles.roleSection} ${isOpen ? styles.roleSectionOpen : ''}`}>
                            <button
                                className={styles.roleHeader}
                                onClick={() => setExpandedRoleId(isOpen ? null : role.id)}
                            >
                                <div className={styles.roleHeaderLeft}>
                                    <span className={styles.roleNameBig}>{role.name}</span>
                                    {role.roundTypes?.length > 0 && (
                                        <div className={styles.roleRoundPills}>
                                            {role.roundTypes.map(rt => (
                                                <span key={rt} className={styles.roleRoundPill}>{rt.toUpperCase()}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className={styles.roleHeaderRight}>
                                    {topicCount > 0 && (
                                        <>
                                            <span className={styles.roleStatChip}>{topicCount} topics</span>
                                            {totalH > 0 && <span className={styles.roleStatChip}>{totalH}h prep</span>}
                                        </>
                                    )}
                                    {isOpen
                                        ? <ChevronUp size={18} className={styles.chevron} />
                                        : <ChevronRight size={18} className={styles.chevron} />
                                    }
                                </div>
                            </button>

                            <AnimatePresence>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className={styles.roleSyllabusBody}
                                    >
                                        {syllabus
                                            ? <RichSyllabusView syllabus={syllabus} companyName={companyName} />
                                            : (
                                                <div className={styles.noSyllabus} style={{ padding: '2rem' }}>
                                                    <p>Study material for this role is coming soon.</p>
                                                </div>
                                            )
                                        }
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function StudyMaterial({ slug = '', companyName = '', syllabus: syllabusFromDb, roleName = '', roles = null }) {
    // ── ALL HOOKS FIRST — never below an early return ──────────────────────
    const { user } = useAuth();
    const userEmail = user?.email || '';
    const [filter, setFilter] = useState('all');
    const [openIds, setOpenIds] = useState(new Set());
    useContentProtection({ blockCopy: true, blockRightClick: true, blockPrint: true });

    // Determine which syllabus to display for a single-role or company view
    // Priority: static ROLE_SYLLABI > Firestore saved > company-level SYLLABI
    const resolvedSyllabus = useMemo(() => {
        if (roleName) {
            const rich = getRoleSyllabus(slug, roleName);
            if (rich) return rich;
        }
        if (syllabusFromDb?.topics?.length && !isFlatSyllabus(syllabusFromDb)) return syllabusFromDb;
        return SYLLABI[slug] || syllabusFromDb || null;
    }, [slug, roleName, syllabusFromDb]);

    const isFlat = useMemo(() => isFlatSyllabus(resolvedSyllabus), [resolvedSyllabus]);

    // Only used by rich format — safe to compute even when null/flat
    const filteredTopics = useMemo(() => {
        if (!resolvedSyllabus?.topics?.length || isFlat) return [];
        if (filter === 'all') return resolvedSyllabus.topics;
        return resolvedSyllabus.topics.filter(t => t.importance === filter);
    }, [resolvedSyllabus, filter, isFlat]);

    const totalHours = useMemo(() =>
        isFlat || !resolvedSyllabus?.topics ? 0
            : resolvedSyllabus.topics.reduce((s, t) => s + (t.prepHours || 0), 0),
        [resolvedSyllabus, isFlat]
    );
    const mustHours = useMemo(() =>
        isFlat || !resolvedSyllabus?.topics ? 0
            : resolvedSyllabus.topics.filter(t => t.importance === 'must').reduce((s, t) => s + (t.prepHours || 0), 0),
        [resolvedSyllabus, isFlat]
    );

    function toggle(id) {
        setOpenIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    }

    // ── EARLY RETURNS — only after all hooks ───────────────────────────────

    // All-Roles grouped view (when roles prop is passed and no specific role selected)
    if (roles !== null) {
        return (
            <div style={{ position: 'relative' }}>
                <Watermark email={userEmail} />
                <AllRolesSyllabusView slug={slug} roles={roles} companyName={companyName} />
            </div>
        );
    }

    // No syllabus available
    if (!resolvedSyllabus || !resolvedSyllabus.topics?.length) {
        return (
            <div className={styles.noSyllabus}>
                <BookOpen size={48} className={styles.emptyIcon} />
                <h3>Syllabus Coming Soon</h3>
                <p>
                    We&apos;re building out the study guide for {companyName || 'this company'}.
                    In the meantime, explore the Mock Test or AI Interview to start practicing!
                </p>
            </div>
        );
    }

    // Flat format (Firestore admin-saved, no subtopics)
    if (isFlat) {
        const totalH = resolvedSyllabus.topics.reduce((s, t) => s + (Number(t.studyHours) || 0), 0);
        return (
            <div className={styles.root} style={{ position: 'relative' }}>
                <Watermark email={userEmail} />
                <div className={styles.overviewCard}>
                    <div className={styles.overviewLeft}>
                        <p className={styles.overviewLabel}>SYLLABUS OVERVIEW</p>
                        <p className={styles.overviewText}>
                            {resolvedSyllabus.overview || `Study guide for ${companyName || 'this role'} — curated by admin.`}
                        </p>
                    </div>
                    <div className={styles.overviewStats}>
                        <div className={styles.oStat}>
                            <span className={styles.oNum}>{resolvedSyllabus.topics.length}</span>
                            <span className={styles.oLbl}>Topics</span>
                        </div>
                        {totalH > 0 && (
                            <>
                                <div className={styles.oStatDiv} />
                                <div className={styles.oStat}>
                                    <span className={`${styles.oNum} ${styles.oAmber}`}>{totalH}h</span>
                                    <span className={styles.oLbl}>Total Prep</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <div className={styles.topicList}>
                    {resolvedSyllabus.topics.map((topic, idx) => (
                        <FlatTopicCard key={idx} topic={topic} idx={idx} />
                    ))}
                </div>
                {resolvedSyllabus.lastUpdated && (
                    <p className={styles.lastUpdated}>Last updated: {resolvedSyllabus.lastUpdated} · Topics curated by admin.</p>
                )}
            </div>
        );
    }

    // Rich format (static SYLLABI or ROLE_SYLLABI)
    return (
        <div className={styles.root} style={{ position: 'relative' }}>
            <Watermark email={userEmail} />
            <div className={styles.overviewCard}>
                <div className={styles.overviewLeft}>
                    <p className={styles.overviewLabel}>SYLLABUS OVERVIEW</p>
                    <p className={styles.overviewText}>{resolvedSyllabus.overview}</p>
                </div>
                <div className={styles.overviewStats}>
                    <div className={styles.oStat}>
                        <span className={styles.oNum}>{resolvedSyllabus.topics.length}</span>
                        <span className={styles.oLbl}>Topics</span>
                    </div>
                    <div className={styles.oStatDiv} />
                    <div className={styles.oStat}>
                        <span className={`${styles.oNum} ${styles.oRed}`}>{mustHours}h</span>
                        <span className={styles.oLbl}>Must Know</span>
                    </div>
                    <div className={styles.oStatDiv} />
                    <div className={styles.oStat}>
                        <span className={`${styles.oNum} ${styles.oAmber}`}>{totalHours}h</span>
                        <span className={styles.oLbl}>Full Prep</span>
                    </div>
                </div>
            </div>

            <div className={styles.legend}>
                {Object.entries(IMPORTANCE_META).map(([key, meta]) => (
                    <div key={key} className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ background: meta.color }} />
                        <span className={styles.legendLabel}>{meta.label}</span>
                        <span className={styles.legendHint}>
                            {key === 'must' && '— appears in every test/interview'}
                            {key === 'good' && '— gives you an edge'}
                            {key === 'optional' && '— only if you have extra time'}
                        </span>
                    </div>
                ))}
            </div>

            <div className={styles.filterBar}>
                <Filter size={14} className={styles.filterIcon} />
                {FILTERS.map(f => (
                    <button
                        key={f.id}
                        className={`${styles.filterPill} ${filter === f.id ? styles.filterActive : ''}`}
                        onClick={() => setFilter(f.id)}
                        style={filter === f.id && f.id !== 'all'
                            ? { color: IMPORTANCE_META[f.id]?.color, borderColor: IMPORTANCE_META[f.id]?.color }
                            : {}}
                    >
                        {f.label}
                        <span className={styles.filterCount}>
                            {f.id === 'all' ? resolvedSyllabus.topics.length
                                : resolvedSyllabus.topics.filter(t => t.importance === f.id).length}
                        </span>
                    </button>
                ))}
                <button className={styles.expandAllBtn} onClick={() => {
                    const allIds = new Set(filteredTopics.map(t => t.id));
                    setOpenIds(openIds.size === filteredTopics.length ? new Set() : allIds);
                }}>
                    {openIds.size === filteredTopics.length ? 'Collapse All' : 'Expand All'}
                </button>
            </div>

            {filteredTopics.length === 0
                ? <div className={styles.emptyFilter}><p>No topics with this importance level.</p></div>
                : (
                    <div className={styles.topicList}>
                        {filteredTopics.map(topic => (
                            <TopicCard
                                key={topic.id}
                                topic={topic}
                                isOpen={openIds.has(topic.id)}
                                onToggle={() => toggle(topic.id)}
                            />
                        ))}
                    </div>
                )
            }

            <p className={styles.lastUpdated}>
                Last updated: {resolvedSyllabus.lastUpdated} · Topics are curated based on PYQs and student interview experiences.
            </p>
        </div>
    );
}
