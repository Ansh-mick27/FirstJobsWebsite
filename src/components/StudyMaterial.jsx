'use client';

import { useState, useMemo } from 'react';
import {
    ChevronDown, ChevronUp, Clock, BookOpen, AlertCircle,
    CheckCircle2, Circle, ChevronRight, Filter, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SYLLABI, IMPORTANCE_META } from '@/data/syllabi';
import styles from './StudyMaterial.module.css';

const FILTERS = [
    { id: 'all', label: 'All Topics' },
    { id: 'must', label: '🔴 Must Know' },
    { id: 'good', label: '🟡 Good to Know' },
    { id: 'optional', label: '⚪ Optional' },
];

function ImportanceBadge({ level, size = 'sm' }) {
    const meta = IMPORTANCE_META[level] || IMPORTANCE_META.optional;
    return (
        <span
            className={`${styles.badge} ${size === 'lg' ? styles.badgeLg : ''}`}
            style={{
                color: meta.color,
                background: meta.bg,
                border: `1px solid ${meta.border}`,
            }}
        >
            {level === 'must' && <AlertCircle size={10} />}
            {level === 'good' && <CheckCircle2 size={10} />}
            {level === 'optional' && <Circle size={10} />}
            {meta.label}
        </span>
    );
}

function SubtopicRow({ sub, idx }) {
    const [showNote, setShowNote] = useState(false);
    const meta = IMPORTANCE_META[sub.importance] || IMPORTANCE_META.optional;

    return (
        <div className={styles.subtopicRow}>
            <div className={styles.subtopicMain}>
                {/* Importance dot */}
                <span
                    className={styles.importanceDot}
                    style={{ background: meta.color }}
                    title={meta.label}
                />
                <span className={styles.subtopicName}>{sub.name}</span>
                <div className={styles.subtopicRight}>
                    <ImportanceBadge level={sub.importance} />
                    {sub.note && (
                        <button
                            className={styles.noteBtn}
                            onClick={() => setShowNote(v => !v)}
                            title="View tip"
                        >
                            <Sparkles size={13} />
                            Tip
                        </button>
                    )}
                </div>
            </div>
            {sub.note && showNote && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
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
    const mustCount = topic.subtopics.filter(s => s.importance === 'must').length;
    const goodCount = topic.subtopics.filter(s => s.importance === 'good').length;

    return (
        <div
            className={`${styles.topicCard} ${isOpen ? styles.topicOpen : ''}`}
            style={isOpen ? { borderColor: meta.color.replace('var(--', '#').replace(')', '') } : {}}
        >
            <button className={styles.topicHeader} onClick={onToggle}>
                {/* Left: icon + name + badges */}
                <div className={styles.topicLeft}>
                    <span className={styles.topicIcon}>{topic.icon}</span>
                    <div className={styles.topicInfo}>
                        <span className={styles.topicName}>{topic.name}</span>
                        <div className={styles.topicMeta}>
                            <span className={styles.subtopicCount}>
                                {topic.subtopics.length} subtopics
                            </span>
                            {mustCount > 0 && (
                                <span className={styles.mustCount}>
                                    <span style={{ color: IMPORTANCE_META.must.color }}>●</span>
                                    {mustCount} must know
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: importance + hours + chevron */}
                <div className={styles.topicRight}>
                    <ImportanceBadge level={topic.importance} size="lg" />
                    <span className={styles.hourBadge}>
                        <Clock size={12} />
                        ~{topic.prepHours}h
                    </span>
                    {isOpen
                        ? <ChevronUp size={18} className={styles.chevron} />
                        : <ChevronDown size={18} className={styles.chevron} />
                    }
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className={styles.subtopicsContainer}
                    >
                        {topic.subtopics.map((sub, i) => (
                            <SubtopicRow key={i} sub={sub} idx={i} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function StudyMaterial({ slug = '', companyName = '' }) {
    const syllabus = SYLLABI[slug];
    const [filter, setFilter] = useState('all');
    const [openIds, setOpenIds] = useState(new Set());

    function toggle(id) {
        setOpenIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }

    // If no syllabus exists for this company yet
    if (!syllabus) {
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

    const topics = useMemo(() => {
        if (filter === 'all') return syllabus.topics;
        return syllabus.topics.filter(t => t.importance === filter);
    }, [syllabus, filter]);

    const totalHours = syllabus.topics.reduce((sum, t) => sum + t.prepHours, 0);
    const mustHours = syllabus.topics
        .filter(t => t.importance === 'must')
        .reduce((sum, t) => sum + t.prepHours, 0);

    return (
        <div className={styles.root}>
            {/* ── Overview Card ── */}
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

            {/* ── Legend ── */}
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

            {/* ── Filter Pills ── */}
            <div className={styles.filterBar}>
                <Filter size={14} className={styles.filterIcon} />
                {FILTERS.map(f => (
                    <button
                        key={f.id}
                        className={`${styles.filterPill} ${filter === f.id ? styles.filterActive : ''}`}
                        onClick={() => setFilter(f.id)}
                        style={filter === f.id && f.id !== 'all'
                            ? { color: IMPORTANCE_META[f.id]?.color, borderColor: IMPORTANCE_META[f.id]?.color }
                            : {}
                        }
                    >
                        {f.label}
                        <span className={styles.filterCount}>
                            {f.id === 'all'
                                ? syllabus.topics.length
                                : syllabus.topics.filter(t => t.importance === f.id).length
                            }
                        </span>
                    </button>
                ))}
                <button
                    className={styles.expandAllBtn}
                    onClick={() => {
                        const allIds = new Set(topics.map(t => t.id));
                        if (openIds.size === topics.length) setOpenIds(new Set());
                        else setOpenIds(allIds);
                    }}
                >
                    {openIds.size === topics.length ? 'Collapse All' : 'Expand All'}
                </button>
            </div>

            {/* ── Topic List ── */}
            {topics.length === 0 ? (
                <div className={styles.emptyFilter}>
                    <p>No topics with this importance level.</p>
                </div>
            ) : (
                <div className={styles.topicList}>
                    {topics.map((topic) => (
                        <TopicCard
                            key={topic.id}
                            topic={topic}
                            isOpen={openIds.has(topic.id)}
                            onToggle={() => toggle(topic.id)}
                        />
                    ))}
                </div>
            )}

            {/* ── Last Updated ── */}
            <p className={styles.lastUpdated}>
                Last updated: {syllabus.lastUpdated} · Topics are curated based on PYQs and student interview experiences.
            </p>
        </div>
    );
}
