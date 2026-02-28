'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FileText, ArrowLeft, Building2, Eye, EyeOff, FileType, CheckCircle2 } from 'lucide-react';
import styles from './page.module.css';

export default function PaperViewerPage() {
    const { id } = useParams();
    const [paper, setPaper] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showOptions, setShowOptions] = useState(false);
    const [showSolutions, setShowSolutions] = useState({});

    useEffect(() => {
        fetch(`/api/papers/${id}`)
            .then(res => res.json())
            .then(data => { setPaper(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [id]);

    if (loading) return <div className={styles.loading}>Loading paper...</div>;
    if (!paper) return (
        <div className={styles.loading}>
            <h2>Paper not found</h2>
            <Link href="/papers" className={styles.backLink}><ArrowLeft size={16} /> Back to Papers</Link>
        </div>
    );

    const questions = typeof paper.questions === 'string' ? JSON.parse(paper.questions) : paper.questions;
    const solutions = typeof paper.solutions === 'string' ? JSON.parse(paper.solutions) : paper.solutions;

    const toggleSolution = (qId) => {
        setShowSolutions(prev => ({ ...prev, [qId]: !prev[qId] }));
    };

    const toggleAllSolutions = () => {
        if (Object.keys(showSolutions).length === questions.length) {
            setShowSolutions({});
        } else {
            const all = {};
            questions.forEach(q => all[q.id] = true);
            setShowSolutions(all);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className="container">
                    <Link href="/papers" className={styles.backLink}><ArrowLeft size={16} /> All Papers</Link>

                    <div className={styles.paperHeader}>
                        <div className={styles.titleArea}>
                            <span className={styles.badge}>{paper.year}</span>
                            <span className={styles.badgeAlt}>{paper.type}</span>
                            <h1>{paper.title}</h1>
                            <div className={styles.companyInfo}>
                                {paper.company?.logo ? <img src={paper.company.logo} alt={paper.company.name} /> : <Building2 size={16} />}
                                <span>{paper.company?.name || 'Unknown Company'}</span>
                            </div>
                        </div>

                        <div className={styles.headerControls}>
                            <button
                                className={styles.controlBtn}
                                onClick={toggleAllSolutions}
                            >
                                {Object.keys(showSolutions).length === questions.length ? (
                                    <><EyeOff size={18} /> Hide All Solutions</>
                                ) : (
                                    <><Eye size={18} /> Show All Solutions</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container">
                <div className={styles.viewerLayout}>
                    <div className={styles.paperMeta}>
                        <div className={styles.metaCard}>
                            <h3>Paper Details</h3>
                            <ul>
                                <li><strong>Total Questions:</strong> {questions.length}</li>
                                <li><strong>Time Allotted:</strong> {questions.length * 2} mins</li>
                                <li><strong>Format:</strong> Multiple Choice</li>
                            </ul>
                        </div>
                    </div>

                    <div className={styles.questionsContainer}>
                        {questions.map((q, index) => {
                            const sol = solutions.find(s => s.id === q.id);
                            const isShowing = showSolutions[q.id];

                            return (
                                <div key={q.id} className={styles.questionCard}>
                                    <div className={styles.qHeader}>
                                        <span className={styles.qIndex}>Question {index + 1}</span>
                                        <span className={styles.qType}>{q.type}</span>
                                    </div>

                                    <div className={styles.qText}>{q.text}</div>

                                    <div className={styles.optionsList}>
                                        {q.options.map((opt, oIdx) => (
                                            <div
                                                key={oIdx}
                                                className={`${styles.option} ${isShowing && oIdx === sol?.answer ? styles.correctOption : ''}`}
                                            >
                                                <span className={styles.optLetter}>{String.fromCharCode(65 + oIdx)}</span>
                                                {opt}
                                                {isShowing && oIdx === sol?.answer && <CheckCircle2 size={16} className={styles.checkIcon} />}
                                            </div>
                                        ))}
                                    </div>

                                    <div className={styles.qFooter}>
                                        <button className={styles.toggleBtn} onClick={() => toggleSolution(q.id)}>
                                            {isShowing ? 'Hide Solution' : 'View Solution'}
                                        </button>
                                    </div>

                                    {isShowing && sol && (
                                        <div className={styles.solutionBox}>
                                            <strong>Explanation:</strong>
                                            <p>{sol.explanation}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
