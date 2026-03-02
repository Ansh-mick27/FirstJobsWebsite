'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FileText, ArrowLeft, Building2, Eye, EyeOff, FileType, CheckCircle2, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './page.module.css';

export default function PaperViewerPage() {
    const { id } = useParams();
    const [paper, setPaper] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [showSolutions, setShowSolutions] = useState({});

    // We import dynamically to avoid SSR issues with window object
    const html2pdfRef = useRef(null);

    useEffect(() => {
        // Dynamically import html2pdf to avoid Next.js SSR window is not defined errors
        import('html2pdf.js').then((html2pdfModule) => {
            html2pdfRef.current = html2pdfModule.default;
        });

        fetch(`/api/papers/${id}`)
            .then(res => res.json())
            .then(data => { setPaper(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [id]);

    const generatePDF = () => {
        if (!paper || !html2pdfRef.current) return;
        setIsGeneratingPdf(true);

        const element = document.getElementById('pdf-content');

        // Temporarily unhide it specifically for the clone that html2pdf processes
        element.style.display = 'block';

        const opt = {
            margin: 10,
            filename: `${paper.company.name}_${paper.year}_Prep_Guide.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdfRef.current().from(element).set(opt).save().then(() => {
            element.style.display = 'none';
            setIsGeneratingPdf(false);
        });
    };

    if (loading) return <div className={styles.loading}>Loading paper...</div>;
    if (!paper || paper.error) return (
        <div className={styles.loading}>
            <h2>Paper not found</h2>
            <Link href="/papers" className={styles.backLink}><ArrowLeft size={16} /> Back to Papers</Link>
        </div>
    );

    const questions = typeof paper.questions === 'string' ? JSON.parse(paper.questions) : (paper.questions || []);
    const solutions = typeof paper.solutions === 'string' ? JSON.parse(paper.solutions) : (paper.solutions || []);
    const interviewQs = paper.company?.interviewQuestions || [];

    const toggleSolution = (qId) => {
        setShowSolutions(prev => ({ ...prev, [qId]: !prev[qId] }));
    };

    const toggleAllSolutions = () => {
        if (Object.keys(showSolutions).length === (questions?.length || 0)) {
            setShowSolutions({});
        } else {
            const all = {};
            (questions || []).forEach(q => all[q.id] = true);
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
                            <motion.button
                                className={styles.downloadBtn}
                                onClick={generatePDF}
                                disabled={isGeneratingPdf}
                                whileHover={{ y: -2, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Download size={18} />
                                {isGeneratingPdf ? 'Generating...' : 'Download Full Prep Guide'}
                            </motion.button>

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

            {/* Hidden Printable PDF Layout */}
            <div id="pdf-content" className={styles.printablePdfContainer} style={{ display: 'none' }}>
                <div className={styles.pdfPage}>
                    <div className={styles.pdfHeader}>
                        <h1>{paper.company?.name || 'Company'} - Comprehensive Prep Guide</h1>
                        <p>{paper.title} ({paper.year}) | FirstJobs Platform</p>
                    </div>

                    <div className={styles.pdfSection}>
                        <h2>Section 1: Interview Preparation (HR & Technical)</h2>
                        {interviewQs.length > 0 ? (
                            <div className={styles.pdfInterviewList}>
                                {interviewQs.map((iq, idx) => (
                                    <div key={idx} className={styles.pdfInterviewItem}>
                                        <div className={styles.pdfQuestionTitle}>
                                            <span className={styles.pdfCategoryBadge}>{iq.category}</span>
                                            Q{idx + 1}: {iq.question}
                                        </div>
                                        <p className={styles.pdfAnswer}>
                                            <strong>Suggested Answer:</strong> {iq.answer}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>No specific interview questions available for this company yet.</p>
                        )}
                    </div>

                    {/* Explicit page break before test questions */}
                    <div className="html2pdf__page-break"></div>

                    <div className={styles.pdfSection}>
                        <h2>Section 2: Previous Year Test Paper</h2>
                        <div className={styles.pdfTestList}>
                            {questions.map((q, idx) => {
                                const sol = solutions.find(s => s.id === q.id);
                                return (
                                    <div key={q.id} className={styles.pdfTestItem}>
                                        <div className={styles.pdfQuestionTitle}>
                                            <strong>Q{idx + 1}.</strong> {q.text}
                                        </div>
                                        <ul className={styles.pdfOptions}>
                                            {q.options.map((opt, oIdx) => (
                                                <li key={oIdx} className={sol?.answer === oIdx ? styles.pdfCorrectOpt : ''}>
                                                    {String.fromCharCode(65 + oIdx)}) {opt}
                                                    {sol?.answer === oIdx && ' ✓'}
                                                </li>
                                            ))}
                                        </ul>
                                        {sol && (
                                            <div className={styles.pdfExplanation}>
                                                <strong>Explanation:</strong> {sol.explanation}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
